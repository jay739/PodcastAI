from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import pypdf
import fitz
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from routes.file_routes import file_blueprint
from config import Config
from pdf_processor import analyze_pdf, chunk_text
from tts_service import synthesize_podcast_audio
from services.podcast_service import podcast_service
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)

app.config.from_object(Config)
app.register_blueprint(file_blueprint, url_prefix='/api')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/api/debug-pdf/<fileID>', methods=['GET'])
def debug_pdf(fileID):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{fileID}.pdf")
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    try:
        text_mupdf = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text_mupdf += page.get_text() + "\n"
            doc.close()
        except Exception as e:
            text_mupdf = f"PyMuPDF error: {str(e)}"
        
        text_pypdf = ""
        try:
            pdf = pypdf.PdfReader(file_path)
            for page in pdf.pages:
                text_pypdf += page.extract_text() + "\n"
        except Exception as e:
            text_pypdf = f"PyPDF error: {str(e)}"
        
        return jsonify({
            "pymupdf_result": text_mupdf,
            "pypdf_result": text_pypdf,
            "file_size": os.path.getsize(file_path)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate_transcript', methods=['POST'])
def generate_transcript():
    data = request.get_json(force=True)
    fileID = data['fileID']
    speakers = data.get('speakers', [])
    config = {
        "title": data.get("title", "Generated Podcast"),
        "hosts": [s["name"] for s in speakers[:2]],
        "guest": speakers[2]["name"] if len(speakers) > 2 else None,
        "speakers": speakers,
        "language": data.get("language", "en")
    }
    # Generate transcript (no audio yet)
    result = podcast_service.generate_transcript(fileID, config)
    return jsonify({
        "success": True,
        "job_id": fileID,
        "transcript": result["transcript"]
    })

@app.route('/api/generate_audio', methods=['POST'])
def generate_audio():
    data = request.get_json(force=True)
    fileID = data['fileID']
    transcript_text = data.get('transcript')
    speakers = data.get('speakers', [])
    tts_model = data.get('tts_model', 'bark')
    bg_choice = data.get('bg_music', None)  # e.g. "none" or filename
    if not transcript_text:
        return jsonify({"error": "No transcript provided"}), 400
    # Save edited transcript back to file
    transcript_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{fileID}_transcript.md")
    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(transcript_text)
    # Reconstruct speakers_config similar to podcast_service
    speakers_config = {s["name"].strip().lower(): {"gender": s.get("gender","male"), "tone": s.get("tone","neutral")} for s in speakers}
    # Parse transcript and synthesize audio
    from services.transcript_utils import parse_transcript, save_arc_transcript
    script_df = parse_transcript(transcript_path)
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{fileID}.mp3")
    synthesize_podcast_audio(script_df, output_path, speakers_config, tts_model=tts_model, bg_music=bg_choice)
    # Save interactive transcript JSON for highlighting
    save_arc_transcript(script_df, fileID)
    return jsonify({
        "success": True,
        "job_id": fileID,
        "audio_path": output_path
    })

@app.route('/api/export/<job_id>', methods=['GET'])
def export_podcast(job_id):
    html_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}.html")
    if not os.path.exists(html_path):
        # Generate HTML file if not exists
        audio_url = f"/api/audio/{job_id}.mp3"
        transcript_md_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}_transcript.md")
        transcript_text = ""
        try:
            with open(transcript_md_path, "r", encoding="utf-8") as f:
                transcript_text = f.read()
        except FileNotFoundError:
            return jsonify({"error": "Transcript not found"}), 404
        # Convert markdown transcript to basic HTML (simple line breaks for now)
        lines = transcript_text.splitlines()
        transcript_html = ""
        for line in lines:
            if line.startswith("#"):
                # Make title a heading
                transcript_html += f"<h2>{line.lstrip('# ').strip()}</h2>\n"
            elif line.strip() == "":
                continue  # skip empty line or handle paragraph break
            else:
                transcript_html += f"<p>{line}</p>\n"
        html_content = f"""
<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Podcast Export</title></head>
<body>
<h1>Podcast Audio</h1>
<audio controls src="{audio_url}"></audio>
<h1>Transcript</h1>
<div>{transcript_html}</div>
</body></html>"""
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
    return send_file(html_path, mimetype='text/html', as_attachment=True)


@app.route('/api/transcript/<job_id>', methods=['GET'])
def get_transcript_json(job_id):
    json_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{job_id}_arc.json")
    if not os.path.exists(json_path):
        return jsonify({"error": "Transcript JSON not found"}), 404
    return send_file(json_path, mimetype='application/json')


@app.route('/api/generate', methods=['POST'])
def generate_podcast():
    print("Generation started")
    try:
        data = request.get_json(force=True)
        fileID = data['fileID']
        speakers = data.get('speakers', [])

        config = {
            "title": data.get("title", "Generated Podcast"),
            "hosts": [s["name"] for s in speakers[:2]],
            "guest": speakers[2]["name"] if len(speakers) > 2 else None
        }

        config["speakers"] = speakers 

        result = podcast_service.generate_podcast(fileID, config)

        print("Generation completed successfully")
        return jsonify({
            "success": True,
            "job_id": result["fileID"],
            "transcript": result["transcript"],
            "audio_path": result["output_path"]
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "message": "Podcast generation failed"
        }), 500

@app.route('/api/status/<job_id>', methods=['GET'])  
def get_status(job_id):  
    return jsonify({
        "job_id": job_id,  
        "status": "completed",
        "progress": 100,
        "resultUrl": f"/api/download/{job_id}"  
    })

@app.route('/api/download/<job_id>', methods=['GET'])
def download_podcast(job_id): 
    return jsonify({
        "url": f"/api/audio/{job_id}.mp3",
        "expires": (datetime.now() + timedelta(days=1)).isoformat()
    })

@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    audio_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if not os.path.exists(audio_path):
        return jsonify({"error": "Audio file not found"}), 404
    return send_file(
        audio_path,
        mimetype='audio/mpeg',
        as_attachment=False
    )

@app.route('/api/audio/edit', methods=['POST'])
def edit_audio():
    try:
        data = request.get_json(force=True)
        file_id = data['fileID']
        edits = data['edits']  # [{start, end, action, ...}]
        audio_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{file_id}.mp3")
        audio = AudioSegment.from_file(audio_path)
        segments = []
        # Handle move: sort by new_index if present
        if any('new_index' in e for e in edits):
            edits = sorted(edits, key=lambda e: e.get('new_index', 0))
        for edit in edits:
            if edit['action'] == 'keep':
                segments.append(audio[edit['start']:edit['end']])
            elif edit['action'] == 'regenerate':
                # TODO: Call TTS backend with edit['text'], edit['voice'], etc.
                # For now, just keep the original segment as a placeholder
                segments.append(audio[edit['start']:edit['end']])
            # 'delete' means skip this region
        result = segments[0] if segments else AudioSegment.silent(duration=1000)
        for seg in segments[1:]:
            result += seg
        new_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{file_id}_edited.mp3")
        result.export(new_path, format='mp3')
        return jsonify({'success': True, 'audio_url': f'/api/audio/{file_id}_edited.mp3'})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

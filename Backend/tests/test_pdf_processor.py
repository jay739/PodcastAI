import pymupdf
import pytest

from pdf_processor import analyze_pdf, chunk_text, clean_text, extract_text
from services.transcript_utils import parse_transcript


def _make_pdf(path, pages, title=None):
    doc = pymupdf.open()
    for body in pages:
        page = doc.new_page()
        page.insert_text((72, 72), body)
    if title is not None:
        doc.set_metadata({"title": title})
    doc.save(path)
    doc.close()


def test_clean_text_rejoins_hyphenated_words_and_collapses_space():
    assert clean_text("pod-\ncast  is\n\n great\x00") == "podcast is great"


def test_chunks_respect_size_and_cover_all_text():
    sentences = [f"Sentence number {i} is here." for i in range(200)]
    chunks = chunk_text(" ".join(sentences), chunk_size=300, overlap=60)
    assert len(chunks) > 1
    # Each chunk stays near the limit: at most one sentence over it.
    assert all(len(c) <= 300 + len(sentences[0]) + 60 for c in chunks)
    for s in sentences:
        assert any(s in c for c in chunks)


def test_overlap_carries_trailing_sentences_up_to_limit():
    text = " ".join(f"S{i:03d} padding words." for i in range(50))
    chunks = chunk_text(text, chunk_size=200, overlap=40)
    for prev, nxt in zip(chunks, chunks[1:]):
        carried = nxt.split(" S")[0]
        assert carried in prev
        assert len(carried) <= 40


def test_zero_overlap_does_not_accumulate():
    # Used to keep the whole previous chunk, since list[-0:] is the full list.
    text = " ".join(f"Sentence {i}." for i in range(500))
    chunks = chunk_text(text, chunk_size=100, overlap=0)
    assert sum(len(c) for c in chunks) <= len(text) + len(chunks)
    assert max(len(c) for c in chunks) <= 100 + 20


def test_extract_text_reads_pages_and_metadata(tmp_path):
    path = tmp_path / "book.pdf"
    _make_pdf(path, ["Chapter one begins.", "Chapter two follows."], title="My Book")
    text, meta = extract_text(str(path))
    assert "Chapter one begins." in text and "Chapter two follows." in text
    assert meta["title"] == "My Book"
    assert meta["page_count"] == 2
    assert meta["author"] == "Unknown"


def test_missing_title_falls_back_to_file_name(tmp_path):
    path = tmp_path / "untitled.pdf"
    _make_pdf(path, ["Some text."])
    _, meta = extract_text(str(path))
    assert meta["title"] == "untitled.pdf"


def test_unreadable_file_raises_the_real_error(tmp_path):
    with pytest.raises(pymupdf.FileNotFoundError):
        extract_text(str(tmp_path / "missing.pdf"))


def test_analyze_pdf_counts(tmp_path):
    path = tmp_path / "b.pdf"
    _make_pdf(path, ["One two three."])
    result = analyze_pdf(str(path))
    assert result["word_count"] == 3
    assert result["chunks"] == ["One two three."]


def test_analyze_pdf_rejects_empty(tmp_path):
    path = tmp_path / "blank.pdf"
    _make_pdf(path, [""])
    with pytest.raises(ValueError):
        analyze_pdf(str(path))


def test_parse_transcript(tmp_path):
    path = tmp_path / "t.md"
    path.write_text(
        "# Episode 1\n\nHost: Welcome to the show.\nDr. Smith: Thanks for having me.\n\nnot a line\n",
        encoding="utf-8",
    )
    df = parse_transcript(str(path))
    assert df.to_dict("records") == [
        {"Name": "Host", "Dialogue": "Welcome to the show."},
        {"Name": "Dr. Smith", "Dialogue": "Thanks for having me."},
    ]

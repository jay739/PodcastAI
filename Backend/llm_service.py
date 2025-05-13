import requests
import re
import logging
from typing import List
import json
import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY", "")
openai.api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

class OpenAiLLMProvider:
    def __init__(self, model_name="gpt-3.5"):
        # Map friendly names to actual model IDs
        self.model = "gpt-3.5-turbo" if "3.5" in model_name else "gpt-4"
    def generate_response(self, prompt: str, max_tokens: int = 1000) -> str:
        if not openai.api_key:
            raise RuntimeError("OpenAI API key not set")
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        # Extract assistant response
        return response['choices'][0]['message']['content'].strip()
class OllamaLLMProvider:
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.model_name = model_name
        self.base_url = "http://localhost:11434"
    
    def get_available_models(self) -> List[str]:
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                return [model['name'] for model in response.json()['models']]
            return []
        except Exception as e:
            logging.error(f"Error fetching Ollama models: {e}")
            return []
    
    def select_model_interactively(self) -> str:
        models = self.get_available_models()
        if not models:
            print("No Ollama models found. Using default 'llama3'")
            return "llama3"
        print("\\nAvailable Ollama models:")
        for i, model in enumerate(models, 1):
            print(f"{i}. {model}")
        while True:
            try:
                choice = int(input("\\nSelect model number: "))
                if 1 <= choice <= len(models):
                    return models[choice-1]
                print("Invalid selection. Try again.")
            except ValueError:
                print("Please enter a number.")
    
    def generate_response(self, prompt: str, max_tokens: int = 4000) -> str:
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "num_ctx": max_tokens
            }
        }
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                headers=headers,
                json=data,
                stream=True,
                timeout=300
            )
            response.raise_for_status()
            full_text = ""
            for line in response.iter_lines():
                if line:
                    partial = line.decode("utf-8").removeprefix("data: ").strip()
                    if partial != "[DONE]":
                        chunk = json.loads(partial)
                        full_text += chunk.get("response", "")
            return self._clean_response(full_text)
        except Exception as e:
            logging.error(f"Error calling Ollama: {e}")
            return ""

    def _clean_response(self, text: str) -> str:
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"\\[(?!Host)[^\\]]+\\]", "", text)
        text = re.sub(r"Use a\\s+\\w+\\s+tone\\.?\\s*", "", text)
        text = re.sub(r"The user wants this for.*?\\.", "", text)
        text = re.sub(r"(?i)I need to generate.*?\\.", "", text)
        text = re.sub(r"(?i)I should.*?\\.", "", text)
        text = re.sub(r"(?i)I must.*?\\.", "", text)
        text = re.sub(r"(?i)The tone needs to be.*?\\.", "", text)
        text = re.sub(r"\\[Write.*?\\]", "", text)
        text = re.sub(r"\\[Speaker.*?\\]", "", text)
        text = re.sub(r"\\[.*?sentence.*?\\]", "", text)
        return text.strip()

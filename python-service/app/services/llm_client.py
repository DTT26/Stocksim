import os
import json
import httpx
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any, Iterator

class LLMClient:
    """
    VIP Hybrid LLM Client supporting Google Gemini API and OpenAI API.
    Dynamically loads .env so changes take effect immediately without restart.
    Provides fast timeout, HTTP connection pooling, and streaming fallback.
    """

    def __init__(self):
        self.last_error: Optional[str] = None
        self.active_provider: Optional[str] = None
        # Persistent HTTP connection pool to avoid repeated SSL/TLS handshakes
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0)
        self.client = httpx.Client(limits=limits, timeout=30.0)
        self._reload_env()

    def _reload_env(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        for env_path in [
            os.path.join(base_dir, ".env"),
            os.path.join(base_dir, "..", "backend", ".env"),
            os.path.join(base_dir, "..", ".env"),
        ]:
            if os.path.exists(env_path):
                load_dotenv(dotenv_path=env_path, override=True)
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip().strip("'\"")
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip().strip("'\"")
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "").strip().rstrip("/")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        self.preferred_provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()

    def is_configured(self) -> bool:
        self._reload_env()
        return bool(self.gemini_key or self.openai_key)

    def stream_text(self, system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> Iterator[str]:
        self.last_error = None
        self.active_provider = None
        if not self.is_configured():
            return

        # If user explicitly chose OpenAI
        if self.preferred_provider == "openai" and self.openai_key:
            try:
                has_yielded = False
                for chunk in self._stream_openai(system_prompt, user_prompt, max_tokens):
                    has_yielded = True
                    self.active_provider = "openai"
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI Streaming error, falling back to Gemini: {e}")

        # Gemini Streaming
        if self.gemini_key:
            try:
                has_yielded = False
                for chunk in self._stream_gemini(system_prompt, user_prompt, max_tokens):
                    has_yielded = True
                    self.active_provider = "gemini"
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                self.last_error = str(e)
                print(f"Gemini Streaming error, falling back: {e}")

        # OpenAI fallback if not already tried first
        if self.preferred_provider != "openai" and self.openai_key:
            try:
                has_yielded = False
                for chunk in self._stream_openai(system_prompt, user_prompt, max_tokens):
                    has_yielded = True
                    self.active_provider = "openai"
                    yield chunk
                if has_yielded:
                    return
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI Streaming error: {e}")

        # Fallback to standard generation if streaming fails
        full_text = self.generate_text(system_prompt, user_prompt, max_tokens)
        if full_text:
            yield full_text

    def generate_text(self, system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> Optional[str]:
        self.last_error = None
        self.active_provider = None
        if not self.is_configured():
            return None

        # If user chose OpenAI as preferred
        if self.preferred_provider == "openai" and self.openai_key:
            try:
                res = self._call_openai(system_prompt, user_prompt, max_tokens)
                if res:
                    self.active_provider = "openai"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI call failed, falling back to Gemini: {e}")

        # Gemini
        if self.gemini_key:
            try:
                res = self._call_gemini(system_prompt, user_prompt, max_tokens)
                if res:
                    self.active_provider = "gemini"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"Gemini API call failed, attempting fallback: {e}")

        # OpenAI fallback if Gemini was primary
        if self.preferred_provider != "openai" and self.openai_key:
            try:
                res = self._call_openai(system_prompt, user_prompt, max_tokens)
                if res:
                    self.active_provider = "openai"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI API call failed: {e}")

        return None

    def generate_vision_text(
        self,
        system_prompt: str,
        user_prompt: str,
        image_base64: str,
        mime_type: str = "image/png",
        max_tokens: int = 4000
    ) -> Optional[str]:
        self.last_error = None
        self.active_provider = None
        if not self.is_configured():
            return None

        clean_b64 = image_base64
        detected_mime = mime_type
        if "," in clean_b64:
            header, clean_b64 = clean_b64.split(",", 1)
            if "image/jpeg" in header or "image/jpg" in header:
                detected_mime = "image/jpeg"
            elif "image/webp" in header:
                detected_mime = "image/webp"
            else:
                detected_mime = "image/png"

        image_data = {"mimeType": detected_mime, "data": clean_b64.strip()}

        # Phương án 1: Gemini làm "Mắt thần" soi ảnh biểu đồ (Ưu tiên số 1 vì tốc độ cao, nhận diện hình ảnh tốt và rẻ)
        if self.gemini_key:
            try:
                res = self._call_gemini(system_prompt, user_prompt, max_tokens, image_data=image_data)
                if res:
                    self.active_provider = "gemini"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"Gemini Vision failed, falling back to OpenAI: {e}")

        # Dự phòng: OpenAI GPT-4o-mini Vision nếu Gemini gặp lỗi
        if self.openai_key:
            try:
                res = self._call_openai_vision(system_prompt, user_prompt, clean_b64, detected_mime, max_tokens)
                if res:
                    self.active_provider = "openai"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI Vision failed: {e}")

        return None

    def generate_inspection_text(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4000
    ) -> Optional[str]:
        """
        Chuyên biệt cho tính năng Chấm Bài Phân Tích Kỹ Thuật (SMC / ICT / Chart Grading).
        Ưu tiên Google Gemini theo cấu hình phân nhiệm (Gemini Chấm Bài, OpenAI Chat),
        dự phòng tự động sang OpenAI nếu Gemini gặp sự cố.
        """
        self.last_error = None
        self.active_provider = None
        if not self.is_configured():
            return None

        # 1. Ưu tiên số 1: Google Gemini chấm bài
        if self.gemini_key:
            try:
                res = self._call_gemini(system_prompt, user_prompt, max_tokens)
                if res:
                    self.active_provider = "gemini"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"Gemini chart inspection failed, falling back to OpenAI: {e}")

        # 2. Dự phòng: OpenAI GPT-4o nếu Gemini gặp lỗi
        if self.openai_key:
            try:
                res = self._call_openai(system_prompt, user_prompt, max_tokens)
                if res:
                    self.active_provider = "openai"
                    return res
            except Exception as e:
                self.last_error = str(e)
                print(f"OpenAI inspection fallback failed: {e}")

        return None

    def _call_gemini(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        max_tokens: int = 4000,
        image_data: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        # Models in order of current available quota & speed
        models = [
            "gemini-flash-lite-latest",
            "gemini-pro-latest",
            "gemini-flash-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.8-flash"
        ]

        contents_parts: List[Dict[str, Any]] = [{"text": user_prompt}]
        if image_data and image_data.get("data"):
            contents_parts.append({
                "inlineData": {
                    "mimeType": image_data.get("mimeType", "image/png"),
                    "data": image_data.get("data", "")
                }
            })

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_prompt}]
                },
                "contents": [
                    {
                        "parts": contents_parts
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": max_tokens,
                    "topP": 0.95
                }
            }
            try:
                resp = self.client.post(url, json=payload, timeout=25.0)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        texts = [p.get("text", "") for p in parts if "text" in p]
                        full_text = "\n".join(texts).strip()
                        if full_text:
                            self.last_error = None
                            return full_text
                elif resp.status_code in [429, 503, 500, 502, 504, 404]:
                    print(f"Gemini ({model}) HTTP {resp.status_code}, trying next model...")
                    continue
                else:
                    err_json = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
                    err_msg = err_json.get("error", {}).get("message", resp.text)
                    self.last_error = f"Google Gemini ({resp.status_code}): {err_msg}"
                    print(f"Gemini ({model}) HTTP {resp.status_code}: {err_msg}")
                    if resp.status_code in [400, 401, 403]:
                        break
                    continue
            except Exception as ex:
                self.last_error = str(ex)
                print(f"Error calling {model}: {ex}")
                continue
        return None

    def _stream_gemini(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4000
    ) -> Iterator[str]:
        models = [
            "gemini-flash-lite-latest",
            "gemini-pro-latest",
            "gemini-flash-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.7-flash"
        ]
        contents_parts: List[Dict[str, Any]] = [{"text": user_prompt}]
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "parts": contents_parts
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": max_tokens,
                "topP": 0.95
            }
        }
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={self.gemini_key}"
            try:
                with self.client.stream("POST", url, json=payload, timeout=35.0) as resp:
                    if resp.status_code == 200:
                        for line in resp.iter_lines():
                            if line.startswith("data: "):
                                raw = line[6:].strip()
                                try:
                                    data = json.loads(raw)
                                    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                                    for p in parts:
                                        t = p.get("text", "")
                                        if t:
                                            yield t
                                except Exception:
                                    pass
                        return
                    elif resp.status_code in [429, 503, 500, 502, 504, 404]:
                        print(f"Gemini stream ({model}) HTTP {resp.status_code}, trying next model...")
                        continue
                    else:
                        break
            except Exception as ex:
                print(f"Error streaming {model}: {ex}")
                continue

    def _stream_openai(self, system_prompt: str, user_prompt: str, max_tokens: int) -> Iterator[str]:
        base_url = self.openai_base_url or "https://api.openai.com/v1"
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        model = self.openai_model or "gpt-4o-mini"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": max_tokens,
            "stream": True
        }
        try:
            with self.client.stream("POST", url, headers=headers, json=payload, timeout=30.0) as resp:
                if resp.status_code == 200:
                    for line in resp.iter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except Exception:
                                continue
                else:
                    err_msg = f"OpenAI Stream HTTP {resp.status_code}"
                    self.last_error = err_msg
                    print(err_msg)
                    raise RuntimeError(err_msg)
        except Exception as ex:
            self.last_error = str(ex)
            print(f"OpenAI stream error: {ex}")
            raise ex

    def _call_openai(self, system_prompt: str, user_prompt: str, max_tokens: int) -> Optional[str]:
        base_url = self.openai_base_url or "https://api.openai.com/v1"
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.openai_model or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": max_tokens
        }
        try:
            resp = self.client.post(url, headers=headers, json=payload, timeout=20.0)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    return choices[0]["message"].get("content", "")
            else:
                print(f"OpenAI HTTP {resp.status_code}: {resp.text}")
                if resp.status_code in [400, 401, 403]:
                    self.openai_key = ""
        except Exception as ex:
            self.last_error = str(ex)
            print(f"Error calling OpenAI: {ex}")
        return None

    def _call_openai_vision(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        image_base64: str, 
        mime_type: str, 
        max_tokens: int
    ) -> Optional[str]:
        base_url = self.openai_base_url or "https://api.openai.com/v1"
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }

        data_url = f"data:{mime_type};base64,{image_base64}"
        payload = {
            "model": self.openai_model or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": data_url
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.4,
            "max_tokens": max_tokens
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
                else:
                    print(f"OpenAI Vision HTTP {resp.status_code}: {resp.text}")
        except Exception as ex:
            self.last_error = str(ex)
            print(f"Error calling OpenAI Vision: {ex}")
        return None

llm_client = LLMClient()

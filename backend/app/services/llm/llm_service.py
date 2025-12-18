import google.generativeai as genai
from groq import AsyncGroq, APIError as GroqAPIError
from openai import AsyncOpenAI, APIError as OpenAIAPIError
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import LLMServiceError
import json
import re
from functools import lru_cache

logger = get_logger(__name__)


class LLMService:
    """Service for interacting with a configured LLM provider (Gemini, Groq, or OpenRouter)."""

    def __init__(self):
        """Initialize the LLM service based on the provider in settings."""
        self.provider = settings.LLM_PROVIDER.lower()
        self.model_name = settings.LLM_MODEL
        self.client = None

        try:
            if not settings.LLM_API_KEY:
                raise LLMServiceError(f"{self.provider} API key is not configured")

            if self.provider == 'google':
                genai.configure(api_key=settings.LLM_API_KEY)
                # Store the default model client
                self.client = genai.GenerativeModel(self.model_name)
                logger.info(f"Google Gemini service initialized with model: {self.model_name}")
                
            elif self.provider == 'groq':
                self.client = AsyncGroq(api_key=settings.LLM_API_KEY)
                logger.info(f"Groq service initialized with model: {self.model_name}")
            
            elif self.provider == 'openrouter':
                self.client = AsyncOpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.LLM_API_KEY
                )
                logger.info(f"OpenRouter service initialized for model: {self.model_name}")
                
            else:
                raise LLMServiceError(f"Unsupported LLM provider: {self.provider}")
                
        except Exception as e:
            logger.error(f"Failed to initialize LLM service for provider '{self.provider}': {repr(e)}", exc_info=True)
            raise LLMServiceError(f"LLM initialization failed: {str(e)}")


    async def generate_text(
        self,
        prompt: str,
        temperature: float = settings.TEMPERATURE,
        max_tokens: int = settings.MAX_TOKENS,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None  # <-- ADDED model override
    ) -> str:
        """Generate text using the configured LLM."""
        
        # Determine the model to use for this specific call
        model_to_use = model or self.model_name
        
        logger.info(f"Generating text with {self.provider} using model {model_to_use}")
        
        try:
            if self.provider == 'google':
                
                client_instance = self.client
                apply_system_instruction = bool(system_instruction)
                
                # Check if we need a new client instance:
                # 1. If a custom model is specified AND it's different from the default
                # 2. If a system instruction is provided (as it's part of the model init)
                if (model and model != self.model_name) or apply_system_instruction:
                    logger.debug(f"Creating new Google client for model: {model_to_use} (System Instruction: {apply_system_instruction})")
                    client_instance = genai.GenerativeModel(
                        model_to_use,
                        system_instruction=system_instruction if apply_system_instruction else None
                    )
                # If no custom model AND no system instruction, self.client (from __init__) is used.
                
                generation_config = genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                )
                
                logger.debug("Calling Google Gemini API...")
                response = await client_instance.generate_content_async(
                    prompt,
                    generation_config=generation_config
                )
                
                if not response or not hasattr(response, 'text'):
                    logger.error("Empty or invalid response from Google Gemini")
                    raise LLMServiceError("Empty response from LLM")
                    
                logger.info(f"Generated {len(response.text)} characters")
                return response.text

            elif self.provider == 'groq' or self.provider == 'openrouter':
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                chat_completion = await self.client.chat.completions.create(
                    messages=messages,
                    model=model_to_use,  # <-- Use the determined model
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                
                if not chat_completion.choices or not chat_completion.choices[0].message.content:
                    logger.error(f"Empty response from {self.provider}")
                    raise LLMServiceError("Empty response from LLM")
                    
                content = chat_completion.choices[0].message.content
                logger.info(f"Generated {len(content)} characters")
                return content

            return "" 
            
        except (GroqAPIError, OpenAIAPIError) as api_err: 
            # Avoid formatting with a dict payload which caused KeyError('error')
            logger.error("%s API error: %r", self.provider, api_err, exc_info=True)
            # Some client errors may not have a .message attribute or may have
            # nested error payloads; fall back safely to string repr.
            message = getattr(api_err, "message", None) or str(api_err)
            raise LLMServiceError(f"{self.provider} API failed: {message}")
        except Exception as e:
            logger.error(f"LLM text generation error with {self.provider}: {repr(e)}", exc_info=True)
            raise LLMServiceError(f"Failed to generate text: {str(e)}")

    async def generate_json(
        self,
        prompt: str,
        temperature: float = settings.TEMPERATURE,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate structured JSON output using the configured LLM."""
        
        # Determine the model to use for this specific call
        model_to_use = model or self.model_name
        
        logger.info(f"Generating JSON with {self.provider} using model {model_to_use}")
        
        json_prompt = f"""{prompt}

IMPORTANT: Return ONLY a valid JSON object or array. No markdown, no code blocks (```json), no explanations before or after the JSON."""

        response_text = ""  # Initialize for error logging
        try:
            if self.provider == 'groq' or self.provider == 'openrouter':
                messages = [{"role": "user", "content": json_prompt}]
                
                # Try to use JSON mode
                try:
                    chat_completion = await self.client.chat.completions.create(
                        messages=messages,
                        model=model_to_use, # <-- Use the determined model
                        temperature=temperature,
                        response_format={"type": "json_object"},
                    )
                    response_text = chat_completion.choices[0].message.content
                    return json.loads(response_text)
                except Exception as json_mode_error:
                    # Fallback if model doesn't support JSON mode or fails
                    logger.warning(f"JSON mode failed ({repr(json_mode_error)}), falling back to text extraction.")
                    # Pass the specific model to the fallback
                    return await self._generate_json_from_text(json_prompt, temperature, model=model_to_use)
            
            elif self.provider == 'google': # Fallback for Google
                # --- THIS IS THE FIX ---
                # Pass the specific model to the fallback
                # Changed `use_model=` to `model=`
                return await self._generate_json_from_text(json_prompt, temperature, model=model_to_use)
            
            # Default empty dict if providers fail, though error should be raised first
            return {}

        except json.JSONDecodeError as je:
            logger.error(f"JSON parsing error: {je}. Response: {response_text[:500] if response_text else 'N/A'}", exc_info=True)
            raise LLMServiceError(f"Failed to parse JSON from LLM response: {str(je)}")
        except (GroqAPIError, OpenAIAPIError) as api_err:
            logger.error("%s API error in JSON gen: %r", self.provider, api_err, exc_info=True)
            message = getattr(api_err, "message", None) or str(api_err)
            raise LLMServiceError(f"{self.provider} API failed: {message}")
        except Exception as e:
            logger.error(f"LLM JSON generation error: {repr(e)}", exc_info=True)
            raise LLMServiceError(f"Failed to generate JSON: {str(e)}")

    async def _generate_json_from_text(self, prompt: str, temperature: float, model: Optional[str] = None) -> Dict[str, Any]:
        """Internal helper to generate text and extract JSON."""
        # Pass model to generate_text
        response_text = await self.generate_text(prompt=prompt, temperature=temperature, model=model) 
        response_text = response_text.strip()
        
        # Strip markdown code blocks if present
        if response_text.startswith('```'):
            response_text = re.sub(r'\s*```$', '', response_text)

        # Find the first occurrence of { or [ and the last occurrence of } or ]
        match = re.search(r'[\[\{].*[\]\}]', response_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse extracted JSON string: {e}. String: {json_str[:500]}...")
                raise LLMServiceError(f"LLM returned malformed JSON: {e}")
        else:
            logger.error(f"No valid JSON object or array found in text response: {response_text[:500]}...")
            raise LLMServiceError("LLM did not return a valid JSON object")

    async def generate_with_context(
        self,
        prompt: str,
        context: str,
        temperature: float = settings.TEMPERATURE,
        model: Optional[str] = None # <-- Allow model override here too
    ) -> str:
        """Generate text with given context (RAG)."""
        logger.info("Generating text with context")
        
        full_prompt = f"""Context:
---
{context}
---

Task:
Based *only* on the provided context, answer the following question:
{prompt}
"""
        # Pass the model parameter to generate_text
        return await self.generate_text(prompt=full_prompt, temperature=temperature, model=model)


@lru_cache()
def get_llm_service() -> "LLMService":
    """
    Return a cached singleton instance of LLMService.

    Heavy LLM client initialization (network validation, auth setup, etc.)
    should not run on every request. Using an lru_cache here ensures we
    create the client once per process and reuse it, which significantly
    reduces latency for generation/chat endpoints.
    """
    return LLMService()

from app.core.config import settings
from app.ai.base import BaseAIProvider
from app.ai.gemini import GeminiProvider
from app.ai.mock import MockProvider

def get_ai_provider() -> BaseAIProvider:
    provider_name = settings.AI_PROVIDER.lower()
    
    if provider_name == "gemini":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    elif provider_name == "mock":
        return MockProvider()
    # Future providers will be registered here:
    # elif provider_name == "openai":
    #     return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    # elif provider_name == "ollama":
    #     return OllamaProvider(base_url=settings.OLLAMA_BASE_URL)
    else:
        raise ValueError(f"Unsupported AI_PROVIDER: {provider_name}")

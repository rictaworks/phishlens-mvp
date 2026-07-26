import os

DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 2


def get_google_api_key() -> str | None:
    return os.environ.get("GOOGLE_API_KEY")


def get_model_name() -> str:
    return os.environ.get("PHISHLENS_LLM_MODEL", DEFAULT_MODEL)

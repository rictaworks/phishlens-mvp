import os

DEFAULT_MODEL = "claude-opus-5"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 2


def get_anthropic_api_key() -> str | None:
    return os.environ.get("ANTHROPIC_API_KEY")


def get_model_name() -> str:
    return os.environ.get("PHISHLENS_LLM_MODEL", DEFAULT_MODEL)

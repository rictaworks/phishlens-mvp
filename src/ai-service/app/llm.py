from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import (
    DEFAULT_MAX_RETRIES,
    DEFAULT_TIMEOUT_SECONDS,
    get_google_api_key,
    get_model_name,
)


class LlmNotConfiguredError(RuntimeError):
    """GOOGLE_API_KEY未設定時に送出する(規約によりフォールバックしない)。"""


def build_analysis_llm() -> ChatGoogleGenerativeAI:
    api_key = get_google_api_key()
    if not api_key:
        raise LlmNotConfiguredError("GOOGLE_API_KEYが設定されていません")

    return ChatGoogleGenerativeAI(
        model=get_model_name(),
        api_key=api_key,
        timeout=DEFAULT_TIMEOUT_SECONDS,
        max_retries=DEFAULT_MAX_RETRIES,
    )

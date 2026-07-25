from langchain_anthropic import ChatAnthropic

from app.config import (
    DEFAULT_MAX_RETRIES,
    DEFAULT_TIMEOUT_SECONDS,
    get_anthropic_api_key,
    get_model_name,
)


class LlmNotConfiguredError(RuntimeError):
    """ANTHROPIC_API_KEY未設定時に送出する(規約によりフォールバックしない)。"""


def build_analysis_llm() -> ChatAnthropic:
    api_key = get_anthropic_api_key()
    if not api_key:
        raise LlmNotConfiguredError("ANTHROPIC_API_KEYが設定されていません")

    return ChatAnthropic(
        model=get_model_name(),
        api_key=api_key,
        timeout=DEFAULT_TIMEOUT_SECONDS,
        max_retries=DEFAULT_MAX_RETRIES,
    )

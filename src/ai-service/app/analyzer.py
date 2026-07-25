from pathlib import Path
from typing import Protocol

from langchain_core.prompts import ChatPromptTemplate

from app.schemas import AnalysisResult

PROMPT_PATH = Path(__file__).resolve().parent.parent / "config" / "analysis-prompt.txt"
SYSTEM_PROMPT = PROMPT_PATH.read_text(encoding="utf-8")


class AnalysisFailedError(RuntimeError):
    """LLM呼び出し・構造化出力の解析に失敗した場合に送出する(規約によりフォールバックしない)。"""


class StructuredOutputLlm(Protocol):
    def with_structured_output(self, schema: type[AnalysisResult]): ...  # noqa: D102


def build_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", "{body}"),
        ]
    )


def analyze(body: str, llm: StructuredOutputLlm) -> AnalysisResult:
    messages = build_prompt().format_messages(body=body)
    structured_llm = llm.with_structured_output(AnalysisResult)
    try:
        result = structured_llm.invoke(messages)
    except Exception as error:  # noqa: BLE001 - 外部LLM呼び出しの失敗を統一的に扱う
        raise AnalysisFailedError(f"AI詳細判定に失敗しました: {error}") from error

    if not isinstance(result, AnalysisResult):
        raise AnalysisFailedError("AI詳細判定の応答を構造化データとして解析できませんでした")

    return result

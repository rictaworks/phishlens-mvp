import pytest

from app.analyzer import AnalysisFailedError, analyze
from app.schemas import AnalysisResult


class FakeStructuredRunnable:
    def __init__(self, result_or_error):
        self._result_or_error = result_or_error

    def invoke(self, _messages):
        if isinstance(self._result_or_error, Exception):
            raise self._result_or_error
        return self._result_or_error


class FakeLlm:
    def __init__(self, result_or_error):
        self._result_or_error = result_or_error

    def with_structured_output(self, _schema):
        return FakeStructuredRunnable(self._result_or_error)


def test_analyze_returns_structured_result() -> None:
    expected = AnalysisResult(phishing_score=70, ai_gen_score=55, reason_text="定型的な文面です")
    llm = FakeLlm(expected)

    result = analyze("本文", llm)

    assert result == expected


def test_analyze_wraps_llm_errors() -> None:
    llm = FakeLlm(RuntimeError("connection reset"))

    with pytest.raises(AnalysisFailedError):
        analyze("本文", llm)


def test_analyze_rejects_non_structured_response() -> None:
    llm = FakeLlm("plain string, not AnalysisResult")

    with pytest.raises(AnalysisFailedError):
        analyze("本文", llm)

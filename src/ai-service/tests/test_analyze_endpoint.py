import pytest
from fastapi.testclient import TestClient

from app.main import app, get_llm
from app.schemas import AnalysisResult


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def test_analyze_returns_503_when_llm_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    client = TestClient(app)

    response = client.post("/analyze", json={"body": "本文です"})

    assert response.status_code == 503


def test_analyze_returns_structured_result_when_configured() -> None:
    expected = AnalysisResult(phishing_score=80, ai_gen_score=None, reason_text="緊急性を煽る表現があります")
    app.dependency_overrides[get_llm] = lambda: _FakeLlm(expected)
    client = TestClient(app)

    response = client.post("/analyze", json={"body": "至急ご確認ください"})

    assert response.status_code == 200
    assert response.json() == {
        "phishing_score": 80,
        "ai_gen_score": None,
        "reason_text": "緊急性を煽る表現があります",
    }


def test_analyze_returns_502_when_analysis_fails() -> None:
    app.dependency_overrides[get_llm] = lambda: _FakeLlm(RuntimeError("timeout"))
    client = TestClient(app)

    response = client.post("/analyze", json={"body": "本文です"})

    assert response.status_code == 502


def test_analyze_rejects_empty_body() -> None:
    app.dependency_overrides[get_llm] = lambda: _FakeLlm(
        AnalysisResult(phishing_score=0, ai_gen_score=None, reason_text="")
    )
    client = TestClient(app)

    response = client.post("/analyze", json={"body": ""})

    assert response.status_code == 422


class _FakeStructuredRunnable:
    def __init__(self, result_or_error):
        self._result_or_error = result_or_error

    def invoke(self, _messages):
        if isinstance(self._result_or_error, Exception):
            raise self._result_or_error
        return self._result_or_error


class _FakeLlm:
    def __init__(self, result_or_error):
        self._result_or_error = result_or_error

    def with_structured_output(self, _schema):
        return _FakeStructuredRunnable(self._result_or_error)

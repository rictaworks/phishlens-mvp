import pytest

from app.llm import LlmNotConfiguredError, build_analysis_llm


def test_raises_when_api_key_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    with pytest.raises(LlmNotConfiguredError):
        build_analysis_llm()


def test_builds_llm_with_configured_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")

    llm = build_analysis_llm()

    assert llm.model == "gemini-2.5-flash"


def test_uses_model_override_env_var(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setenv("PHISHLENS_LLM_MODEL", "gemini-2.5-pro")

    llm = build_analysis_llm()

    assert llm.model == "gemini-2.5-pro"

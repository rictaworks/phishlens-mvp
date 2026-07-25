from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.analyzer import AnalysisFailedError, analyze
from app.llm import LlmNotConfiguredError, build_analysis_llm
from app.schemas import AnalysisResult, AnalyzeRequest

app = FastAPI(title="PhishLens AI Service", version="0.0.1")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


def get_llm():
    return build_analysis_llm()


@app.exception_handler(LlmNotConfiguredError)
def handle_llm_not_configured(_request: Request, exc: LlmNotConfiguredError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"error": str(exc)})


@app.exception_handler(AnalysisFailedError)
def handle_analysis_failed(_request: Request, exc: AnalysisFailedError) -> JSONResponse:
    return JSONResponse(status_code=502, content={"error": str(exc)})


@app.post("/analyze", response_model=AnalysisResult)
def analyze_endpoint(payload: AnalyzeRequest, llm=Depends(get_llm)) -> AnalysisResult:
    return analyze(payload.body, llm)

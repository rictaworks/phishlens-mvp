from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    body: str = Field(min_length=1)


class AnalysisResult(BaseModel):
    phishing_score: int = Field(ge=0, le=100, description="フィッシング意図の強さ(0-100)")
    ai_gen_score: int | None = Field(default=None, ge=0, le=100, description="AI生成らしさ(0-100)")
    reason_text: str = Field(description="判定根拠の説明文")

from fastapi import FastAPI

app = FastAPI(title="PhishLens AI Service", version="0.0.1")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}

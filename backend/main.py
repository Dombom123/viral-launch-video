import json
import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from storyboard.schemas import Status, Storyboard
from storyboard.storyboard_service import (
    choose_generator,
    configure_gemini_if_needed,
    generate_storyboard,
    load_research,
    mock_generate_storyboard,
    storyboard_path,
    status_path,
    write_status,
)

load_dotenv()

app = FastAPI(title="ViralLaunch Storyboard Service", version="0.1.0")


@app.post("/runs/{run_id}/storyboard", response_model=Storyboard)
def create_storyboard(run_id: str) -> Storyboard:
    # For now we operate on a single static run id.
    run_id = "first"
    research = load_research(run_id)
    write_status(Status(run_id=run_id, status="processing", message="Generating storyboard..."))

    try:
        if choose_generator():
            try:
                configure_gemini_if_needed()
                print("[storyboard] Using Gemini pipeline")
                write_status(Status(run_id=run_id, status="processing", message="Generating with Gemini..."))
                storyboard = generate_storyboard(run_id, research)
            except Exception as exc:  # noqa: BLE001
                # Fallback to mock if Gemini model is unavailable
                print(f"[storyboard] Gemini failed, falling back to mock: {exc}")
                write_status(
                    Status(
                        run_id=run_id,
                        status="processing",
                        message="Gemini unavailable, using mock",
                    )
                )
                storyboard = mock_generate_storyboard(run_id, research)
        else:
            print("[storyboard] Gemini key not set, using mock generator")
            storyboard = mock_generate_storyboard(run_id, research)

        path = storyboard_path(run_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(storyboard.model_dump(), ensure_ascii=False, indent=2), encoding="utf-8")
        write_status(Status(run_id=run_id, status="done", message="Storyboard ready"))
        return storyboard
    except Exception as exc:  # noqa: BLE001
        write_status(Status(run_id=run_id, status="error", message=str(exc)))
        raise


@app.get("/runs/{run_id}/storyboard", response_model=Storyboard)
def get_storyboard(run_id: str) -> Storyboard:
    run_id = "first"
    path = storyboard_path(run_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="storyboard.json not found for run")
    return Storyboard.model_validate(json.loads(path.read_text(encoding="utf-8")))


@app.get("/runs/{run_id}/status", response_model=Status)
def get_status(run_id: str) -> Status:
    run_id = "first"
    path = status_path(run_id)
    if not path.exists():
        return Status(run_id=run_id, status="queued", message="Waiting to start")
    return Status.model_validate(json.loads(path.read_text(encoding="utf-8")))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
    )

"""
MIC.BEST BOM Agent Backend — FastAPI + LangGraph
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from .routers.bom import router as bom_router

app = FastAPI(
    title="MIC.BEST BOM Agent",
    version="0.1.0",
    description="LangGraph-powered BOM generation agent for MIC.BEST",
)

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(bom_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "mic-best-agent"}


@app.get("/")
def root():
    return {
        "service": "MIC.BEST BOM Agent",
        "version": "0.1.0",
        "endpoints": {
            "/bom/stream": "SSE stream for BOM generation",
            "/health": "Health check",
        },
    }

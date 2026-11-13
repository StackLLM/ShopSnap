# syntax=docker/dockerfile:1

# ---- 1. Interface (React + Vite + Tailwind + Lightswind) ----
FROM node:22-alpine AS interface
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Construit dans /app/shopsnap/static (voir vite.config.ts : outDir ../shopsnap/static)
RUN npm run build

# ---- 2. Application Python ----
FROM python:3.12-slim

# ffmpeg : assemble image + son sans réencodage (yt-dlp)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY shopsnap ./shopsnap
COPY --from=interface /app/shopsnap/static ./shopsnap/static

ENV DATA_DIR=/data ATTENTE_DIR=/attente PORT=8080 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "-m", "shopsnap"]

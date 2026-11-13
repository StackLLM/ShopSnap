# syntax=docker/dockerfile:1
FROM python:3.12-slim

# ffmpeg : assemble image + son sans réencodage (yt-dlp)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY shopsnap ./shopsnap

ENV DATA_DIR=/data ATTENTE_DIR=/attente PORT=8080 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "-m", "shopsnap"]

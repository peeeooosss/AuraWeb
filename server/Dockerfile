# TryAuraAI — PPTX Compiler (FastAPI)
# Converts AI-generated HTML slides into editable .pptx files.
# Usage: docker build -t tryauraai-pptx-compiler . -f server/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/export_server.py .

EXPOSE 4567

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:4567/health')"

CMD ["uvicorn", "export_server:app", "--host", "0.0.0.0", "--port", "4567"]

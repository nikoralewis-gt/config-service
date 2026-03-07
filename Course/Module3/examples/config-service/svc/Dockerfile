# Use the official uv base image
FROM ghcr.io/astral-sh/uv:python3.13-alpine

# Set working directory
WORKDIR /app

# Copy application code
COPY api/ ./api/
COPY migrations/ ./migrations/

# Install dependencies with uv add
RUN uv init --no-readme --no-workspace && \
    uv add fastapi==0.116.1 && \
    uv add "uvicorn[standard]==0.32.1" && \
    uv add pydantic==2.11.7 && \
    uv add "pydantic-settings>=2.0.0,<3.0.0" && \
    uv add "pydantic-extra-types>=2.0.0,<3.0.0" && \
    uv add "python-ulid>=2.0.0,<3.0.0" && \
    uv add "psycopg2-binary>=2.9.0,<3.0.0"

# Expose port 8000
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

# Run with uv
CMD ["uv", "run", "python", "-m", "uvicorn", "api.main:svc", "--host", "0.0.0.0", "--port", "8000"]
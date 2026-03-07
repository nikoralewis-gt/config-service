.PHONY: test run migrate clean install

# Run all tests with coverage
test:
	uv run python -m pytest --cov=api --cov=migrations --cov-report=html --cov-report=term

# Start the development server
run:
	uv run python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Run database migrations
migrate:
	uv run python -m migrations.migrations

# Clean generated files and caches
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache .coverage htmlcov dist build

# Install dependencies
install:
	uv sync

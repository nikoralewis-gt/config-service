# Getting Started

## Prerequisites

- Python 3.13+
- uv package manager
- Node.js 18+
- npm

## Start the System

### 1. Config Service API

```bash
cd config-service
uv sync
cp .env.example .env
make migrate
make run
```

### 2. Client Library

```bash
cd config-service-client
npm install
npm run build
```

### 3. Admin UI

```bash
cd ui
npm install
npm run dev
```

## Access the Application

- **Admin UI:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs

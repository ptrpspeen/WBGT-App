# WBGT App

Monorepo workspace for the WBGT prediction system.

## Structure

```text
.
├── backend/          # R Plumber API serving the WBGT XGBoost model
├── frontend/         # Responsive web app prototype
├── docker-compose.yml
└── README.md
```

The backend and frontend are isolated so API code, model assets, and UI code stay easy to work on independently.

## Backend

Run the API from the repository root with Docker:

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:8000
```

Backend-specific setup, endpoints, and request examples live in [backend/README.md](backend/README.md).

## Frontend

Run the web app from the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

It proxies `/api/*` requests to the backend at `http://localhost:8000`.

Current layout:

```text
.
├── backend/
├── frontend/
└── docker-compose.yml
```

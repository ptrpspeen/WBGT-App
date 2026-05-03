# WBGT Heat Risk Frontend

Responsive web application prototype for outdoor heat-risk assessment.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The app calls Open-Meteo directly from the browser for weather data without an API key, and proxies `/api/*` to the backend at `http://localhost:8000` for model prediction.

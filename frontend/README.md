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

The app calls Open-Meteo directly from the browser for weather data without an API key, and calls the WBGT model API directly for prediction.

Default API:

```text
https://wbgt-app-49xb.onrender.com
```

Override for local development:

```bash
VITE_WBGT_API_BASE_URL=http://localhost:8000 npm run dev
```

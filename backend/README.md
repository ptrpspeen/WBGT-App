# WBGT Geo R API

MVP R Plumber API for serving the provided XGBoost Geo WBGT prediction model.

## What This API Does

This API receives prepared weather, time, and location features, validates them, performs small unit standardization for `SunshineDuration`, runs the saved R model, and returns predicted WBGT in Celsius as JSON.

## What This API Does Not Do

- Does not build or serve frontend code.
- Does not implement API1.
- Does not call Open-Meteo or any external weather API.
- Does not train or retrain a model.
- Does not use `Area`.
- Does not use the old cumulative `Time` feature.
- Does not fake or hardcode prediction values.

## Required Features

Feature names are case-sensitive and must be provided under the `features` object:

1. `Temperature_2m`
2. `DewPoint_2m`
3. `WetBulb_2m`
4. `DiffuseRadiation`
5. `SunshineDuration`
6. `CloudCoverHigh`
7. `hour_of_day`
8. `latitude`
9. `longitude`

Additional fields inside `features` are ignored and are not passed into the model.

## Feature Schema

| Feature | Type | Notes |
| --- | --- | --- |
| `Temperature_2m` | numeric | Air temperature at 2m in Celsius. |
| `DewPoint_2m` | numeric | Dew point temperature at 2m in Celsius. |
| `WetBulb_2m` | numeric | Wet bulb temperature at 2m in Celsius. |
| `DiffuseRadiation` | numeric, `>= 0` | Diffuse radiation in the same scale used by the geo model training data. |
| `SunshineDuration` | numeric, `>= 0` | Standardized to seconds per hour if sent as fraction or minutes. |
| `CloudCoverHigh` | numeric, `0-100` | High cloud cover percentage. |
| `hour_of_day` | numeric, `0-23` | Local hour of selected prediction time. |
| `latitude` | numeric, `-90..90` | Decimal degrees. |
| `longitude` | numeric, `-180..180` | Decimal degrees. |

Requests with missing values, `null`, `NA`, `NaN`, `Inf`, empty strings, or non-numeric values are rejected.

## Run Locally

From the backend directory:

```bash
cd backend
Rscript install.R
Rscript -e "pr <- plumber::plumb('plumber.R'); pr$run(host = '0.0.0.0', port = 8000)"
```

Then check:

```bash
curl http://localhost:8000/health
```

## Run With Docker

From the repository root:

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:8000
```

## Example Request

```json
{
  "features": {
    "Temperature_2m": 33.5,
    "DewPoint_2m": 25.2,
    "WetBulb_2m": 28.0,
    "DiffuseRadiation": 180,
    "SunshineDuration": 3300,
    "CloudCoverHigh": 20,
    "hour_of_day": 13,
    "latitude": 14.7225,
    "longitude": 101.3351
  }
}
```

## Example Curl

```bash
curl -X POST http://localhost:8000/predict-wbgt \
  -H "Content-Type: application/json" \
  --data @backend/examples/sample_request.json
```

Batch prediction for multiple hours:

```bash
curl -X POST http://localhost:8000/predict-wbgt-batch \
  -H "Content-Type: application/json" \
  --data @backend/examples/batch_request.json
```

## Expected Response

With the bundled `final_xgb_geo_model_bundle_for_app.rds` artifact currently in this project, the sample request produces approximately `29.77` Celsius. If a separate handoff expects `31.84`, verify that the model artifact and training-time unit conventions are the same.

```json
{
  "wbgt_c": 29.77,
  "model": "xgboost_geo",
  "model_version": "xgb-geo-v1",
  "unit": "celsius"
}
```

## Batch Prediction

Use `POST /predict-wbgt-batch` when API1 already has several model-ready hourly rows. The recommended request shape is `items`, where each item contains a `features` object and optional row-level `metadata`.

```json
{
  "items": [
    {
      "features": {
        "Temperature_2m": 33.5,
        "DewPoint_2m": 25.2,
        "WetBulb_2m": 28.0,
        "DiffuseRadiation": 180,
        "SunshineDuration": 3300,
        "CloudCoverHigh": 20,
        "hour_of_day": 13,
        "latitude": 14.7225,
        "longitude": 101.3351
      },
      "metadata": {
        "datetime": "2026-04-25T13:00:00+07:00",
        "location_id": "pakchong"
      }
    }
  ]
}
```

Successful batch response:

```json
{
  "predictions": [
    {
      "index": 1,
      "wbgt_c": 29.77,
      "metadata": {
        "datetime": "2026-04-25T13:00:00+07:00",
        "location_id": "pakchong"
      }
    }
  ],
  "count": 1,
  "model": "xgboost_geo",
  "model_version": "xgb-geo-v1",
  "unit": "celsius"
}
```

The endpoint also accepts a shorter shape when metadata is not needed:

```json
{
  "features": [
    {
      "Temperature_2m": 33.5,
      "DewPoint_2m": 25.2,
      "WetBulb_2m": 28.0,
      "DiffuseRadiation": 180,
      "SunshineDuration": 3300,
      "CloudCoverHigh": 20,
      "hour_of_day": 13,
      "latitude": 14.7225,
      "longitude": 101.3351
    }
  ]
}
```

## Notes About Unit Standardization

`SunshineDuration` is standardized before prediction:

- Values `<= 1` are treated as a fraction of an hour and multiplied by `3600`.
- Values `<= 60` are treated as minutes and multiplied by `60`.
- Larger values are treated as seconds.
- Values outside `0` to `3600` after conversion are clamped and returned with a warning.

`CloudCoverHigh` is not converted from percent to seconds in this geo API. Send a `0-100` high cloud cover percentage, such as `20`.

## How API1 Should Call This API

API1 should:

- Fetch or derive the six weather variables.
- Compute local `hour_of_day` from the selected prediction time.
- Send `latitude` and `longitude` directly as decimal degrees.
- For hourly ranges, send one item per hour to `/predict-wbgt-batch` and keep timestamps in item-level `metadata`.
- Preserve exact case-sensitive feature names.
- Avoid sending `Area` and old cumulative `Time`; they are not used by this model.

## Known Limitations

- This is an MVP serving API for a pre-trained model.
- Prediction quality depends on API1 matching the geo model training feature schema and units.
- The model is intended for screening and decision support, not formal ISO-compliant WBGT certification without further validation.
- Wider deployment should be validated, especially for locations outside the training geography.

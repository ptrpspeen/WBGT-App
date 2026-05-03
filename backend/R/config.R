MODEL_PATH <- file.path("app_prototype", "final_xgb_geo_model_bundle_for_app.rds")
SELECTED_FEATURES_PATH <- file.path("app_prototype", "final_feature_schema_for_app.csv")

MODEL_VERSION <- "xgb-geo-v1"
MODEL_NAME <- "xgboost_geo"
TARGET_NAME <- "WBGT"
TARGET_UNIT <- "celsius"

REQUIRED_FEATURES <- c(
  "Temperature_2m",
  "DewPoint_2m",
  "WetBulb_2m",
  "DiffuseRadiation",
  "SunshineDuration",
  "CloudCoverHigh",
  "hour_of_day",
  "latitude",
  "longitude"
)

API_PORT <- as.integer(Sys.getenv("PORT", "8000"))

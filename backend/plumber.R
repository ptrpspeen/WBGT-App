library(plumber)
library(jsonlite)
library(caret)
library(xgboost)

source(file.path("R", "config.R"))
source(file.path("R", "model_loader.R"))
source(file.path("R", "validator.R"))
source(file.path("R", "standardize_features.R"))
source(file.path("R", "predict_wbgt.R"))
source(file.path("R", "response_helpers.R"))

model_state <- load_wbgt_model(MODEL_PATH)

metadata_payload <- function() {
  list(
    model = MODEL_NAME,
    model_version = MODEL_VERSION,
    target = TARGET_NAME,
    unit = TARGET_UNIT,
    required_features = REQUIRED_FEATURES,
    feature_notes = list(
      Temperature_2m = "Air temperature at 2m in Celsius.",
      DewPoint_2m = "Dew point temperature at 2m in Celsius.",
      WetBulb_2m = "Wet bulb temperature at 2m in Celsius.",
      DiffuseRadiation = "Diffuse radiation value in the same scale used by the geo model training data.",
      SunshineDuration = "Expected in seconds per hour after standardization.",
      CloudCoverHigh = "High cloud cover percentage from 0 to 100.",
      hour_of_day = "Hour of day as a numeric value from 0 to 23.",
      latitude = "Latitude in decimal degrees.",
      longitude = "Longitude in decimal degrees."
    ),
    warnings = c(
      "Area is not used by this model.",
      "The old cumulative Time feature is not used by this model.",
      "hour_of_day must be computed from the selected local prediction time.",
      "Prediction quality depends on matching the geo model training-time feature schema and units."
    )
  )
}

#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (identical(req$REQUEST_METHOD, "OPTIONS")) {
    res$status <- 200
    return(list())
  }

  plumber::forward()
}

#* Health check
#* @serializer unboxedJSON
#* @get /health
function() {
  if (isTRUE(model_state$loaded)) {
    return(success_response(list(
      status = "ok",
      model_loaded = TRUE,
      model_version = MODEL_VERSION,
      required_features = REQUIRED_FEATURES
    )))
  }

  success_response(list(
    status = "degraded",
    model_loaded = FALSE,
    model_version = MODEL_VERSION,
    error = "Model file not found or could not be loaded"
  ))
}

#* Model metadata
#* @serializer unboxedJSON
#* @get /metadata
function() {
  success_response(metadata_payload())
}

#* Predict WBGT
#* @serializer unboxedJSON
#* @post /predict-wbgt
function(req, res) {
  if (!isTRUE(model_state$loaded)) {
    return(model_not_loaded_response(res))
  }

  body <- tryCatch(
    jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
    error = function(e) NULL
  )

  if (is.null(body) || is.null(body$features)) {
    return(error_response(
      res = res,
      status = 400,
      code = "INVALID_INPUT",
      message = "Invalid input features",
      details = c("Request body must contain features")
    ))
  }

  validation <- validate_features(body$features, REQUIRED_FEATURES)
  if (!isTRUE(validation$valid)) {
    return(error_response(
      res = res,
      status = 400,
      code = "INVALID_INPUT",
      message = "Invalid input features",
      details = validation$details
    ))
  }

  standardized <- standardize_features(body$features)

  prediction <- tryCatch(
    predict_wbgt(model_state$model, standardized$features, REQUIRED_FEATURES),
    error = function(e) e
  )

  if (inherits(prediction, "error")) {
    return(error_response(
      res = res,
      status = 500,
      code = "PREDICTION_FAILED",
      message = "Failed to generate WBGT prediction",
      details = conditionMessage(prediction)
    ))
  }

  response <- list(
    wbgt_c = round(prediction, 2),
    model = MODEL_NAME,
    model_version = MODEL_VERSION,
    unit = TARGET_UNIT
  )

  if (length(standardized$warnings) > 0) {
    response$warnings <- standardized$warnings
  }

  success_response(response)
}

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

parse_request_body <- function(req) {
  tryCatch(
    jsonlite::fromJSON(req$postBody, simplifyVector = FALSE),
    error = function(e) NULL
  )
}

as_batch_items <- function(body) {
  if (!is.null(body$items) && is.list(body$items)) {
    return(body$items)
  }

  if (!is.null(body$features) && is.list(body$features)) {
    has_named_single_feature_set <- all(REQUIRED_FEATURES %in% names(body$features))
    if (!has_named_single_feature_set) {
      return(lapply(body$features, function(features) list(features = features)))
    }
  }

  NULL
}

validate_batch_items <- function(items) {
  details <- character()

  if (is.null(items) || length(items) == 0) {
    return(list(
      valid = FALSE,
      details = c("Request body must contain a non-empty items array or features array")
    ))
  }

  for (index in seq_along(items)) {
    item <- items[[index]]
    features <- if (!is.null(item$features)) item$features else item
    validation <- validate_features(features, REQUIRED_FEATURES)

    if (!isTRUE(validation$valid)) {
      details <- c(
        details,
        paste0("Item ", index, ": ", validation$details)
      )
    }
  }

  list(
    valid = length(details) == 0,
    details = details
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

  body <- parse_request_body(req)

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

#* Predict WBGT for multiple rows
#* @serializer unboxedJSON
#* @post /predict-wbgt-batch
function(req, res) {
  if (!isTRUE(model_state$loaded)) {
    return(model_not_loaded_response(res))
  }

  body <- parse_request_body(req)
  if (is.null(body)) {
    return(error_response(
      res = res,
      status = 400,
      code = "INVALID_INPUT",
      message = "Invalid batch input",
      details = c("Request body must be valid JSON")
    ))
  }

  items <- as_batch_items(body)
  validation <- validate_batch_items(items)
  if (!isTRUE(validation$valid)) {
    return(error_response(
      res = res,
      status = 400,
      code = "INVALID_INPUT",
      message = "Invalid batch input",
      details = validation$details
    ))
  }

  standardized_items <- lapply(items, function(item) {
    features <- if (!is.null(item$features)) item$features else item
    standardized <- standardize_features(features)

    list(
      features = standardized$features,
      warnings = standardized$warnings,
      metadata = null_coalesce(item$metadata, NULL)
    )
  })

  predictions <- tryCatch(
    predict_wbgt_batch(
      model_state$model,
      lapply(standardized_items, function(item) item$features),
      REQUIRED_FEATURES
    ),
    error = function(e) e
  )

  if (inherits(predictions, "error")) {
    return(error_response(
      res = res,
      status = 500,
      code = "PREDICTION_FAILED",
      message = "Failed to generate WBGT predictions",
      details = conditionMessage(predictions)
    ))
  }

  results <- lapply(seq_along(predictions), function(index) {
    item_response <- list(
      index = index,
      wbgt_c = round(predictions[[index]], 2)
    )

    if (!is.null(standardized_items[[index]]$metadata)) {
      item_response$metadata <- standardized_items[[index]]$metadata
    }

    if (length(standardized_items[[index]]$warnings) > 0) {
      item_response$warnings <- standardized_items[[index]]$warnings
    }

    item_response
  })

  success_response(list(
    predictions = results,
    count = length(results),
    model = MODEL_NAME,
    model_version = MODEL_VERSION,
    unit = TARGET_UNIT
  ))
}

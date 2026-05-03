load_wbgt_model <- function(model_path) {
  tryCatch({
    if (!file.exists(model_path)) {
      stop("Model file not found")
    }

    model_object <- readRDS(model_path)
    model <- if (is.list(model_object) && !is.null(model_object$model)) {
      model_object$model
    } else {
      model_object
    }

    predictors <- tryCatch(
      {
        if (is.list(model_object) && !is.null(model_object$feature_cols_raw)) {
          model_object$feature_cols_raw
        } else {
          caret::predictors(model)
        }
      },
      error = function(e) REQUIRED_FEATURES
    )

    list(
      model = model,
      bundle = model_object,
      loaded = TRUE,
      error = NULL,
      predictors = predictors
    )
  }, error = function(e) {
    list(
      model = NULL,
      bundle = NULL,
      loaded = FALSE,
      error = "Model file not found or could not be loaded",
      predictors = REQUIRED_FEATURES
    )
  })
}

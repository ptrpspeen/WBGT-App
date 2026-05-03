predict_wbgt <- function(model, features, required_features) {
  values <- lapply(required_features, function(feature_name) {
    as.numeric(features[[feature_name]])
  })
  names(values) <- required_features

  df <- as.data.frame(values, check.names = FALSE)
  df <- df[, required_features, drop = FALSE]

  prediction <- tryCatch(
    predict(model, newdata = df),
    error = function(e1) {
      tryCatch(
        predict(model, df),
        error = function(e2) {
          matrix_data <- as.matrix(df)
          if (inherits(model, "xgb.Booster")) {
            return(predict(model, matrix_data))
          }
          stop(e2)
        }
      )
    }
  )

  as.numeric(prediction[[1]])
}

predict_wbgt_batch <- function(model, features_list, required_features) {
  vapply(
    features_list,
    function(features) predict_wbgt(model, features, required_features),
    numeric(1)
  )
}

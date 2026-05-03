success_response <- function(payload) {
  payload
}

empty_object <- function() {
  structure(list(), names = character())
}

null_coalesce <- function(value, fallback) {
  if (is.null(value)) {
    return(fallback)
  }

  value
}

error_response <- function(res, status, code, message, details = NULL) {
  res$status <- status

  response <- list(
    error = TRUE,
    code = code,
    message = message
  )

  if (!is.null(details)) {
    response$details <- details
  }

  response
}

model_not_loaded_response <- function(res) {
  error_response(
    res = res,
    status = 503,
    code = "MODEL_NOT_LOADED",
    message = "WBGT model is not loaded"
  )
}

validate_features <- function(features, required_features) {
  details <- character()

  if (is.null(features) || !is.list(features)) {
    return(list(
      valid = FALSE,
      details = "Request body must contain a features object"
    ))
  }

  for (feature_name in required_features) {
    if (!feature_name %in% names(features) || is.null(features[[feature_name]])) {
      details <- c(details, paste0("Missing feature: ", feature_name))
      next
    }

    value <- features[[feature_name]]

    if (length(value) != 1 || is.character(value) || !is.numeric(value)) {
      details <- c(details, paste0("Feature ", feature_name, " must be numeric"))
      next
    }

    if (is.na(value) || is.nan(value) || is.infinite(value)) {
      details <- c(details, paste0("Feature ", feature_name, " must be finite and non-missing"))
      next
    }
  }

  non_negative_features <- c("DiffuseRadiation", "SunshineDuration", "CloudCoverHigh")
  for (feature_name in non_negative_features) {
    if (feature_name %in% names(features) &&
        is.numeric(features[[feature_name]]) &&
        length(features[[feature_name]]) == 1 &&
        is.finite(features[[feature_name]]) &&
        features[[feature_name]] < 0) {
      details <- c(details, paste0("Feature ", feature_name, " must be greater than or equal to 0"))
    }
  }

  if ("hour_of_day" %in% names(features) &&
      is.numeric(features[["hour_of_day"]]) &&
      length(features[["hour_of_day"]]) == 1 &&
      is.finite(features[["hour_of_day"]]) &&
      (features[["hour_of_day"]] < 0 || features[["hour_of_day"]] > 23)) {
    details <- c(details, "Feature hour_of_day must be between 0 and 23")
  }

  if ("CloudCoverHigh" %in% names(features) &&
      is.numeric(features[["CloudCoverHigh"]]) &&
      length(features[["CloudCoverHigh"]]) == 1 &&
      is.finite(features[["CloudCoverHigh"]]) &&
      features[["CloudCoverHigh"]] > 100) {
    details <- c(details, "Feature CloudCoverHigh must be between 0 and 100")
  }

  if ("latitude" %in% names(features) &&
      is.numeric(features[["latitude"]]) &&
      length(features[["latitude"]]) == 1 &&
      is.finite(features[["latitude"]]) &&
      (features[["latitude"]] < -90 || features[["latitude"]] > 90)) {
    details <- c(details, "Feature latitude must be between -90 and 90")
  }

  if ("longitude" %in% names(features) &&
      is.numeric(features[["longitude"]]) &&
      length(features[["longitude"]]) == 1 &&
      is.finite(features[["longitude"]]) &&
      (features[["longitude"]] < -180 || features[["longitude"]] > 180)) {
    details <- c(details, "Feature longitude must be between -180 and 180")
  }

  list(
    valid = length(details) == 0,
    details = details
  )
}

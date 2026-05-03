standardize_features <- function(features) {
  standardized <- features
  warnings <- character()

  sunshine <- standardized[["SunshineDuration"]]
  if (sunshine <= 1) {
    sunshine <- sunshine * 3600
  } else if (sunshine <= 60) {
    sunshine <- sunshine * 60
  }

  if (sunshine < 0 || sunshine > 3600) {
    clamped <- min(max(sunshine, 0), 3600)
    warnings <- c(
      warnings,
      paste0("SunshineDuration was clamped from ", sunshine, " to ", clamped, " seconds")
    )
    sunshine <- clamped
  }
  standardized[["SunshineDuration"]] <- sunshine

  list(
    features = standardized,
    warnings = warnings
  )
}

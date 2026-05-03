packages <- c(
  "plumber",
  "jsonlite",
  "caret",
  "dplyr",
  "tibble"
)

xgboost_version <- "1.7.8.1"
xgboost_url <- paste0(
  "https://cran.r-project.org/src/contrib/Archive/xgboost/xgboost_",
  xgboost_version,
  ".tar.gz"
)

missing_packages <- packages[!vapply(packages, requireNamespace, logical(1), quietly = TRUE)]

if (length(missing_packages) > 0) {
  install.packages(missing_packages, repos = "https://cloud.r-project.org")
}

installed_xgboost <- requireNamespace("xgboost", quietly = TRUE)
if (!installed_xgboost || as.character(utils::packageVersion("xgboost")) != xgboost_version) {
  install.packages(xgboost_url, repos = NULL, type = "source")
}

packages <- c(packages, "xgboost")
still_missing <- packages[!vapply(packages, requireNamespace, logical(1), quietly = TRUE)]

if (length(still_missing) > 0) {
  stop(
    "Failed to install required packages: ",
    paste(still_missing, collapse = ", "),
    call. = FALSE
  )
}

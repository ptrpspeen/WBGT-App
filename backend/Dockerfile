FROM rocker/r-ver:4.3.3

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libsodium-dev \
    libssl-dev \
    libxml2-dev \
    make \
    pkg-config \
    zlib1g-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY install.R /app/install.R
RUN Rscript /app/install.R

COPY plumber.R /app/plumber.R
COPY R /app/R
COPY app_prototype /app/app_prototype
COPY examples /app/examples
COPY README.md /app/README.md

EXPOSE 8000

CMD ["Rscript", "-e", "pr <- plumber::plumb('/app/plumber.R'); pr$run(host = '0.0.0.0', port = 8000)"]

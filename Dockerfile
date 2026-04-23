# pandoc/extra includes pandoc, TeX Live, and the eisvogel template
FROM docker.io/pandoc/extra:3.6.4 AS base

# Install Node.js, npm, and Chromium (required by mermaid-cli/puppeteer)
RUN apk add --no-cache nodejs npm \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Tell puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Install npm dependencies (includes @mermaid-js/mermaid-cli)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY bin/ bin/
COPY src/ src/
COPY lua/ lua/
COPY index.js ./
COPY puppeteer-config.json ./

ENTRYPOINT ["node", "bin/cli.js"]

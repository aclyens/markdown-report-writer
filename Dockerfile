# pandoc/extra includes pandoc, TeX Live, and the eisvogel template
FROM docker.io/pandoc/extra:3.6.4 AS base

# Install Node.js (LTS)
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Install npm dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY bin/ bin/
COPY src/ src/
COPY lua/ lua/
COPY index.js ./

ENTRYPOINT ["node", "bin/cli.js"]

FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    qpdf \
    poppler-utils \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p storage/uploads storage/results

EXPOSE 4000

CMD ["node", "dist/main.js"]

# Stage 1: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
RUN apk add --no-cache git

WORKDIR /app

# Copy backend build
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package*.json ./
RUN npm ci --omit=dev

# Copy frontend build (served as static files or via reverse proxy)
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV DB_PATH=/app/data/branchtree.sqlite
# SETTINGS_ENCRYPTION_KEY must be provided at runtime for portable secret encryption
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

EXPOSE 3001

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health/ready || exit 1

CMD ["node", "dist/index.js"]

# Multi-stage Dockerfile for Next.js (Next 13)
FROM node:18-alpine AS builder
WORKDIR /app

# Allow passing required environment variables at build time.
# Example: docker build --build-arg MONGODB_URI="your-uri" -t cryptopulse:latest .
ARG MONGODB_URI
ENV MONGODB_URI=${MONGODB_URI}

# Install dependencies (copy package files first for better caching)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source code and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Propagate runtime environment variables (if you passed them at build time, they'll be preserved)
ARG MONGODB_URI
ENV MONGODB_URI=${MONGODB_URI}

# Copy only the necessary artifacts from the builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]

# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

WORKDIR /app
ENV DATABASE_URL=postgresql://smartlog:smartlog_dev@db:5432/smartlog

# Dependencias primero para aprovechar la cache de Docker.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Imagen final con solo las dependencias necesarias para ejecutar la API.
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://smartlog:smartlog_dev@db:5432/smartlog
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "dist/main.js"]

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist/server.js ./dist/server.js
COPY --from=builder /app/dist/openapi.json ./dist/openapi.json

USER node
EXPOSE 3000

CMD ["node", "dist/server.js"]

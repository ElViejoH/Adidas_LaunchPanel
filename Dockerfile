FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_URL=file:/data/staging.db \
    SERVE_FRONTEND=true \
    FRONTEND_DIST_PATH=/app/frontend/dist

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/scripts ./scripts
RUN npm run prisma:generate
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN mkdir -p /data && chown -R node:node /app /data
USER node

EXPOSE 4000
VOLUME ["/data"]
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["npm", "run", "start:container"]

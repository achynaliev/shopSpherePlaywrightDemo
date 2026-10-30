# ---- Build the React client -------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w client --include-workspace-root=false
COPY client client
RUN npm run build -w client

# ---- Production image: API + static client ----------------------------------
FROM node:20-bookworm-slim
ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_PATH=/data/shop.db
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
# better-sqlite3 normally downloads a prebuilt binary; the build tools are a fallback and are removed afterwards.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci --omit=dev -w server --include-workspace-root=false \
 && npm cache clean --force \
 && apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*
COPY server/src server/src
COPY --from=build /app/client/dist client/dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/src/index.js"]

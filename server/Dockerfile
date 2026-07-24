FROM node:22-alpine

WORKDIR /app

COPY package.json ./
# python3/make/g++ sont requis pour compiler better-sqlite3 (module natif) — retirés
# après l'installation pour garder l'image légère ; MongoDB (utilisé en production
# quand MONGODB_URI est défini) ne dépend pas de ces outils.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --omit=dev \
    && apk del .build-deps

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]

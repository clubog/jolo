FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY server/package.json server/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY server/src ./src
COPY server/tsconfig.json ./

RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]

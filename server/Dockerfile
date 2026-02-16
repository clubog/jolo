FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile
RUN npx tsc

EXPOSE 3001

CMD ["node", "--env-file=.env", "dist/index.js"]

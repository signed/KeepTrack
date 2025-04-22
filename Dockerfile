# setup pnpm with corepack
FROM node:22-alpine AS pnpm
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN corepack enable && corepack install

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
FROM pnpm AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile

FROM pnpm AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm build

# download production dependencies
FROM pnpm AS production-dependencies-env
WORKDIR /app
RUN pnpm install --prod

FROM node:22-alpine
COPY package.json pnpm-lock.yaml server.js /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]

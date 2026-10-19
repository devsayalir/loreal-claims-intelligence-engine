FROM node:24-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# One-off job: apply migrations and load demo data into an empty database.
FROM deps AS migrate
ENV SEED_ONLY_IF_EMPTY=true
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
# @prisma/client lists the Prisma CLI and TypeScript as optional peers;
# --omit=optional keeps them (about 350 MB) out of the runtime image.
RUN npm ci --omit=dev --omit=optional --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

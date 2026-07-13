FROM node:22-alpine
WORKDIR /app

# Prisma needs OpenSSL (and libc6-compat on musl/Alpine) to load its engines.
RUN apk add --no-cache openssl libc6-compat

# Install dependencies (includes Prisma CLI for migrations at startup)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

# Entrypoint applies migrations, then starts the server
CMD ["sh", "docker-entrypoint.sh"]

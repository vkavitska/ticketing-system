# Build stage: compile the SPA
FROM node:22-alpine AS build
WORKDIR /app
# libc6-compat helps native build deps (e.g. Tailwind's oxide) run on musl/Alpine.
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage: serve static assets + proxy /api to the backend
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

FROM node:16.15.1-alpine3.15 as builder

WORKDIR /app/builder

COPY . .

RUN cd playground && npm install
RUN cd playground && npm run build

FROM nginx:1.22.0

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/builder/playground/build ./
COPY --from=builder /app/builder/ci/docker/nginx/nginx.conf /etc/nginx/nginx.conf


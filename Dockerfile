FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY *.html ./
COPY *.css ./
COPY *.js ./
COPY assets ./assets

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV BATTLECHESS_DATA_DIR=/tmp/battlechess-armada

EXPOSE 8080

CMD ["node", "server.js"]

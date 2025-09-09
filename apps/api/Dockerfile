FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm i
COPY . .
RUN npm run build
ENV PORT=3001
EXPOSE 3001
RUN chmod +x ./docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]

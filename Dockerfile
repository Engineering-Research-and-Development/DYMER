# ============================
# STAGE 1 - Build Angular
# ============================
FROM node:20 AS build-frontend
WORKDIR /app/dymer-gui
COPY dymer-gui/package*.json ./
RUN npm install
COPY dymer-gui/ .
RUN npm run build --prod
 
# ============================
# STAGE 2 - Gateway + Angular
# ============================
FROM node:20 AS gateway
WORKDIR /app/secrets
COPY secrets/ .

WORKDIR /app/dymer-webserver
COPY dymer-webserver/package*.json ./
RUN npm install --production
COPY dymer-webserver/ .
COPY --from=build-frontend /app/dymer-gui/dist/ng-matero/browser ./public
EXPOSE 8080
CMD ["npm", "start"]
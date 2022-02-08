FROM node:17.0.1
ENV NODE_ENV=production

WORKDIR /SRC

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "server.js" ]

FROM node:16

WORKDIR /usr/src/mailSenderJS

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "./src/index.js"]
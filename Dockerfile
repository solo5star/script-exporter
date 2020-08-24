FROM node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir /scripts

ENV SCRIPTS_DIRECTORY=/scripts

EXPOSE 9109

ENTRYPOINT ["node", "main.js"]

RUN apt update
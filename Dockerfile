FROM node:25
RUN mkdir -p /usr/scr/bot
WORKDIR /usr/src/bot
COPY . /usr/src/bot
RUN npm install
RUN npx tsc
CMD ["node", "built/index.js"]
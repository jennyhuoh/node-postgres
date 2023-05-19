FROM node:18.12.1
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./
COPY ./ ./
RUN npm install
CMD ["node", "index.js"]
CMD ["node", "index.js"]
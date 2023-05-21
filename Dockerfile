FROM node:18.12.1
WORKDIR /node-postgres
COPY package*.json ./
RUN npm install
COPY . ./
EXPOSE 8000
CMD ["node", "index.js"]
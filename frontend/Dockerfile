FROM node:20-alpine
WORKDIR /app
COPY package*.json angular.json tsconfig*.json ./
RUN npm install
COPY src ./src
EXPOSE 4200
CMD ["npm", "start"]

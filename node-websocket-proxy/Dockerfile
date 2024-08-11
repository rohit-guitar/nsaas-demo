FROM node:22-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
# RUN npm install
EXPOSE 8891
CMD ["npm", "run", "start"]
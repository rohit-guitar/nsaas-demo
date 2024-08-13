FROM node:22-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN yarn install
EXPOSE 8891
CMD ["yarn", "start"]
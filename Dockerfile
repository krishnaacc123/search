FROM node:9-alpine

LABEL maintainer="Krishna Kumar <krishna.kumar@razorpay.com>"

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN mkdir /app
COPY . /app

CMD [ "npm", "start", "start:prod" ]

EXPOSE 5555


FROM node:18
ENV NODE_ENV=production
WORKDIR /usr/app/
COPY ./ /usr/app

RUN npm install

COPY . .
EXPOSE 80

CMD ["npm", "start"]

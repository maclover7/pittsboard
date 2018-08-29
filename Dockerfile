FROM node:10.6.0

RUN apt-get update -y

WORKDIR /app
ADD . /app
RUN rm .env

RUN yarn install

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s CMD curl --fail http://localhost:3000/ping || exit 1

CMD ["yarn", "run", "start"]

FROM node:10-alpine as build 
WORKDIR /usr/data
COPY app.js package.json ./
RUN npm install -g pkg
RUN npm install
RUN npm run build

FROM alpine
RUN apk update && apk add --no-cache libstdc++ libgcc curl
COPY --from=build /usr/data/simple-express .
CMD ["./simple-express"]

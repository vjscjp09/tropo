FROM mikejihbe/nodejs-ssh:latest
EXPOSE 3000
WORKDIR /app
COPY . /app
RUN ["npm", "install"]
CMD ${0%/*}/build
node index.js

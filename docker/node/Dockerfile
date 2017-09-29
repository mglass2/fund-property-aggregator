FROM node:latest

COPY ./docker/node/start.sh /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh; sync

WORKDIR /app
CMD ["start.sh"]
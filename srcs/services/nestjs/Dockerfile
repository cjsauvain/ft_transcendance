FROM node:18.17.1

WORKDIR /var/www/backend

COPY scripts/nestjs-entrypoint.sh /usr/bin

RUN chmod 755 /usr/bin/nestjs-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["nestjs-entrypoint.sh"]

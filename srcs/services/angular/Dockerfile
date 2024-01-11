FROM node:18.17.1

WORKDIR /var/www/frontend

COPY scripts/angular-entrypoint.sh /usr/bin

RUN chmod 755 /usr/bin/angular-entrypoint.sh

EXPOSE 4200

ENTRYPOINT ["angular-entrypoint.sh"]

FROM phusion/passenger-nodejs

ENV HOME /root
CMD ["/sbin/my_init"]

RUN rm -f /etc/service/nginx/down

RUN rm /etc/nginx/sites-enabled/default
ADD slackquarto.conf /etc/nginx/sites-enabled/slackquarto.conf
RUN mkdir /home/app/slackquarto
COPY --chown=app:app app /home/app/slackquarto

RUN npm --prefix /home/app/slackquarto install /home/app/slackquarto
FROM public.ecr.aws/lambda/nodejs:24

WORKDIR /var/task

COPY package.json package-lock.json ./
RUN /var/lang/bin/npm ci

COPY bench.js ./
COPY lib ./lib
COPY scenarios ./scenarios

ENTRYPOINT ["/var/lang/bin/node"]
CMD ["bench.js"]

FROM node:17
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . ./
RUN mkdir -p /usr/share/fonts/truetype/
RUN install -m644 Roboto-Regular.ttf /usr/share/fonts/truetype/
RUN install -m644 Roboto-Bold.ttf /usr/share/fonts/truetype/
RUN install -m644 "Font Awesome 6 Pro-Solid-900.otf" /usr/share/fonts/truetype/
EXPOSE 3033
CMD [ "node", "index.js" ]

FROM node:18
# Install dependencies for building node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    tzdata \
ENV TZ=Europe/London
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY images ./images
COPY fonts ./fonts
COPY index.js ./
RUN mkdir -p /usr/share/fonts/truetype/
RUN find $PWD/fonts \( -name "*.ttf" -o -name "*.otf" \) -exec install -m644 {} /usr/share/fonts/truetype/ \;
RUN fc-cache -f -v
EXPOSE 3033
CMD [ "npm", "start" ]

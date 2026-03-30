FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build
RUN sh -lc 'for f in dist/assets/*.js; do b=$(basename "$f"); n=$(echo "$b" | sed -E "s/-[A-Za-z0-9_-]+\\.js$/.js/"); [ "$b" = "$n" ] || cp "$f" "dist/assets/$n"; done'
RUN sh -lc 'for f in dist/assets/*.css; do b=$(basename "$f"); n=$(echo "$b" | sed -E "s/-[A-Za-z0-9_-]+\\.css$/.css/"); [ "$b" = "$n" ] || cp "$f" "dist/assets/$n"; done'

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

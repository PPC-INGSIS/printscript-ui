# Etapa 1: construye la UI. Node solo hace falta para esto.
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build

WORKDIR /app

# Cypress está en dependencies pero la imagen no lo usa: sin esto baja su binario.
ENV CYPRESS_INSTALL_BINARY=0

# Primero solo lo que define las dependencias, para que Docker reuse esta capa
# mientras no cambien.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

# Relativa: la misma imagen sirve en dev y en prod, bajo el mismo dominio que la API.
ARG BACKEND_URL=/api
# Auth0: Vite los graba en el JavaScript al construir. Son públicos (el Client ID de una SPA no es
# un secreto) y todos los entornos usan el mismo tenant, así que una sola imagen sirve para todos.
ARG VITE_AUTH0_DOMAIN=dev-m32ysp7h6y2qyjn0.us.auth0.com
ARG VITE_AUTH0_CLIENT_ID=G0kbDLuLToHgld18uycoHvq7sav3xMvp
ARG VITE_AUTH0_AUDIENCE=https://snippet-searcher-api
RUN npm run build

# Etapa 2: solo los archivos estáticos, servidos por nginx.
FROM nginx:1.30-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Swarm considera la tarea sana recién cuando nginx contesta. En un deploy con start-first,
# no apaga la tarea vieja hasta que la nueva esté sana.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

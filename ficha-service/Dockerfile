FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json del servicio
COPY ficha-service/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código del servicio
COPY ficha-service/ .

# Copiar la carpeta shared
COPY shared/ ../shared/

# Establecer NODE_PATH para que shared pueda encontrar los módulos
ENV NODE_PATH=/app/node_modules

# Exponer el puerto
EXPOSE 3003

# Comando para iniciar la aplicación
CMD ["node", "index.js"]

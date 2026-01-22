FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json del servicio
COPY appointment-service/package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el codigo del servicio
COPY appointment-service/ .

# Copiar la carpeta shared
COPY shared/ ../shared/

# Establecer NODE_PATH para que shared pueda encontrar los modulos
ENV NODE_PATH=/app/node_modules

# Exponer el puerto
EXPOSE 3006

# Comando para iniciar la aplicacion
CMD ["node", "index.js"]

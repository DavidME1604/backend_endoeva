# Guía de Despliegue y Mejores Prácticas

## Índice
1. [Despliegue en Producción](#despliegue-en-producción)
2. [Mejores Prácticas](#mejores-prácticas)
3. [Seguridad](#seguridad)
4. [Monitoreo y Logs](#monitoreo-y-logs)
5. [Respaldos](#respaldos)
6. [Escalabilidad](#escalabilidad)
7. [Troubleshooting](#troubleshooting)

---

## Despliegue en Producción

### 1. Preparación del Servidor

#### Requisitos Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB mínimo, 8GB recomendado
- **Disco**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS o superior
- **Red**: IP pública, puertos 80, 443 abiertos

#### Software Requerido
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Instalar certificados SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuración de Variables de Entorno

Crear archivo `.env` en producción:

```bash
# Base de Datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=odontologia_db
DB_USER=odonto_user
DB_PASSWORD=<STRONG_PASSWORD_HERE>

# Puertos (internos)
GATEWAY_PORT=3000
AUTH_PORT=3001
PATIENT_PORT=3002
FICHA_PORT=3003
ODONTOGRAM_PORT=3004
BUDGET_PORT=3005

# Seguridad
JWT_SECRET=<GENERATE_RANDOM_SECRET_HERE>
NODE_ENV=production

# URLs de Servicios (internos)
AUTH_SERVICE_URL=http://auth-service:3001
PATIENT_SERVICE_URL=http://patient-service:3002
FICHA_SERVICE_URL=http://ficha-service:3003
ODONTOGRAM_SERVICE_URL=http://odontogram-service:3004
BUDGET_SERVICE_URL=http://budget-service:3005
```

### 3. Generar Secretos Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar DB_PASSWORD
openssl rand -base64 32
```

### 4. Configurar NGINX como Reverse Proxy

Crear archivo `/etc/nginx/sites-available/odontologia`:

```nginx
upstream api_gateway {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/odontologia-access.log;
    error_log /var/log/nginx/odontologia-error.log;

    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Activar configuración:
```bash
sudo ln -s /etc/nginx/sites-available/odontologia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Obtener Certificado SSL

```bash
sudo certbot --nginx -d api.tudominio.com
```

### 6. Desplegar con Docker Compose

```bash
# Clonar repositorio
git clone <repository-url>
cd sistema-odontologia

# Configurar .env
nano .env

# Construir e iniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose logs -f
```

### 7. Inicializar Base de Datos

```bash
# Esperar a que PostgreSQL esté listo
sleep 10

# Ejecutar migraciones
docker-compose exec postgres psql -U odonto_user -d odontologia_db -f /migrations/001_create_tables.sql
```

---

## Mejores Prácticas

### Código

1. **Validación de Entrada**
   - Siempre validar datos de entrada
   - Usar express-validator
   - Sanitizar strings

2. **Manejo de Errores**
   - Try-catch en todas las rutas
   - Respuestas consistentes
   - No exponer información sensible

3. **Logs**
   - Usar niveles de log (info, warn, error)
   - Incluir timestamps
   - No loguear contraseñas o tokens

4. **Código Limpio**
   - Seguir estándares de JavaScript
   - Comentarios claros
   - Nombres descriptivos

### Base de Datos

1. **Índices**
   - Crear índices en campos de búsqueda frecuente
   - Monitorear queries lentas

2. **Transacciones**
   - Usar transacciones para operaciones múltiples
   - BEGIN, COMMIT, ROLLBACK apropiadamente

3. **Respaldos**
   - Respaldos diarios automáticos
   - Guardar en ubicación segura
   - Probar restauración regularmente

### API

1. **Versionado**
   - Usar versionado de API (/api/v1)
   - Mantener compatibilidad hacia atrás

2. **Documentación**
   - Mantener documentación actualizada
   - Usar Swagger/OpenAPI

3. **Rate Limiting**
   - Configurar límites apropiados
   - Diferentes límites por endpoint

---

## Seguridad

### Checklist de Seguridad

- [ ] JWT_SECRET fuerte y aleatorio
- [ ] Contraseñas hasheadas con bcrypt
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Validación de entrada en todos los endpoints
- [ ] SQL injection protegido (prepared statements)
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad configurados
- [ ] Logs no contienen información sensible
- [ ] Variables de entorno no comiteadas
- [ ] Certificados SSL válidos
- [ ] Firewall configurado
- [ ] Acceso SSH por llave únicamente
- [ ] Usuario root deshabilitado
- [ ] Actualizaciones automáticas de seguridad

### Actualizar Dependencias

```bash
# Verificar vulnerabilidades
npm audit

# Actualizar dependencias
npm update

# Actualizar dependencias con vulnerabilidades
npm audit fix
```

---

## Monitoreo y Logs

### Logs Centralizados

Usar herramientas como:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Graylog**
- **Splunk**

### Monitoreo de Servicios

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Ver logs con timestamp
docker-compose logs -f --timestamps

# Ver últimas 100 líneas
docker-compose logs --tail=100
```

### Métricas Importantes

- **Tiempo de respuesta** de APIs
- **Tasa de errores** (4xx, 5xx)
- **Uso de CPU y memoria**
- **Conexiones a base de datos**
- **Espacio en disco**
- **Tráfico de red**

### Alertas

Configurar alertas para:
- Servicios caídos
- Alto uso de recursos (>80%)
- Errores 5xx frecuentes
- Disco casi lleno (>85%)

---

## Respaldos

### Script de Respaldo Automático

Crear `/root/backup-odontologia.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/odontologia"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="odontologia_db"
DB_USER="odonto_user"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Respaldar base de datos
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Eliminar respaldos mayores a 30 días
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Respaldo completado: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

### Configurar Cron

```bash
# Hacer ejecutable
chmod +x /root/backup-odontologia.sh

# Editar crontab
crontab -e

# Agregar línea (respaldo diario a las 2 AM)
0 2 * * * /root/backup-odontologia.sh >> /var/log/odontologia-backup.log 2>&1
```

### Restaurar Respaldo

```bash
# Descomprimir
gunzip db_backup_YYYYMMDD_HHMMSS.sql.gz

# Restaurar
docker-compose exec -T postgres psql -U odonto_user -d odontologia_db < db_backup_YYYYMMDD_HHMMSS.sql
```

---

## Escalabilidad

### Escalar Horizontalmente

Para escalar servicios:

```yaml
# docker-compose.prod.yml
services:
  patient-service:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Load Balancing

Usar NGINX o HAProxy para balancear carga entre réplicas.

### Caché

Implementar Redis para:
- Caché de queries frecuentes
- Sesiones de usuario
- Rate limiting distribuido

### Base de Datos

- **Replicación**: Master-Slave para lectura
- **Particionamiento**: Por fecha o ID
- **Connection pooling**: Ya implementado con pg

---

## Troubleshooting

### Servicio no arranca

```bash
# Ver logs
docker-compose logs service-name

# Verificar configuración
docker-compose config

# Reiniciar servicio
docker-compose restart service-name
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Probar conexión
docker-compose exec postgres psql -U postgres -d odontologia_db -c "SELECT 1;"

# Ver logs de PostgreSQL
docker-compose logs postgres
```

### Alto uso de memoria

```bash
# Ver uso de recursos
docker stats

# Limitar memoria en docker-compose.yml
services:
  service-name:
    mem_limit: 512m
```

### Queries lentas

```bash
# Habilitar log de queries lentas en PostgreSQL
docker-compose exec postgres psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Ver queries lentas
docker-compose exec postgres tail -f /var/lib/postgresql/data/log/postgresql-*.log
```

### Errores 502 Bad Gateway

```bash
# Verificar que todos los servicios estén arriba
docker-compose ps

# Ver logs del API Gateway
docker-compose logs api-gateway

# Reiniciar servicios
docker-compose restart
```

---

## Comandos Útiles

```bash
# Ver todos los contenedores
docker ps -a

# Ver uso de recursos
docker stats

# Limpiar recursos no usados
docker system prune -a

# Reiniciar todo el sistema
docker-compose restart

# Detener y eliminar todo
docker-compose down

# Actualizar y reiniciar un servicio
docker-compose up -d --build service-name

# Entrar a un contenedor
docker-compose exec service-name /bin/sh

# Ver variables de entorno de un servicio
docker-compose exec service-name env
```

---

## Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Security Guide](https://owasp.org/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## Contacto y Soporte

Para problemas o preguntas:
- Email: support@endonova.com
- GitHub Issues: [repository-url]/issues
- Documentación: https://docs.tudominio.com

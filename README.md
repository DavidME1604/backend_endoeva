# Sistema de Gestión Odontológica - Backend

Sistema completo de microservicios para gestión de fichas endodónticas, pacientes, odontogramas y presupuestos.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Microservicios](#microservicios)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Docker](#docker)

## 🏗️ Arquitectura

El sistema utiliza una arquitectura de microservicios con las siguientes características:

- **6 Microservicios independientes**: Auth, Pacientes, Fichas, Odontograma, Presupuestos, API Gateway
- **Base de datos PostgreSQL centralizada**
- **Autenticación JWT**
- **API Gateway como punto único de entrada**
- **Comunicación REST entre servicios**

```
┌─────────────────┐
│   API Gateway   │ (Puerto 3000)
│   Rate Limiting │
└────────┬────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───▼────┐  ┌─────────┐  ┌────────▼──┐
│  Auth  │  │Pacientes│  │  Fichas   │
│  3001  │  │  3002   │  │   3003    │
└───┬────┘  └────┬────┘  └─────┬─────┘
    │            │              │
    │       ┌────▼─────┐   ┌────▼──────┐
    │       │Odontogram│   │Presupuesto│
    │       │   3004   │   │   3005    │
    │       └────┬─────┘   └─────┬─────┘
    │            │                │
    └────────────▼────────────────▼──────┐
              PostgreSQL                  │
              (Puerto 5432)              │
         ┌──────────────────────────────┘
         │
    ┌────▼────┐
    │ Docker  │
    └─────────┘
```

## 🚀 Tecnologías

- **Node.js** v18+
- **Express.js** 4.18
- **PostgreSQL** 15
- **Docker & Docker Compose**
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **express-validator** para validación

## 🔧 Microservicios

### 1. Auth Service (Puerto 3001)
Maneja autenticación y autorización de usuarios.

**Endpoints principales:**
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /verify` - Verificación de token
- `POST /change-password` - Cambio de contraseña

### 2. Patient Service (Puerto 3002)
Gestión CRUD de pacientes.

**Endpoints principales:**
- `POST /patients` - Crear paciente
- `GET /patients` - Listar pacientes (con paginación y búsqueda)
- `GET /patients/:id` - Obtener paciente por ID
- `GET /patients/historia/:historia_clinica` - Obtener por historia clínica
- `PUT /patients/:id` - Actualizar paciente
- `DELETE /patients/:id` - Eliminar paciente (soft delete)

### 3. Ficha Service (Puerto 3003)
Gestión de fichas endodónticas completas.

**Endpoints principales:**
- `POST /fichas` - Crear ficha endodóntica
- `GET /fichas` - Listar fichas
- `GET /fichas/:id` - Obtener ficha por ID
- `PUT /fichas/:id` - Actualizar ficha
- `DELETE /fichas/:id` - Eliminar ficha

### 4. Odontogram Service (Puerto 3004)
Gestión de odontogramas (estado dental).

**Endpoints principales:**
- `POST /odontogramas` - Crear/actualizar odontograma
- `GET /odontogramas/ficha/:ficha_id` - Obtener odontograma completo
- `PUT /odontogramas/:id` - Actualizar diente específico
- `DELETE /odontogramas/:id` - Eliminar diente
- `GET /odontogramas/estados` - Obtener estados válidos

### 5. Budget Service (Puerto 3005)
Gestión de presupuestos y pagos.

**Endpoints principales:**
- `POST /presupuestos` - Crear presupuesto
- `GET /presupuestos/:id` - Obtener presupuesto
- `GET /presupuestos/ficha/:ficha_id` - Obtener por ficha
- `PUT /presupuestos/:id` - Actualizar presupuesto
- `POST /presupuestos/:id/pagos` - Registrar pago
- `GET /presupuestos/:id/pagos` - Listar pagos

### 6. API Gateway (Puerto 3000)
Punto único de entrada, enrutamiento y seguridad.

**Características:**
- Rate limiting (100 req/15min)
- Verificación JWT centralizada
- Proxy a microservicios
- Manejo de errores global

## 💻 Instalación

### Prerequisitos

- Node.js v18 o superior
- PostgreSQL 15 o superior
- Docker y Docker Compose (opcional)
- npm o yarn

### Instalación Local (Sin Docker)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-odontologia
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Instalar dependencias de cada servicio**
```bash
cd auth-service && npm install && cd ..
cd patient-service && npm install && cd ..
cd ficha-service && npm install && cd ..
cd odontogram-service && npm install && cd ..
cd budget-service && npm install && cd ..
cd api-gateway && npm install && cd ..
```

4. **Crear base de datos**
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE odontologia_db;

# Ejecutar migraciones
psql -U postgres -d odontologia_db -f database/migrations/001_create_tables.sql

# (Opcional) Insertar datos de prueba
psql -U postgres -d odontologia_db -f database/seeds/001_sample_data.sql
```

5. **Iniciar servicios**

Abrir 6 terminales diferentes:

```bash
# Terminal 1 - Auth Service
cd auth-service && npm start

# Terminal 2 - Patient Service
cd patient-service && npm start

# Terminal 3 - Ficha Service
cd ficha-service && npm start

# Terminal 4 - Odontogram Service
cd odontogram-service && npm start

# Terminal 5 - Budget Service
cd budget-service && npm start

# Terminal 6 - API Gateway
cd api-gateway && npm start
```

### Instalación con Docker

```bash
# 1. Construir y levantar todos los servicios
docker-compose up --build

# 2. Para correr en segundo plano
docker-compose up -d

# 3. Ver logs
docker-compose logs -f

# 4. Detener servicios
docker-compose down

# 5. Detener y eliminar volúmenes
docker-compose down -v
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=odontologia_db
DB_USER=postgres
DB_PASSWORD=postgres

# Puertos de Servicios
GATEWAY_PORT=3000
AUTH_PORT=3001
PATIENT_PORT=3002
FICHA_PORT=3003
ODONTOGRAM_PORT=3004
BUDGET_PORT=3005

# Seguridad
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
NODE_ENV=development
```

## 📖 Uso

### 1. Registro e Inicio de Sesión

```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Dr. Juan Pérez",
    "email": "juan@example.com",
    "password": "password123",
    "rol": "odontologo"
  }'

# Iniciar sesión
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### 2. Crear Paciente

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "historia_clinica": "HC-001",
    "nombres": "María",
    "apellidos": "González",
    "edad": 35,
    "domicilio": "Av. Principal 123",
    "telefono": "0987654321"
  }'
```

### 3. Crear Ficha Endodóntica

```bash
curl -X POST http://localhost:3000/api/fichas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "paciente_id": 1,
    "pieza_dental": "16",
    "motivo_consulta": "Dolor intenso",
    "causa_caries": true,
    "dolor_naturaleza": "Intenso",
    "dolor_calidad": "Pulsátil"
  }'
```

### 4. Crear Odontograma

```bash
curl -X POST http://localhost:3000/api/odontogramas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ficha_id": 1,
    "dientes": [
      {
        "diente_numero": 16,
        "cuadrante": 1,
        "estado": "Caries",
        "notas": "Caries profunda"
      },
      {
        "diente_numero": 17,
        "cuadrante": 1,
        "estado": "Sano"
      }
    ]
  }'
```

### 5. Crear Presupuesto

```bash
curl -X POST http://localhost:3000/api/presupuestos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ficha_id": 1,
    "actos": [
      {
        "numero": 1,
        "actividad": "Diagnóstico y Radiografía",
        "costo_unitario": 50.00,
        "cantidad": 1
      },
      {
        "numero": 2,
        "actividad": "Tratamiento de Conducto",
        "costo_unitario": 250.00,
        "cantidad": 1
      }
    ]
  }'
```

### 6. Registrar Pago

```bash
curl -X POST http://localhost:3000/api/presupuestos/1/pagos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "valor": 50.00,
    "actividad": "Pago inicial - Diagnóstico"
  }'
```

## 🗄️ Base de Datos

### Diagrama de Entidad-Relación

```
usuarios (1) ──── (N) [sesiones]

pacientes (1) ──── (N) fichas_endodonticas
    │                      │
    │                      ├──── (N) odontogramas
    │                      ├──── (1) causas_fracaso
    │                      └──── (1) presupuestos
    │                              │
    │                              ├──── (N) actos_presupuesto
    │                              └──── (N) pagos
```

### Tablas Principales

- **usuarios**: Información de usuarios del sistema
- **pacientes**: Datos personales de pacientes
- **fichas_endodonticas**: Fichas de diagnóstico y tratamiento
- **odontogramas**: Estado de cada diente
- **presupuestos**: Presupuestos de tratamiento
- **actos_presupuesto**: Actividades del presupuesto
- **pagos**: Registro de pagos realizados
- **causas_fracaso**: Causas de fracaso de tratamientos anteriores

## 🐳 Docker

### Comandos Útiles

```bash
# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Reiniciar un servicio
docker-compose restart patient-service

# Ejecutar comando en PostgreSQL
docker-compose exec postgres psql -U postgres -d odontologia_db

# Ver estado de servicios
docker-compose ps

# Reconstruir servicios
docker-compose up --build --force-recreate
```

## 📊 Testing

### Pruebas con Postman

Se recomienda importar la colección de Postman (crear archivo):
- Incluye todos los endpoints
- Variables de entorno preconfiguradas
- Tokens JWT automáticos

### Pruebas con curl

Ver sección de [Uso](#uso) para ejemplos de curl.

## 🔒 Seguridad

- Autenticación JWT con tokens de 24h
- Contraseñas hasheadas con bcrypt (10 rounds)
- Rate limiting en API Gateway
- Validación de entrada en todos los endpoints
- Soft delete para datos sensibles
- CORS configurado

## 📝 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": []
}
```

## 👥 Roles de Usuario

- **administrador**: Acceso completo al sistema
- **odontologo**: Acceso a funciones clínicas

## 🛠️ Desarrollo

### Modo Desarrollo

```bash
# Instalar nodemon globalmente
npm install -g nodemon

# Ejecutar en modo desarrollo
cd auth-service && npm run dev
```

### Linting y Formato

```bash
# Instalar ESLint y Prettier
npm install --save-dev eslint prettier

# Ejecutar lint
npm run lint

# Formatear código
npm run format
```

## 📄 Licencia

MIT

## 👨‍💻 Autor

Sistema de Gestión Odontológica - 2025

---

## 📞 Soporte

Para soporte o preguntas:
- Email: support@endonova.com
- Documentación: http://localhost:3000/api/docs

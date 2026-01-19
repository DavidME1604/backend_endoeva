# Diagrama de Arquitectura del Sistema

## Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│                   (Web, Mobile, Postman)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     API GATEWAY                                  │
│                    (Puerto 3000)                                │
│                                                                  │
│  • Rate Limiting (100 req/15min)                               │
│  • Verificación JWT                                            │
│  • Enrutamiento                                                │
│  • Manejo de Errores                                           │
└───┬────────────┬──────────┬──────────┬───────────┬─────────────┘
    │            │          │          │           │
    │            │          │          │           │
┌───▼───┐   ┌───▼────┐  ┌──▼─────┐  ┌─▼────────┐ ┌▼──────────┐
│ Auth  │   │Patient │  │ Ficha  │  │Odontogram│ │ Budget    │
│Service│   │Service │  │Service │  │ Service  │ │ Service   │
│ 3001  │   │  3002  │  │  3003  │  │   3004   │ │   3005    │
└───┬───┘   └───┬────┘  └───┬────┘  └────┬─────┘ └─────┬─────┘
    │           │           │            │             │
    │           │           │            │             │
    └───────────┴───────────┴────────────┴─────────────┘
                            │
                            │
                ┌───────────▼──────────────┐
                │    PostgreSQL Database    │
                │       (Puerto 5432)       │
                │                           │
                │  • usuarios               │
                │  • pacientes              │
                │  • fichas_endodonticas    │
                │  • odontogramas           │
                │  • presupuestos           │
                │  • actos_presupuesto      │
                │  • pagos                  │
                │  • causas_fracaso         │
                └───────────────────────────┘
```

## Flujo de Autenticación

```
┌────────┐              ┌─────────┐              ┌──────────┐
│Cliente │              │   API   │              │   Auth   │
│        │              │ Gateway │              │ Service  │
└───┬────┘              └────┬────┘              └────┬─────┘
    │                        │                        │
    │ POST /api/auth/login   │                        │
    │───────────────────────>│                        │
    │                        │  POST /login           │
    │                        │───────────────────────>│
    │                        │                        │
    │                        │                        │ Verificar
    │                        │                        │ credenciales
    │                        │                        │ en DB
    │                        │                        │
    │                        │  {user, token}         │
    │                        │<───────────────────────│
    │  {user, token}         │                        │
    │<───────────────────────│                        │
    │                        │                        │
    │ Almacenar token        │                        │
    │ en localStorage        │                        │
    │                        │                        │
```

## Flujo de Solicitud Protegida

```
┌────────┐         ┌─────────┐         ┌──────────┐         ┌──────┐
│Cliente │         │   API   │         │ Patient  │         │  DB  │
│        │         │ Gateway │         │ Service  │         │      │
└───┬────┘         └────┬────┘         └────┬─────┘         └──┬───┘
    │                   │                   │                   │
    │ GET /api/patients │                   │                   │
    │ + Authorization   │                   │                   │
    │──────────────────>│                   │                   │
    │                   │                   │                   │
    │                   │ Verificar JWT     │                   │
    │                   │ (middleware)      │                   │
    │                   │                   │                   │
    │                   │ GET /patients     │                   │
    │                   │──────────────────>│                   │
    │                   │                   │                   │
    │                   │                   │ SELECT * FROM     │
    │                   │                   │ pacientes         │
    │                   │                   │──────────────────>│
    │                   │                   │                   │
    │                   │                   │  {pacientes}      │
    │                   │                   │<──────────────────│
    │                   │  {pacientes}      │                   │
    │                   │<──────────────────│                   │
    │  {pacientes}      │                   │                   │
    │<──────────────────│                   │                   │
    │                   │                   │                   │
```

## Flujo de Creación de Ficha Completa

```
┌────────┐    ┌─────────┐    ┌──────┐    ┌────────┐    ┌──────────┐
│Cliente │    │   API   │    │Ficha │    │Odonto- │    │ Budget   │
│        │    │ Gateway │    │Service│   │gram    │    │ Service  │
└───┬────┘    └────┬────┘    └───┬───┘    └───┬────┘    └────┬─────┘
    │              │              │            │             │
    │ 1. POST      │              │            │             │
    │ /api/fichas  │              │            │             │
    │─────────────>│              │            │             │
    │              │              │            │             │
    │              │ 2. POST      │            │             │
    │              │ /fichas      │            │             │
    │              │─────────────>│            │             │
    │              │              │            │             │
    │              │              │ 3. Crear   │             │
    │              │              │ ficha en DB│             │
    │              │              │            │             │
    │              │ {ficha_id}   │            │             │
    │              │<─────────────│            │             │
    │              │              │            │             │
    │ 4. POST      │              │            │             │
    │ /odontogramas│              │            │             │
    │─────────────>│──────────────┼───────────>│             │
    │              │              │            │             │
    │              │              │            │ 5. Guardar  │
    │              │              │            │ dientes     │
    │              │              │            │             │
    │              │<─────────────┼────────────│             │
    │              │              │            │             │
    │ 6. POST      │              │            │             │
    │ /presupuestos│              │            │             │
    │─────────────>│──────────────┼────────────┼────────────>│
    │              │              │            │             │
    │              │              │            │  7. Crear   │
    │              │              │            │  presupuesto│
    │              │              │            │  + actos    │
    │              │              │            │             │
    │ {success}    │              │            │             │
    │<─────────────│<─────────────┼────────────┼─────────────│
    │              │              │            │             │
```

## Base de Datos - Modelo Relacional

```
┌──────────────┐
│   usuarios   │
│              │
│ • id (PK)    │
│ • nombre     │
│ • email      │
│ • pass_hash  │
│ • rol        │
└──────────────┘


┌───────────────┐                ┌─────────────────────┐
│   pacientes   │───────────────>│ fichas_endodonticas │
│               │ 1           N  │                     │
│ • id (PK)     │                │ • id (PK)           │
│ • historia_c  │                │ • paciente_id (FK)  │
│ • nombres     │                │ • pieza_dental      │
│ • apellidos   │                │ • fecha             │
│ • edad        │                │ • motivo_consulta   │
│ • domicilio   │                │ • causa_*           │
│ • telefono    │                │ • dolor_*           │
└───────────────┘                │ • zona_*            │
                                 │ • examen_*          │
                                 │ • camara_*          │
                                 └──────┬──────────────┘
                                        │
                      ┌─────────────────┼─────────────────┐
                      │                 │                 │
                      │ 1               │ 1               │ 1
                      ▼ N               ▼ N               ▼ 1
          ┌──────────────┐  ┌────────────────┐  ┌───────────────┐
          │ odontogramas │  │ presupuestos   │  │causas_fracaso │
          │              │  │                │  │               │
          │ • id (PK)    │  │ • id (PK)      │  │ • id (PK)     │
          │ • ficha_id   │  │ • ficha_id(FK) │  │ • ficha_id(FK)│
          │ • diente_nro │  │ • total        │  │ • filtrac_cor │
          │ • cuadrante  │  │ • total_pagado │  │ • escalon     │
          │ • estado     │  │ • saldo        │  │ • trat_incomp │
          │ • notas      │  └────┬───────────┘  └───────────────┘
          └──────────────┘       │
                                 │ 1
                      ┌──────────┴──────────┐
                      │ N                   │ N
                      ▼                     ▼
          ┌───────────────────┐  ┌──────────────┐
          │ actos_presupuesto │  │    pagos     │
          │                   │  │              │
          │ • id (PK)         │  │ • id (PK)    │
          │ • presupuesto_id  │  │ • presup_id  │
          │ • numero          │  │ • fecha      │
          │ • actividad       │  │ • valor      │
          │ • costo_unitario  │  │ • saldo_ant  │
          │ • cantidad        │  │ • saldo_act  │
          │ • total           │  └──────────────┘
          └───────────────────┘
```

## Tecnologías por Capa

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE CLIENTE                       │
│                                                          │
│  • React / Angular / Vue.js (Frontend)                  │
│  • Postman / Thunder Client (Testing)                   │
│  • Mobile Apps (iOS/Android)                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE API GATEWAY                    │
│                                                          │
│  • Node.js + Express                                    │
│  • http-proxy-middleware                                │
│  • express-rate-limit                                   │
│  • JWT Verification                                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                CAPA DE MICROSERVICIOS                    │
│                                                          │
│  • Node.js + Express                                    │
│  • JWT (jsonwebtoken)                                   │
│  • bcrypt (hashing)                                     │
│  • express-validator                                    │
│  • pg (PostgreSQL driver)                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE BASE DE DATOS                   │
│                                                          │
│  • PostgreSQL 15                                        │
│  • pg_trgm (búsqueda de texto)                          │
│  • Índices optimizados                                  │
│  • Triggers automáticos                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 CAPA DE INFRAESTRUCTURA                  │
│                                                          │
│  • Docker & Docker Compose                              │
│  • Linux Container Runtime                              │
│  • Networking Bridge                                    │
│  • Volúmenes persistentes                               │
└─────────────────────────────────────────────────────────┘
```

## Seguridad

```
┌──────────────────────────────────────────────────────────┐
│                    CAPAS DE SEGURIDAD                     │
│                                                           │
│  1. Rate Limiting (API Gateway)                          │
│     └─> 100 requests / 15 minutos                        │
│                                                           │
│  2. JWT Authentication                                    │
│     └─> Token válido por 24 horas                        │
│     └─> Verificación en cada request protegido           │
│                                                           │
│  3. Password Hashing                                      │
│     └─> bcrypt con 10 salt rounds                        │
│                                                           │
│  4. Input Validation                                      │
│     └─> express-validator en todos los endpoints         │
│     └─> Sanitización de strings                          │
│                                                           │
│  5. SQL Injection Protection                              │
│     └─> Prepared statements (pg parameterized queries)   │
│                                                           │
│  6. CORS Configuration                                    │
│     └─> Configurado en todos los servicios               │
│                                                           │
│  7. Error Handling                                        │
│     └─> No exposición de stack traces en producción      │
│                                                           │
│  8. Soft Delete                                           │
│     └─> Datos sensibles no se eliminan físicamente       │
└──────────────────────────────────────────────────────────┘
```

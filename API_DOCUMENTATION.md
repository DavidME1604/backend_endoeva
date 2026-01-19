# Documentación de API - Sistema de Gestión Odontológica

## URL Base
```
http://localhost:3000/api
```

## Autenticación

Todos los endpoints (excepto login y register) requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 1. AUTH SERVICE

### 1.1 Registrar Usuario
**POST** `/api/auth/register`

**Body:**
```json
{
  "nombre": "Dr. Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "odontologo"  // "administrador" o "odontologo"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Dr. Juan Pérez",
      "email": "juan@example.com",
      "rol": "odontologo"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Iniciar Sesión
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Dr. Juan Pérez",
      "email": "juan@example.com",
      "rol": "odontologo"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Verificar Token
**POST** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Dr. Juan Pérez",
      "email": "juan@example.com",
      "rol": "odontologo"
    },
    "valid": true
  }
}
```

### 1.4 Cambiar Contraseña
**POST** `/api/auth/change-password`

**Body:**
```json
{
  "email": "juan@example.com",
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "data": null
}
```

---

## 2. PATIENT SERVICE

### 2.1 Crear Paciente
**POST** `/api/patients`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "historia_clinica": "HC-001",
  "nombres": "María",
  "apellidos": "González Pérez",
  "edad": 35,
  "domicilio": "Av. Principal 123, Quito",
  "telefono": "0987654321"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Paciente creado exitosamente",
  "data": {
    "id": 1,
    "historia_clinica": "HC-001",
    "nombres": "María",
    "apellidos": "González Pérez",
    "edad": 35,
    "domicilio": "Av. Principal 123, Quito",
    "telefono": "0987654321",
    "activo": true,
    "created_at": "2025-01-18T10:00:00.000Z",
    "updated_at": "2025-01-18T10:00:00.000Z"
  }
}
```

### 2.2 Listar Pacientes
**GET** `/api/patients?page=1&limit=10&search=maria`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 10, max: 100)
- `search` (opcional): Búsqueda por nombre, apellido, historia o teléfono

**Response 200:**
```json
{
  "success": true,
  "message": "Pacientes obtenidos exitosamente",
  "data": {
    "patients": [
      {
        "id": 1,
        "historia_clinica": "HC-001",
        "nombres": "María",
        "apellidos": "González Pérez",
        "edad": 35,
        "domicilio": "Av. Principal 123",
        "telefono": "0987654321",
        "created_at": "2025-01-18T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 2.3 Obtener Paciente por ID
**GET** `/api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Paciente obtenido exitosamente",
  "data": {
    "id": 1,
    "historia_clinica": "HC-001",
    "nombres": "María",
    "apellidos": "González Pérez",
    "edad": 35,
    "domicilio": "Av. Principal 123",
    "telefono": "0987654321",
    "created_at": "2025-01-18T10:00:00.000Z"
  }
}
```

### 2.4 Obtener Paciente por Historia Clínica
**GET** `/api/patients/historia/:historia_clinica`

**Headers:**
```
Authorization: Bearer <token>
```

### 2.5 Actualizar Paciente
**PUT** `/api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:** (todos los campos son opcionales)
```json
{
  "nombres": "María Carmen",
  "edad": 36,
  "telefono": "0987654322"
}
```

### 2.6 Eliminar Paciente
**DELETE** `/api/patients/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Paciente eliminado exitosamente",
  "data": null
}
```

---

## 3. FICHA SERVICE

### 3.1 Crear Ficha Endodóntica
**POST** `/api/fichas`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "paciente_id": 1,
  "pieza_dental": "16",
  "fecha": "2025-01-18",
  "dr_referidor": "Dr. Ramírez",
  "motivo_consulta": "Dolor intenso en molar superior derecho",
  "antecedentes": "Paciente con antecedentes de caries múltiples",
  
  "causa_caries": true,
  "causa_traumatismo": false,
  "causa_otras": null,
  
  "dolor_naturaleza": "Intenso",
  "dolor_calidad": "Pulsátil",
  "dolor_localizacion": "Localizado",
  "dolor_duracion": "Horas",
  "dolor_iniciado_por": "Frío, Calor",
  
  "zona_normal": false,
  "zona_tumefaccion": false,
  "zona_dolor_palpacion": true,
  
  "profundidad_bolsa": 3.5,
  "movilidad": 1,
  "supuracion": false,
  
  "camara_normal": true,
  "camara_estrecha": false,
  
  "causas_fracaso": {
    "filtracion_coronaria": true,
    "tratamiento_incompleto": false
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Ficha endodóntica creada exitosamente",
  "data": {
    "id": 1,
    "paciente_id": 1,
    "pieza_dental": "16",
    "fecha": "2025-01-18",
    ...
  }
}
```

### 3.2 Listar Fichas
**GET** `/api/fichas?paciente_id=1&page=1&limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `paciente_id` (opcional): Filtrar por paciente
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página

**Response 200:**
```json
{
  "success": true,
  "message": "Fichas obtenidas exitosamente",
  "data": {
    "fichas": [
      {
        "id": 1,
        "paciente_id": 1,
        "nombres": "María",
        "apellidos": "González Pérez",
        "historia_clinica": "HC-001",
        "pieza_dental": "16",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 3.3 Obtener Ficha por ID
**GET** `/api/fichas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### 3.4 Actualizar Ficha
**PUT** `/api/fichas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:** (campos opcionales)
```json
{
  "motivo_consulta": "Dolor actualizado",
  "dolor_naturaleza": "Moderado",
  "causas_fracaso": {
    "filtracion_coronaria": false
  }
}
```

### 3.5 Eliminar Ficha
**DELETE** `/api/fichas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 4. ODONTOGRAM SERVICE

### 4.1 Crear/Actualizar Odontograma
**POST** `/api/odontogramas`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "ficha_id": 1,
  "dientes": [
    {
      "diente_numero": 16,
      "cuadrante": 1,
      "estado": "Caries",
      "notas": "Caries profunda, requiere endodoncia"
    },
    {
      "diente_numero": 17,
      "cuadrante": 1,
      "estado": "Sano",
      "notas": "Sin hallazgos"
    },
    {
      "diente_numero": 18,
      "cuadrante": 1,
      "estado": "Obturado",
      "notas": "Obturación antigua en buen estado"
    }
  ]
}
```

**Estados válidos:**
- Sano
- Caries
- Obturado
- Endodoncia
- Corona
- Puente
- Extraído
- Implante
- Fractura
- Ausente
- En tratamiento

**Response 201:**
```json
{
  "success": true,
  "message": "Odontograma guardado exitosamente",
  "data": [
    {
      "id": 1,
      "ficha_id": 1,
      "diente_numero": 16,
      "cuadrante": 1,
      "estado": "Caries",
      "notas": "Caries profunda",
      "fecha_registro": "2025-01-18"
    }
  ]
}
```

### 4.2 Obtener Odontograma Completo
**GET** `/api/odontogramas/ficha/:ficha_id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Odontograma obtenido exitosamente",
  "data": {
    "cuadrante_1": [
      { "diente_numero": 16, "estado": "Caries", ... }
    ],
    "cuadrante_2": [],
    "cuadrante_3": [],
    "cuadrante_4": [],
    "todos": [...]
  }
}
```

### 4.3 Actualizar Diente Específico
**PUT** `/api/odontogramas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "estado": "Endodoncia",
  "notas": "Tratamiento completado exitosamente"
}
```

### 4.4 Eliminar Diente
**DELETE** `/api/odontogramas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### 4.5 Obtener Estados Válidos
**GET** `/api/odontogramas/estados`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 5. BUDGET SERVICE

### 5.1 Crear Presupuesto
**POST** `/api/presupuestos`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
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
    },
    {
      "numero": 3,
      "actividad": "Obturación Final",
      "costo_unitario": 50.00,
      "cantidad": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Presupuesto creado exitosamente",
  "data": {
    "presupuesto": {
      "id": 1,
      "ficha_id": 1,
      "total": 350.00,
      "total_pagado": 0.00,
      "saldo": 350.00,
      "created_at": "2025-01-18T10:00:00.000Z"
    },
    "actos": [
      {
        "id": 1,
        "presupuesto_id": 1,
        "numero": 1,
        "actividad": "Diagnóstico y Radiografía",
        "costo_unitario": 50.00,
        "cantidad": 1,
        "total": 50.00
      }
    ]
  }
}
```

### 5.2 Obtener Presupuesto por ID
**GET** `/api/presupuestos/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "message": "Presupuesto obtenido exitosamente",
  "data": {
    "presupuesto": {
      "id": 1,
      "ficha_id": 1,
      "total": 350.00,
      "total_pagado": 150.00,
      "saldo": 200.00
    },
    "actos": [...],
    "pagos": [...]
  }
}
```

### 5.3 Obtener Presupuesto por Ficha
**GET** `/api/presupuestos/ficha/:ficha_id`

**Headers:**
```
Authorization: Bearer <token>
```

### 5.4 Registrar Pago
**POST** `/api/presupuestos/:id/pagos`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "valor": 50.00,
  "fecha": "2025-01-18",
  "actividad": "Pago inicial - Diagnóstico"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Pago registrado exitosamente",
  "data": {
    "pago": {
      "id": 1,
      "presupuesto_id": 1,
      "fecha": "2025-01-18",
      "actividad": "Pago inicial",
      "valor": 50.00,
      "saldo_anterior": 350.00,
      "saldo_actual": 300.00
    },
    "presupuesto": {
      "id": 1,
      "total": 350.00,
      "total_pagado": 50.00,
      "saldo": 300.00
    }
  }
}
```

### 5.5 Listar Pagos
**GET** `/api/presupuestos/:id/pagos`

**Headers:**
```
Authorization: Bearer <token>
```

### 5.6 Actualizar Presupuesto
**PUT** `/api/presupuestos/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "actos": [
    {
      "numero": 1,
      "actividad": "Diagnóstico y Radiografía Actualizada",
      "costo_unitario": 60.00,
      "cantidad": 1
    }
  ]
}
```

### 5.7 Eliminar Presupuesto
**DELETE** `/api/presupuestos/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Códigos de Error

- `200` - OK
- `201` - Created
- `400` - Bad Request (validación)
- `401` - Unauthorized (token inválido)
- `403` - Forbidden (sin permisos)
- `404` - Not Found
- `500` - Internal Server Error

## Formato de Errores

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { verifyToken } = require('../shared/middleware/auth');
const { isValidHistoriaClinica, sanitizeString, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.PATIENT_PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'patient-service' });
});

// Crear nuevo paciente
app.post('/patients', verifyToken, [
  body('historia_clinica').notEmpty().withMessage('Historia clínica es requerida'),
  body('nombres').notEmpty().withMessage('Nombres son requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos son requeridos'),
  body('edad').optional().isInt({ min: 0, max: 120 }).withMessage('Edad inválida'),
  body('telefono').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { historia_clinica, nombres, apellidos, edad, domicilio, telefono } = req.body;

    // Verificar si la historia clínica ya existe
    const exists = await pool.query(
      'SELECT id FROM pacientes WHERE historia_clinica = $1',
      [historia_clinica]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un paciente con esta historia clínica'
      });
    }

    // Insertar nuevo paciente
    const result = await pool.query(
      `INSERT INTO pacientes (historia_clinica, nombres, apellidos, edad, domicilio, telefono) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        sanitizeString(historia_clinica),
        sanitizeString(nombres),
        sanitizeString(apellidos),
        edad || null,
        sanitizeString(domicilio) || null,
        sanitizeString(telefono) || null
      ]
    );

    return successResponse(res, result.rows[0], 'Paciente creado exitosamente', 201);

  } catch (error) {
    return handleError(res, error, 'Error al crear paciente');
  }
});

// Obtener todos los pacientes con paginación y búsqueda
app.get('/patients', verifyToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT id, historia_clinica, nombres, apellidos, edad, domicilio, telefono, created_at, updated_at
      FROM pacientes 
      WHERE activo = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM pacientes WHERE activo = true';
    const params = [];

    // Agregar búsqueda si existe
    if (search) {
      query += ` AND (
        LOWER(nombres) LIKE LOWER($1) OR 
        LOWER(apellidos) LIKE LOWER($1) OR 
        LOWER(historia_clinica) LIKE LOWER($1) OR
        LOWER(telefono) LIKE LOWER($1)
      )`;
      countQuery += ` AND (
        LOWER(nombres) LIKE LOWER($1) OR 
        LOWER(apellidos) LIKE LOWER($1) OR 
        LOWER(historia_clinica) LIKE LOWER($1) OR
        LOWER(telefono) LIKE LOWER($1)
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Obtener pacientes
    const result = await pool.query(query, params);

    // Obtener total de registros
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const total = parseInt(countResult.rows[0].count);

    return successResponse(res, {
      patients: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Pacientes obtenidos exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener pacientes');
  }
});

// Obtener un paciente por ID
app.get('/patients/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM pacientes WHERE id = $1 AND activo = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    return successResponse(res, result.rows[0], 'Paciente obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener paciente');
  }
});

// Obtener un paciente por historia clínica
app.get('/patients/historia/:historia_clinica', verifyToken, [
  param('historia_clinica').notEmpty().withMessage('Historia clínica es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { historia_clinica } = req.params;

    const result = await pool.query(
      'SELECT * FROM pacientes WHERE historia_clinica = $1 AND activo = true',
      [historia_clinica]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    return successResponse(res, result.rows[0], 'Paciente obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener paciente');
  }
});

// Actualizar paciente
app.put('/patients/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido'),
  body('nombres').optional().notEmpty().withMessage('Nombres no pueden estar vacíos'),
  body('apellidos').optional().notEmpty().withMessage('Apellidos no pueden estar vacíos'),
  body('edad').optional().isInt({ min: 0, max: 120 }).withMessage('Edad inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { nombres, apellidos, edad, domicilio, telefono } = req.body;

    // Verificar si el paciente existe
    const exists = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1 AND activo = true',
      [id]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombres !== undefined) {
      updates.push(`nombres = $${paramCount}`);
      values.push(sanitizeString(nombres));
      paramCount++;
    }
    if (apellidos !== undefined) {
      updates.push(`apellidos = $${paramCount}`);
      values.push(sanitizeString(apellidos));
      paramCount++;
    }
    if (edad !== undefined) {
      updates.push(`edad = $${paramCount}`);
      values.push(edad);
      paramCount++;
    }
    if (domicilio !== undefined) {
      updates.push(`domicilio = $${paramCount}`);
      values.push(sanitizeString(domicilio));
      paramCount++;
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramCount}`);
      values.push(sanitizeString(telefono));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE pacientes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows[0], 'Paciente actualizado exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al actualizar paciente');
  }
});

// Eliminar paciente (soft delete)
app.delete('/patients/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    // Verificar si el paciente existe
    const exists = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1 AND activo = true',
      [id]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Soft delete
    await pool.query(
      'UPDATE pacientes SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    return successResponse(res, null, 'Paciente eliminado exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al eliminar paciente');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`👥 Patient Service corriendo en puerto ${PORT}`);
});

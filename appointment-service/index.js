const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { verifyToken } = require('../shared/middleware/auth');
const { sanitizeString, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.APPOINTMENT_PORT || 3006;

// Constantes de validacion
const HORA_INICIO_ATENCION = '08:00';
const HORA_FIN_ATENCION = '18:00';
const DURACION_MINIMA_MINUTOS = 30;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'appointment-service' });
});

// Funcion auxiliar para convertir hora string a minutos
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Funcion auxiliar para validar horario de atencion
const validarHorarioAtencion = (horaInicio, horaFin) => {
  const inicioMinutos = timeToMinutes(horaInicio);
  const finMinutos = timeToMinutes(horaFin);
  const inicioAtencion = timeToMinutes(HORA_INICIO_ATENCION);
  const finAtencion = timeToMinutes(HORA_FIN_ATENCION);

  if (inicioMinutos < inicioAtencion || finMinutos > finAtencion) {
    return {
      valid: false,
      message: `El horario de atencion es de ${HORA_INICIO_ATENCION} a ${HORA_FIN_ATENCION}`
    };
  }

  if (inicioMinutos >= finMinutos) {
    return {
      valid: false,
      message: 'La hora de inicio debe ser anterior a la hora de fin'
    };
  }

  if (finMinutos - inicioMinutos < DURACION_MINIMA_MINUTOS) {
    return {
      valid: false,
      message: `La duracion minima de la cita es de ${DURACION_MINIMA_MINUTOS} minutos`
    };
  }

  return { valid: true };
};

// Funcion auxiliar para verificar superposicion de citas
const verificarSuperposicion = async (fecha, horaInicio, horaFin, excludeId = null) => {
  let query = `
    SELECT id, hora_inicio, hora_fin
    FROM citas
    WHERE fecha = $1
    AND estado NOT IN ('cancelada', 'no_asistio')
    AND (
      (hora_inicio < $3 AND hora_fin > $2)
    )
  `;
  const params = [fecha, horaInicio, horaFin];

  if (excludeId) {
    query += ` AND id != $4`;
    params.push(excludeId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

// Crear nueva cita
app.post('/citas', verifyToken, [
  body('paciente_id').isInt({ min: 1 }).withMessage('ID de paciente invalido'),
  body('fecha').isDate().withMessage('Fecha invalida (formato: YYYY-MM-DD)'),
  body('hora_inicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de inicio invalida (formato: HH:MM)'),
  body('hora_fin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de fin invalida (formato: HH:MM)'),
  body('motivo').optional().isString().isLength({ max: 255 }).withMessage('Motivo muy largo (max 255 caracteres)'),
  body('notas').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { paciente_id, fecha, hora_inicio, hora_fin, motivo, notas } = req.body;

    // Validar horario de atencion
    const validacionHorario = validarHorarioAtencion(hora_inicio, hora_fin);
    if (!validacionHorario.valid) {
      return res.status(400).json({
        success: false,
        message: validacionHorario.message
      });
    }

    // Verificar que el paciente existe
    const pacienteExists = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1 AND activo = true',
      [paciente_id]
    );

    if (pacienteExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar superposicion de citas
    const haySuperposicion = await verificarSuperposicion(fecha, hora_inicio, hora_fin);
    if (haySuperposicion) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cita programada en ese horario'
      });
    }

    // Insertar nueva cita
    const result = await pool.query(
      `INSERT INTO citas (paciente_id, fecha, hora_inicio, hora_fin, motivo, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        paciente_id,
        fecha,
        hora_inicio,
        hora_fin,
        sanitizeString(motivo) || null,
        sanitizeString(notas) || null
      ]
    );

    return successResponse(res, result.rows[0], 'Cita creada exitosamente', 201);

  } catch (error) {
    return handleError(res, error, 'Error al crear cita');
  }
});

// Obtener todas las citas con filtros
app.get('/citas', verifyToken, [
  query('fecha').optional().isDate().withMessage('Fecha invalida'),
  query('fecha_inicio').optional().isDate().withMessage('Fecha inicio invalida'),
  query('fecha_fin').optional().isDate().withMessage('Fecha fin invalida'),
  query('paciente_id').optional().isInt().withMessage('ID de paciente invalido'),
  query('estado').optional().isIn(['programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio']).withMessage('Estado invalido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Pagina invalida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fecha, fecha_inicio, fecha_fin, paciente_id, estado } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT c.*, p.nombres, p.apellidos, p.historia_clinica
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM citas c WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtro por fecha exacta
    if (fecha) {
      queryStr += ` AND c.fecha = $${paramIndex}`;
      countQuery += ` AND c.fecha = $${paramIndex}`;
      params.push(fecha);
      paramIndex++;
    }

    // Filtro por rango de fechas (para el calendario)
    if (fecha_inicio) {
      queryStr += ` AND c.fecha >= $${paramIndex}`;
      countQuery += ` AND c.fecha >= $${paramIndex}`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      queryStr += ` AND c.fecha <= $${paramIndex}`;
      countQuery += ` AND c.fecha <= $${paramIndex}`;
      params.push(fecha_fin);
      paramIndex++;
    }

    if (paciente_id) {
      queryStr += ` AND c.paciente_id = $${paramIndex}`;
      countQuery += ` AND c.paciente_id = $${paramIndex}`;
      params.push(paciente_id);
      paramIndex++;
    }

    if (estado) {
      queryStr += ` AND c.estado = $${paramIndex}`;
      countQuery += ` AND c.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    queryStr += ` ORDER BY c.fecha ASC, c.hora_inicio ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(queryStr, params);
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    // Formatear respuesta con datos del paciente anidados
    const citasFormateadas = result.rows.map(row => ({
      id: row.id,
      paciente_id: row.paciente_id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      notas: row.notas,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paciente: {
        id: row.paciente_id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        historia_clinica: row.historia_clinica
      }
    }));

    return successResponse(res, {
      citas: citasFormateadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Citas obtenidas exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener citas');
  }
});

// IMPORTANTE: Las rutas especificas deben ir ANTES de /citas/:id

// Obtener citas de una fecha especifica
app.get('/citas/fecha/:fecha', verifyToken, [
  param('fecha').isDate().withMessage('Fecha invalida (formato: YYYY-MM-DD)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fecha } = req.params;

    const result = await pool.query(
      `SELECT c.*, p.nombres, p.apellidos, p.historia_clinica, p.telefono
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.fecha = $1
       ORDER BY c.hora_inicio ASC`,
      [fecha]
    );

    // Formatear respuesta con datos del paciente anidados
    const citasFormateadas = result.rows.map(row => ({
      id: row.id,
      paciente_id: row.paciente_id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      notas: row.notas,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paciente: {
        id: row.paciente_id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        historia_clinica: row.historia_clinica,
        telefono: row.telefono
      }
    }));

    return successResponse(res, citasFormateadas, 'Citas obtenidas exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener citas por fecha');
  }
});

// Obtener proximas citas (siguiente N dias)
app.get('/citas/proximas', verifyToken, [
  query('dias').optional().isInt({ min: 1, max: 30 }).withMessage('Dias debe ser entre 1 y 30')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const dias = parseInt(req.query.dias) || 7;

    const result = await pool.query(
      `SELECT c.*,
              p.nombres, p.apellidos, p.historia_clinica, p.telefono
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.fecha >= CURRENT_DATE
         AND c.fecha <= CURRENT_DATE + $1 * INTERVAL '1 day'
         AND c.estado NOT IN ('completada', 'cancelada', 'no_asistio')
       ORDER BY c.fecha ASC, c.hora_inicio ASC`,
      [dias]
    );

    // Formatear respuesta con datos del paciente anidados
    const citasFormateadas = result.rows.map(row => ({
      id: row.id,
      paciente_id: row.paciente_id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      notas: row.notas,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paciente: {
        id: row.paciente_id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        historia_clinica: row.historia_clinica,
        telefono: row.telefono
      }
    }));

    return successResponse(res, citasFormateadas, 'Proximas citas obtenidas exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener proximas citas');
  }
});

// Obtener citas de un paciente
app.get('/citas/paciente/:paciente_id', verifyToken, [
  param('paciente_id').isInt().withMessage('ID de paciente invalido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { paciente_id } = req.params;

    // Verificar que el paciente existe
    const pacienteExists = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1',
      [paciente_id]
    );

    if (pacienteExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const result = await pool.query(
      `SELECT c.*, p.nombres, p.apellidos, p.historia_clinica, p.telefono
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.paciente_id = $1
       ORDER BY c.fecha DESC, c.hora_inicio ASC`,
      [paciente_id]
    );

    // Formatear respuesta con datos del paciente anidados
    const citasFormateadas = result.rows.map(row => ({
      id: row.id,
      paciente_id: row.paciente_id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      notas: row.notas,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paciente: {
        id: row.paciente_id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        historia_clinica: row.historia_clinica,
        telefono: row.telefono
      }
    }));

    return successResponse(res, citasFormateadas, 'Citas del paciente obtenidas exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener citas del paciente');
  }
});

// Obtener cita por ID (DEBE IR DESPUES de las rutas especificas)
app.get('/citas/:id', verifyToken, [
  param('id').isInt().withMessage('ID invalido')
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
      `SELECT c.*, p.nombres, p.apellidos, p.historia_clinica, p.telefono
       FROM citas c
       JOIN pacientes p ON c.paciente_id = p.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const row = result.rows[0];
    const citaFormateada = {
      id: row.id,
      paciente_id: row.paciente_id,
      fecha: row.fecha,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      motivo: row.motivo,
      estado: row.estado,
      notas: row.notas,
      created_at: row.created_at,
      updated_at: row.updated_at,
      paciente: {
        id: row.paciente_id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        historia_clinica: row.historia_clinica,
        telefono: row.telefono
      }
    };

    return successResponse(res, citaFormateada, 'Cita obtenida exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener cita');
  }
});

// Actualizar cita
app.put('/citas/:id', verifyToken, [
  param('id').isInt().withMessage('ID invalido'),
  body('fecha').optional().isDate().withMessage('Fecha invalida'),
  body('hora_inicio').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de inicio invalida'),
  body('hora_fin').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de fin invalida'),
  body('motivo').optional().isString().isLength({ max: 255 }).withMessage('Motivo muy largo'),
  body('notas').optional().isString(),
  body('estado').optional().isIn(['programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio']).withMessage('Estado invalido')
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
    const { fecha, hora_inicio, hora_fin, motivo, notas, estado } = req.body;

    // Verificar si la cita existe
    const citaExiste = await pool.query(
      'SELECT * FROM citas WHERE id = $1',
      [id]
    );

    if (citaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const citaActual = citaExiste.rows[0];

    // Usar valores actuales si no se proporcionan nuevos
    const nuevaFecha = fecha || citaActual.fecha;
    const nuevaHoraInicio = hora_inicio || citaActual.hora_inicio;
    const nuevaHoraFin = hora_fin || citaActual.hora_fin;

    // Validar horario si se modifican horas o fecha
    if (fecha || hora_inicio || hora_fin) {
      const validacionHorario = validarHorarioAtencion(nuevaHoraInicio, nuevaHoraFin);
      if (!validacionHorario.valid) {
        return res.status(400).json({
          success: false,
          message: validacionHorario.message
        });
      }

      // Verificar superposicion (excluyendo la cita actual)
      const haySuperposicion = await verificarSuperposicion(nuevaFecha, nuevaHoraInicio, nuevaHoraFin, id);
      if (haySuperposicion) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cita programada en ese horario'
        });
      }
    }

    // Construir query de actualizacion
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fecha !== undefined) {
      updates.push(`fecha = $${paramCount}`);
      values.push(fecha);
      paramCount++;
    }
    if (hora_inicio !== undefined) {
      updates.push(`hora_inicio = $${paramCount}`);
      values.push(hora_inicio);
      paramCount++;
    }
    if (hora_fin !== undefined) {
      updates.push(`hora_fin = $${paramCount}`);
      values.push(hora_fin);
      paramCount++;
    }
    if (motivo !== undefined) {
      updates.push(`motivo = $${paramCount}`);
      values.push(sanitizeString(motivo));
      paramCount++;
    }
    if (notas !== undefined) {
      updates.push(`notas = $${paramCount}`);
      values.push(sanitizeString(notas));
      paramCount++;
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramCount}`);
      values.push(estado);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);
    const query = `UPDATE citas SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows[0], 'Cita actualizada exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al actualizar cita');
  }
});

// Cambiar estado de cita
app.patch('/citas/:id/estado', verifyToken, [
  param('id').isInt().withMessage('ID invalido'),
  body('estado').isIn(['programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio']).withMessage('Estado invalido')
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
    const { estado } = req.body;

    // Verificar si la cita existe
    const citaExiste = await pool.query(
      'SELECT id FROM citas WHERE id = $1',
      [id]
    );

    if (citaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const result = await pool.query(
      'UPDATE citas SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [estado, id]
    );

    return successResponse(res, result.rows[0], 'Estado de cita actualizado exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al cambiar estado de cita');
  }
});

// Eliminar cita
app.delete('/citas/:id', verifyToken, [
  param('id').isInt().withMessage('ID invalido')
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

    // Verificar si la cita existe
    const citaExiste = await pool.query(
      'SELECT id FROM citas WHERE id = $1',
      [id]
    );

    if (citaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    await pool.query('DELETE FROM citas WHERE id = $1', [id]);

    return successResponse(res, null, 'Cita eliminada exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al eliminar cita');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`📅 Appointment Service corriendo en puerto ${PORT}`);
});

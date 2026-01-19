const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { verifyToken } = require('../shared/middleware/auth');
const { sanitizeString, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.FICHA_PORT || 3003;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'ficha-service' });
});

// Crear nueva ficha endodóntica
app.post('/fichas', verifyToken, [
  body('paciente_id').isInt().withMessage('ID de paciente inválido'),
  body('pieza_dental').notEmpty().withMessage('Pieza dental es requerida'),
  body('fecha').optional().isDate().withMessage('Fecha inválida')
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    await client.query('BEGIN');

    const {
      paciente_id,
      pieza_dental,
      fecha,
      dr_referidor,
      motivo_consulta,
      antecedentes,
      // Causas
      causa_caries,
      causa_traumatismo,
      causa_reabsorciones,
      causa_finalidad_protetica,
      causa_tratamiento_anterior,
      causa_endoperiodontal,
      causa_otras,
      // Dolor
      dolor_naturaleza,
      dolor_calidad,
      dolor_localizacion,
      dolor_irradiado_a,
      dolor_duracion,
      dolor_iniciado_por,
      // Zona periapical
      zona_normal,
      zona_tumefaccion,
      zona_adenopatias,
      zona_dolor_palpacion,
      zona_fistula,
      zona_flemon,
      // Examen periodontal
      profundidad_bolsa,
      movilidad,
      supuracion,
      // Evaluación radiográfica - Cámara
      camara_normal,
      camara_estrecha,
      camara_amplia,
      camara_calcificada,
      camara_nodulos,
      camara_reabsorcion_interna,
      camara_reabsorcion_externa,
      // Causas de fracaso (opcional)
      causas_fracaso
    } = req.body;

    // Verificar que el paciente existe
    const pacienteExists = await client.query(
      'SELECT id FROM pacientes WHERE id = $1 AND activo = true',
      [paciente_id]
    );

    if (pacienteExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Insertar ficha endodóntica
    const fichaQuery = `
      INSERT INTO fichas_endodonticas (
        paciente_id, pieza_dental, fecha, dr_referidor, motivo_consulta, antecedentes,
        causa_caries, causa_traumatismo, causa_reabsorciones, causa_finalidad_protetica,
        causa_tratamiento_anterior, causa_endoperiodontal, causa_otras,
        dolor_naturaleza, dolor_calidad, dolor_localizacion, dolor_irradiado_a,
        dolor_duracion, dolor_iniciado_por,
        zona_normal, zona_tumefaccion, zona_adenopatias, zona_dolor_palpacion,
        zona_fistula, zona_flemon,
        profundidad_bolsa, movilidad, supuracion,
        camara_normal, camara_estrecha, camara_amplia, camara_calcificada,
        camara_nodulos, camara_reabsorcion_interna, camara_reabsorcion_externa
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35
      ) RETURNING *
    `;

    const fichaResult = await client.query(fichaQuery, [
      paciente_id,
      sanitizeString(pieza_dental),
      fecha || new Date(),
      sanitizeString(dr_referidor) || null,
      sanitizeString(motivo_consulta) || null,
      sanitizeString(antecedentes) || null,
      causa_caries || false,
      causa_traumatismo || false,
      causa_reabsorciones || false,
      causa_finalidad_protetica || false,
      causa_tratamiento_anterior || false,
      causa_endoperiodontal || false,
      sanitizeString(causa_otras) || null,
      dolor_naturaleza || null,
      dolor_calidad || null,
      dolor_localizacion || null,
      sanitizeString(dolor_irradiado_a) || null,
      dolor_duracion || null,
      sanitizeString(dolor_iniciado_por) || null,
      zona_normal || false,
      zona_tumefaccion || false,
      zona_adenopatias || false,
      zona_dolor_palpacion || false,
      zona_fistula || false,
      zona_flemon || false,
      profundidad_bolsa || null,
      movilidad || 0,
      supuracion || false,
      camara_normal || false,
      camara_estrecha || false,
      camara_amplia || false,
      camara_calcificada || false,
      camara_nodulos || false,
      camara_reabsorcion_interna || false,
      camara_reabsorcion_externa || false
    ]);

    const fichaId = fichaResult.rows[0].id;

    // Si hay causas de fracaso, insertarlas
    if (causas_fracaso && causa_tratamiento_anterior) {
      const fracasoQuery = `
        INSERT INTO causas_fracaso (
          ficha_id, filtracion_coronaria, escalon, mantiene_lesion_periodontal,
          instrumento_fracturado, tratamiento_incompleto, perforacion,
          tratamiento_subobturado, finalidad_protetica, tratamiento_sobreobturado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await client.query(fracasoQuery, [
        fichaId,
        causas_fracaso.filtracion_coronaria || false,
        causas_fracaso.escalon || false,
        causas_fracaso.mantiene_lesion_periodontal || false,
        causas_fracaso.instrumento_fracturado || false,
        causas_fracaso.tratamiento_incompleto || false,
        causas_fracaso.perforacion || false,
        causas_fracaso.tratamiento_subobturado || false,
        causas_fracaso.finalidad_protetica || false,
        causas_fracaso.tratamiento_sobreobturado || false
      ]);
    }

    await client.query('COMMIT');

    return successResponse(res, fichaResult.rows[0], 'Ficha endodóntica creada exitosamente', 201);

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al crear ficha endodóntica');
  } finally {
    client.release();
  }
});

// Obtener todas las fichas con filtros
app.get('/fichas', verifyToken, [
  query('paciente_id').optional().isInt().withMessage('ID de paciente inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido')
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
    const paciente_id = req.query.paciente_id;

    let query = `
      SELECT f.*, 
             p.nombres, p.apellidos, p.historia_clinica,
             cf.id as causas_fracaso_id, cf.filtracion_coronaria, cf.escalon,
             cf.mantiene_lesion_periodontal, cf.instrumento_fracturado,
             cf.tratamiento_incompleto, cf.perforacion, cf.tratamiento_subobturado,
             cf.finalidad_protetica, cf.tratamiento_sobreobturado
      FROM fichas_endodonticas f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN causas_fracaso cf ON f.id = cf.ficha_id
      WHERE f.activo = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM fichas_endodonticas WHERE activo = true';
    const params = [];

    if (paciente_id) {
      query += ` AND f.paciente_id = $1`;
      countQuery += ` AND paciente_id = $1`;
      params.push(paciente_id);
    }

    query += ` ORDER BY f.fecha DESC, f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Obtener fichas
    const result = await pool.query(query, params);

    // Obtener total
    const countResult = await pool.query(countQuery, paciente_id ? [paciente_id] : []);
    const total = parseInt(countResult.rows[0].count);

    return successResponse(res, {
      fichas: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Fichas obtenidas exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener fichas');
  }
});

// Obtener una ficha por ID
app.get('/fichas/:id', verifyToken, [
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

    const result = await pool.query(`
      SELECT f.*, 
             p.nombres, p.apellidos, p.historia_clinica, p.edad, p.telefono,
             cf.id as causas_fracaso_id, cf.filtracion_coronaria, cf.escalon,
             cf.mantiene_lesion_periodontal, cf.instrumento_fracturado,
             cf.tratamiento_incompleto, cf.perforacion, cf.tratamiento_subobturado,
             cf.finalidad_protetica, cf.tratamiento_sobreobturado
      FROM fichas_endodonticas f
      LEFT JOIN pacientes p ON f.paciente_id = p.id
      LEFT JOIN causas_fracaso cf ON f.id = cf.ficha_id
      WHERE f.id = $1 AND f.activo = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    return successResponse(res, result.rows[0], 'Ficha obtenida exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener ficha');
  }
});

// Actualizar ficha endodóntica
app.put('/fichas/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido')
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    await client.query('BEGIN');

    const { id } = req.params;
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Campos que se pueden actualizar
    const updatableFields = [
      'pieza_dental', 'fecha', 'dr_referidor', 'motivo_consulta', 'antecedentes',
      'causa_caries', 'causa_traumatismo', 'causa_reabsorciones', 'causa_finalidad_protetica',
      'causa_tratamiento_anterior', 'causa_endoperiodontal', 'causa_otras',
      'dolor_naturaleza', 'dolor_calidad', 'dolor_localizacion', 'dolor_irradiado_a',
      'dolor_duracion', 'dolor_iniciado_por',
      'zona_normal', 'zona_tumefaccion', 'zona_adenopatias', 'zona_dolor_palpacion',
      'zona_fistula', 'zona_flemon',
      'profundidad_bolsa', 'movilidad', 'supuracion',
      'camara_normal', 'camara_estrecha', 'camara_amplia', 'camara_calcificada',
      'camara_nodulos', 'camara_reabsorcion_interna', 'camara_reabsorcion_externa'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);
    const query = `UPDATE fichas_endodonticas SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND activo = true RETURNING *`;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    // Actualizar causas de fracaso si se proporcionan
    if (req.body.causas_fracaso) {
      const cf = req.body.causas_fracaso;
      
      // Verificar si ya existe un registro de causas de fracaso
      const existingCF = await client.query(
        'SELECT id FROM causas_fracaso WHERE ficha_id = $1',
        [id]
      );

      if (existingCF.rows.length > 0) {
        // Actualizar
        await client.query(`
          UPDATE causas_fracaso SET
            filtracion_coronaria = $1, escalon = $2, mantiene_lesion_periodontal = $3,
            instrumento_fracturado = $4, tratamiento_incompleto = $5, perforacion = $6,
            tratamiento_subobturado = $7, finalidad_protetica = $8, tratamiento_sobreobturado = $9
          WHERE ficha_id = $10
        `, [
          cf.filtracion_coronaria || false,
          cf.escalon || false,
          cf.mantiene_lesion_periodontal || false,
          cf.instrumento_fracturado || false,
          cf.tratamiento_incompleto || false,
          cf.perforacion || false,
          cf.tratamiento_subobturado || false,
          cf.finalidad_protetica || false,
          cf.tratamiento_sobreobturado || false,
          id
        ]);
      } else {
        // Insertar
        await client.query(`
          INSERT INTO causas_fracaso (
            ficha_id, filtracion_coronaria, escalon, mantiene_lesion_periodontal,
            instrumento_fracturado, tratamiento_incompleto, perforacion,
            tratamiento_subobturado, finalidad_protetica, tratamiento_sobreobturado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          id,
          cf.filtracion_coronaria || false,
          cf.escalon || false,
          cf.mantiene_lesion_periodontal || false,
          cf.instrumento_fracturado || false,
          cf.tratamiento_incompleto || false,
          cf.perforacion || false,
          cf.tratamiento_subobturado || false,
          cf.finalidad_protetica || false,
          cf.tratamiento_sobreobturado || false
        ]);
      }
    }

    await client.query('COMMIT');

    return successResponse(res, result.rows[0], 'Ficha actualizada exitosamente');

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al actualizar ficha');
  } finally {
    client.release();
  }
});

// Eliminar ficha (soft delete)
app.delete('/fichas/:id', verifyToken, [
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
      'UPDATE fichas_endodonticas SET activo = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND activo = true RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    return successResponse(res, null, 'Ficha eliminada exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al eliminar ficha');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`📋 Ficha Service corriendo en puerto ${PORT}`);
});

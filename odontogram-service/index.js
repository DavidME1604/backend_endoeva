const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { verifyToken } = require('../shared/middleware/auth');
const { sanitizeString, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.ODONTOGRAM_PORT || 3004;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'odontogram-service' });
});

// Estados válidos para los dientes
const ESTADOS_VALIDOS = [
  'Sano',
  'Caries',
  'Obturado',
  'Endodoncia',
  'Corona',
  'Puente',
  'Extraído',
  'Implante',
  'Fractura',
  'Ausente',
  'En tratamiento'
];

// Crear o actualizar odontograma completo
app.post('/odontogramas', verifyToken, [
  body('ficha_id').isInt().withMessage('ID de ficha inválido'),
  body('dientes').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un diente'),
  body('dientes.*.diente_numero').isInt({ min: 1, max: 48 }).withMessage('Número de diente inválido'),
  body('dientes.*.cuadrante').isInt({ min: 1, max: 4 }).withMessage('Cuadrante inválido'),
  body('dientes.*.estado').isIn(ESTADOS_VALIDOS).withMessage('Estado inválido')
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

    const { ficha_id, dientes } = req.body;

    // Verificar que la ficha existe
    const fichaExists = await client.query(
      'SELECT id FROM fichas_endodonticas WHERE id = $1 AND activo = true',
      [ficha_id]
    );

    if (fichaExists.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    // Insertar o actualizar cada diente
    const resultados = [];
    
    for (const diente of dientes) {
      const { diente_numero, cuadrante, estado, notas } = diente;

      // Verificar si el diente ya existe en el odontograma
      const exists = await client.query(
        'SELECT id FROM odontogramas WHERE ficha_id = $1 AND diente_numero = $2',
        [ficha_id, diente_numero]
      );

      let result;

      if (exists.rows.length > 0) {
        // Actualizar
        result = await client.query(`
          UPDATE odontogramas 
          SET cuadrante = $1, estado = $2, notas = $3, fecha_registro = CURRENT_DATE
          WHERE ficha_id = $4 AND diente_numero = $5
          RETURNING *
        `, [cuadrante, estado, sanitizeString(notas) || null, ficha_id, diente_numero]);
      } else {
        // Insertar
        result = await client.query(`
          INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
          VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
          RETURNING *
        `, [ficha_id, diente_numero, cuadrante, estado, sanitizeString(notas) || null]);
      }

      resultados.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return successResponse(res, resultados, 'Odontograma guardado exitosamente', 201);

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al guardar odontograma');
  } finally {
    client.release();
  }
});

// Obtener odontograma completo de una ficha
app.get('/odontogramas/ficha/:ficha_id', verifyToken, [
  param('ficha_id').isInt().withMessage('ID de ficha inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { ficha_id } = req.params;

    // Verificar que la ficha existe
    const fichaExists = await pool.query(
      'SELECT id FROM fichas_endodonticas WHERE id = $1 AND activo = true',
      [ficha_id]
    );

    if (fichaExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    // Obtener todos los dientes del odontograma
    const result = await pool.query(`
      SELECT id, diente_numero, cuadrante, estado, notas, fecha_registro, created_at
      FROM odontogramas
      WHERE ficha_id = $1
      ORDER BY diente_numero ASC
    `, [ficha_id]);

    // Organizar por cuadrantes
    const odontograma = {
      cuadrante_1: result.rows.filter(d => d.cuadrante === 1),
      cuadrante_2: result.rows.filter(d => d.cuadrante === 2),
      cuadrante_3: result.rows.filter(d => d.cuadrante === 3),
      cuadrante_4: result.rows.filter(d => d.cuadrante === 4),
      todos: result.rows
    };

    return successResponse(res, odontograma, 'Odontograma obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener odontograma');
  }
});

// Actualizar un diente específico
app.put('/odontogramas/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido'),
  body('estado').optional().isIn(ESTADOS_VALIDOS).withMessage('Estado inválido'),
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

    const { id } = req.params;
    const { estado, notas } = req.body;

    // Verificar que el registro existe
    const exists = await pool.query(
      'SELECT id FROM odontogramas WHERE id = $1',
      [id]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro de odontograma no encontrado'
      });
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (estado !== undefined) {
      updates.push(`estado = $${paramCount}`);
      values.push(estado);
      paramCount++;
    }

    if (notas !== undefined) {
      updates.push(`notas = $${paramCount}`);
      values.push(sanitizeString(notas));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`fecha_registro = CURRENT_DATE`);
    values.push(id);

    const query = `UPDATE odontogramas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows[0], 'Diente actualizado exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al actualizar diente');
  }
});

// Eliminar un diente específico del odontograma
app.delete('/odontogramas/:id', verifyToken, [
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
      'DELETE FROM odontogramas WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro de odontograma no encontrado'
      });
    }

    return successResponse(res, null, 'Diente eliminado del odontograma exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al eliminar diente');
  }
});

// Obtener historial de cambios de un diente
app.get('/odontogramas/historial/:ficha_id/:diente_numero', verifyToken, [
  param('ficha_id').isInt().withMessage('ID de ficha inválido'),
  param('diente_numero').isInt().withMessage('Número de diente inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { ficha_id, diente_numero } = req.params;

    // Obtener historial (ordenado por fecha)
    const result = await pool.query(`
      SELECT id, estado, notas, fecha_registro, created_at
      FROM odontogramas
      WHERE ficha_id = $1 AND diente_numero = $2
      ORDER BY fecha_registro DESC, created_at DESC
    `, [ficha_id, diente_numero]);

    return successResponse(res, result.rows, 'Historial obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener historial');
  }
});

// Obtener estados válidos
app.get('/odontogramas/estados', verifyToken, (req, res) => {
  return successResponse(res, ESTADOS_VALIDOS, 'Estados válidos obtenidos');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🦷 Odontogram Service corriendo en puerto ${PORT}`);
});

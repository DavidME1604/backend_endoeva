const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../shared/utils/database');
const { verifyToken } = require('../shared/middleware/auth');
const { sanitizeString, handleError, successResponse } = require('../shared/utils/validators');

const app = express();
const PORT = process.env.BUDGET_PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'budget-service' });
});

// Crear presupuesto con actos
app.post('/presupuestos', verifyToken, [
  body('ficha_id').isInt().withMessage('ID de ficha inválido'),
  body('actos').isArray({ min: 1 }).withMessage('Debe incluir al menos un acto'),
  body('actos.*.numero').isInt({ min: 1 }).withMessage('Número de acto inválido'),
  body('actos.*.actividad').notEmpty().withMessage('Actividad es requerida'),
  body('actos.*.costo_unitario').isFloat({ min: 0 }).withMessage('Costo unitario inválido'),
  body('actos.*.cantidad').optional().isInt({ min: 1 }).withMessage('Cantidad inválida')
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

    const { ficha_id, actos } = req.body;

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

    // Verificar si ya existe un presupuesto para esta ficha
    const presupuestoExists = await client.query(
      'SELECT id FROM presupuestos WHERE ficha_id = $1',
      [ficha_id]
    );

    if (presupuestoExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ya existe un presupuesto para esta ficha'
      });
    }

    // Calcular total del presupuesto
    let total = 0;
    actos.forEach(acto => {
      const cantidad = acto.cantidad || 1;
      total += parseFloat(acto.costo_unitario) * cantidad;
    });

    // Crear presupuesto
    const presupuestoResult = await client.query(
      'INSERT INTO presupuestos (ficha_id, total, total_pagado, saldo) VALUES ($1, $2, 0, $2) RETURNING *',
      [ficha_id, total]
    );

    const presupuesto_id = presupuestoResult.rows[0].id;

    // Insertar actos del presupuesto
    const actosInsertados = [];
    for (const acto of actos) {
      const cantidad = acto.cantidad || 1;
      const totalActo = parseFloat(acto.costo_unitario) * cantidad;

      const result = await client.query(`
        INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        presupuesto_id,
        acto.numero,
        sanitizeString(acto.actividad),
        parseFloat(acto.costo_unitario),
        cantidad,
        totalActo
      ]);

      actosInsertados.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return successResponse(res, {
      presupuesto: presupuestoResult.rows[0],
      actos: actosInsertados
    }, 'Presupuesto creado exitosamente', 201);

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al crear presupuesto');
  } finally {
    client.release();
  }
});

// Obtener presupuesto de una ficha
app.get('/presupuestos/ficha/:ficha_id', verifyToken, [
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

    // Obtener presupuesto
    const presupuestoResult = await pool.query(
      'SELECT * FROM presupuestos WHERE ficha_id = $1',
      [ficha_id]
    );

    if (presupuestoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró presupuesto para esta ficha'
      });
    }

    const presupuesto = presupuestoResult.rows[0];

    // Obtener actos del presupuesto
    const actosResult = await pool.query(
      'SELECT * FROM actos_presupuesto WHERE presupuesto_id = $1 ORDER BY numero ASC',
      [presupuesto.id]
    );

    // Obtener pagos del presupuesto
    const pagosResult = await pool.query(
      'SELECT * FROM pagos WHERE presupuesto_id = $1 ORDER BY fecha DESC, created_at DESC',
      [presupuesto.id]
    );

    return successResponse(res, {
      presupuesto,
      actos: actosResult.rows,
      pagos: pagosResult.rows
    }, 'Presupuesto obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener presupuesto');
  }
});

// Obtener presupuesto por ID
app.get('/presupuestos/:id', verifyToken, [
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

    // Obtener presupuesto
    const presupuestoResult = await pool.query(
      'SELECT * FROM presupuestos WHERE id = $1',
      [id]
    );

    if (presupuestoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    const presupuesto = presupuestoResult.rows[0];

    // Obtener actos
    const actosResult = await pool.query(
      'SELECT * FROM actos_presupuesto WHERE presupuesto_id = $1 ORDER BY numero ASC',
      [id]
    );

    // Obtener pagos
    const pagosResult = await pool.query(
      'SELECT * FROM pagos WHERE presupuesto_id = $1 ORDER BY fecha DESC, created_at DESC',
      [id]
    );

    return successResponse(res, {
      presupuesto,
      actos: actosResult.rows,
      pagos: pagosResult.rows
    }, 'Presupuesto obtenido exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener presupuesto');
  }
});

// Registrar un pago
app.post('/presupuestos/:id/pagos', verifyToken, [
  param('id').isInt().withMessage('ID de presupuesto inválido'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor de pago inválido'),
  body('fecha').optional().isDate().withMessage('Fecha inválida'),
  body('actividad').optional().isString()
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
    const { valor, fecha, actividad } = req.body;

    // Obtener presupuesto actual
    const presupuestoResult = await client.query(
      'SELECT * FROM presupuestos WHERE id = $1',
      [id]
    );

    if (presupuestoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    const presupuesto = presupuestoResult.rows[0];
    const saldo_anterior = parseFloat(presupuesto.saldo);
    const valor_pago = parseFloat(valor);

    // Validar que el pago no exceda el saldo
    if (valor_pago > saldo_anterior) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `El pago ($${valor_pago}) excede el saldo pendiente ($${saldo_anterior})`
      });
    }

    const saldo_nuevo = saldo_anterior - valor_pago;
    const total_pagado_nuevo = parseFloat(presupuesto.total_pagado) + valor_pago;

    // Registrar el pago
    const pagoResult = await client.query(`
      INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      id,
      fecha || new Date(),
      sanitizeString(actividad) || null,
      valor_pago,
      saldo_anterior,
      saldo_nuevo
    ]);

    // Actualizar presupuesto
    await client.query(`
      UPDATE presupuestos 
      SET total_pagado = $1, saldo = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [total_pagado_nuevo, saldo_nuevo, id]);

    await client.query('COMMIT');

    return successResponse(res, {
      pago: pagoResult.rows[0],
      presupuesto: {
        id,
        total: presupuesto.total,
        total_pagado: total_pagado_nuevo,
        saldo: saldo_nuevo
      }
    }, 'Pago registrado exitosamente', 201);

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al registrar pago');
  } finally {
    client.release();
  }
});

// Obtener todos los pagos de un presupuesto
app.get('/presupuestos/:id/pagos', verifyToken, [
  param('id').isInt().withMessage('ID de presupuesto inválido')
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

    // Verificar que el presupuesto existe
    const presupuestoExists = await pool.query(
      'SELECT id FROM presupuestos WHERE id = $1',
      [id]
    );

    if (presupuestoExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    // Obtener pagos
    const result = await pool.query(
      'SELECT * FROM pagos WHERE presupuesto_id = $1 ORDER BY fecha DESC, created_at DESC',
      [id]
    );

    return successResponse(res, result.rows, 'Pagos obtenidos exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al obtener pagos');
  }
});

// Actualizar presupuesto (modificar actos)
app.put('/presupuestos/:id', verifyToken, [
  param('id').isInt().withMessage('ID inválido'),
  body('actos').optional().isArray({ min: 1 }).withMessage('Debe incluir al menos un acto')
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
    const { actos } = req.body;

    // Verificar que el presupuesto existe
    const presupuestoResult = await client.query(
      'SELECT * FROM presupuestos WHERE id = $1',
      [id]
    );

    if (presupuestoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    const presupuesto = presupuestoResult.rows[0];

    if (actos && actos.length > 0) {
      // Eliminar actos anteriores
      await client.query('DELETE FROM actos_presupuesto WHERE presupuesto_id = $1', [id]);

      // Calcular nuevo total
      let nuevoTotal = 0;
      const actosInsertados = [];

      for (const acto of actos) {
        const cantidad = acto.cantidad || 1;
        const totalActo = parseFloat(acto.costo_unitario) * cantidad;
        nuevoTotal += totalActo;

        const result = await client.query(`
          INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          id,
          acto.numero,
          sanitizeString(acto.actividad),
          parseFloat(acto.costo_unitario),
          cantidad,
          totalActo
        ]);

        actosInsertados.push(result.rows[0]);
      }

      // Actualizar presupuesto con nuevo total
      const total_pagado = parseFloat(presupuesto.total_pagado);
      const nuevoSaldo = nuevoTotal - total_pagado;

      await client.query(`
        UPDATE presupuestos 
        SET total = $1, saldo = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [nuevoTotal, nuevoSaldo, id]);

      await client.query('COMMIT');

      return successResponse(res, {
        presupuesto: {
          id,
          total: nuevoTotal,
          total_pagado,
          saldo: nuevoSaldo
        },
        actos: actosInsertados
      }, 'Presupuesto actualizado exitosamente');
    }

    await client.query('COMMIT');
    return successResponse(res, presupuesto, 'Presupuesto actualizado');

  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error, 'Error al actualizar presupuesto');
  } finally {
    client.release();
  }
});

// Eliminar presupuesto (y sus actos y pagos en cascada)
app.delete('/presupuestos/:id', verifyToken, [
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
      'DELETE FROM presupuestos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    return successResponse(res, null, 'Presupuesto eliminado exitosamente');

  } catch (error) {
    return handleError(res, error, 'Error al eliminar presupuesto');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`💰 Budget Service corriendo en puerto ${PORT}`);
});

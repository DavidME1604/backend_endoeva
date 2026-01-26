-- =====================================================
-- Script de inserción de datos para odontologia_db
-- Mantiene todas las relaciones entre tablas
-- =====================================================

-- Iniciar transacción para garantizar integridad
BEGIN;

-- =====================================================
-- 1. USUARIOS (sin dependencias)
-- =====================================================
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
('Dr. Carlos Mendoza', 'carlos.mendoza@clinica.com', '$2b$10$YourHashedPasswordHere1234567890abcdef', 'administrador', true),
('Dra. María García', 'maria.garcia@clinica.com', '$2b$10$YourHashedPasswordHere1234567890abcdef', 'odontologo', true),
('Dr. Roberto Sánchez', 'roberto.sanchez@clinica.com', '$2b$10$YourHashedPasswordHere1234567890abcdef', 'odontologo', true),
('Dra. Ana Martínez', 'ana.martinez@clinica.com', '$2b$10$YourHashedPasswordHere1234567890abcdef', 'odontologo', true),
('Dr. Luis Fernández', 'luis.fernandez@clinica.com', '$2b$10$YourHashedPasswordHere1234567890abcdef', 'odontologo', false);

-- =====================================================
-- 2. PACIENTES (sin dependencias)
-- =====================================================
INSERT INTO pacientes (historia_clinica, nombres, apellidos, edad, domicilio, telefono, activo) VALUES
('HC-2024-001', 'Juan Carlos', 'Pérez López', 35, 'Av. Principal 123, Col. Centro', '555-0101', true),
('HC-2024-002', 'María Elena', 'Rodríguez Gómez', 28, 'Calle Norte 456, Col. Industrial', '555-0102', true),
('HC-2024-003', 'Roberto', 'Hernández Díaz', 45, 'Blvd. Sur 789, Col. Residencial', '555-0103', true),
('HC-2024-004', 'Ana Sofía', 'Martínez Ruiz', 32, 'Av. Reforma 321, Col. Moderna', '555-0104', true),
('HC-2024-005', 'Pedro Antonio', 'García Flores', 52, 'Calle Oriente 654, Col. Jardines', '555-0105', true),
('HC-2024-006', 'Laura Patricia', 'Sánchez Morales', 41, 'Privada Las Palmas 12, Fraccionamiento Verde', '555-0106', true),
('HC-2024-007', 'Diego Alejandro', 'López Vargas', 29, 'Av. Universidad 890, Col. Educación', '555-0107', true),
('HC-2024-008', 'Carmen Rosa', 'Torres Medina', 38, 'Calle del Sol 234, Col. Aurora', '555-0108', true),
('HC-2024-009', 'Fernando José', 'Ramírez Castro', 55, 'Blvd. Libertad 567, Col. Independencia', '555-0109', true),
('HC-2024-010', 'Gabriela', 'Ortiz Navarro', 24, 'Av. Juárez 876, Col. Centro Histórico', '555-0110', true);

-- =====================================================
-- 3. FICHAS ENDODÓNTICAS (depende de pacientes)
-- =====================================================
-- Usamos subconsultas para obtener los IDs de pacientes

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
    camara_nodulos, camara_reabsorcion_interna, camara_reabsorcion_externa,
    activo
) VALUES
-- Ficha 1: Paciente Juan Carlos - Endodoncia por caries
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-001'),
 '16', '2024-01-15', 'Dr. Miguel Ángel Reyes', 'Dolor intenso al masticar', 'Sin antecedentes relevantes',
 true, false, false, false, false, false, false,
 'Intenso', 'Pulsátil', 'Localizado', 'Oído derecho',
 '3 días', 'Frío y calor',
 false, false, false, true, false, false,
 2.5, 0, false,
 false, true, false, false, false, false, false,
 true),

-- Ficha 2: Paciente María Elena - Retratamiento
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-002'),
 '21', '2024-01-20', 'Dra. Patricia Vega', 'Reactivación de lesión periapical', 'Endodoncia hace 5 años',
 false, false, false, false, true, false, false,
 'Moderado', 'Sordo', 'Localizado', NULL,
 '1 semana', 'Presión al morder',
 false, true, false, true, true, false,
 3.0, 1, false,
 false, false, false, true, true, false, false,
 true),

-- Ficha 3: Paciente Roberto - Traumatismo
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-003'),
 '11', '2024-02-01', NULL, 'Fractura dental por accidente', 'Traumatismo hace 2 semanas',
 false, true, false, false, false, false, false,
 'Leve', 'Agudo', 'Localizado', NULL,
 'Desde el accidente', 'Aire frío',
 true, false, false, false, false, false,
 2.0, 1, false,
 true, false, false, false, false, false, false,
 true),

-- Ficha 4: Paciente Ana Sofía - Finalidad protética
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-004'),
 '36', '2024-02-10', 'Dr. Alberto Ruiz', 'Preparación para corona', 'Ninguno',
 false, false, false, true, false, false, false,
 'No hay dolor', NULL, NULL, NULL,
 NULL, NULL,
 true, false, false, false, false, false,
 2.0, 0, false,
 true, false, false, false, false, false, false,
 true),

-- Ficha 5: Paciente Pedro - Lesión endoperiodontal
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-005'),
 '46', '2024-02-15', 'Dr. Periodoncista García', 'Dolor y movilidad dental', 'Enfermedad periodontal crónica',
 true, false, false, false, false, true, false,
 'Intenso', 'Continuo', 'Difuso', 'Mandíbula',
 '2 semanas', 'Espontáneo',
 false, true, true, true, true, false,
 6.0, 2, true,
 false, true, false, false, false, false, true,
 true),

-- Ficha 6: Paciente Laura - Segunda ficha (otro diente)
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-006'),
 '24', '2024-02-20', NULL, 'Caries profunda con exposición pulpar', 'Bruxismo',
 true, false, false, false, false, false, false,
 'Moderado', 'Pulsátil', 'Localizado', NULL,
 '5 días', 'Dulce y frío',
 true, false, false, false, false, false,
 2.5, 0, false,
 true, false, false, false, false, false, false,
 true),

-- Ficha 7: Paciente Diego - Reabsorción
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-007'),
 '12', '2024-03-01', 'Dra. Ortodoncista Méndez', 'Hallazgo radiográfico', 'Tratamiento de ortodoncia previo',
 false, false, true, false, false, false, false,
 'No hay dolor', NULL, NULL, NULL,
 NULL, NULL,
 true, false, false, false, false, false,
 2.0, 0, false,
 false, false, false, false, false, false, true,
 true),

-- Ficha 8: Paciente Carmen - Caries extensa
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-008'),
 '37', '2024-03-05', NULL, 'Dolor nocturno intenso', 'Diabetes tipo 2 controlada',
 true, false, false, false, false, false, false,
 'Intenso', 'Pulsátil', 'Referido', 'Sien izquierda',
 '1 semana', 'Calor y acostarse',
 false, false, false, true, false, false,
 3.5, 0, false,
 false, true, false, false, false, false, false,
 true),

-- Ficha 9: Paciente Fernando - Flemón
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-009'),
 '47', '2024-03-10', 'Urgencias Hospital General', 'Inflamación facial severa', 'Hipertensión controlada',
 true, false, false, false, false, false, false,
 'Intenso', 'Continuo', 'Difuso', 'Cuello',
 '3 días', 'Espontáneo',
 false, true, true, true, false, true,
 4.0, 2, true,
 false, false, false, false, false, false, false,
 true),

-- Ficha 10: Paciente Gabriela
((SELECT id FROM pacientes WHERE historia_clinica = 'HC-2024-010'),
 '14', '2024-03-15', NULL, 'Sensibilidad persistente', 'Sin antecedentes',
 true, false, false, false, false, false, false,
 'Leve', 'Agudo', 'Localizado', NULL,
 '2 semanas', 'Frío',
 true, false, false, false, false, false,
 2.0, 0, false,
 true, false, false, false, false, false, false,
 true);

-- =====================================================
-- 4. CAUSAS DE FRACASO (depende de fichas_endodonticas)
-- Solo para fichas que tienen tratamiento anterior
-- =====================================================
INSERT INTO causas_fracaso (
    ficha_id, filtracion_coronaria, escalon, mantiene_lesion_periodontal,
    instrumento_fracturado, tratamiento_incompleto, perforacion,
    tratamiento_subobturado, finalidad_protetica, tratamiento_sobreobturado
) VALUES
-- Para la ficha de María Elena (retratamiento)
((SELECT fe.id FROM fichas_endodonticas fe
  JOIN pacientes p ON fe.paciente_id = p.id
  WHERE p.historia_clinica = 'HC-2024-002' AND fe.pieza_dental = '21'),
 true, false, true, false, false, false, true, false, false),

-- Agregamos otra causa de fracaso para variedad (simulando otro caso)
((SELECT fe.id FROM fichas_endodonticas fe
  JOIN pacientes p ON fe.paciente_id = p.id
  WHERE p.historia_clinica = 'HC-2024-005' AND fe.pieza_dental = '46'),
 false, true, true, false, true, false, false, false, false);

-- =====================================================
-- 5. ODONTOGRAMAS (depende de fichas_endodonticas)
-- Registramos el estado de varios dientes por ficha
-- =====================================================

-- Odontograma para Juan Carlos (ficha del diente 16)
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
SELECT fe.id, diente.numero, diente.cuadrante, diente.estado, diente.notas, '2024-01-15'
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (16, 1, 'Endodoncia', 'Tratamiento actual'),
    (17, 1, 'Obturado', 'Amalgama antigua'),
    (15, 1, 'Sano', NULL),
    (26, 2, 'Obturado', 'Resina'),
    (36, 3, 'Caries', 'Caries oclusal'),
    (46, 4, 'Sano', NULL)
) AS diente(numero, cuadrante, estado, notas)
WHERE p.historia_clinica = 'HC-2024-001' AND fe.pieza_dental = '16';

-- Odontograma para María Elena
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
SELECT fe.id, diente.numero, diente.cuadrante, diente.estado, diente.notas, '2024-01-20'
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (21, 2, 'Endodoncia', 'Retratamiento'),
    (11, 1, 'Corona', 'Corona metal-porcelana'),
    (22, 2, 'Sano', NULL),
    (12, 1, 'Obturado', 'Resina estética')
) AS diente(numero, cuadrante, estado, notas)
WHERE p.historia_clinica = 'HC-2024-002' AND fe.pieza_dental = '21';

-- Odontograma para Roberto (traumatismo)
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
SELECT fe.id, diente.numero, diente.cuadrante, diente.estado, diente.notas, '2024-02-01'
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (11, 1, 'Endodoncia', 'Fractura con exposición pulpar'),
    (21, 2, 'Sano', 'Vigilar'),
    (12, 1, 'Sano', NULL),
    (22, 2, 'Sano', NULL)
) AS diente(numero, cuadrante, estado, notas)
WHERE p.historia_clinica = 'HC-2024-003' AND fe.pieza_dental = '11';

-- Odontograma para Ana Sofía
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
SELECT fe.id, diente.numero, diente.cuadrante, diente.estado, diente.notas, '2024-02-10'
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (36, 3, 'Endodoncia', 'Para corona'),
    (37, 3, 'Obturado', 'Resina grande'),
    (35, 3, 'Sano', NULL),
    (46, 4, 'Corona', 'Corona zirconia')
) AS diente(numero, cuadrante, estado, notas)
WHERE p.historia_clinica = 'HC-2024-004' AND fe.pieza_dental = '36';

-- Odontograma para Pedro (endoperiodontal)
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas, fecha_registro)
SELECT fe.id, diente.numero, diente.cuadrante, diente.estado, diente.notas, '2024-02-15'
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (46, 4, 'Endodoncia', 'Lesión endo-perio'),
    (47, 4, 'Extraído', 'Pérdida ósea severa'),
    (45, 4, 'Obturado', 'Resina'),
    (36, 3, 'Obturado', 'Amalgama'),
    (37, 3, 'Extraído', 'Periodontitis avanzada')
) AS diente(numero, cuadrante, estado, notas)
WHERE p.historia_clinica = 'HC-2024-005' AND fe.pieza_dental = '46';

-- =====================================================
-- 6. PRESUPUESTOS (depende de fichas_endodonticas)
-- =====================================================
INSERT INTO presupuestos (ficha_id, total, total_pagado, saldo)
SELECT fe.id, presup.total, presup.pagado, presup.total - presup.pagado
FROM fichas_endodonticas fe
JOIN pacientes p ON fe.paciente_id = p.id
JOIN (VALUES
    ('HC-2024-001', '16', 4500.00, 4500.00),
    ('HC-2024-002', '21', 6000.00, 3000.00),
    ('HC-2024-003', '11', 5500.00, 2000.00),
    ('HC-2024-004', '36', 8500.00, 8500.00),
    ('HC-2024-005', '46', 7000.00, 3500.00),
    ('HC-2024-006', '24', 4500.00, 1500.00),
    ('HC-2024-007', '12', 5000.00, 0.00),
    ('HC-2024-008', '37', 4500.00, 4500.00),
    ('HC-2024-009', '47', 6500.00, 2000.00),
    ('HC-2024-010', '14', 4000.00, 2000.00)
) AS presup(hc, pieza, total, pagado) ON p.historia_clinica = presup.hc AND fe.pieza_dental = presup.pieza;

-- =====================================================
-- 7. ACTOS DE PRESUPUESTO (depende de presupuestos)
-- =====================================================

-- Actos para presupuesto de Juan Carlos
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico y radiografía inicial', 500.00, 1),
    (2, 'Tratamiento de conductos (3 conductos)', 3000.00, 1),
    (3, 'Radiografías de control', 200.00, 2),
    (4, 'Medicación intraconducto', 300.00, 2)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-001' AND fe.pieza_dental = '16';

-- Actos para presupuesto de María Elena (retratamiento)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico y tomografía', 800.00, 1),
    (2, 'Remoción de material de obturación', 1200.00, 1),
    (3, 'Retratamiento de conducto', 3500.00, 1),
    (4, 'Medicación y radiografías', 500.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-002' AND fe.pieza_dental = '21';

-- Actos para presupuesto de Roberto (traumatismo)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Evaluación de urgencia', 600.00, 1),
    (2, 'Tratamiento de conducto (1 conducto)', 2500.00, 1),
    (3, 'Reconstrucción con poste de fibra', 1800.00, 1),
    (4, 'Radiografías de seguimiento', 300.00, 2)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-003' AND fe.pieza_dental = '11';

-- Actos para presupuesto de Ana Sofía (protético)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico y planificación protésica', 500.00, 1),
    (2, 'Tratamiento de conductos (4 conductos)', 3500.00, 1),
    (3, 'Poste de fibra de vidrio', 1500.00, 1),
    (4, 'Corona provisional', 1000.00, 1),
    (5, 'Corona definitiva zirconia', 2000.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-004' AND fe.pieza_dental = '36';

-- Actos para presupuesto de Pedro (endoperiodontal)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico integral endo-perio', 1000.00, 1),
    (2, 'Tratamiento de conductos', 3000.00, 1),
    (3, 'Tratamiento periodontal quirúrgico', 2500.00, 1),
    (4, 'Controles y medicación', 500.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-005' AND fe.pieza_dental = '46';

-- Actos para presupuesto de Laura
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico y radiografía', 500.00, 1),
    (2, 'Tratamiento de conductos (2 conductos)', 2800.00, 1),
    (3, 'Restauración con resina', 800.00, 1),
    (4, 'Férula de descarga (bruxismo)', 400.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-006' AND fe.pieza_dental = '24';

-- Actos para presupuesto de Diego (reabsorción)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Tomografía computarizada', 1200.00, 1),
    (2, 'Tratamiento de conducto', 2500.00, 1),
    (3, 'Sellado con MTA', 1000.00, 1),
    (4, 'Controles radiográficos', 300.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-007' AND fe.pieza_dental = '12';

-- Actos para presupuesto de Carmen
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico', 500.00, 1),
    (2, 'Tratamiento de conductos (4 conductos)', 3500.00, 1),
    (3, 'Restauración provisional', 500.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-008' AND fe.pieza_dental = '37';

-- Actos para presupuesto de Fernando (flemón)
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Atención de urgencia', 800.00, 1),
    (2, 'Drenaje de absceso', 1200.00, 1),
    (3, 'Tratamiento de conductos', 3500.00, 1),
    (4, 'Medicación antibiótica y analgésica', 500.00, 2)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-009' AND fe.pieza_dental = '47';

-- Actos para presupuesto de Gabriela
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total)
SELECT pr.id, acto.numero, acto.actividad, acto.costo, acto.cantidad, acto.costo * acto.cantidad
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    (1, 'Diagnóstico y pruebas de vitalidad', 400.00, 1),
    (2, 'Tratamiento de conductos (2 conductos)', 2800.00, 1),
    (3, 'Restauración con resina', 800.00, 1)
) AS acto(numero, actividad, costo, cantidad)
WHERE p.historia_clinica = 'HC-2024-010' AND fe.pieza_dental = '14';

-- =====================================================
-- 8. PAGOS (depende de presupuestos)
-- =====================================================

-- Pagos de Juan Carlos (pagado completo)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-01-15', 'Anticipo inicial', 2000.00, 4500.00, 2500.00),
    ('2024-01-22', 'Segunda cita', 1500.00, 2500.00, 1000.00),
    ('2024-01-29', 'Pago final', 1000.00, 1000.00, 0.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-001' AND fe.pieza_dental = '16';

-- Pagos de María Elena (parcial)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-01-20', 'Anticipo', 1500.00, 6000.00, 4500.00),
    ('2024-02-03', 'Segundo pago', 1500.00, 4500.00, 3000.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-002' AND fe.pieza_dental = '21';

-- Pagos de Roberto (parcial)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-02-01', 'Pago urgencia', 2000.00, 5500.00, 3500.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-003' AND fe.pieza_dental = '11';

-- Pagos de Ana Sofía (completo)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-02-10', 'Anticipo', 3000.00, 8500.00, 5500.00),
    ('2024-02-24', 'Segundo pago', 3000.00, 5500.00, 2500.00),
    ('2024-03-10', 'Pago final', 2500.00, 2500.00, 0.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-004' AND fe.pieza_dental = '36';

-- Pagos de Pedro (parcial)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-02-15', 'Anticipo', 2000.00, 7000.00, 5000.00),
    ('2024-03-01', 'Segundo pago', 1500.00, 5000.00, 3500.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-005' AND fe.pieza_dental = '46';

-- Pagos de Laura (parcial)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-02-20', 'Anticipo inicial', 1500.00, 4500.00, 3000.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-006' AND fe.pieza_dental = '24';

-- Pagos de Carmen (completo)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-03-05', 'Pago completo', 4500.00, 4500.00, 0.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-008' AND fe.pieza_dental = '37';

-- Pagos de Fernando (parcial - urgencia)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-03-10', 'Pago urgencia', 2000.00, 6500.00, 4500.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-009' AND fe.pieza_dental = '47';

-- Pagos de Gabriela (parcial)
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual)
SELECT pr.id, pago.fecha::date, pago.actividad, pago.valor, pago.saldo_ant, pago.saldo_act
FROM presupuestos pr
JOIN fichas_endodonticas fe ON pr.ficha_id = fe.id
JOIN pacientes p ON fe.paciente_id = p.id
CROSS JOIN (VALUES
    ('2024-03-15', 'Anticipo', 1000.00, 4000.00, 3000.00),
    ('2024-03-22', 'Segundo pago', 1000.00, 3000.00, 2000.00)
) AS pago(fecha, actividad, valor, saldo_ant, saldo_act)
WHERE p.historia_clinica = 'HC-2024-010' AND fe.pieza_dental = '14';

-- =====================================================
-- 9. CITAS (depende de pacientes)
-- =====================================================
INSERT INTO citas (paciente_id, fecha, hora_inicio, hora_fin, motivo, estado, notas)
SELECT p.id, cita.fecha::date, cita.hora_ini::time, cita.hora_fin::time, cita.motivo, cita.estado, cita.notas
FROM pacientes p
JOIN (VALUES
    -- Citas pasadas completadas
    ('HC-2024-001', '2024-01-15', '09:00', '10:30', 'Primera cita - Diagnóstico', 'completada', 'Paciente llegó puntual'),
    ('HC-2024-001', '2024-01-22', '09:00', '11:00', 'Tratamiento de conductos', 'completada', 'Se completó instrumentación'),
    ('HC-2024-001', '2024-01-29', '10:00', '11:00', 'Obturación final', 'completada', 'Tratamiento finalizado con éxito'),

    ('HC-2024-002', '2024-01-20', '11:00', '12:30', 'Evaluación para retratamiento', 'completada', NULL),
    ('HC-2024-002', '2024-02-03', '09:00', '11:00', 'Remoción de gutapercha', 'completada', 'Proceso complicado'),
    ('HC-2024-002', '2024-02-17', '14:00', '16:00', 'Continuación retratamiento', 'cancelada', 'Paciente canceló por enfermedad'),

    ('HC-2024-003', '2024-02-01', '08:00', '09:30', 'Urgencia - Traumatismo', 'completada', 'Atención inmediata'),
    ('HC-2024-003', '2024-02-08', '09:00', '10:30', 'Control post-tratamiento', 'completada', NULL),

    ('HC-2024-004', '2024-02-10', '15:00', '16:30', 'Tratamiento endodóntico', 'completada', NULL),
    ('HC-2024-004', '2024-02-24', '15:00', '16:00', 'Colocación de poste', 'completada', NULL),
    ('HC-2024-004', '2024-03-10', '16:00', '17:00', 'Cementación de corona', 'completada', 'Caso finalizado'),

    ('HC-2024-005', '2024-02-15', '10:00', '12:00', 'Evaluación endo-perio', 'completada', 'Caso complejo'),
    ('HC-2024-005', '2024-03-01', '10:00', '12:00', 'Tratamiento endodóntico', 'completada', NULL),

    ('HC-2024-006', '2024-02-20', '14:00', '15:30', 'Primera cita', 'completada', NULL),

    ('HC-2024-008', '2024-03-05', '09:00', '11:00', 'Tratamiento completo', 'completada', 'Una sola sesión'),

    ('HC-2024-009', '2024-03-10', '08:00', '09:00', 'Urgencia - Flemón', 'completada', 'Drenaje realizado'),
    ('HC-2024-009', '2024-03-17', '09:00', '11:00', 'Tratamiento de conductos', 'no_asistio', 'Paciente no se presentó'),

    -- Citas futuras programadas
    ('HC-2024-002', '2024-04-01', '09:00', '11:00', 'Continuación retratamiento', 'programada', 'Reprogramada'),
    ('HC-2024-003', '2024-04-05', '10:00', '10:30', 'Control 2 meses', 'programada', NULL),
    ('HC-2024-005', '2024-04-08', '10:00', '11:00', 'Control periodontal', 'confirmada', 'Traer radiografías'),
    ('HC-2024-006', '2024-04-02', '14:00', '15:30', 'Segunda cita tratamiento', 'programada', NULL),
    ('HC-2024-007', '2024-04-03', '11:00', '12:30', 'Inicio tratamiento', 'confirmada', 'Primera cita'),
    ('HC-2024-009', '2024-04-10', '09:00', '11:00', 'Retomar tratamiento', 'programada', 'Contactar día antes'),
    ('HC-2024-010', '2024-04-12', '16:00', '17:00', 'Control y obturación', 'programada', NULL)
) AS cita(hc, fecha, hora_ini, hora_fin, motivo, estado, notas) ON p.historia_clinica = cita.hc;

-- =====================================================
-- CONFIRMAR TRANSACCIÓN
-- =====================================================
COMMIT;

-- =====================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =====================================================
-- Ejecutar estas consultas para verificar la inserción:

-- SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios
-- UNION ALL SELECT 'pacientes', COUNT(*) FROM pacientes
-- UNION ALL SELECT 'fichas_endodonticas', COUNT(*) FROM fichas_endodonticas
-- UNION ALL SELECT 'causas_fracaso', COUNT(*) FROM causas_fracaso
-- UNION ALL SELECT 'odontogramas', COUNT(*) FROM odontogramas
-- UNION ALL SELECT 'presupuestos', COUNT(*) FROM presupuestos
-- UNION ALL SELECT 'actos_presupuesto', COUNT(*) FROM actos_presupuesto
-- UNION ALL SELECT 'pagos', COUNT(*) FROM pagos
-- UNION ALL SELECT 'citas', COUNT(*) FROM citas;

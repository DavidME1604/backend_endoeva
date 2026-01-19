-- Insertar usuario administrador de prueba (password: admin123)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
('Dra. Magda Zulay Bastidas', 'admin@endonova.com', '$2b$10$XQjhZvGzK7y5WvZ3mXJOH.WQ5V0yJ8mXn7b5xS3N9F0aG2pL7dT2m', 'administrador'),
('Dr. Juan Pérez', 'juan.perez@endonova.com', '$2b$10$XQjhZvGzK7y5WvZ3mXJOH.WQ5V0yJ8mXn7b5xS3N9F0aG2pL7dT2m', 'odontologo');

-- Insertar pacientes de prueba
INSERT INTO pacientes (historia_clinica, nombres, apellidos, edad, domicilio, telefono) VALUES 
('HC-001', 'María', 'González Pérez', 35, 'Av. Principal 123, Quito', '0987654321'),
('HC-002', 'Carlos', 'Rodríguez Sánchez', 28, 'Calle Secundaria 456, Quito', '0976543210'),
('HC-003', 'Ana', 'Martínez López', 42, 'Barrio Centro 789, Quito', '0965432109');

-- Insertar fichas endodónticas de ejemplo
INSERT INTO fichas_endodonticas (
    paciente_id, pieza_dental, fecha, dr_referidor, motivo_consulta, antecedentes,
    causa_caries, causa_traumatismo,
    dolor_naturaleza, dolor_calidad, dolor_localizacion, dolor_duracion,
    zona_normal, profundidad_bolsa, movilidad,
    camara_normal
) VALUES 
(1, '16', '2025-01-15', 'Dr. Ramírez', 'Dolor intenso en molar superior derecho', 'Paciente con antecedentes de caries múltiples', 
 true, false,
 'Intenso', 'Pulsátil', 'Localizado', 'Horas',
 false, 3.5, 1,
 true),
(2, '36', '2025-01-16', 'Dr. Silva', 'Sensibilidad al frío', 'Sin antecedentes relevantes',
 true, false,
 'Moderado', 'Agudo', 'Localizado', 'Minutos',
 true, 2.0, 0,
 false);

-- Insertar odontogramas de ejemplo
INSERT INTO odontogramas (ficha_id, diente_numero, cuadrante, estado, notas) VALUES 
-- Ficha 1 - Paciente 1
(1, 16, 1, 'Caries', 'Caries profunda, requiere endodoncia'),
(1, 17, 1, 'Sano', 'Sin hallazgos'),
(1, 18, 1, 'Obturado', 'Obturación antigua en buen estado'),
-- Ficha 2 - Paciente 2
(2, 36, 3, 'Caries', 'Caries moderada'),
(2, 37, 3, 'Sano', 'Sin hallazgos');

-- Insertar presupuestos
INSERT INTO presupuestos (ficha_id, total, total_pagado, saldo) VALUES 
(1, 350.00, 150.00, 200.00),
(2, 280.00, 0.00, 280.00);

-- Insertar actos de presupuesto
INSERT INTO actos_presupuesto (presupuesto_id, numero, actividad, costo_unitario, cantidad, total) VALUES 
-- Presupuesto 1
(1, 1, 'Diagnóstico y Radiografía', 50.00, 1, 50.00),
(1, 2, 'Tratamiento de Conducto', 250.00, 1, 250.00),
(1, 3, 'Obturación Final', 50.00, 1, 50.00),
-- Presupuesto 2
(2, 1, 'Diagnóstico y Radiografía', 50.00, 1, 50.00),
(2, 2, 'Tratamiento de Conducto', 200.00, 1, 200.00),
(2, 3, 'Control Post-tratamiento', 30.00, 1, 30.00);

-- Insertar pagos
INSERT INTO pagos (presupuesto_id, fecha, actividad, valor, saldo_anterior, saldo_actual) VALUES 
(1, '2025-01-15', 'Pago inicial - Diagnóstico', 50.00, 350.00, 300.00),
(1, '2025-01-17', 'Abono a tratamiento', 100.00, 300.00, 200.00);

-- Insertar causas de fracaso (opcional, para fichas con tratamiento anterior fallido)
INSERT INTO causas_fracaso (ficha_id, filtracion_coronaria, tratamiento_incompleto) VALUES 
(1, true, false);

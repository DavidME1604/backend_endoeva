-- Tabla de usuarios para autenticación
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'odontologo',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    historia_clinica VARCHAR(50) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    edad INTEGER,
    domicilio TEXT,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fichas endodónticas
CREATE TABLE IF NOT EXISTS fichas_endodonticas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    pieza_dental VARCHAR(10),
    fecha DATE DEFAULT CURRENT_DATE,
    dr_referidor VARCHAR(100),
    motivo_consulta TEXT,
    antecedentes TEXT,
    
    -- CAUSAS
    causa_caries BOOLEAN DEFAULT false,
    causa_traumatismo BOOLEAN DEFAULT false,
    causa_reabsorciones BOOLEAN DEFAULT false,
    causa_finalidad_protetica BOOLEAN DEFAULT false,
    causa_tratamiento_anterior BOOLEAN DEFAULT false,
    causa_endoperiodontal BOOLEAN DEFAULT false,
    causa_otras TEXT,
    
    -- DOLOR
    dolor_naturaleza VARCHAR(50), -- No hay dolor, Leve, Moderado, Intenso
    dolor_calidad VARCHAR(50), -- Sordo, Agudo, Pulsátil, Continuo
    dolor_localizacion VARCHAR(50), -- Localizado, Difuso, Referido
    dolor_irradiado_a VARCHAR(100),
    dolor_duracion VARCHAR(50), -- Segundos, Fugaz, Minutos, Horas, Persistente
    dolor_iniciado_por TEXT, -- Frío, Calor, Dulces, Ácidos, Espontáneo, Masticación, Percusión, Al acostarse, No deja dormir
    
    -- ZONA PERIAPICAL
    zona_normal BOOLEAN DEFAULT false,
    zona_tumefaccion BOOLEAN DEFAULT false,
    zona_adenopatias BOOLEAN DEFAULT false,
    zona_dolor_palpacion BOOLEAN DEFAULT false,
    zona_fistula BOOLEAN DEFAULT false,
    zona_flemon BOOLEAN DEFAULT false,
    
    -- EXAMEN PERIODONTAL
    profundidad_bolsa DECIMAL(4,2),
    movilidad INTEGER, -- 0, 1, 2, 3
    supuracion BOOLEAN DEFAULT false,
    
    -- EVALUACIÓN RADIOGRÁFICA - CÁMARA
    camara_normal BOOLEAN DEFAULT false,
    camara_estrecha BOOLEAN DEFAULT false,
    camara_amplia BOOLEAN DEFAULT false,
    camara_calcificada BOOLEAN DEFAULT false,
    camara_nodulos BOOLEAN DEFAULT false,
    camara_reabsorcion_interna BOOLEAN DEFAULT false,
    camara_reabsorcion_externa BOOLEAN DEFAULT false,
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de causas de fracaso de tratamiento anterior
CREATE TABLE IF NOT EXISTS causas_fracaso (
    id SERIAL PRIMARY KEY,
    ficha_id INTEGER REFERENCES fichas_endodonticas(id) ON DELETE CASCADE,
    filtracion_coronaria BOOLEAN DEFAULT false,
    escalon BOOLEAN DEFAULT false,
    mantiene_lesion_periodontal BOOLEAN DEFAULT false,
    instrumento_fracturado BOOLEAN DEFAULT false,
    tratamiento_incompleto BOOLEAN DEFAULT false,
    perforacion BOOLEAN DEFAULT false,
    tratamiento_subobturado BOOLEAN DEFAULT false,
    finalidad_protetica BOOLEAN DEFAULT false,
    tratamiento_sobreobturado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de odontogramas
CREATE TABLE IF NOT EXISTS odontogramas (
    id SERIAL PRIMARY KEY,
    ficha_id INTEGER REFERENCES fichas_endodonticas(id) ON DELETE CASCADE,
    diente_numero INTEGER NOT NULL, -- 1 a 32 (o 11-18, 21-28, 31-38, 41-48)
    cuadrante INTEGER NOT NULL, -- 1, 2, 3, 4
    estado VARCHAR(50), -- Sano, Caries, Obturado, Endodoncia, Extraído, Corona, etc.
    notas TEXT,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ficha_id, diente_numero)
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id SERIAL PRIMARY KEY,
    ficha_id INTEGER REFERENCES fichas_endodonticas(id) ON DELETE CASCADE,
    total DECIMAL(10,2) DEFAULT 0,
    total_pagado DECIMAL(10,2) DEFAULT 0,
    saldo DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de actos del presupuesto
CREATE TABLE IF NOT EXISTS actos_presupuesto (
    id SERIAL PRIMARY KEY,
    presupuesto_id INTEGER REFERENCES presupuestos(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    actividad VARCHAR(255) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    cantidad INTEGER DEFAULT 1,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    presupuesto_id INTEGER REFERENCES presupuestos(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    actividad VARCHAR(255),
    valor DECIMAL(10,2) NOT NULL,
    saldo_anterior DECIMAL(10,2),
    saldo_actual DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_historia ON pacientes(historia_clinica);
CREATE INDEX idx_fichas_paciente ON fichas_endodonticas(paciente_id);
CREATE INDEX idx_odontogramas_ficha ON odontogramas(ficha_id);
CREATE INDEX idx_presupuestos_ficha ON presupuestos(ficha_id);
CREATE INDEX idx_pagos_presupuesto ON pagos(presupuesto_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fichas_updated_at BEFORE UPDATE ON fichas_endodonticas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presupuestos_updated_at BEFORE UPDATE ON presupuestos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

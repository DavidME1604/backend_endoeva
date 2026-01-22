-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'en_progreso', 'completada', 'cancelada', 'no_asistio')),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice para busquedas por fecha
CREATE INDEX idx_citas_fecha ON citas(fecha);

-- Indice para busquedas por paciente
CREATE INDEX idx_citas_paciente ON citas(paciente_id);

-- Indice para busquedas por estado
CREATE INDEX idx_citas_estado ON citas(estado);

-- Indice compuesto para verificar superposicion de citas
CREATE INDEX idx_citas_fecha_hora ON citas(fecha, hora_inicio, hora_fin);

-- Trigger para actualizar updated_at automaticamente
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

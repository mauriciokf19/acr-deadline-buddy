-- Garantir que ano_fiscal existe e tem default correto
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS ano_fiscal INTEGER;
ALTER TABLE projetos ALTER COLUMN ano_fiscal SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT;

-- Garantir outros defaults úteis
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS pais TEXT;
ALTER TABLE projetos ALTER COLUMN pais SET DEFAULT 'PT';

-- Garantir status/ativo
ALTER TABLE projetos ALTER COLUMN ativo SET DEFAULT true;

-- Atualizar registos existentes sem ano_fiscal
UPDATE projetos 
SET ano_fiscal = EXTRACT(YEAR FROM created_at)::INT 
WHERE ano_fiscal IS NULL;

-- Atualizar registos existentes sem país
UPDATE projetos 
SET pais = 'PT' 
WHERE pais IS NULL;
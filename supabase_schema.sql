-- Tabela de Armazenamento Geral (Compatível com o modelo JSON unificado do AiVoucher)
CREATE TABLE IF NOT EXISTS system_store (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE system_store ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para a Service Role Key (Backend)
CREATE POLICY "Enable all access for service role" ON system_store FOR ALL USING (true);

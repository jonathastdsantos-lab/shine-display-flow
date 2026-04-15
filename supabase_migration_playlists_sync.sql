-- ############################################################
-- MIGRATION: UPDATE PLAYLISTS SCHEMA
-- DESCRIÇÃO: Adiciona colunas para Layout Individual e Sincronização
-- DATA: 2026-04-15
-- ############################################################

-- 1. Garante que TODAS as colunas necessárias existam na tabela playlists
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS layout_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS template text DEFAULT 'corporativo',
ADD COLUMN IF NOT EXISTS config_clima text DEFAULT 'São Paulo',
ADD COLUMN IF NOT EXISTS config_noticias text DEFAULT 'technology',
ADD COLUMN IF NOT EXISTS instagram_handle text;

-- 2. Notifica o PostgREST para reconhecer as novas colunas imediatamente
-- Isso evita erros de 'column not found' em cache
NOTIFY pgrst, 'reload schema';

-- ############################################################
-- INSTRUÇÕES:
-- Copie este código e execute no SQL Editor do seu Dashboard Supabase.
-- Isso corrigirá o Erro de Sincronização e o Erro ao Salvar Layout Individual.
-- ############################################################

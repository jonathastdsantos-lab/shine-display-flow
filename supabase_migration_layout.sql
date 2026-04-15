-- ================================================================
-- MIGRAÇÃO: Adiciona suporte ao Editor Visual de Layout
-- Execute este script no Supabase → SQL Editor
-- ================================================================

-- 1. Adiciona a coluna layout_config caso não exista
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{}';

-- 2. Adiciona coluna widget_config caso não exista  
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT '{}';

-- 3. Remove o CHECK CONSTRAINT antigo do template (que bloqueava novos valores)
--    e recria com suporte ao modo 'custom'
DO $$ 
BEGIN
  -- Tenta remover o constraint antigo (ignora se não existir)
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_template_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Recria o constraint permitindo 'custom' e todos os templates existentes
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_template_check 
  CHECK (template IN ('corporativo', 'varejo', 'lbar', 'split', 'custom'));

-- 5. Confirma as colunas existentes na tabela profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

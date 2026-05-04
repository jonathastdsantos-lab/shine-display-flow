
-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Promote master user as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'jonathastdsantos@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. Replace hardcoded-email policies on ad_leads
DROP POLICY IF EXISTS "Owners can view their ad leads" ON public.ad_leads;
DROP POLICY IF EXISTS "Owners can update their ad leads" ON public.ad_leads;
DROP POLICY IF EXISTS "Owners can delete their ad leads" ON public.ad_leads;

CREATE POLICY "Owners can view their ad leads" ON public.ad_leads
FOR SELECT USING (
  auth.uid() = client_id
  OR public.has_role(auth.uid(), 'admin')
  OR client_id IS NULL
);

CREATE POLICY "Owners can update their ad leads" ON public.ad_leads
FOR UPDATE USING (
  auth.uid() = client_id OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can delete their ad leads" ON public.ad_leads
FOR DELETE USING (
  auth.uid() = client_id OR public.has_role(auth.uid(), 'admin')
);

-- 4. Replace scenarios admin policy
DROP POLICY IF EXISTS "Admins can manage scenarios" ON public.scenarios;
CREATE POLICY "Admins can manage scenarios" ON public.scenarios
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Fix play_logs RLS: allow public insert when playlist exists, owner can view their own
DROP POLICY IF EXISTS "Clients can view own play logs" ON public.play_logs;
DROP POLICY IF EXISTS "Players can insert own play logs" ON public.play_logs;

CREATE POLICY "Anyone can insert play logs for valid playlist" ON public.play_logs
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = play_logs.player_id)
);

CREATE POLICY "Owners view their playlist logs" ON public.play_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE id = play_logs.player_id
    AND (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- 6. Update DB functions to use has_role instead of hardcoded email
CREATE OR REPLACE FUNCTION public.create_client_user(p_email text, p_password text, p_name text, p_template text DEFAULT 'corporativo'::text, p_plan text DEFAULT 'Basic'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado. Somente administradores podem criar clientes.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'E-mail % já está cadastrado na plataforma.', p_email;
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    role, aud, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data
  ) VALUES (
    v_user_id, p_email, v_encrypted_password, NOW(),
    'authenticated', 'authenticated', NOW(), NOW(),
    jsonb_build_object('nome_empresa', p_name),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'])
  );

  INSERT INTO public.profiles (user_id, nome_empresa, template, config_clima, config_noticias)
  VALUES (v_user_id, p_name, p_template, 'São Paulo', 'technology')
  ON CONFLICT (user_id) DO UPDATE SET nome_empresa = EXCLUDED.nome_empresa, template = EXCLUDED.template;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'message', 'Cliente ' || p_name || ' criado com sucesso!');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_client_user(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  DELETE FROM public.profiles WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'message', 'Usuário excluído permanentemente.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_client_password(p_user_id uuid, p_new_password text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth', 'extensions'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = NOW()
  WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada com sucesso.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

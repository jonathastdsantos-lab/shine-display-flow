import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar que o request vem de um usuário autenticado (o developer master)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autorização." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente com SERVICE ROLE para poder criar usuários admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar que o chamador é o developer master
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: { user: callerUser }, error: callerError } = await supabaseAnon.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Token inválido." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apenas o developer master pode criar usuários
    if (callerUser.email !== "jonathastdsantos@gmail.com") {
      return new Response(JSON.stringify({ error: "Acesso negado. Somente o master pode criar clientes." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { name, email, password, plan, template } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "Nome, e-mail e senha são obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Criar o usuário no Supabase Auth com email_confirm: true (confirmar imediatamente)
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirma o email automaticamente (sem precisar clicar em link)
      user_metadata: { nome_empresa: name },
    });

    if (createError) {
      // Verificar se é duplicata
      if (createError.message.includes("already") || createError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: `E-mail ${email} já está cadastrado na plataforma.` }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createError;
    }

    const newUserId = newUserData.user?.id;
    if (!newUserId) throw new Error("Usuário criado mas sem ID retornado.");

    // 2. Criar o profile do cliente na tabela profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: newUserId,
        nome_empresa: name,
        template: template || "corporativo",
        config_clima: "São Paulo",
        config_noticias: "technology",
      });

    if (profileError) {
      console.error("Erro ao criar profile:", profileError);
      // Não falha — o usuário foi criado, o profile pode ser criado depois pelo trigger
    }

    // 3. Enviar e-mail com as credenciais de acesso usando o Supabase Mailer
    // (O Supabase já envia um e-mail de boas-vindas quando email_confirm: true)
    // Mas adicionalmente enviamos um e-mail customizado com a senha temporária
    try {
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || "https://ebmopkmqutxycitqtbuz.supabase.co"}/login`,
        },
      });
    } catch {
      // O link de acesso é opcional — não falha se não funcionar
      console.log("Link de acesso não gerado (opcional).");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: `Cliente "${name}" criado com sucesso! Login: ${email}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na Edge Function create-client:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

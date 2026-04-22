import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, CheckCircle2, Tv2, Users, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { z } from "zod";

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  empresa: z.string().trim().max(120).optional().or(z.literal("")),
  telefone: z.string().trim().min(8, "Telefone inválido").max(30),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  mensagem: z.string().trim().max(1000).optional().or(z.literal("")),
});

export default function Anuncie() {
  const [params] = useSearchParams();
  const { toast } = useToast();
  const playlistId = params.get("tela");
  const clientHint = params.get("c");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    telefone: "",
    email: "",
    mensagem: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: "Verifique os dados", description: first.message, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ad_leads").insert({
        nome: parsed.data.nome,
        empresa: parsed.data.empresa || null,
        telefone: parsed.data.telefone,
        email: parsed.data.email || null,
        mensagem: parsed.data.mensagem || null,
        playlist_id: playlistId || null,
        client_id: clientHint || null,
        source: playlistId ? "qr_tela" : "landing",
      });

      if (error) throw error;
      setDone(true);
      toast({ title: "✅ Recebemos seu pedido!", description: "Entraremos em contato em breve." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message || "Tente novamente em instantes", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0D14] via-[#0F1320] to-[#0A0D14] text-white">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Espaço publicitário
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Anuncie nas telas <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              que todo mundo vê
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-8">
            Sua marca em destaque nos estabelecimentos da região. 
            Alcance pessoas reais, no momento certo, com impacto visual de alta performance.
          </p>
          <a href="#formulario">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2 h-14 px-8 text-base shadow-lg shadow-amber-500/20">
              Quero anunciar agora <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </div>
      </header>

      {/* BENEFÍCIOS */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: Tv2, title: "Tela em alta resolução", desc: "Sua arte exibida com qualidade impecável durante todo o expediente." },
          { icon: Users, title: "Audiência cativa", desc: "Pessoas em momento de espera, prontas para receber sua mensagem." },
          { icon: MapPin, title: "Localização estratégica", desc: "Estabelecimentos selecionados em pontos de alto fluxo." },
        ].map((b, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <b.icon className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">{b.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </section>

      {/* FORMULÁRIO */}
      <section id="formulario" className="max-w-3xl mx-auto px-6 pb-24">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-8 md:p-10">
            {done ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black">Pedido recebido!</h2>
                <p className="text-white/70 max-w-md mx-auto">
                  Nossa equipe entrará em contato em até <strong>24 horas</strong> para apresentar os planos disponíveis.
                </p>
                <Button onClick={() => { setDone(false); setForm({ nome: "", empresa: "", telefone: "", email: "", mensagem: "" }); }} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Enviar outro pedido
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Megaphone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Fale com a gente</h2>
                    <p className="text-xs text-white/60">Preencha e nosso time retorna rapidinho</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest font-bold text-white/60">Nome *</Label>
                      <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="Seu nome" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest font-bold text-white/60">Empresa</Label>
                      <Input value={form.empresa} onChange={(e) => update("empresa", e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="Nome da empresa" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest font-bold text-white/60">Telefone / WhatsApp *</Label>
                      <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="(11) 90000-0000" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest font-bold text-white/60">E-mail</Label>
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="seu@email.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-widest font-bold text-white/60">Mensagem</Label>
                    <Textarea value={form.mensagem} onChange={(e) => update("mensagem", e.target.value)} className="bg-white/5 border-white/10 text-white min-h-24" placeholder="Conte um pouco sobre o que quer anunciar..." />
                  </div>
                  <Button type="submit" size="lg" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 gap-2">
                    {submitting ? "Enviando..." : "Enviar pedido"} <ArrowRight className="w-4 h-4" />
                  </Button>
                  {playlistId && (
                    <p className="text-[10px] text-center text-white/40 uppercase tracking-widest">
                      Origem: tela {playlistId.slice(0, 8)}
                    </p>
                  )}
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-xs text-white/40">
          <Link to="/" className="hover:text-white/70 transition-colors">← voltar ao início</Link>
        </div>
      </section>
    </div>
  );
}

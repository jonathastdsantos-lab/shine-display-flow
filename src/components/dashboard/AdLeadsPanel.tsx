import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Phone, Mail, MessageSquare, Trash2, Calendar, Building2, ExternalLink, Copy, RefreshCw, Download } from "lucide-react";

interface AdLead {
  id: string;
  nome: string;
  empresa: string | null;
  telefone: string;
  email: string | null;
  mensagem: string | null;
  status: string;
  source: string | null;
  playlist_id: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  novo: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  contatado: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  fechado: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

export default function AdLeadsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<AdLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ad_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar leads", description: error.message, variant: "destructive" });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Realtime: novos leads aparecem instantaneamente
  useEffect(() => {
    const channel = supabase
      .channel("ad_leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_leads" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("ad_leads").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const removeLead = async (id: string) => {
    if (!confirm("Excluir este lead permanentemente?")) return;
    const { error } = await (supabase as any).from("ad_leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Lead excluído" });
    }
  };

  const openWhatsApp = (telefone: string, nome: string) => {
    const cleaned = telefone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${nome}, recebemos seu pedido para anunciar em nossas telas!`);
    window.open(`https://wa.me/55${cleaned}?text=${msg}`, "_blank");
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const counts = {
    novo: leads.filter((l) => l.status === "novo").length,
    contatado: leads.filter((l) => l.status === "contatado").length,
    fechado: leads.filter((l) => l.status === "fechado").length,
  };

  const landingUrl = `${window.location.origin}/anuncie`;
  const copyLanding = () => {
    navigator.clipboard.writeText(landingUrl);
    toast({ title: "Link copiado!", description: "Compartilhe para captar mais anunciantes." });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Megaphone className="w-6 h-6 text-amber-500" />
            </div>
            Leads de Anúncios
          </h2>
          <p className="text-muted-foreground mt-1">
            Pessoas interessadas em comprar espaço publicitário nas suas telas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLanding} className="gap-2">
            <Copy className="w-4 h-4" /> Link público
          </Button>
          <Button variant="outline" onClick={() => window.open(landingUrl, "_blank")} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Abrir página
          </Button>
          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: leads.length, key: "all", color: "bg-foreground/5 text-foreground" },
          { label: "Novos", value: counts.novo, key: "novo", color: "bg-amber-500/10 text-amber-500" },
          { label: "Contatados", value: counts.contatado, key: "contatado", color: "bg-indigo-500/10 text-indigo-500" },
          { label: "Fechados", value: counts.fechado, key: "fechado", color: "bg-emerald-500/10 text-emerald-500" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              filter === s.key ? "border-foreground/30 shadow-md" : "border-border/50 hover:border-foreground/20"
            } ${s.color}`}
          >
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">{s.label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid gap-3">
        {loading && leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
            <Megaphone className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-bold text-lg text-foreground/70">Nenhum lead {filter !== "all" ? `com status "${filter}"` : "ainda"}</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 text-center">
              Quando alguém escanear o QR "Anuncie Aqui" nas telas ou preencher a página pública, aparecerá aqui em tempo real.
            </p>
          </div>
        ) : (
          filtered.map((lead) => (
            <Card key={lead.id} className="hover:border-amber-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-base">{lead.nome}</h3>
                      <Badge className={statusColors[lead.status] || statusColors.novo}>
                        {lead.status}
                      </Badge>
                      {lead.source === "qr_tela" && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">
                          via QR da tela
                        </Badge>
                      )}
                    </div>
                    {lead.empresa && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> {lead.empresa}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <a href={`tel:${lead.telefone}`} className="flex items-center gap-1.5 text-foreground hover:text-amber-500 transition-colors">
                        <Phone className="w-3.5 h-3.5" /> {lead.telefone}
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-foreground hover:text-amber-500 transition-colors">
                          <Mail className="w-3.5 h-3.5" /> {lead.email}
                        </a>
                      )}
                    </div>
                    {lead.mensagem && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg mt-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <p className="leading-relaxed">{lead.mensagem}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold mt-2">
                      <Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button onClick={() => openWhatsApp(lead.telefone, lead.nome)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 gap-2">
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </Button>
                    <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                      <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="contatado">Contatado</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeLead(lead.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

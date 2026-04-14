import { useState, useRef, useEffect } from "react";
import { Search, Settings2, ShieldCheck, Power, RefreshCw, Smartphone, Monitor as MonitorIcon, Plus, LayoutTemplate, LayoutGrid, Wand2, ArrowRight, Play, CheckCircle2, Image as ImageIcon, Upload, Film, DollarSign, Clock, MonitorPlay } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// Dados mockados para protótipo
const INITIAL_CLIENTS = [
  { id: 1, name: "Academia Fitness Pro", email: "contato@fitnesspro.com.br", status: "active", plan: "Premium", devices: 4, type: "Fitness" },
  { id: 2, name: "Supermercado Compre Bem", email: "gerencia@comprebem.com", status: "active", plan: "Enterprise", devices: 12, type: "Retail" },
  { id: 3, name: "Clínica Vida Saudável", email: "admin@vidasaudavel.med", status: "inactive", plan: "Basic", devices: 1, type: "Health" },
  { id: 4, name: "Pizzaria Napoli", email: "pedidos@napoli.com", status: "active", plan: "Basic", devices: 2, type: "Restaurant" },
  { id: 5, name: "Colégio Futuro", email: "ti@colegiofuturo.edu.br", status: "warning", plan: "Pro", devices: 8, type: "Education" },
];

export function ClientManager() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create Client State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", email: "", password: "", plan: "Basic", template: "corporativo" });
  const [creating, setCreating] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState("full");
  
  // Custom Broadcaster States
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [adInterval, setAdInterval] = useState("10"); // a cada 10 min
  const [adDuration, setAdDuration] = useState("15"); // 15 segs
  const [adPreviewFileUrl, setAdPreviewFileUrl] = useState<string | null>(null);
  const [adPreviewIsVideo, setAdPreviewIsVideo] = useState(false);

  const loadClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (data && data.length > 0) {
      const mapped = data.map(p => ({
        id: p.user_id,
        name: (p as any).nome_empresa || 'Empresa em Implantação',
        email: (p as any).email_contact || '—',
        status: 'active',
        plan: (p as any).plan || 'Basic',
        devices: 1,
        template: (p as any).template || 'corporativo',
        type: (p as any).template === 'corporativo' ? 'Corporativo' : (p as any).template === 'varejo' ? 'Varejo' : 'Geral',
        last_seen: (p as any).last_seen || null,
      }));
      setClients(mapped);
    } else {
      setClients(INITIAL_CLIENTS);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleForceUpdate = () => {
    toast.success(`Comando de atualização forçada enviado para as telas de ${selectedClient?.name}`);
  };

  const handleSaveScenario = () => {
    toast.success(`Cenário de configuração salvo para ${selectedClient?.name}`);
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`TEM CERTEZA? Isso excluirá permanentemente o cliente "${name}" e todos os seus arquivos.`)) return;
    
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("delete_client_user", { p_user_id: id });
      const result = data as any;
      
      if (error || !result?.success) {
        toast.error(`Erro ao excluir: ${result?.error || error?.message}`);
      } else {
        toast.success("Cliente removido com sucesso!");
        setSelectedClient(null);
        await loadClients();
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePassword = async (id: string) => {
    const newPass = prompt("Digite a nova senha para este cliente (mín. 6 caracteres):");
    if (!newPass) return;
    if (newPass.length < 6) return toast.error("Senha muito curta.");

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("update_client_password", { 
        p_user_id: id, 
        p_new_password: newPass 
      });
      const result = data as any;
      
      if (error || !result?.success) {
        toast.error(`Erro: ${result?.error || error?.message}`);
      } else {
        toast.success("A senha do cliente foi alterada com sucesso!");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.name || !newClientData.email || !newClientData.password) {
      toast.error("Preencha nome, e-mail e senha temporária.");
      return;
    }
    if (newClientData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCreating(true);
    toast.info("Criando conta no Supabase...");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Chama a PostgreSQL Function via RPC (sem necessidade de Edge Function)
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_client_user", {
        p_email:    newClientData.email,
        p_password: newClientData.password,
        p_name:     newClientData.name,
        p_template: newClientData.template,
        p_plan:     newClientData.plan,
      });

      if (rpcError) {
        toast.error(`Falha ao criar cliente: ${rpcError.message}`);
        return;
      }

      const result = rpcData as { success: boolean; error?: string; message?: string; user_id?: string };

      if (!result?.success) {
        toast.error(`Falha: ${result?.error || "Erro desconhecido."}`);
        return;
      }

      toast.success(`✅ Cliente "${newClientData.name}" criado com sucesso!`, { duration: 6000 });
      toast.success(`📧 Login: ${newClientData.email} | 🔑 Acesso imediato disponível.`, { duration: 8000 });

      setNewClientData({ name: "", email: "", password: "", plan: "Basic", template: "corporativo" });
      setIsCreateOpen(false);
      await loadClients();
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Estabelecimentos Cadastrados</h3>
          <p className="text-sm text-muted-foreground">Gerencie todos os clientes da plataforma</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shrink-0 gap-2">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 grid gap-3">
          {filteredClients.map(client => (
            <Card 
              key={client.id} 
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-500/50 transition-colors cursor-pointer group"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <MonitorIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{client.name}</h4>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto">
                <div className="flex flex-col items-start sm:items-end text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> {client.devices} Telas conectadas
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Plano {client.plan}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <Badge variant={client.status === "active" ? "default" : client.status === "warning" ? "secondary" : "destructive"}>
                    {client.status === "active" ? "Ativo" : client.status === "warning" ? "Alerta" : "Inativo"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-indigo-500">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum estabelecimento encontrado.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* MODAL CRIAR CLIENTE */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!creating) setIsCreateOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>
              A conta será criada diretamente no Supabase Auth com e-mail confirmado e acesso imediato.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                placeholder="Ex: Padaria Do Lado"
                value={newClientData.name}
                onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                disabled={creating}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail de Acesso *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                value={newClientData.email}
                onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                disabled={creating}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha Temporária * (mín. 6 caracteres)</Label>
              <Input
                id="password"
                type="text"
                placeholder="Ex: Signage@2026"
                value={newClientData.password}
                onChange={e => setNewClientData({ ...newClientData, password: e.target.value })}
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground">A senha é definida diretamente — o cliente pode usar imediatamente para fazer login.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Plano</Label>
                <Select
                  value={newClientData.plan}
                  onValueChange={val => setNewClientData({ ...newClientData, plan: val })}
                  disabled={creating}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic (2 telas)</SelectItem>
                    <SelectItem value="Pro">Pro (5 telas)</SelectItem>
                    <SelectItem value="Premium">Premium (15 telas)</SelectItem>
                    <SelectItem value="Enterprise">Enterprise (Ilimitado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Template Inicial</Label>
                <Select
                  value={newClientData.template}
                  onValueChange={val => setNewClientData({ ...newClientData, template: val })}
                  disabled={creating}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporativo">🏢 Corporativo</SelectItem>
                    <SelectItem value="varejo">🛒 Varejo</SelectItem>
                    <SelectItem value="lbar">🥐 L-Bar</SelectItem>
                    <SelectItem value="split">🏋️ Split 60/40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
              <span className="text-emerald-400 text-lg mt-0.5">✅</span>
              <div>
                <p className="font-semibold text-emerald-300">Criação via Admin API</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  O usuário será criado com e-mail confirmado automaticamente via <code className="bg-black/20 px-1 rounded">supabase.auth.admin.createUser</code>. O cliente pode fazer login imediatamente em <strong>/login</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={creating}>Cancelar</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]"
              onClick={handleCreateClient}
              disabled={creating}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : "Registrar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DRAWER DO CLIENTE (COM TABS) */}
      <Sheet open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0 flex flex-col">
          <div className="p-6 pb-2 border-b">
            <SheetHeader className="mb-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                  <MonitorIcon className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Gestão Mestre do Cliente</SheetTitle>
                  <SheetDescription className="truncate max-w-sm">
                    Modificando o ambiente remoto de <strong className="text-foreground">{selectedClient?.name}</strong>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
            <Tabs defaultValue="configs" className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 py-0 h-12 overflow-x-auto shrink-0 space-x-4">
                <TabsTrigger value="configs" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none bg-transparent">
                  <Settings2 className="w-4 h-4 mr-2" /> Configurações Base
                </TabsTrigger>
                <TabsTrigger value="editor" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none bg-transparent">
                  <LayoutGrid className="w-4 h-4 mr-2" /> Editor Remoto
                </TabsTrigger>
                <TabsTrigger value="ai" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none bg-transparent text-amber-600 data-[state=active]:text-amber-600 data-[state=active]:border-amber-500">
                  <Wand2 className="w-4 h-4 mr-2" /> Assistente IA
                </TabsTrigger>
                <TabsTrigger value="admin" className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none bg-transparent text-red-500">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Administração
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 p-6">
                
                {/* ABA 1: CONFIGURAÇÕES BASE */}
                <TabsContent value="configs" className="mt-0 space-y-6 outline-none">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Status da Conta</p>
                      <p className="text-lg font-bold flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedClient?.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {selectedClient?.status === "active" ? "Ativo" : "Bloqueado"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Plano Atual</p>
                      <p className="text-lg font-bold text-indigo-500">{selectedClient?.plan}</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Power className="w-4 h-4" /> Controles de Firmware
                    </h4>
                    <div className="p-4 border rounded-lg bg-card flex items-center justify-between">
                      <div>
                        <Label className="text-base">Forçar Refresh nos Players</Label>
                        <p className="text-sm text-muted-foreground">Obriga os hardwares a limparem cache e baixarem nova playlist.</p>
                      </div>
                      <Button onClick={handleForceUpdate} variant="secondary" className="gap-2 shrink-0">
                        <RefreshCw className="h-4 w-4" /> Atualizar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Retrições & Regras</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50 rounded-lg">
                        <div><Label className="font-medium">Limitar Tamanho de Upload</Label></div>
                        <Select defaultValue="50mb">
                          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10mb">10 MB</SelectItem>
                            <SelectItem value="50mb">50 MB</SelectItem>
                            <SelectItem value="unlimited">Ilimitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50 rounded-lg">
                        <div>
                          <Label className="font-medium">Habilitar Previsão do Tempo</Label>
                          <p className="text-xs text-muted-foreground">Permite rodar widget de clima.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 flex justify-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveScenario}>Salvar Variáveis</Button>
                  </div>
                </TabsContent>

                {/* ABA 2: EDITOR REMOTO (ZONE LAYOUTS & AD NETWORK) */}
                <TabsContent value="editor" className="mt-0 space-y-8 outline-none">
                  
                  {/* LIVE PREVIEW HERO */}
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl overflow-hidden p-6 mb-8 text-center flex flex-col items-center shadow-inner">
                     <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-400">
                       <MonitorPlay className="w-5 h-5" /> Live Preview da TV
                     </h3>
                     
                     <div className="w-full max-w-lg aspect-video bg-black rounded-lg border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        {previewFileUrl ? (
                           <>
                             {previewIsVideo ? (
                               <video src={previewFileUrl} className="w-full h-full object-cover" autoPlay muted loop />
                             ) : (
                               <img src={previewFileUrl} className="w-full h-full object-cover" />
                             )}
                           </>
                        ) : (
                           <div className="text-white/30 text-sm flex flex-col items-center gap-2">
                             <Film className="w-8 h-8 opacity-50" />
                             Mídia Nativa do Cliente Rodando...
                           </div>
                        )}

                        {/* Layout Mockups over the preview */}
                        {selectedLayout === 'sidebar' && !previewFileUrl && (
                           <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-black/60 border-l border-white/10 backdrop-blur-md flex flex-col p-2 gap-2">
                             <div className="h-10 bg-white/5 rounded"></div>
                             <div className="flex-1 bg-white/5 rounded flex items-center justify-center text-[10px] text-white/50">WIDGETS</div>
                           </div>
                        )}
                        {selectedLayout === 'footer' && !previewFileUrl && (
                           <div className="absolute left-0 right-0 bottom-0 h-[20%] bg-blue-600/90 flex flex-col p-2 border-t border-white/20">
                             <span className="text-[8px] uppercase tracking-widest text-white/80 font-bold items-center flex h-full">TICKER ATIVO DE NOTÍCIAS...</span>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* COLUNA ESQUERDA: LAYOUT E INJEÇÃO */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                          <LayoutTemplate className="h-5 w-5 text-indigo-500" /> Malha de Apresentação
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Force o modo de divisão de tela.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div 
                            className={`border-2 rounded-xl p-3 cursor-pointer relative transition-all ${selectedLayout === 'full' ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-transparent hover:border-border bg-card'}`}
                            onClick={() => setSelectedLayout('full')}
                          >
                            <span className="font-medium text-xs block text-center mt-1">Tela Cheia</span>
                          </div>
                          
                          <div 
                            className={`border-2 rounded-xl p-3 cursor-pointer relative transition-all ${selectedLayout === 'sidebar' ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-transparent hover:border-border bg-card'}`}
                            onClick={() => setSelectedLayout('sidebar')}
                          >
                            <span className="font-medium text-xs block text-center mt-1">Sidebar Dir.</span>
                          </div>

                          <div 
                            className={`border-2 rounded-xl p-3 cursor-pointer relative transition-all ${selectedLayout === 'footer' ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-transparent hover:border-border bg-card'}`}
                            onClick={() => setSelectedLayout('footer')}
                          >
                            <span className="font-medium text-xs block text-center mt-1">Footer Ativo</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <Upload className="h-5 w-5 text-indigo-500" /> Injeção de Mídia Master
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">Empurre vídeos ou imagens da sua máquina.</p>
                        
                        <div 
                          className="border-2 border-dashed border-indigo-500/30 rounded-xl p-6 text-center hover:bg-indigo-500/5 transition-colors cursor-pointer group mb-4"
                          onClick={() => document.getElementById('master-upload')?.click()}
                        >
                          <input 
                            type="file" 
                            id="master-upload" 
                            className="hidden" 
                            accept="video/*,image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if(file) {
                                setPreviewFileUrl(URL.createObjectURL(file));
                                setPreviewIsVideo(file.type.startsWith('video/'));
                                toast.success("Mídia carregada no Live Preview!");
                              }
                            }}
                          />
                          <Film className="w-8 h-8 mx-auto text-indigo-500/50 mb-2 group-hover:scale-110 transition-transform" />
                          <h4 className="font-bold text-sm">Clique ou Arraste o Arquivo</h4>
                          <p className="text-xs text-muted-foreground mt-1">MP4, WebM ou JPG/PNG (Máx 200MB)</p>
                        </div>

                        {previewFileUrl && (
                          <Button variant="destructive" size="sm" onClick={() => setPreviewFileUrl(null)} className="w-full">
                            Remover Mídia Master
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* COLUNA DIREITA: AD NETWORK */}
                    <div className="space-y-6 bg-emerald-950/10 border border-emerald-500/20 p-5 rounded-xl shadow-inner">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="h-5 w-5" /> Ad Network (Patrocínio)
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Programe interrupções publicitárias Full Screen no meio do conteúdo original deste cliente para rentabilizar a tela.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                           <Label>Marca Patrocinadora (Ref)</Label>
                           <Input placeholder="Ex: Coca-Cola, Prefeitura Local" />
                        </div>
                        
                        <div className="grid gap-2">
                           <Label>Upload da Publicidade Full Screen</Label>
                           <div 
                             className="border-2 border-dashed border-emerald-500/30 rounded-lg p-3 text-center hover:bg-emerald-500/5 transition-colors cursor-pointer group"
                             onClick={() => document.getElementById('ad-upload')?.click()}
                           >
                             <input 
                               type="file" 
                               id="ad-upload" 
                               className="hidden" 
                               accept="video/*,image/*" 
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if(file) {
                                   setAdPreviewFileUrl(URL.createObjectURL(file));
                                   setAdPreviewIsVideo(file.type.startsWith('video/'));
                                   toast.success("Publicidade carregada na Ad Network!");
                                 }
                               }}
                             />
                             <Upload className="w-5 h-5 mx-auto text-emerald-500/50 mb-1 group-hover:scale-110 transition-transform" />
                             <h4 className="font-bold text-xs">Anexar Propaganda</h4>
                           </div>
                           {adPreviewFileUrl && (
                             <div className="w-full bg-black rounded border border-emerald-500/30 overflow-hidden aspect-video relative">
                               {adPreviewIsVideo ? (
                                 <video src={adPreviewFileUrl} className="w-full h-full object-cover" autoPlay muted loop />
                               ) : (
                                 <img src={adPreviewFileUrl} className="w-full h-full object-cover" />
                               )}
                               <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setAdPreviewFileUrl(null)}>
                                 <span className="text-[10px]">X</span>
                               </Button>
                             </div>
                           )}
                        </div>
                        <div className="grid gap-2">
                           <Label>Frequência Crítica da Interrupção</Label>
                           <Select value={adInterval} onValueChange={setAdInterval}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="2">Atrito Máximo (A cada 2 vídeos)</SelectItem>
                               <SelectItem value="5">Padrão (A cada 5 vídeos rodados)</SelectItem>
                               <SelectItem value="10">Econômico (A cada 10 vídeos)</SelectItem>
                               <SelectItem value="time15">Por Relógio (A cada 15 Minutos)</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="grid gap-2">
                           <Label>Janela Protegida do Anúncio</Label>
                           <Select value={adDuration} onValueChange={setAdDuration}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="15">15 Segundos Inderbávei</SelectItem>
                               <SelectItem value="30">30 Segundos</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>

                        <div className="flex justify-between items-center bg-background border p-3 rounded-lg shadow-sm">
                           <div>
                             <Label className="font-bold text-emerald-600 dark:text-emerald-400">Forçar Ativação</Label>
                             <p className="text-[10px] text-muted-foreground">O anúncio enviado no bloco de injeção tomará conta da tela.</p>
                           </div>
                           <Switch />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t mt-8">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg shadow-lg shadow-indigo-500/20" 
                      onClick={() => toast.success("Pacote de Injeção e Campanhas de Anúncio transferidos na Nuvem!")}
                    >
                      Disparar Configurações Remotas
                    </Button>
                  </div>
                </TabsContent>

                {/* ABA 3: ASSISTENTE IA */}
                <TabsContent value="ai" className="mt-0 space-y-6 outline-none">
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-6 rounded-xl border border-amber-500/20 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20 text-white shrink-0">
                        <Wand2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">Inteligente & Dedutivo</h2>
                        <p className="text-sm text-foreground/80 mt-1">
                          A IA Mestre avaliou as métricas e o ramo de negócio deste cliente (<strong>{selectedClient?.type || 'Comércio'}</strong>) e construiu um pacote perfeito para reter atenção.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <div>
                          <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10 mb-2">Sugestão de Template</Badge>
                          <h4 className="font-semibold text-lg">Pacote "{selectedClient?.type || 'Comércio'} Dinâmico"</h4>
                        </div>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Aplicar Pacote
                        </Button>
                      </div>
                      <div className="p-6 pb-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Esta arquitetura mescla imagens estáticas fatiadas com um ticker de leitura rápida na base. É ideal para divulgar promoções curtas acompanhadas de uma vitrine atrativa.
                        </p>
                        
                        <div className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-amber-500/20 mx-auto aspect-video mb-4 relative shadow-sm">
                          {/* Mock UI for TV */}
                          <div className="absolute inset-0 flex bg-slate-900 text-white">
                             <div className="flex-1 flex flex-col justify-center items-center h-full pb-8">
                                <Play className="w-12 h-12 opacity-50 mb-2" />
                                <span className="text-xs font-bold tracking-widest opacity-50">PROMO MÍDIA</span>
                             </div>
                             <div className="w-[30%] bg-slate-800 border-l border-slate-700 p-2 flex flex-col gap-2">
                                <div className="h-10 bg-slate-700 rounded w-full"></div>
                                <div className="flex-1 bg-slate-700 rounded w-full flex items-center justify-center text-xs opacity-50">MENU</div>
                             </div>
                             <div className="absolute bottom-0 w-full h-8 bg-amber-500 overflow-hidden flex items-center px-2">
                               <span className="text-xs font-bold text-black font-mono">📢 MEGA OFERTA: 30% OFF EM...</span>
                             </div>
                          </div>
                        </div>

                        <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/10 mt-6">
                          <Label className="text-amber-700 dark:text-amber-500 mb-2 block font-medium">Por que escolher este layout?</Label>
                          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                            <li>Deixa uma zona separada constante para avisos importantes.</li>
                            <li>Aumenta em 40% a retenção dos clientes olhando para o rodapé rotativo.</li>
                            <li>Integra automaticamente a temperatura local.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                </TabsContent>

                {/* ABA 4: ADMINISTRAÇÃO (PERIGOSA) */}
                <TabsContent value="admin" className="mt-0 space-y-6 outline-none">
                  <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl space-y-4">
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5" /> Zona de Gestão Master
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Estas ações afetam diretamente a autenticação e persistência do cliente no sistema.
                    </p>

                    <div className="pt-4 grid gap-3">
                      <div className="p-4 border border-red-500/10 rounded-lg bg-card/50 flex flex-col gap-3">
                        <div>
                          <Label className="text-base font-bold">Alterar Senha de Acesso</Label>
                          <p className="text-xs text-muted-foreground">Define uma nova senha para o cliente imediatamente. Útil para recuperação manual.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full border-red-500/20 hover:bg-red-500/5"
                          onClick={() => handleUpdatePassword(selectedClient.id)}
                          disabled={creating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Redefinir Senha do Cliente
                        </Button>
                      </div>

                      <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5 flex flex-col gap-3">
                        <div>
                          <Label className="text-base font-bold text-red-600">Excluir Estabelecimento</Label>
                          <p className="text-xs text-muted-foreground">Remove o usuário da autenticação, limpa o profile e todas as configurações de tela. Esta ação é IRREVERSÍVEL.</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => handleDeleteClient(selectedClient.id, selectedClient.name)}
                          disabled={creating}
                        >
                          <Plus className="w-4 h-4 mr-2 rotate-45" /> Excluir Cliente Permanentemente
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Smartphone, LayoutGrid, Check, Wand2, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Scenario {
  id: string;
  label: string;
  emoji: string;
  description: string;
  template: string;
  color: string;
  gradient: string;
  shadow_color: string;
  tags: string[];
  config: any;
  widgets: string[];
  preview: any;
  is_global: boolean;
  client_id?: string;
}

interface ScenarioManagerProps {
  clientId?: string;
  isGlobalOnly?: boolean;
}

export function ScenarioManager({ clientId, isGlobalOnly = false }: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  
  const [formData, setFormData] = useState<Partial<Scenario>>({
    label: "",
    emoji: "🚀",
    description: "",
    template: "corporativo",
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-violet-500/10",
    shadow_color: "shadow-indigo-500/20",
    tags: [],
    widgets: [],
    is_global: isGlobalOnly,
    config: {},
    preview: { zones: [] }
  });

  const loadScenarios = async () => {
    setLoading(true);
    let query = supabase.from("scenarios").select("*");
    
    if (clientId) {
      query = query.or(`client_id.eq.${clientId},is_global.eq.true`);
    } else if (isGlobalOnly) {
      query = query.eq("is_global", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erro ao carregar cenários");
    } else {
      setScenarios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScenarios();
  }, [clientId]);

  const handleSave = async () => {
    if (!formData.label) return toast.error("O nome é obrigatório");

    const dataToSave = {
      ...formData,
      client_id: clientId || null,
      is_global: isGlobalOnly ? true : (formData.is_global || false)
    };

    let error;
    if (editingScenario) {
      const { error: err } = await supabase
        .from("scenarios")
        .update(dataToSave)
        .eq("id", editingScenario.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("scenarios")
        .insert([dataToSave]);
      error = err;
    }

    if (error) {
      toast.error("Erro ao salvar cenário");
    } else {
      toast.success("Cenário salvo com sucesso!");
      setIsDialogOpen(false);
      setEditingScenario(null);
      loadScenarios();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cenário?")) return;
    
    const { error } = await supabase.from("scenarios").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir cenário");
    } else {
      toast.success("Cenário excluído");
      loadScenarios();
    }
  };

  const openEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setFormData(scenario);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingScenario(null);
    setFormData({
      label: "",
      emoji: "🚀",
      description: "",
      template: "corporativo",
      color: "text-indigo-400",
      gradient: "from-indigo-500/20 to-violet-500/10",
      shadow_color: "shadow-indigo-500/20",
      tags: [],
      widgets: [],
      is_global: isGlobalOnly,
      config: {},
      preview: { zones: [] }
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Cenários Customizados
          </h3>
          <p className="text-sm text-muted-foreground">
            {clientId ? "Cenários exclusivos para este cliente" : "Gerenciador de templates globais"}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus className="w-4 h-4" /> Novo Cenário
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10">Carregando cenários...</div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Nenhum cenário encontrado.</div>
        ) : (
          scenarios.map((scenario) => (
            <Card key={scenario.id} className="p-4 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{scenario.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{scenario.label}</h4>
                    {scenario.is_global && <Badge variant="secondary" className="text-[9px]">Global</Badge>}
                    {scenario.client_id && <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-500">Exclusivo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEdit(scenario)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(scenario.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScenario ? "Editar Cenário" : "Criar Novo Cenário"}</DialogTitle>
            <DialogDescription>
              Configure o template e comportamento deste cenário.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label>Emoji</Label>
                <Input 
                  value={formData.emoji} 
                  onChange={e => setFormData({...formData, emoji: e.target.value})}
                  className="text-2xl text-center"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label>Nome do Cenário</Label>
                <Input 
                  value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  placeholder="Ex: Farmácia 24h"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o propósito deste cenário..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Base</Label>
                <Select 
                  value={formData.template} 
                  onValueChange={val => setFormData({...formData, template: val})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporativo">Corporativo</SelectItem>
                    <SelectItem value="varejo">Varejo</SelectItem>
                    <SelectItem value="lbar">L-Bar</SelectItem>
                    <SelectItem value="split">Split 60/40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor do Texto/Badge</Label>
                <Input 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  placeholder="text-indigo-400"
                />
              </div>
            </div>

            {!isGlobalOnly && !clientId && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Disponibilidade Global</Label>
                  <p className="text-xs text-muted-foreground">Visível para todos os clientes.</p>
                </div>
                <Switch 
                  checked={formData.is_global} 
                  onCheckedChange={checked => setFormData({...formData, is_global: checked})}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              Salvar Cenário ✨
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

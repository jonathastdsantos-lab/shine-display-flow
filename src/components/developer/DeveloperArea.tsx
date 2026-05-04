import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientManager } from "./ClientManager";
import { BroadcastCenter } from "./BroadcastCenter";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate } from "react-router-dom";
import { Terminal, Users, Send } from "lucide-react";

export default function DeveloperArea() {
  const { isAdmin, loading } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("clients");

  // Security barrier (server-side via user_roles)
  if (loading) return null;
  if (!isAdmin) {
    return <Navigate to="/dashboard/media" replace />;
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Terminal className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Área do Desenvolvedor</h2>
          <p className="text-muted-foreground">Acesso restrito ao Master da Plataforma.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="clients"
            className="flex gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent px-6 py-3"
          >
            <Users className="w-4 h-4" />
            <span>Cadastro de Clientes</span>
          </TabsTrigger>
          <TabsTrigger
            value="broadcast"
            className="flex gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent px-6 py-3"
          >
            <Send className="w-4 h-4" />
            <span>Transmissão & Avisos</span>
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 mt-6 overflow-hidden">
          <TabsContent value="clients" className="h-full m-0 data-[state=active]:flex flex-col">
            <ClientManager />
          </TabsContent>
          <TabsContent value="broadcast" className="h-full m-0 data-[state=active]:flex flex-col">
            <BroadcastCenter />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

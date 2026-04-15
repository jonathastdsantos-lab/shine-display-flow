  BarChart2,
  Tv2,
  Zap,
  CheckCircle2
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Biblioteca de Mídia", url: "/dashboard/media", icon: Image },
  { title: "Playlists", url: "/dashboard/playlists", icon: ListVideo },
  { title: "Config. do Canal", url: "/dashboard/settings", icon: Settings },
  { title: "Templates & Cenários", url: "/dashboard/templates", icon: LayoutTemplate },
];

const analyticsItems = [
  { title: "Meus Dispositivos", url: "/dashboard/devices", icon: Tv2 },
  { title: "Relatórios", url: "/dashboard/reports", icon: BarChart2 },
];

import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DashboardSidebarProps {
  onSync?: () => Promise<void>;
}

export function DashboardSidebar({ onSync }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  
  const handleSyncAll = async () => {
    if (!onSync) return;
    try {
      setSyncing(true);
      await onSync();
      toast({
        title: "Telas Sincronizadas! 🚀",
        description: "Todas as suas telas ativas receberam o sinal de atualização.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na Sincronização",
        description: "Não foi possível enviar o sinal para as telas.",
      });
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };
  
  const isMaster = user?.email === "jonathastdsantos@gmail.com";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Grupo principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Logo" className={`rounded-lg shadow-sm object-contain ${collapsed ? "h-7 w-7" : "h-8 w-8"} shrink-0`} />
              {!collapsed && (
                <span className="font-bold text-sm leading-none">
                  <span className="text-emerald-500">Digital</span>
                  <span className="text-teal-500">Signage</span>
                  <span className="text-cyan-500">OS</span>
                </span>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grupo analytics / monitoring */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">
              Monitoramento
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Developer only */}
        {isMaster && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-widest text-indigo-500/60 font-bold">
                Developer
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/developer"
                      className="hover:bg-sidebar-accent/50 text-indigo-500"
                      activeClassName="bg-indigo-500/10 text-indigo-500 font-medium"
                    >
                      <Terminal className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Área Developer</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        {onSync && (
          <Button
            variant="default"
            size="sm"
            className={`w-full justify-start gap-2 bg-amber-500 hover:bg-amber-600 border-none transition-all duration-300 shadow-lg shadow-amber-500/20 mb-2 ${syncing ? 'scale-[0.98] brightness-90' : 'hover:scale-[1.02]'}`}
            onClick={handleSyncAll}
            disabled={syncing}
          >
            {syncing ? (
              <CheckCircle2 className="h-4 w-4 animate-in zoom-in duration-300" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {!collapsed && (
              <span className="font-bold tracking-tight">
                {syncing ? "Sincronizado!" : "Sincronizar Telas"}
              </span>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => navigate(`/player/${user?.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {!collapsed && "Preview Player"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

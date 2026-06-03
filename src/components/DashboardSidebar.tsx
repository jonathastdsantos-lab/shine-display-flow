import { 
  Image, 
  ListVideo, 
  Settings, 
  LayoutTemplate, 
  BarChart2, 
  Tv2, 
  Terminal, 
  Zap, 
  Eye, 
  LogOut, 
  CheckCircle2,
  Megaphone
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
import { useTranslation } from "react-i18next";

const navItems = [
  { key: "media", url: "/dashboard/media", icon: Image },
  { key: "playlists", url: "/dashboard/playlists", icon: ListVideo },
  { key: "settings", url: "/dashboard/settings", icon: Settings },
  { key: "templates", url: "/dashboard/templates", icon: LayoutTemplate },
];

const analyticsItems = [
  { key: "devices", url: "/dashboard/devices", icon: Tv2 },
  { key: "leads", url: "/dashboard/leads", icon: Megaphone },
  { key: "reports", url: "/dashboard/reports", icon: BarChart2 },
];

import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DashboardSidebarProps {
  onSync?: () => Promise<void>;
  playlists?: any[];
  selectedPlaylistId?: string | null;
}

export function DashboardSidebar({ onSync, playlists = [], selectedPlaylistId }: DashboardSidebarProps) {
  const { t } = useTranslation();
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
      console.log("📤 Enviando sinal de sincronização para todas as telas...");
      await onSync();
      toast({
        title: t("sidebar.toasts.syncSuccessTitle"),
        description: t("sidebar.toasts.syncSuccessDescription"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("sidebar.toasts.syncErrorTitle"),
        description: t("sidebar.toasts.syncErrorDescription"),
      });
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };
  
  const { isAdmin: isMaster } = useIsAdmin();

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
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(`sidebar.nav.${item.key}`)}</span>}
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
              {t("sidebar.groups.monitoring")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(`sidebar.nav.${item.key}`)}</span>}
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
                {t("sidebar.groups.developer")}
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
                      {!collapsed && <span>{t("sidebar.nav.developer")}</span>}
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
                {syncing ? t("sidebar.actions.synced") : t("sidebar.actions.syncScreens")}
              </span>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            const targetId = selectedPlaylistId || playlists[0]?.id;
            if (targetId) {
              navigate(`/player/${targetId}`);
            } else {
              toast({
                title: t("sidebar.toasts.noScreensTitle"),
                description: t("sidebar.toasts.noScreensDescription"),
                variant: "destructive"
              });
            }
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          {!collapsed && t("sidebar.actions.previewPlayer")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && t("sidebar.actions.logout")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

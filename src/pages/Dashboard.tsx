import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useSelectedPlaylist } from "@/hooks/useSelectedPlaylist";
import MediaLibrary from "@/components/dashboard/MediaLibrary";
import PlaylistManager from "@/components/dashboard/PlaylistManager";
import ChannelSettings from "@/components/dashboard/ChannelSettings";
import TemplateSelector from "@/components/dashboard/TemplateSelector";
import DeviceMonitor from "@/components/dashboard/DeviceMonitor";
import ReportsPanel from "@/components/dashboard/ReportsPanel";
import AdLeadsPanel from "@/components/dashboard/AdLeadsPanel";
import DeveloperArea from "@/components/developer/DeveloperArea";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const data = useDashboardData();
  const { selectedPlaylistId, setSelectedPlaylistId } = useSelectedPlaylist(
    data.playlists,
    data.playlistsLoaded
  );

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  const selectedPlaylist = data.playlists.find(p => p.id === selectedPlaylistId);
  
  // Objeto de configuração para os editores: usa a tela selecionada ou o perfil global
  const activeConfig = selectedPlaylist ? {
    ...data.profile,
    config_clima: selectedPlaylist.config_clima || data.profile.config_clima,
    config_noticias: selectedPlaylist.config_noticias || data.profile.config_noticias,
    template: selectedPlaylist.template || data.profile.template,
    instagram_handle: selectedPlaylist.instagram_handle || data.profile.instagram_handle,
    widget_config: selectedPlaylist.widget_config || data.profile.widget_config,
    layout_config: selectedPlaylist.layout_config || data.profile.layout_config,
    nome_empresa: selectedPlaylist.nome_da_tela || data.profile.nome_empresa,
  } : data.profile;

  const handleSaveEditor = async (updates: any) => {
    // Se updates contiver um id_playlist_alvo, salvamos especificamente nela (usado pelo Atrelar)
    if (updates?.id_playlist_alvo) {
      const { id_playlist_alvo, ...rest } = updates;
      await data.savePlaylistConfig(id_playlist_alvo, rest);
      return;
    }

    if (selectedPlaylist) {
      await data.savePlaylistConfig(selectedPlaylist.id, updates);
    } else {
      await data.saveProfile(updates);
    }
  };

  const handleSetProfileMock = (p: any) => {
    if (selectedPlaylist) {
      // Para o ChannelSettings que usa setProfile localmente
      data.savePlaylistConfig(selectedPlaylist.id, p);
    } else {
      data.setProfile(p);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar 
          onSync={data.triggerSync} 
          playlists={data.playlists} 
          selectedPlaylistId={data.selectedPlaylistId} 
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2 overflow-hidden">
              <h1 className="font-display text-lg font-bold truncate">
                {selectedPlaylist ? `Editando: ${selectedPlaylist.nome_da_tela}` : (data.profile.nome_empresa || "Digital Signage")}
              </h1>
              {selectedPlaylist && (
                <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase text-indigo-500 animate-pulse shrink-0">
                  Modo Individual
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<Navigate to="media" replace />} />
              <Route path="media" element={
                <MediaLibrary
                  media={data.media}
                  uploading={data.uploading}
                  onUpload={data.handleUpload}
                  onDelete={data.deleteMedia}
                  onRefresh={data.fetchData}
                />
              } />
              <Route path="playlists" element={
                <PlaylistManager
                  playlists={data.playlists}
                  media={data.media}
                  getMediaName={data.getMediaName}
                  onCreate={data.createPlaylist}
                  onAddMedia={data.addToPlaylist}
                  onRemoveMedia={data.removeFromPlaylist}
                  onReorder={data.reorderPlaylist}
                  onDelete={data.deletePlaylist}
                />
              } />
              <Route path="settings" element={
                <ChannelSettings profile={activeConfig as any} setProfile={handleSetProfileMock} onSave={handleSaveEditor} />
              } />
              <Route path="templates" element={
                <TemplateSelector 
                  profile={activeConfig as any} 
                  onSave={handleSaveEditor}
                  playlists={data.playlists}
                  selectedPlaylistId={data.selectedPlaylistId}
                  setSelectedPlaylistId={data.setSelectedPlaylistId}
                />
              } />
              <Route path="devices" element={
                  <DeviceMonitor 
                    playlists={data.playlists} 
                    profile={data.profile}
                    media={data.media}
                    selectedPlaylistId={data.selectedPlaylistId}
                    setSelectedPlaylistId={data.setSelectedPlaylistId}
                    onSync={data.triggerSync}
                    onCreate={data.createPlaylist}
                    onUpdatePlaylist={data.savePlaylistConfig}
                    onAddMedia={data.addToPlaylist}
                    onRemoveMedia={data.removeFromPlaylist}
                    onReorder={data.reorderPlaylist}
                    getMediaName={data.getMediaName}
                  />
              } />
              <Route path="reports" element={<ReportsPanel profile={data.profile} />} />
              <Route path="leads" element={<AdLeadsPanel />} />
              <Route path="developer/*" element={
                isAdmin
                  ? <DeveloperArea />
                  : <Navigate to="/dashboard/media" replace />
              } />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

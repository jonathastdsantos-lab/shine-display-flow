import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useDashboardData } from "@/hooks/useDashboardData";
import MediaLibrary from "@/components/dashboard/MediaLibrary";
import PlaylistManager from "@/components/dashboard/PlaylistManager";
import ChannelSettings from "@/components/dashboard/ChannelSettings";
import TemplateSelector from "@/components/dashboard/TemplateSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const data = useDashboardData();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3">
            <SidebarTrigger />
            <h1 className="font-display text-lg font-bold truncate">{data.profile.nome_empresa || "Digital Signage"}</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<Navigate to="media" replace />} />
              <Route path="media" element={
                <MediaLibrary media={data.media} uploading={data.uploading} onUpload={data.handleUpload} onDelete={data.deleteMedia} />
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
                <ChannelSettings profile={data.profile} setProfile={data.setProfile} onSave={data.saveProfile} />
              } />
              <Route path="templates" element={
                <TemplateSelector profile={data.profile} onSave={data.saveProfile} />
              } />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

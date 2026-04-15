import { useEffect, useRef, useState } from "react";
import { Loader2, Instagram, AlertCircle } from "lucide-react";

interface InstagramEmbedProps {
  handle: string;
}

export default function InstagramEmbed({ handle }: InstagramEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);

    // Clean up previous embeds
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const scriptId = "instagram-embed-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Create the blockquote required for Instagram embed
    // We use a profile embed concept. Since Instagram doesn't have a "profile embed" script that shows multiple posts well in iFrames easily,
    // we will fetch the latest post or show a clean CTA if the embed fails.
    // However, the best "official" way to show real content is embedding a specific post.
    // Since we don't have a specific post ID, we'll try to use a "profile-like" approach or embed the latest if possible.
    
    // Note: Instagram Embeds usually require a specific post URL.
    // For a profile view, there isn't a simple official "Profile Widget" anymore (deprecated).
    // The "best visual option" for a player that shows real images without keys is often a custom fetcher or just the Embed.
    
    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.setAttribute("data-instgrm-captioned", "");
    blockquote.setAttribute("data-instgrm-permalink", `https://www.instagram.com/${handle.replace("@", "")}/`);
    blockquote.setAttribute("data-instgrm-version", "14");
    blockquote.style.width = "99.375%";
    blockquote.style.width = "-webkit-calc(100% - 2px)";
    blockquote.style.width = "calc(100% - 2px)";
    blockquote.style.margin = "1px";
    
    if (containerRef.current) {
      containerRef.current.appendChild(blockquote);
    }

    const checkEmbed = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
        setLoading(false);
      } else {
        setTimeout(checkEmbed, 200);
      }
    };

    checkEmbed();

    // Timeout for loading
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [handle]);

  return (
    <div className="w-full h-full flex flex-col bg-black/20 rounded-xl overflow-hidden relative border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mb-2" />
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Carregando Mural Social...</p>
        </div>
      )}

      <div className="flex-1 overflow-auto scrollbar-hide p-1" ref={containerRef}>
        {/* Instagram will inject the embed here */}
      </div>

      <div className="absolute top-2 right-2 z-10">
        <div className="p-1.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-lg">
          <Instagram className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      
      {!loading && !containerRef.current?.querySelector("iframe") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900">
           <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
           <p className="text-sm font-bold text-white mb-1">Perfil em Carregamento</p>
           <p className="text-[10px] text-white/40 leading-relaxed">
             Certifique-se de que o perfil <span className="text-pink-400 font-bold">@{handle}</span> é público.<br/>
             O Instagram pode exigir login para visualizar alguns perfis.
           </p>
           <a 
             href={`https://instagram.com/${handle}`} 
             target="_blank" 
             rel="noopener noreferrer"
             className="mt-4 px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold rounded-full transition-colors"
           >
             Ver no Instagram
           </a>
        </div>
      )}
    </div>
  );
}

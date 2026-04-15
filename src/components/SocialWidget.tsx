import { useState, useEffect } from "react";
import { Instagram, ExternalLink, Heart, MessageCircle, RefreshCw } from "lucide-react";

interface SocialWidgetProps {
  instagramHandle?: string;
  compact?: boolean;
}

// Simulated Instagram posts - in production, replace with Instagram Basic Display API
// Instagram embeds are the safest cross-origin option without a backend token
const MOCK_POSTS = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=60",
    caption: "Novidades da estação chegando com tudo! ✨ #tendencias #novidades",
    likes: 124,
    comments: 18,
    timeAgo: "2h",
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=60",
    caption: "Resultado incrível de hoje! Seu próximo look pode ser assim 💇‍♀️ #beleza",
    likes: 237,
    comments: 32,
    timeAgo: "5h",
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&auto=format&fit=crop&q=60",
    caption: "Visual transformado em poucas horas! Agende já o seu horário 📲 #cabelo",
    likes: 89,
    comments: 9,
    timeAgo: "1d",
  },
];

export default function SocialWidget({ instagramHandle = "suaempresa", compact = false }: SocialWidgetProps) {
  const [postIndex, setPostIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handle = instagramHandle.replace("@", "") || "suaempresa";
  const post = MOCK_POSTS[postIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPostIndex((prev) => (prev + 1) % MOCK_POSTS.length);
        setImgLoaded(false);
        setFading(false);
      }, 500);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex flex-col px-2 py-2 w-full bg-black/30 overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Instagram className="w-3 h-3 text-pink-500" />
          <span className="text-[9px] font-bold text-pink-400/80">@{handle}</span>
        </div>
        <div className={`w-full aspect-square rounded overflow-hidden bg-black transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
          <img
            src={post.imageUrl}
            alt="Instagram post"
            className="w-full h-full object-cover"
            onLoad={() => setImgLoaded(true)}
          />
        </div>
        <p className="text-[8px] text-white/60 mt-1 line-clamp-2 leading-tight">{post.caption}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-purple-600/5 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between w-full px-4 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
            <Instagram className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">@{handle}</p>
            <p className="text-[8px] text-white/40 uppercase tracking-widest">Mural Social</p>
          </div>
        </div>
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-400/60 hover:text-pink-400 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Post Image */}
      <div className={`w-full flex-1 relative overflow-hidden transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        )}
        <img
          key={post.id}
          src={post.imageUrl}
          alt="Post Instagram"
          className="w-full h-full object-cover"
          onLoad={() => setImgLoaded(true)}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>

      {/* Post Info */}
      <div className="px-3 py-2 w-full">
        {/* Stats */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex items-center gap-1 text-white/60">
            <Heart className="w-3 h-3 text-red-400 fill-red-400" />
            <span className="text-[10px]">{post.likes}</span>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span className="text-[10px]">{post.comments}</span>
          </div>
          <span className="text-[9px] text-white/30 ml-auto">Há {post.timeAgo}</span>
        </div>
        <p className="text-[9px] text-white/70 line-clamp-2 leading-relaxed">{post.caption}</p>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 pb-2">
        {MOCK_POSTS.map((_, i) => (
          <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === postIndex ? "bg-pink-500 w-3" : "bg-white/20"}`} />
        ))}
      </div>

      {/* CTA Banner */}
      <div className="w-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-t border-white/5 px-3 py-1.5 flex items-center justify-center gap-2">
        <Instagram className="w-3 h-3 text-pink-400" />
        <span className="text-[9px] text-pink-400/80 font-bold">Siga-nos no Instagram → @{handle}</span>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Quote } from "lucide-react";

interface MotivationalWidgetProps {
  fontSize?: number;
  customQuote?: string;
}

const DEFAULT_QUOTES = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "A única maneira de fazer um excelente trabalho é amar o que você faz.",
  "Não espere por oportunidades. Crie-as.",
  "Sua limitação é apenas sua imaginação.",
  "Grandes coisas nunca vêm de zonas de conforto.",
  "Estude enquanto eles dormem, trabalhe enquanto eles se divertem, viva o que eles sonham.",
  "Foque no objetivo, não nos obstáculos."
];

export default function MotivationalWidget({ fontSize, customQuote }: MotivationalWidgetProps) {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    if (customQuote) {
      setQuote(customQuote);
    } else {
      const randomQuote = DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)];
      setQuote(randomQuote);
    }
  }, [customQuote]);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center w-full h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl border border-white/5 relative overflow-hidden group">
      <Quote className="w-8 h-8 text-indigo-400/40 mb-4 animate-pulse" />
      
      <p 
        className="font-display font-medium text-white italic leading-relaxed drop-shadow-sm"
        style={{ fontSize: fontSize ? `${fontSize}px` : "1.25rem" }}
      >
        "{quote}"
      </p>

      <div className="absolute bottom-4 right-6 opacity-10">
        <Quote className="w-16 h-16 rotate-180" />
      </div>

      <div className="mt-6 flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-1 h-1 rounded-full bg-indigo-500/30" />
        ))}
      </div>
    </div>
  );
}

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CitySuggestion {
  name: string;
  state: string;
  fullName: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CityAutocomplete({ value, onChange }: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<CitySuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Busca na API pública do IBGE (sem chave, todos os municípios do Brasil)
  React.useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // API pública do IBGE de localidades
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`
        );
        const data: Array<{ nome: string; microrregiao: { mesorregiao: { UF: { sigla: string } } } }> = await res.json();

        // Filtra pelo query (busca local no resultado)
        const normalized = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const filtered = data
          .filter(m => {
            const name = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return name.startsWith(normalized);
          })
          .slice(0, 15)
          .map(m => ({
            name: m.nome,
            state: m.microrregiao.mesorregiao.UF.sigla,
            fullName: `${m.nome}, ${m.microrregiao.mesorregiao.UF.sigla}`
          }));

        setSuggestions(filtered);
      } catch (err) {
        console.error("Erro ao buscar cidades via IBGE:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-background/50 border-border/50"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 text-primary" />
            {value ? value : "Digite o nome da cidade..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Mínimo 3 letras (ex: Joinville)..." 
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[300px]">
            {loading && (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Buscando no Brasil...
              </div>
            )}
            
            {!loading && query.length >= 3 && suggestions.length === 0 && (
              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            )}

            {!loading && query.length < 3 && (
              <div className="p-4 text-[10px] text-center text-muted-foreground uppercase tracking-widest px-8">
                Continue digitando para pesquisar...
              </div>
            )}

            <CommandGroup>
              {suggestions.map((city) => (
                <CommandItem
                  key={city.fullName}
                  value={city.fullName}
                  onSelect={(currentValue) => {
                    onChange(city.fullName);
                    setOpen(false);
                  }}
                  className="py-3 px-4 flex items-center justify-between cursor-pointer hover:bg-primary/5"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{city.name}</span>
                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                        Município
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> Estado de {city.state}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 text-primary",
                      value === city.fullName ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

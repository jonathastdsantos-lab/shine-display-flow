import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";

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

  // Debounce logic for searching
  React.useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-cities", {
          body: { query },
        });

        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error("Erro ao buscar cidades:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

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
                  className="py-3 px-4"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{city.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                      {city.state || "Brasil"}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
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

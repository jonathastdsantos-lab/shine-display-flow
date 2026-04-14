import * as React from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
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

const CITIES = [
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", 
  "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Goiânia", 
  "Belém", "Porto Alegre", "Guarulhos", "Campinas", "São Luís",
  "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Teresina",
  "São Bernardo do Campo", "Nova Iguaçu", "Campo Grande", "São José dos Campos",
  "Cuiabá", "Aracaju", "Feira de Santana", "Porto Velho", "Florianópolis",
  "João Pessoa", "Serra", "Londrina", "Niterói", "Belford Roxo", "Joinville",
  "Campos dos Goytacazes", "Aparecida de Goiânia", "Sorocaba"
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CityAutocomplete({ value, onChange }: CityAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {value ? value : "Selecione uma cidade..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Digite o nome da cidade..." />
          <CommandList>
            <CommandEmpty>Cidade não encontrada.</CommandEmpty>
            <CommandGroup heading="Cidades Comuns">
              {CITIES.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : city);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

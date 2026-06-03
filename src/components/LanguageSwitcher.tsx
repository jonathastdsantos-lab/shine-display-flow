import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeLocale, SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current: SupportedLocale =
    (i18n.language as SupportedLocale) && SUPPORTED_LOCALES.includes(i18n.language as SupportedLocale)
      ? (i18n.language as SupportedLocale)
      : "pt-BR";

  return (
    <Select value={current} onValueChange={(v) => changeLocale(v as SupportedLocale)}>
      <SelectTrigger
        className="h-8 w-auto gap-2 border-border/50 bg-transparent text-xs font-semibold"
        aria-label={t("language.label")}
      >
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((loc) => (
          <SelectItem key={loc} value={loc} className="text-xs">
            {t(`language.${loc}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

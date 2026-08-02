import { Moon, Sun, Laptop, Clock3 } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const horas = Array.from({ length: 24 }, (_, h) => h);
const fmtHora = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Bloco de aparência exibido dentro do menu do perfil do usuário. */
export function ThemeMenuSection() {
  const { config, resolved, setMode, setHorarios } = useTheme();

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center justify-between gap-4 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Aparência</span>
          </div>
          <span className="normal-case tracking-normal">
            {config.mode === "claro" ? "Modo claro" :
             config.mode === "noturno" ? "Modo noturno" :
             config.mode === "sistema" ? "Do usuário" : "Automático"}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56">
          <DropdownMenuRadioGroup value={config.mode} onValueChange={(v) => setMode(v as never)}>
            <DropdownMenuRadioItem value="claro" className="gap-2 text-xs">
              <Sun className="h-3.5 w-3.5" /> Modo claro
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="noturno" className="gap-2 text-xs">
              <Moon className="h-3.5 w-3.5" /> Modo noturno
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="sistema" className="gap-2 text-xs">
              <Laptop className="h-3.5 w-3.5" /> Do usuário (sistema)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="automatico" className="gap-2 text-xs">
              <Clock3 className="h-3.5 w-3.5" /> Automático por horário
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {config.mode === "automatico" && (
        <div
          className="space-y-2 px-2 py-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] text-muted-foreground">
            Escolha o horário em que o portal muda de tema automaticamente.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Noturno às</Label>
              <Select
                value={String(config.inicioNoturno)}
                onValueChange={(v) => setHorarios(Number(v), config.inicioClaro)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {horas.map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-xs">
                      {fmtHora(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Claro às</Label>
              <Select
                value={String(config.inicioClaro)}
                onValueChange={(v) => setHorarios(config.inicioNoturno, Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {horas.map((h) => (
                    <SelectItem key={h} value={String(h)} className="text-xs">
                      {fmtHora(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

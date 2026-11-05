import * as React from "react";
import { Input } from "@/components/ui/input";
import { formaterSaisieHeure, normaliserSaisieHeure } from "@/lib/admin/heure-saisie";

type HeureInputProps = Omit<React.ComponentProps<"input">, "type" | "inputMode" | "maxLength">;

/**
 * Champ d'heure HH:MM sur 24 h, identique quelle que soit la langue du
 * navigateur (le `type="time"` natif affiche AM/PM sur un appareil en anglais).
 *
 * Clavier numérique sur téléphone ; le « : » se place tout seul ("0730" →
 * "07:30") et la valeur est complétée à la sortie du champ ("7" → "07:00").
 * Une saisie invalide est laissée telle quelle : c'est la validation du
 * formulaire qui la signale, on n'efface rien en silence.
 *
 * Fonctionne en contrôlé (value / onChange) comme avec `form.register(...)`
 * de react-hook-form : la valeur est réécrite dans l'événement avant d'être
 * transmise.
 */
const HeureInput = React.forwardRef<HTMLInputElement, HeureInputProps>(
  ({ onChange, onBlur, placeholder = "HH:MM", ...props }, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder={placeholder}
      {...props}
      onChange={(e) => {
        e.target.value = formaterSaisieHeure(e.target.value);
        onChange?.(e);
      }}
      onBlur={(e) => {
        const normalisee = normaliserSaisieHeure(e.target.value);
        if (normalisee && normalisee !== e.target.value) {
          e.target.value = normalisee;
          onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }
        onBlur?.(e);
      }}
    />
  ),
);
HeureInput.displayName = "HeureInput";

export default HeureInput;

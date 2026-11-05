import * as React from "react";
import { Input } from "@/components/ui/input";
import { formaterSaisieHeure, normaliserSaisieHeure } from "@/lib/admin/heure-saisie";

type HeureInputProps = Omit<React.ComponentProps<"input">, "type" | "inputMode" | "maxLength">;

/**
 * Champ d'heure HH:MM sur 24 h, identique quelle que soit la langue du
 * navigateur (le `type="time"` natif affiche AM/PM sur un appareil en anglais).
 *
 * Clavier numérique sur téléphone ; le « : » se place tout seul ("0730" →
 * "07:30"). La valeur est complétée ("7" → "07:00", "7:3" → "07:30") à la
 * sortie du champ ET sur Entrée, pour qu'un formulaire validé au clavier ne
 * reçoive jamais une saisie à moitié tapée. Une saisie invalide est laissée
 * telle quelle : c'est la validation du formulaire qui la signale, on
 * n'efface rien en silence.
 *
 * Fonctionne en contrôlé (value / onChange) comme avec `form.register(...)`
 * de react-hook-form.
 */
const HeureInput = React.forwardRef<HTMLInputElement, HeureInputProps>(
  ({ onChange, onBlur, onKeyDown, placeholder = "HH:MM", ...props }, ref) => {
    // Complète la valeur et la transmet comme un événement « change » : relayé
    // tel quel, un événement blur ou keydown ne ferait pas revalider le champ
    // par react-hook-form (l'erreur resterait sous une valeur devenue valide).
    const completer = (cible: HTMLInputElement) => {
      const normalisee = normaliserSaisieHeure(cible.value);
      if (!normalisee || normalisee === cible.value) return;
      cible.value = normalisee;
      onChange?.({ type: "change", target: cible, currentTarget: cible } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    return (
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
        onKeyDown={(e) => {
          if (e.key === "Enter") completer(e.currentTarget);
          onKeyDown?.(e);
        }}
        onBlur={(e) => {
          completer(e.currentTarget);
          onBlur?.(e);
        }}
      />
    );
  },
);
HeureInput.displayName = "HeureInput";

export default HeureInput;

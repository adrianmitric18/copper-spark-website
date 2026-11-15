import ReactCompareImage from "react-compare-image";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import type { ProjectImage } from "@/lib/chantiers/types";

interface BeforeAfterSliderProps {
  before: ProjectImage;
  after: ProjectImage;
}

/**
 * Slider Avant/Après. Utilise react-compare-image (~3 Ko).
 * Chaque image porte sa légende en alt (lisible par Google et les IA).
 * On laisse le composant gérer le ratio nativement, pas besoin de
 * forcer un aspect-ratio si les deux images ont la même résolution.
 */
const BeforeAfterSlider = ({ before, after }: BeforeAfterSliderProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-muted">
      <ReactCompareImage
        leftImage={getChantierImageUrl(before.storage_path)}
        rightImage={getChantierImageUrl(after.storage_path)}
        leftImageAlt={before.caption ?? "Avant les travaux"}
        rightImageAlt={after.caption ?? "Après les travaux"}
        leftImageLabel="Avant"
        rightImageLabel="Après"
        sliderLineColor="hsl(var(--primary))"
        handleSize={48}
      />
    </div>
  );
};

export default BeforeAfterSlider;

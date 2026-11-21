import type { CSSProperties } from "react";
import ReactCompareImage from "react-compare-image";
import { getChantierImageUrl } from "@/lib/chantiers/upload";
import type { ProjectImage } from "@/lib/chantiers/types";

interface BeforeAfterSliderProps {
  before: ProjectImage;
  after: ProjectImage;
}

/** Hauteur / largeur d'une photo. Sans dimensions connues : portrait 3:4, le cas le plus haut. */
const RATIO_PAR_DEFAUT = 4 / 3;
const ratioHauteur = (image: ProjectImage): number =>
  image.width && image.height ? image.height / image.width : RATIO_PAR_DEFAUT;

/**
 * Slider Avant/Après. Utilise react-compare-image (~3 Ko).
 * Chaque image porte sa légende en alt (lisible par Google et les IA).
 *
 * Le composant prend toute la largeur disponible et calcule sa hauteur sur la
 * photo la plus haute des deux (aspectRatio « taller », son réglage par
 * défaut). Sur PC (lg et plus), on borne donc la LARGEUR pour que la hauteur
 * tienne dans un écran (75 % de la hauteur, le menu fixe en occupe 80 px).
 * Sous lg, rien ne change : pleine largeur.
 */
const BeforeAfterSlider = ({ before, after }: BeforeAfterSliderProps) => {
  const plusHaut = Math.max(ratioHauteur(before), ratioHauteur(after));

  return (
    <div
      className="rounded-lg overflow-hidden border border-border bg-muted lg:mx-auto lg:max-w-[calc(75vh/var(--avant-apres-ratio))]"
      style={{ "--avant-apres-ratio": plusHaut } as CSSProperties}
    >
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

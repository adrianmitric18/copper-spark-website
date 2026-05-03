// Ambient types for vite-imagetools query imports.
// vite-imagetools v7 ne fournit pas de types ambient pour les directives ?as=...
// Ces déclarations couvrent les patterns utilisés dans le projet.

interface ResponsivePicture {
  sources: Record<string, string>;
  img: {
    src: string;
    w: number;
    h: number;
    srcset: string;
  };
}

declare module "*as=picture" {
  const value: ResponsivePicture;
  export default value;
}

declare module "*as=metadata" {
  const value: { src: string; w: number; h: number };
  export default value;
}

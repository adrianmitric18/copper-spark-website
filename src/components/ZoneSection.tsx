import { MapPin, Check } from "lucide-react";

const zones = [
  {
    region: "Bruxelles",
    areas: ["Bruxelles-Capitale", "19 communes"],
    highlight: true,
  },
  {
    region: "Brabant Wallon",
    areas: ["Wavre", "Nivelles", "Ottignies-LLN", "Braine-l'Alleud"],
  },
  {
    region: "Hainaut",
    areas: ["Charleroi", "Mons", "La Louvière", "Tournai"],
  },
  {
    region: "Namur",
    areas: ["Namur", "Dinant", "Gembloux", "Sambreville"],
  },
  {
    region: "Liège",
    areas: ["Liège", "Verviers", "Seraing", "Herstal"],
  },
  {
    region: "Luxembourg",
    areas: ["Arlon", "Bastogne", "Marche-en-Famenne"],
  },
];

const ZoneSection = () => {
  return (
    <section id="zone" className="py-24 md:py-32 bg-card relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}
      />
      
      <div className="container mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-sm font-medium rounded-full mb-6 opacity-0 animate-fade-up">
            Zone d'Intervention
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 opacity-0 animate-fade-up animation-delay-100">
            Toute la{" "}
            <span className="text-gradient-copper">Belgique francophone</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg opacity-0 animate-fade-up animation-delay-200">
            De Bruxelles au Luxembourg, nos électriciens se déplacent rapidement chez vous.
          </p>
        </div>

        {/* Zones grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {zones.map((zone, index) => (
            <div
              key={zone.region}
              className={`bento-card opacity-0 animate-fade-up ${
                zone.highlight ? '!bg-gradient-copper border-primary/50' : ''
              }`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    zone.highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'
                  }`}
                >
                  <MapPin
                    className={`w-6 h-6 ${
                      zone.highlight ? 'text-primary-foreground' : 'text-primary'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-display text-xl font-bold mb-3 ${
                      zone.highlight ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {zone.region}
                  </h3>
                  <ul className="space-y-1.5">
                    {zone.areas.map((area) => (
                      <li
                        key={area}
                        className={`flex items-center gap-2 text-sm ${
                          zone.highlight
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ZoneSection;

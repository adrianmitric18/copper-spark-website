import { MapPin } from "lucide-react";

const zones = [
  {
    region: "Bruxelles",
    areas: ["Bruxelles-Capitale", "19 communes"],
    highlight: true,
  },
  {
    region: "Brabant Wallon",
    areas: ["Wavre", "Nivelles", "Ottignies-LLN", "Braine-l'Alleud"],
    highlight: false,
  },
  {
    region: "Hainaut",
    areas: ["Charleroi", "Mons", "La Louvière", "Tournai"],
    highlight: false,
  },
  {
    region: "Namur",
    areas: ["Namur", "Dinant", "Gembloux", "Sambreville"],
    highlight: false,
  },
  {
    region: "Liège",
    areas: ["Liège", "Verviers", "Seraing", "Herstal"],
    highlight: false,
  },
  {
    region: "Luxembourg",
    areas: ["Arlon", "Bastogne", "Marche-en-Famenne"],
    highlight: false,
  },
];

const ZoneSection = () => {
  return (
    <section id="zone" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary-foreground text-sm font-medium rounded-full mb-4">
            Zone d'intervention
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary-foreground mb-4">
            Nous intervenons dans toute la{" "}
            <span className="text-copper-light">Belgique francophone</span>
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            De Bruxelles au Luxembourg, en passant par la Wallonie, nos
            électriciens se déplacent rapidement chez vous.
          </p>
        </div>

        {/* Zones grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone, index) => (
            <div
              key={zone.region}
              className={`p-6 rounded-xl transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-up ${
                zone.highlight
                  ? "bg-gradient-copper text-primary-foreground shadow-copper-lg"
                  : "bg-card text-foreground shadow-card hover:shadow-card-hover"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    zone.highlight ? "bg-primary-foreground/20" : "bg-accent"
                  }`}
                >
                  <MapPin
                    className={`w-5 h-5 ${
                      zone.highlight ? "text-primary-foreground" : "text-primary"
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`font-display text-lg font-bold mb-2 ${
                      zone.highlight ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {zone.region}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      zone.highlight
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {zone.areas.join(" • ")}
                  </p>
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

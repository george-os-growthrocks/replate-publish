import { Sparkles } from "lucide-react";

const clients = [
  {
    name: "Discover Cyclades",
    logo: "https://greececyclades.com/favicon.svg",
    type: "svg",
    showName: true
  },
  {
    name: "Hotels Sifnos",
    logo: "https://hotelssifnos.com/lovable-uploads/18f3243f-e98a-4341-8b0a-e7ea71ce61bf.png?v=1761607884504-999",
    type: "image",
    showName: true
  },
  {
    name: "Touristas AI",
    logo: "https://hotelssifnos.com/uploads/touristas-ai-logo.svg",
    type: "svg",
    showName: true
  },
  {
    name: "ALK Hotel",
    logo: "/assets/alkhotel.png",
    type: "image",
    showName: true
  },
  {
    name: "Morpheas",
    logo: "/assets/morpheas-logo.png",
    type: "image",
    noGrayscale: true,
    invertColors: true,
    showName: true
  },
  {
    name: "Meropi Rooms",
    logo: "/assets/meropirooms.png",
    type: "image",
    noGrayscale: true,
    invertColors: true,
    showName: true
  },
  {
    name: "Ktima Orion",
    logo: "https://ktimaorion.gr/assets/logo-white-DDaP8UZp.png",
    type: "image",
    noGrayscale: true,
    invertColors: true,
    showName: true
  },
  {
    name: "The Agency",
    logo: "/assets/theagencylogo.png",
    type: "image"
  },
  {
    name: "Petsville",
    logo: "/assets/petsville.png",
    type: "image"
  },
  {
    name: "RAC SA",
    logo: "/assets/rac sa.jpg",
    type: "image"
  },
  {
    name: "Athens Rent a Car",
    logo: "/assets/athensrentacar.png",
    type: "image"
  },
  {
    name: "Rent a Car Antiparos",
    logo: "/assets/rentacarantiparos.png",
    type: "image"
  },
  {
    name: "Health Assistance",
    logo: "/assets/healthassistance.png",
    type: "image"
  },
  {
    name: "Allazw Diatrofi",
    logo: "/assets/allazwdiatrofi.png",
    type: "image"
  },
  {
    name: "Box2Box",
    logo: "/assets/box2box_logo.png",
    type: "image"
  },
  {
    name: "EEF EDU",
    logo: "/assets/eefedu.png",
    type: "image"
  },
  {
    name: "Active Sport",
    logo: "/assets/activesport.png",
    type: "image"
  },
  {
    name: "Sports Factory Outlet",
    logo: "/assets/sportsfactory-outlet-logo-17153332223.webp",
    type: "image"
  },
  {
    name: "Sneaker10",
    logo: "/assets/sneaker10-logo-17075791422.webp",
    type: "image"
  },
  {
    name: "Run Dome",
    logo: "/assets/rundome-logo-17075791815.webp",
    type: "image"
  },
  {
    name: "Slam Dunk",
    logo: "/assets/slam-dunk-logo-17075791644.webp",
    type: "image"
  },
  {
    name: "Cosmos Sport",
    logo: "/assets/cosmos-sport-logo-17075792651.webp",
    type: "image"
  },
  {
    name: "JD Sports",
    logo: "/assets/jd-desktop-logo.webp",
    type: "image"
  },
  {
    name: "Villarreal",
    logo: "/assets/logo-villarreal-web.png",
    type: "image"
  },
  {
    name: "Antiparos Rent a Car",
    logo: "/assets/antiparosrentacar.png",
    type: "image"
  },
  {
    name: "Aggelos Rentals",
    logo: "/assets/aggelosrentals.png",
    type: "image"
  },
  {
    name: "Antiparos Transfer",
    logo: "/assets/antiparostransfer.png",
    type: "image"
  },
  {
    name: "Antiparos Rooms",
    logo: "/assets/antiparosrooms.png",
    type: "image"
  },
  {
    name: "Villa Olivia Clara",
    logo: "/assets/villa-olivia-clara-logo-768x204.png",
    type: "image"
  },
  {
    name: "Elite Hospitality",
    logo: "/assets/elitehospitality.png",
    type: "image"
  },
];

export function ClientsSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Trusted by Leading Brands</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Join <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">1,000+</span> Companies
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From startups to enterprises, businesses worldwide trust AnotherSEOGuru to dominate search rankings
          </p>
        </div>

        {/* Logos Grid */}
        <div className="relative">
          {/* Gradient Overlays for Fade Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
          
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {clients.map((client, index) => (
              <div
                key={index}
                className="group relative w-full h-24 flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <img
                  src={client.logo}
                  alt={`${client.name} logo`}
                  className={`max-w-full ${client.showName ? 'max-h-12' : 'max-h-full'} object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
                    client.noGrayscale ? '' : 'filter grayscale group-hover:grayscale-0'
                  } ${client.invertColors ? 'invert dark:invert-0' : ''}`}
                  loading="lazy"
                />
                {client.showName && (
                  <span className="text-xs font-semibold text-foreground mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to join the ranks of successful businesses?
          </p>
          <div className="inline-flex items-center gap-2 text-sm">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-background" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-background" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-background" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-background flex items-center justify-center text-white font-bold text-xs">
                +1k
              </div>
            </div>
            <span className="text-muted-foreground">
              <strong className="text-foreground">1,234</strong> companies improved their rankings this month
            </span>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
    </section>
  );
}


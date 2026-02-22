import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EVENTS = [
  // Mon Feb 16
  { title: "ETHBerlin Builders Breakfast", date: "2026-02-16", startTime: "09:00", endTime: "11:00", district: "Mitte", venue: "Factory Berlin", category: "tech", subtags: ["crypto", "web3", "founders"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.7, socialOpenness: 0.8, energyLevel: 0.4, crowdVector: { founders: 0.9, investors: 0.7 }, accessDifficulty: 0.3 },
  { title: "Neue Nationalgalerie — Modern Masters", date: "2026-02-16", startTime: "10:00", endTime: "18:00", district: "Mitte", venue: "Neue Nationalgalerie", category: "art", subtags: ["gallery", "modern art"], priceEurMin: 14, priceEurMax: 14, socialDensity: 0.3, socialOpenness: 0.2, energyLevel: 0.3, crowdVector: { tourists: 0.6, artists: 0.4 }, accessDifficulty: 0.1 },
  { title: "AI Product Meetup", date: "2026-02-16", startTime: "18:30", endTime: "21:00", district: "Kreuzberg", venue: "Betahaus", category: "tech", subtags: ["ai", "product", "networking"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.8, socialOpenness: 0.7, energyLevel: 0.6, crowdVector: { founders: 0.8, investors: 0.5 }, accessDifficulty: 0.2 },
  { title: "Berghain (Monday Club Night)", date: "2026-02-16", startTime: "23:00", endTime: null, district: "Friedrichshain", venue: "Berghain", category: "club", subtags: ["techno", "nightlife"], priceEurMin: 15, priceEurMax: 20, socialDensity: 0.9, socialOpenness: 0.3, energyLevel: 0.95, crowdVector: { artists: 0.5, tourists: 0.3 }, accessDifficulty: 0.9 },
  { title: "Markthalle Neun Street Food", date: "2026-02-16", startTime: "12:00", endTime: "20:00", district: "Kreuzberg", venue: "Markthalle Neun", category: "community", subtags: ["food", "market", "local"], priceEurMin: 5, priceEurMax: 15, socialDensity: 0.6, socialOpenness: 0.9, energyLevel: 0.4, crowdVector: { tourists: 0.5, artists: 0.3 }, accessDifficulty: 0.1 },

  // Tue Feb 17
  { title: "VC Coffee & Dealflow", date: "2026-02-17", startTime: "08:30", endTime: "10:00", district: "Mitte", venue: "Soho House Berlin", category: "tech", subtags: ["vc", "investing", "founders"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.5, socialOpenness: 0.4, energyLevel: 0.3, crowdVector: { investors: 0.95, founders: 0.8 }, accessDifficulty: 0.6 },
  { title: "Hamburger Bahnhof — Contemporary Art", date: "2026-02-17", startTime: "10:00", endTime: "18:00", district: "Mitte", venue: "Hamburger Bahnhof", category: "art", subtags: ["contemporary", "installation"], priceEurMin: 12, priceEurMax: 12, socialDensity: 0.3, socialOpenness: 0.2, energyLevel: 0.3, crowdVector: { artists: 0.6, tourists: 0.5 }, accessDifficulty: 0.1 },
  { title: "Web3 Berlin Pitch Night", date: "2026-02-17", startTime: "19:00", endTime: "22:00", district: "Kreuzberg", venue: "Betahaus", category: "tech", subtags: ["web3", "pitching", "startups"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.8, socialOpenness: 0.7, energyLevel: 0.7, crowdVector: { founders: 0.9, investors: 0.9 }, accessDifficulty: 0.3 },
  { title: "Jazz at A-Trane", date: "2026-02-17", startTime: "21:00", endTime: "23:30", district: "Charlottenburg", venue: "A-Trane", category: "music", subtags: ["jazz", "live", "intimate"], priceEurMin: 10, priceEurMax: 20, socialDensity: 0.4, socialOpenness: 0.5, energyLevel: 0.4, crowdVector: { artists: 0.5 }, accessDifficulty: 0.2 },
  { title: "Creative Coding Workshop", date: "2026-02-17", startTime: "14:00", endTime: "17:00", district: "Neukölln", venue: "Agora Collective", category: "workshop", subtags: ["coding", "art", "generative"], priceEurMin: 25, priceEurMax: 25, socialDensity: 0.4, socialOpenness: 0.6, energyLevel: 0.5, crowdVector: { artists: 0.7, founders: 0.3 }, accessDifficulty: 0.2 },

  // Wed Feb 18
  { title: "Berlin Startup Sauna", date: "2026-02-18", startTime: "09:00", endTime: "12:00", district: "Prenzlauer Berg", venue: "Vabali Spa", category: "community", subtags: ["founders", "wellness", "networking"], priceEurMin: 30, priceEurMax: 30, socialDensity: 0.4, socialOpenness: 0.8, energyLevel: 0.3, crowdVector: { founders: 0.8, investors: 0.3 }, accessDifficulty: 0.3 },
  { title: "KW Institute — New Exhibition Opening", date: "2026-02-18", startTime: "18:00", endTime: "21:00", district: "Mitte", venue: "KW Institute", category: "art", subtags: ["opening", "contemporary", "drinks"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.7, socialOpenness: 0.8, energyLevel: 0.5, crowdVector: { artists: 0.9, investors: 0.2 }, accessDifficulty: 0.2 },
  { title: "Blockchain & Beer", date: "2026-02-18", startTime: "19:30", endTime: "22:00", district: "Friedrichshain", venue: "RSVP Bar", category: "tech", subtags: ["blockchain", "casual", "networking"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.7, socialOpenness: 0.8, energyLevel: 0.5, crowdVector: { founders: 0.7, investors: 0.4 }, accessDifficulty: 0.1 },
  { title: "Silent Film Night + Live Score", date: "2026-02-18", startTime: "20:30", endTime: "22:30", district: "Kreuzberg", venue: "Babylon Cinema", category: "film", subtags: ["silent film", "live music", "culture"], priceEurMin: 10, priceEurMax: 10, socialDensity: 0.3, socialOpenness: 0.2, energyLevel: 0.3, crowdVector: { artists: 0.5, tourists: 0.3 }, accessDifficulty: 0.1 },
  { title: "Vinyasa Flow at Yoga Rain", date: "2026-02-18", startTime: "07:30", endTime: "08:30", district: "Neukölln", venue: "Yoga Rain", category: "community", subtags: ["yoga", "wellness", "morning"], priceEurMin: 12, priceEurMax: 12, socialDensity: 0.2, socialOpenness: 0.3, energyLevel: 0.3, crowdVector: {}, accessDifficulty: 0.1 },

  // Thu Feb 19
  { title: "Founder Dinner (invite only)", date: "2026-02-19", startTime: "19:00", endTime: "22:00", district: "Mitte", venue: "Grill Royal", category: "community", subtags: ["founders", "dinner", "exclusive"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.5, socialOpenness: 0.3, energyLevel: 0.4, crowdVector: { founders: 0.95, investors: 0.7 }, accessDifficulty: 0.8 },
  { title: "Printmaking Workshop", date: "2026-02-19", startTime: "11:00", endTime: "14:00", district: "Wedding", venue: "Studio Am Moritzplatz", category: "workshop", subtags: ["printmaking", "art", "hands-on"], priceEurMin: 35, priceEurMax: 35, socialDensity: 0.3, socialOpenness: 0.6, energyLevel: 0.4, crowdVector: { artists: 0.8 }, accessDifficulty: 0.2 },
  { title: "Tresor Techno Night", date: "2026-02-19", startTime: "23:30", endTime: null, district: "Mitte", venue: "Tresor", category: "club", subtags: ["techno", "underground", "nightlife"], priceEurMin: 12, priceEurMax: 15, socialDensity: 0.8, socialOpenness: 0.3, energyLevel: 0.9, crowdVector: { artists: 0.4, tourists: 0.3 }, accessDifficulty: 0.5 },
  { title: "Berlin Philharmonic — Chamber Music", date: "2026-02-19", startTime: "20:00", endTime: "22:00", district: "Mitte", venue: "Philharmonie", category: "music", subtags: ["classical", "chamber", "culture"], priceEurMin: 20, priceEurMax: 60, socialDensity: 0.4, socialOpenness: 0.2, energyLevel: 0.2, crowdVector: { tourists: 0.5 }, accessDifficulty: 0.2 },
  { title: "Spree River Winter Walk", date: "2026-02-19", startTime: "14:00", endTime: "16:00", district: "Mitte", venue: null, category: "community", subtags: ["walking", "outdoor", "casual"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.2, socialOpenness: 0.9, energyLevel: 0.3, crowdVector: { tourists: 0.4 }, accessDifficulty: 0.0 },

  // Fri Feb 20
  { title: "Demo Day — Berlin Accelerator", date: "2026-02-20", startTime: "14:00", endTime: "18:00", district: "Kreuzberg", venue: "Factory Görlitzer", category: "tech", subtags: ["demo day", "startups", "pitching"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.8, socialOpenness: 0.6, energyLevel: 0.7, crowdVector: { founders: 0.9, investors: 0.9 }, accessDifficulty: 0.4 },
  { title: "Gallery Weekend Preview", date: "2026-02-20", startTime: "17:00", endTime: "21:00", district: "Mitte", venue: "Various Galleries", category: "art", subtags: ["gallery", "opening", "contemporary"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.6, socialOpenness: 0.7, energyLevel: 0.5, crowdVector: { artists: 0.9, investors: 0.3 }, accessDifficulty: 0.2 },
  { title: "Sisyphos Friday Opening", date: "2026-02-20", startTime: "22:00", endTime: null, district: "Rummelsburg", venue: "Sisyphos", category: "club", subtags: ["techno", "open-air", "marathon"], priceEurMin: 15, priceEurMax: 15, socialDensity: 0.8, socialOpenness: 0.5, energyLevel: 0.9, crowdVector: { artists: 0.4, tourists: 0.4 }, accessDifficulty: 0.6 },
  { title: "Cooking Class: Turkish Berlin", date: "2026-02-20", startTime: "11:00", endTime: "14:00", district: "Kreuzberg", venue: "Goldhahn & Sampson", category: "workshop", subtags: ["cooking", "food", "culture"], priceEurMin: 45, priceEurMax: 45, socialDensity: 0.4, socialOpenness: 0.8, energyLevel: 0.4, crowdVector: { tourists: 0.5 }, accessDifficulty: 0.1 },
  { title: "Stand-up Comedy (English)", date: "2026-02-20", startTime: "20:00", endTime: "22:00", district: "Neukölln", venue: "Cosmic Comedy", category: "other", subtags: ["comedy", "english", "nightlife"], priceEurMin: 10, priceEurMax: 10, socialDensity: 0.6, socialOpenness: 0.7, energyLevel: 0.5, crowdVector: { tourists: 0.5 }, accessDifficulty: 0.1 },

  // Sat Feb 21
  { title: "Flohmarkt am Mauerpark", date: "2026-02-21", startTime: "10:00", endTime: "17:00", district: "Prenzlauer Berg", venue: "Mauerpark", category: "community", subtags: ["flea market", "outdoor", "vintage"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.7, socialOpenness: 0.9, energyLevel: 0.5, crowdVector: { artists: 0.4, tourists: 0.7 }, accessDifficulty: 0.0 },
  { title: "AI Art Exhibition", date: "2026-02-21", startTime: "12:00", endTime: "20:00", district: "Kreuzberg", venue: "König Galerie", category: "art", subtags: ["ai", "digital art", "contemporary"], priceEurMin: 8, priceEurMax: 8, socialDensity: 0.5, socialOpenness: 0.5, energyLevel: 0.4, crowdVector: { artists: 0.7, founders: 0.4 }, accessDifficulty: 0.1 },
  { title: "Rooftop DJ Session", date: "2026-02-21", startTime: "16:00", endTime: "22:00", district: "Friedrichshain", venue: "Klunkerkranich", category: "music", subtags: ["dj", "rooftop", "casual"], priceEurMin: 5, priceEurMax: 5, socialDensity: 0.6, socialOpenness: 0.7, energyLevel: 0.6, crowdVector: { artists: 0.5, tourists: 0.4 }, accessDifficulty: 0.2 },
  { title: "About Blank — Queer Night", date: "2026-02-21", startTime: "23:00", endTime: null, district: "Friedrichshain", venue: "://about blank", category: "club", subtags: ["techno", "queer", "nightlife"], priceEurMin: 10, priceEurMax: 15, socialDensity: 0.8, socialOpenness: 0.5, energyLevel: 0.9, crowdVector: { artists: 0.6 }, accessDifficulty: 0.4 },
  { title: "Brunch at House of Small Wonder", date: "2026-02-21", startTime: "10:00", endTime: "14:00", district: "Mitte", venue: "House of Small Wonder", category: "other", subtags: ["brunch", "japanese", "cozy"], priceEurMin: 15, priceEurMax: 25, socialDensity: 0.3, socialOpenness: 0.4, energyLevel: 0.2, crowdVector: { tourists: 0.4 }, accessDifficulty: 0.1 },

  // Sun Feb 22
  { title: "Sunday Assembly Berlin", date: "2026-02-22", startTime: "11:00", endTime: "12:30", district: "Neukölln", venue: "Heimathafen", category: "community", subtags: ["community", "talks", "social"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.5, socialOpenness: 0.9, energyLevel: 0.3, crowdVector: {}, accessDifficulty: 0.1 },
  { title: "Topography of Terror — Free Exhibition", date: "2026-02-22", startTime: "10:00", endTime: "20:00", district: "Kreuzberg", venue: "Topography of Terror", category: "art", subtags: ["history", "free", "culture"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.4, socialOpenness: 0.2, energyLevel: 0.2, crowdVector: { tourists: 0.8 }, accessDifficulty: 0.0 },
  { title: "Afternoon Karaoke at Monster Ronson", date: "2026-02-22", startTime: "15:00", endTime: "19:00", district: "Friedrichshain", venue: "Monster Ronson's", category: "other", subtags: ["karaoke", "fun", "casual"], priceEurMin: 5, priceEurMax: 5, socialDensity: 0.6, socialOpenness: 0.9, energyLevel: 0.6, crowdVector: { tourists: 0.4 }, accessDifficulty: 0.1 },
  { title: "Sunday Vinyl Market", date: "2026-02-22", startTime: "12:00", endTime: "18:00", district: "Kreuzberg", venue: "Markthalle Neun", category: "music", subtags: ["vinyl", "market", "chill"], priceEurMin: 0, priceEurMax: 0, socialDensity: 0.4, socialOpenness: 0.7, energyLevel: 0.3, crowdVector: { artists: 0.5 }, accessDifficulty: 0.0 },
  { title: "Sunset Yoga by the Spree", date: "2026-02-22", startTime: "16:00", endTime: "17:00", district: "Friedrichshain", venue: "Holzmarkt", category: "community", subtags: ["yoga", "outdoor", "wellness"], priceEurMin: 10, priceEurMax: 10, socialDensity: 0.2, socialOpenness: 0.4, energyLevel: 0.2, crowdVector: {}, accessDifficulty: 0.0 },
];

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.feedback.deleteMany();
  await prisma.event.deleteMany();

  // Create events
  for (const event of EVENTS) {
    await prisma.event.create({
      data: {
        ...event,
        subtags: JSON.stringify(event.subtags),
        crowdVector: JSON.stringify(event.crowdVector),
      },
    });
  }
  console.log(`Created ${EVENTS.length} events`);

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

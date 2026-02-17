import { Router } from "express";
import { config } from "../config.js";
import { signToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../types/common.js";
import { getStats, createEvent } from "../services/event-service.js";
import { pool } from "../db/pool.js";

export const adminRouter = Router();

adminRouter.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== config.ADMIN_PASSWORD) {
    throw ApiError.unauthorized("Invalid password");
  }

  const token = signToken("admin:" + Date.now());
  const isCrossOrigin = !config.CORS_ORIGIN.includes("localhost");
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: isCrossOrigin ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: isCrossOrigin,
  });

  res.json({ ok: true });
});

adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const stats = await getStats();
  res.json(stats);
});

// Seed 100 events into the database
adminRouter.post("/seed", requireAdmin, async (_req, res) => {
  const { rows: existing } = await pool.query("SELECT COUNT(*)::int as count FROM events");

  function d(offset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

  const bezirke = [
    { name: "Kreuzberg", kiezes: ["Wrangelkiez", "Oranienplatz", "Görlitzer Park", "Graefekiez", "Bergmannkiez", "Kottbusser Tor", "Mariannenplatz"] },
    { name: "Mitte", kiezes: ["Scheunenviertel", "Hackescher Markt", "Rosenthaler Vorstadt", "Alexanderplatz", "Unter den Linden"] },
    { name: "Friedrichshain", kiezes: ["Boxhagener Platz", "RAW-Gelände", "Warschauer", "Simon-Dach-Kiez", "Karl-Marx-Allee"] },
    { name: "Neukölln", kiezes: ["Reuterkiez", "Schillerkiez", "Sonnenallee", "Karl-Marx-Straße", "Maybachufer"] },
    { name: "Prenzlauer Berg", kiezes: ["Kastanienallee", "Helmholtzkiez", "Kollwitzkiez", "Mauerpark", "Gleimviertel"] },
    { name: "Charlottenburg", kiezes: ["Savignyplatz", "City West", "Kantstraße", "Lietzensee"] },
    { name: "Schöneberg", kiezes: ["Nollendorfplatz", "Winterfeldtplatz", "Akazienkiez", "Bayerischer Platz"] },
    { name: "Wilmersdorf", kiezes: ["Ludwigkirchplatz", "Fehrbelliner Platz", "Bundesplatz"] },
    { name: "Pankow", kiezes: ["Florakiez", "Schönholz", "Buch"] },
    { name: "Treptow-Köpenick", kiezes: ["Treptower Park", "Alt-Köpenick", "Oberschöneweide"] },
  ];

  const eventTemplates = [
    // Food & Drink
    { type: "Food & Drink", titles: ["Craft Beer Tasting", "Ramen Pop-Up Kitchen", "Vietnamese Street Food Night", "Sourdough Pizza Workshop", "Specialty Coffee Cupping", "Georgian Wine & Khachapuri Evening", "Vegan Brunch Buffet", "Syrian Shawarma Night", "Thai Street Food Market", "Italian Aperitivo Hour", "Korean BBQ Pop-Up", "Dumpling Making Class"], energy: [2, 3], social: [3, 4], times: [["10:00","13:00"],["12:00","15:00"],["17:00","21:00"],["18:00","22:00"],["19:00","23:00"]] },
    // Music & Nightlife
    { type: "Music & Nightlife", titles: ["Jazz Jam Session", "Vinyl DJ Night", "Open Mic Comedy", "Acoustic Singer-Songwriter Night", "Afrobeat Dance Party", "Electronic Live Set", "Classical Piano Recital", "Funk & Soul Night", "Indie Band Showcase", "Latin Salsa Night", "Drum Circle in the Park", "Underground Hip-Hop Cypher"], energy: [3, 5], social: [3, 5], times: [["19:00","23:00"],["20:00","01:00"],["21:00","02:00"],["22:00","04:00"]] },
    // Arts & Culture
    { type: "Arts & Culture", titles: ["Street Art Walking Tour", "Life Drawing Session", "Indie Film Screening", "Poetry Slam Night", "Photography Exhibition Opening", "Zine Making Workshop", "Spoken Word Evening", "Gallery Opening with Live Music", "Documentary Screening & Talk", "Interactive Art Installation", "Printmaking Workshop", "Berlin Wall History Tour"], energy: [1, 3], social: [1, 3], times: [["10:00","13:00"],["11:00","14:00"],["14:00","17:00"],["18:00","21:00"],["19:00","22:00"]] },
    // Fitness/Sports
    { type: "Fitness/Sports", titles: ["Park Run 5K", "Beach Volleyball Tournament", "Outdoor HIIT Class", "Skateboarding Session", "Group Cycling Ride", "Boxing Fitness Class", "Swimming at Badeschiff", "Frisbee in Tempelhof", "Rollerblading on the Runway", "Capoeira in the Park", "Morning Tai Chi", "Sunset Rooftop Yoga"], energy: [4, 5], social: [2, 4], times: [["07:00","09:00"],["08:00","10:00"],["10:00","12:00"],["16:00","18:00"],["17:00","19:00"]] },
    // Workshops
    { type: "Workshops", titles: ["Candle Making Workshop", "Screen Printing Class", "Leather Crafting Basics", "Watercolor Painting Session", "Macramé Plant Hanger Workshop", "Bookbinding Class", "Natural Dyeing Workshop", "Ceramics Hand-Building", "Terrarium Building", "Woodworking Intro", "Perfume Making Class", "Calligraphy Workshop"], energy: [2, 3], social: [3, 4], times: [["10:00","13:00"],["14:00","17:00"],["15:00","18:00"],["18:00","21:00"]] },
    // Outdoors
    { type: "Outdoors", titles: ["Sunset Picnic at Tempelhof", "Canal Walk & Coffee", "Guided Foraging Walk", "Urban Sketching Session", "Bird Watching at Tiergarten", "Bike Tour to Müggelsee", "Stand-Up Paddleboarding", "Stargazing at Teufelsberg", "Morning Run along the Spree", "Botanical Garden Exploration"], energy: [2, 4], social: [1, 3], times: [["07:00","09:00"],["09:00","12:00"],["10:00","13:00"],["14:00","17:00"],["16:00","19:00"]] },
    // Wellness
    { type: "Wellness", titles: ["Breathwork & Ice Bath", "Yin Yoga & Sound Healing", "Guided Meditation Circle", "Ayurvedic Cooking Class", "Forest Bathing Walk", "Acro Yoga for Beginners", "Hammam & Spa Afternoon", "Journaling & Tea Ceremony", "Cacao Ceremony", "Qi Gong in the Park"], energy: [1, 2], social: [1, 3], times: [["08:00","10:00"],["09:00","11:00"],["17:00","19:00"],["18:00","20:00"],["19:00","21:00"]] },
    // Community
    { type: "Community", titles: ["Board Game Night", "Language Exchange Café", "Neighborhood Clean-Up", "Book Club Meetup", "Co-Working Social Hour", "Dog Park Hangout", "Clothing Swap Party", "Community Dinner", "Pub Quiz Night", "Volunteer at Food Bank", "Tech Meetup Lightning Talks", "Newcomers Welcome Drinks"], energy: [2, 4], social: [4, 5], times: [["11:00","14:00"],["17:00","20:00"],["18:00","21:00"],["19:00","22:00"]] },
    // Shopping & Markets
    { type: "Shopping & Markets", titles: ["Vintage Clothing Market", "Designer Pop-Up Market", "Antique Book Fair", "Record Store Crawl", "Handmade Jewelry Sale", "Plant Market at Treptow", "Art Print Fair", "Flea Market Sunday", "Farmers Market Fresh Produce", "Sustainable Fashion Swap"], energy: [2, 3], social: [2, 4], times: [["09:00","14:00"],["10:00","16:00"],["10:00","18:00"],["11:00","17:00"]] },
    // Networking
    { type: "Networking", titles: ["Founder Fireside Chat", "UX Design Meetup", "Women in Tech Brunch", "Climate Action Meetup", "Freelancer Co-Working Day", "Investor Pitch Night", "Creative Industry Mixer", "AI & Machine Learning Talk", "Startup Demo Day", "Social Impact Networking"], energy: [3, 4], social: [4, 5], times: [["09:00","12:00"],["17:00","20:00"],["18:00","21:00"],["19:00","22:00"]] },
  ];

  const descriptions: Record<string, string[]> = {
    "Food & Drink": [
      "Come hungry and leave happy. Great vibes, amazing flavors, and friendly people.",
      "A curated culinary experience celebrating Berlin's diverse food scene. Don't miss it.",
      "Casual atmosphere with incredible food. Perfect for adventurous eaters.",
      "Local favorites meet international flavors. Grab a table and dig in.",
    ],
    "Music & Nightlife": [
      "An unforgettable night of live music in one of Berlin's iconic venues.",
      "Let the music carry you. Dance floor energy is guaranteed.",
      "Intimate setting, incredible performers. Berlin nightlife at its best.",
      "A night out that perfectly captures Berlin's legendary music scene.",
    ],
    "Arts & Culture": [
      "Immerse yourself in Berlin's thriving art scene. Thought-provoking and inspiring.",
      "Culture meets community in this carefully curated experience.",
      "See Berlin through the eyes of local artists. Powerful and moving.",
      "A cultural experience that captures the creative spirit of the city.",
    ],
    "Fitness/Sports": [
      "Push your limits in a welcoming, motivating atmosphere. All levels welcome.",
      "Get your heart pumping with fellow fitness enthusiasts. No experience needed.",
      "Outdoor exercise with Berlin's skyline as your backdrop.",
      "Fun, energetic, and open to everyone. Just show up and move.",
    ],
    "Workshops": [
      "Learn a new skill and take home something you made with your own hands.",
      "Hands-on creative session led by an experienced local artist.",
      "Perfect for beginners. All materials provided. Leave with a masterpiece.",
      "Slow down, get creative, and enjoy the process. Tea and snacks included.",
    ],
    "Outdoors": [
      "Fresh air, beautiful scenery, and a chance to discover hidden Berlin.",
      "Nature meets urban life in this quintessentially Berlin experience.",
      "Escape the city noise without leaving the city. Peaceful and rejuvenating.",
      "Berlin is greener than you think. Come see for yourself.",
    ],
    "Wellness": [
      "Deep relaxation for body and mind. You'll leave feeling renewed.",
      "A nurturing space to slow down and reconnect with yourself.",
      "Ancient practices meet modern Berlin. Healing and grounding.",
      "Give yourself permission to rest. You deserve this.",
    ],
    "Community": [
      "Connect with your neighbors and make new friends. Berlin at its warmest.",
      "Real community vibes. Everyone's welcome, everyone belongs.",
      "The kind of event that reminds you why Berlin is special.",
      "Bring your curiosity and an open heart. Wonderful people guaranteed.",
    ],
    "Shopping & Markets": [
      "Treasures waiting to be discovered. Berlin's market culture at its finest.",
      "Browse unique finds from local makers and vintage collectors.",
      "The perfect way to spend a Berlin afternoon. Bring a tote bag.",
      "Support local creators and find something truly one-of-a-kind.",
    ],
    "Networking": [
      "Expand your network in a relaxed, no-pressure environment.",
      "Meet inspiring people working on things that matter.",
      "Casual connections that could change your career. Come say hi.",
      "Berlin's professional community is warm and welcoming. Join us.",
    ],
  };

  const addresses: Record<string, string[]> = {
    "Kreuzberg": ["Oranienstraße 25", "Adalberstraße 12", "Skalitzer Str. 80", "Wiener Str. 18", "Bergmannstr. 102", "Kottbusser Damm 33", "Graefestr. 71"],
    "Mitte": ["Auguststraße 26", "Rosenthaler Str. 39", "Torstraße 66", "Linienstr. 132", "Weinmeisterstr. 15", "Münzstraße 8"],
    "Friedrichshain": ["Simon-Dach-Str. 39", "Revaler Str. 99", "Warschauer Str. 34", "Grünberger Str. 73", "Boxhagener Str. 44"],
    "Neukölln": ["Weserstraße 44", "Sonnenallee 67", "Richardstr. 20", "Hermannstr. 166", "Donaustr. 115", "Pannierstr. 52"],
    "Prenzlauer Berg": ["Kastanienallee 49", "Stargarder Str. 11", "Rykestr. 25", "Oderberger Str. 56", "Schönhauser Allee 36"],
    "Charlottenburg": ["Kantstr. 148", "Savignyplatz 5", "Wilmersdorfer Str. 122", "Pestalozzistr. 88"],
    "Schöneberg": ["Goltzstr. 24", "Winterfeldtstr. 50", "Akazienstr. 28", "Motzstr. 30"],
    "Wilmersdorf": ["Ludwigkirchplatz 11", "Uhlandstr. 170", "Pariser Str. 44"],
    "Pankow": ["Florastr. 27", "Wollankstr. 18", "Breite Str. 33"],
    "Treptow-Köpenick": ["Alt-Treptow 6", "Baumschulenstr. 68", "Köpenicker Str. 325"],
  };

  const events = [];
  for (let i = 0; i < 100; i++) {
    const template = pick(eventTemplates);
    const title = pick(template.titles);
    const bezirkInfo = pick(bezirke);
    const kiez = pick(bezirkInfo.kiezes);
    const time = pick(template.times);
    const dayOffset = rand(0, 13);
    const energy = rand(template.energy[0], template.energy[1]);
    const social = rand(template.social[0], template.social[1]);
    const desc = pick(descriptions[template.type]);
    const addr = pick(addresses[bezirkInfo.name]) + ", Berlin";

    events.push({
      title: `${title}`,
      description: desc,
      date: d(dayOffset),
      start_time: time[0],
      end_time: time[1],
      address: addr,
      bezirk: bezirkInfo.name,
      kiez,
      event_type: template.type,
      energy_score: energy,
      social_score: social,
    });
  }

  let inserted = 0;
  for (const e of events) {
    await createEvent({
      ...e,
      latitude: null,
      longitude: null,
      source: "seed",
      url: null,
    } as any);
    inserted++;
  }

  res.json({ ok: true, inserted, previousCount: existing[0].count });
});

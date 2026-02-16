import { pool } from "../db/pool.js";

const VENUES = [
  "SO36", "Lido", "Monarch Bar", "Südblock", "Ritter Butzke", "Prince Charles",
  "Paloma Bar", "Luzia", "Ora", "Möbel Olfe", "Roses", "Watergate",
  "Club der Visionäre", "Ankerklause", "Freischwimmer", "Holzmarkt",
  "Markthalle Neun", "Jolesch", "Cocolo Ramen", "Burgermeister",
  "Curry 36", "Mustafas Gemüsekebap", "Five Elephant", "Companion Coffee",
  "The Barn", "Café do Brasil", "Leuchtstoff Kaffeebar", "Hallesches Haus",
  "Betahaus", "Aqua Kreuzberg", "Zentrum für aktuelle Kunst", "Kunstraum Kreuzberg",
  "Künstlerhaus Bethanien", "FHXB Museum", "Schwules Museum", "nGbK",
  "TAK Theater", "Ballhaus Naunynstraße", "English Theatre Berlin", "Hebbel am Ufer",
  "Graefekiez Yoga", "CrossFit Kreuzberg", "Boulderklub Kreuzberg", "Badeschiff",
  "Prinzessinnengarten", "Görlitzer Park Café", "Café Mugrabi", "Kimchi Princess",
  "Angry Chicken", "Sahara Imbiss",
];

const STREETS = [
  "Oranienstraße", "Wiener Straße", "Skalitzer Straße", "Kottbusser Damm",
  "Adalbertstraße", "Mariannenstraße", "Naunynstraße", "Wrangelstraße",
  "Cuvrystraße", "Reichenberger Straße", "Graefestraße", "Dieffenbachstraße",
  "Urbanstraße", "Gneisenaustraße", "Bergmannstraße", "Mehringdamm",
  "Yorckstraße", "Großbeerenstraße", "Rudi-Dutschke-Straße", "Lindenstraße",
];

const KIEZE = [
  "Wrangelkiez", "Oranienplatz", "Görlitzer Park", "Kottbusser Tor",
  "Graefekiez", "Bergmannkiez", "Gleisdreieck", "Mariannenplatz",
  "Luisenstadt", "Chamissokiez",
];

const TYPES = [
  "Fitness/Sports", "Food & Drink", "Arts & Culture", "Music & Nightlife",
  "Shopping & Markets", "Networking", "Outdoors", "Wellness", "Workshops", "Community",
];

const DESCRIPTIONS: Record<string, string[]> = {
  "Fitness/Sports": [
    "High-intensity workout session to get your blood pumping",
    "Chill group fitness class suitable for all levels",
    "Competitive sports event with a friendly atmosphere",
    "Outdoor movement session in the fresh Berlin air",
    "Dance-based fitness class with great music",
  ],
  "Food & Drink": [
    "Curated tasting experience with local Berlin producers",
    "Pop-up kitchen featuring a guest chef from the neighborhood",
    "Craft cocktail evening with creative seasonal drinks",
    "Community dinner with shared plates and good conversation",
    "Street food pop-up bringing global flavors to Kreuzberg",
  ],
  "Arts & Culture": [
    "Gallery opening with works from emerging Berlin artists",
    "Interactive art installation exploring urban identity",
    "Film screening followed by director Q&A",
    "Poetry slam with local and international performers",
    "Photography exhibition documenting Kreuzberg life",
  ],
  "Music & Nightlife": [
    "Live set from a rising Berlin electronic artist",
    "Intimate jazz session in a candlelit venue",
    "Open mic night — bring your instrument or just listen",
    "DJ set spanning house, techno, and everything between",
    "Vinyl-only listening session with rare records",
  ],
  "Shopping & Markets": [
    "Evening market with handmade goods and vintage finds",
    "Designer pop-up shop featuring local creators",
    "Book swap and reading event at a cozy café",
    "Art print and zine fair with independent publishers",
    "Night market with food stalls and live music",
  ],
  "Networking": [
    "Casual meetup for tech workers and creatives",
    "Speed networking event with free drinks",
    "Co-working social with lightning talks",
    "Founder mixer at a Kreuzberg startup hub",
    "Creative professionals happy hour",
  ],
  "Outdoors": [
    "Evening walk along the Landwehr Canal",
    "Sunset gathering at a Kreuzberg rooftop",
    "Outdoor cinema screening in a courtyard",
    "Urban sketching session by the Spree",
    "Night photography walk through the neighborhood",
  ],
  "Wellness": [
    "Restorative yoga session to wind down the day",
    "Sound healing experience with singing bowls",
    "Guided meditation in a peaceful studio space",
    "Breathwork and relaxation workshop",
    "Candlelit yin yoga with ambient music",
  ],
  "Workshops": [
    "Hands-on ceramics workshop — make your own mug",
    "Creative writing workshop with a published author",
    "Cocktail mixing masterclass",
    "Screen printing workshop — bring your own design",
    "Fermentation basics — make your own kombucha",
  ],
  "Community": [
    "Neighborhood dinner bringing together locals and newcomers",
    "Language tandem evening — practice German and more",
    "Board game night with free entry and snacks",
    "Community storytelling circle",
    "Volunteer cook-along for a local food bank",
  ],
};

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedKreuzberg() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (let i = 0; i < 100; i++) {
      const eventType = rand(TYPES);
      const descs = DESCRIPTIONS[eventType];
      const venue = rand(VENUES);
      const street = rand(STREETS);
      const kiez = rand(KIEZE);
      const houseNum = randInt(1, 120);
      const startHour = randInt(17, 21);
      const startMin = rand(["00", "15", "30", "45"]);
      const endHour = Math.min(startHour + randInt(1, 3), 23);
      const energy = randInt(1, 5);
      const social = randInt(1, 5);

      await client.query(
        `INSERT INTO events (title, description, date, start_time, end_time, address, bezirk, kiez, event_type, energy_score, social_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `${venue} — ${eventType} Night`,
          rand(descs),
          "2026-02-18",
          `${startHour}:${startMin}`,
          `${endHour}:00`,
          `${street} ${houseNum}, 10999 Berlin`,
          "Kreuzberg",
          kiez,
          eventType,
          energy,
          social,
        ],
      );
    }

    await client.query("COMMIT");
    console.log("Seeded 100 Kreuzberg evening events for 2026-02-18");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedKreuzberg().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

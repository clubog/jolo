// Generates dates dynamically relative to today
function d(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const seedEvents = [
  // Fitness/Sports
  {
    title: "Morning Yoga in Volkspark",
    description: "Start your day with a calming vinyasa flow session in the beautiful Volkspark Friedrichshain. Bring your own mat.",
    date: d(1), start_time: "08:00", end_time: "09:30",
    address: "Volkspark Friedrichshain, Am Friedrichshain, 10249",
    bezirk: "Friedrichshain", kiez: "Volkspark",
    event_type: "Fitness/Sports", energy_score: 3, social_score: 2,
  },
  {
    title: "Bouldering Session at Berta Block",
    description: "Indoor bouldering for all levels with great community vibes and a solid café.",
    date: d(2), start_time: "10:00", end_time: "12:00",
    address: "Mühlenstraße 62, 13187 Berlin",
    bezirk: "Prenzlauer Berg", kiez: "Gleimviertel",
    event_type: "Fitness/Sports", energy_score: 5, social_score: 3,
  },
  {
    title: "Ping Pong at Dr. Pong",
    description: "The legendary round-robin ping pong bar. Grab a paddle, wait your turn, and play against strangers.",
    date: d(3), start_time: "19:00", end_time: "23:00",
    address: "Eberswalder Str. 21, 10437 Berlin",
    bezirk: "Prenzlauer Berg", kiez: "Helmholtzkiez",
    event_type: "Fitness/Sports", energy_score: 4, social_score: 5,
  },

  // Food & Drink
  {
    title: "Street Food Thursday at Markthalle Neun",
    description: "Berlin's best street food market. Dozens of stalls with food from around the world. Come hungry.",
    date: d(4), start_time: "17:00", end_time: "22:00",
    address: "Eisenbahnstraße 42/43, 10997 Berlin",
    bezirk: "Kreuzberg", kiez: "Wrangelkiez",
    event_type: "Food & Drink", energy_score: 3, social_score: 4,
  },
  {
    title: "Natural Wine Tasting at Suff",
    description: "Cozy natural wine bar with curated tastings. Knowledgeable staff, relaxed atmosphere.",
    date: d(1), start_time: "18:00", end_time: "21:00",
    address: "Weserstraße 120, 12045 Berlin",
    bezirk: "Neukölln", kiez: "Reuterkiez",
    event_type: "Food & Drink", energy_score: 2, social_score: 3,
  },
  {
    title: "Brunch at House of Small Wonder",
    description: "Japanese-meets-Brooklyn brunch spot. The matcha pancakes are legendary. Reserve ahead.",
    date: d(2), start_time: "10:00", end_time: "13:00",
    address: "Johannisstraße 20, 10117 Berlin",
    bezirk: "Mitte", kiez: "Scheunenviertel",
    event_type: "Food & Drink", energy_score: 2, social_score: 3,
  },

  // Arts & Culture
  {
    title: "Hamburger Bahnhof — Contemporary Art",
    description: "One of Berlin's premier contemporary art museums. Current exhibition explores post-digital identity.",
    date: d(1), start_time: "10:00", end_time: "18:00",
    address: "Invalidenstraße 50-51, 10557 Berlin",
    bezirk: "Mitte", kiez: "Moabit",
    event_type: "Arts & Culture", energy_score: 2, social_score: 1,
  },
  {
    title: "Gallery Hop on Auguststraße",
    description: "Walk through a dozen galleries on Berlin's most iconic art street. Free entry to most spaces.",
    date: d(3), start_time: "14:00", end_time: "18:00",
    address: "Auguststraße, 10117 Berlin",
    bezirk: "Mitte", kiez: "Scheunenviertel",
    event_type: "Arts & Culture", energy_score: 2, social_score: 2,
  },
  {
    title: "KW Institute Open Studio Night",
    description: "Artists-in-residence open their studios to the public. Free drinks, conversations with creators.",
    date: d(5), start_time: "19:00", end_time: "22:00",
    address: "Auguststraße 69, 10117 Berlin",
    bezirk: "Mitte", kiez: "Scheunenviertel",
    event_type: "Arts & Culture", energy_score: 3, social_score: 4,
  },

  // Music & Nightlife
  {
    title: "Jazz Night at Donau115",
    description: "Intimate jazz performances in a cozy Neukölln bar. No cover, just buy drinks and enjoy.",
    date: d(2), start_time: "20:00", end_time: "23:00",
    address: "Donaustraße 115, 12043 Berlin",
    bezirk: "Neukölln", kiez: "Reuterkiez",
    event_type: "Music & Nightlife", energy_score: 2, social_score: 3,
  },
  {
    title: "Ambient Night at OHM",
    description: "Immersive ambient and experimental electronic music in a converted power station.",
    date: d(6), start_time: "22:00", end_time: "04:00",
    address: "Köpenicker Str. 70, 10179 Berlin",
    bezirk: "Kreuzberg", kiez: "Luisenstadt",
    event_type: "Music & Nightlife", energy_score: 3, social_score: 2,
  },
  {
    title: "Karaoke at Monster Ronson's",
    description: "Berlin's most iconic karaoke bar. Private booths, wild costumes, no judgment. Absolute blast.",
    date: d(4), start_time: "20:00", end_time: "02:00",
    address: "Warschauer Str. 34, 10243 Berlin",
    bezirk: "Friedrichshain", kiez: "Warschauer",
    event_type: "Music & Nightlife", energy_score: 5, social_score: 5,
  },

  // Shopping & Markets
  {
    title: "Mauerpark Flea Market",
    description: "Berlin's most famous Sunday flea market. Vintage treasures, handmade crafts, and the legendary karaoke amphitheater.",
    date: d(7), start_time: "10:00", end_time: "18:00",
    address: "Bernauer Str. 63-64, 13355 Berlin",
    bezirk: "Prenzlauer Berg", kiez: "Mauerpark",
    event_type: "Shopping & Markets", energy_score: 3, social_score: 4,
  },
  {
    title: "Nowkoelln Flowmarkt",
    description: "Charming canal-side flea market in Neukölln. Design, art, vintage clothing, and good coffee.",
    date: d(8), start_time: "10:00", end_time: "17:00",
    address: "Maybachufer, 12047 Berlin",
    bezirk: "Neukölln", kiez: "Maybachufer",
    event_type: "Shopping & Markets", energy_score: 2, social_score: 3,
  },
  {
    title: "Bikini Berlin Concept Mall",
    description: "Curated concept stores and pop-ups with views of the Berlin Zoo. Architecture alone is worth the visit.",
    date: d(1), start_time: "11:00", end_time: "19:00",
    address: "Budapester Str. 38-50, 10787 Berlin",
    bezirk: "Charlottenburg", kiez: "City West",
    event_type: "Shopping & Markets", energy_score: 2, social_score: 2,
  },

  // Networking
  {
    title: "Berlin Startup Meetup",
    description: "Monthly meetup for founders and tech workers. Lightning talks, free pizza, great connections.",
    date: d(5), start_time: "18:30", end_time: "21:00",
    address: "Factory Berlin, Rheinsberger Str. 76/77, 10115 Berlin",
    bezirk: "Mitte", kiez: "Rosenthaler Vorstadt",
    event_type: "Networking", energy_score: 4, social_score: 5,
  },
  {
    title: "Creative Freelancers Brunch",
    description: "Casual brunch for designers, writers, and creatives. Share what you're working on, find collaborators.",
    date: d(3), start_time: "11:00", end_time: "14:00",
    address: "Betahaus, Rudi-Dutschke-Str. 23, 10969 Berlin",
    bezirk: "Kreuzberg", kiez: "Checkpoint Charlie",
    event_type: "Networking", energy_score: 3, social_score: 4,
  },

  // Outdoors
  {
    title: "Sunrise Walk at Tempelhofer Feld",
    description: "Walk, jog, or skate on the old airport runway. The open space is surreal at sunrise.",
    date: d(1), start_time: "07:00", end_time: "09:00",
    address: "Tempelhofer Damm, 12101 Berlin",
    bezirk: "Neukölln", kiez: "Tempelhof",
    event_type: "Outdoors", energy_score: 3, social_score: 1,
  },
  {
    title: "Spree River Kayaking",
    description: "Guided 2-hour kayak tour through central Berlin. See the city from a totally different perspective.",
    date: d(4), start_time: "14:00", end_time: "16:00",
    address: "Fischerinsel, 10179 Berlin",
    bezirk: "Mitte", kiez: "Fischerinsel",
    event_type: "Outdoors", energy_score: 4, social_score: 3,
  },
  {
    title: "Botanical Garden Walk",
    description: "One of the world's largest botanical gardens. The tropical greenhouse is incredible even on cold days.",
    date: d(6), start_time: "10:00", end_time: "16:00",
    address: "Königin-Luise-Str. 6-8, 14195 Berlin",
    bezirk: "Wilmersdorf", kiez: "Dahlem",
    event_type: "Outdoors", energy_score: 2, social_score: 1,
  },

  // Wellness
  {
    title: "Sauna Day at Liquidrom",
    description: "Floating in a salt pool with underwater music and ambient lights. Pure bliss after a long week.",
    date: d(2), start_time: "10:00", end_time: "22:00",
    address: "Möckernstraße 10, 10963 Berlin",
    bezirk: "Kreuzberg", kiez: "Gleisdreieck",
    event_type: "Wellness", energy_score: 1, social_score: 1,
  },
  {
    title: "Sound Bath at Lichtenberg Studio",
    description: "90-minute session with singing bowls and gongs. Deeply relaxing. Bring a blanket.",
    date: d(5), start_time: "18:00", end_time: "19:30",
    address: "Herzbergstraße 55, 10365 Berlin",
    bezirk: "Lichtenberg", kiez: "Herzbergstraße",
    event_type: "Wellness", energy_score: 1, social_score: 2,
  },
  {
    title: "Morning Meditation at Insight Timer Studio",
    description: "Free guided meditation session in a peaceful courtyard space. All levels welcome.",
    date: d(3), start_time: "08:00", end_time: "09:00",
    address: "Oranienstraße 25, 10999 Berlin",
    bezirk: "Kreuzberg", kiez: "Oranienplatz",
    event_type: "Wellness", energy_score: 1, social_score: 2,
  },

  // Workshops
  {
    title: "Pottery Workshop at Keramik Café",
    description: "Hand-build your own cup or bowl. No experience needed. They fire it and you pick it up later.",
    date: d(4), start_time: "15:00", end_time: "17:30",
    address: "Mariannenstr. 4, 10997 Berlin",
    bezirk: "Kreuzberg", kiez: "Mariannenplatz",
    event_type: "Workshops", energy_score: 2, social_score: 3,
  },
  {
    title: "Fermentation Workshop",
    description: "Learn to make kimchi, sauerkraut, and kombucha. Take home your creations.",
    date: d(6), start_time: "14:00", end_time: "17:00",
    address: "Grünberger Str. 73, 10245 Berlin",
    bezirk: "Friedrichshain", kiez: "Boxhagener Platz",
    event_type: "Workshops", energy_score: 2, social_score: 4,
  },
  {
    title: "Analog Photography Walk",
    description: "Shoot a roll of 35mm film on a guided walk through Kreuzberg. Development included.",
    date: d(8), start_time: "11:00", end_time: "14:00",
    address: "Kottbusser Tor, 10999 Berlin",
    bezirk: "Kreuzberg", kiez: "Kottbusser Tor",
    event_type: "Workshops", energy_score: 3, social_score: 3,
  },

  // Community
  {
    title: "Refugee Kitchen Community Dinner",
    description: "Chefs from Syria, Afghanistan, and Eritrea cook a feast. Fixed price, communal tables, amazing stories.",
    date: d(5), start_time: "19:00", end_time: "22:00",
    address: "Oranienplatz 17, 10999 Berlin",
    bezirk: "Kreuzberg", kiez: "Oranienplatz",
    event_type: "Community", energy_score: 3, social_score: 5,
  },
  {
    title: "Language Exchange at Babel Café",
    description: "Rotating table conversations in German, English, Spanish, and more. Great way to practice and meet people.",
    date: d(2), start_time: "19:00", end_time: "21:00",
    address: "Karl-Marx-Allee 36, 10178 Berlin",
    bezirk: "Friedrichshain", kiez: "Karl-Marx-Allee",
    event_type: "Community", energy_score: 3, social_score: 5,
  },
  {
    title: "Community Garden Open Day",
    description: "Help plant, learn about urban gardening, and share cake with neighbors. Real Kiez vibes.",
    date: d(7), start_time: "14:00", end_time: "18:00",
    address: "Scharnweberstraße 159, 13405 Berlin",
    bezirk: "Pankow", kiez: "Schönholz",
    event_type: "Community", energy_score: 3, social_score: 4,
  },

  // Additional events to reach 30+
  {
    title: "Techno Yoga at Sisyphos",
    description: "Yes, it's real. Yoga to a live DJ in a converted factory. The most Berlin thing you can do.",
    date: d(7), start_time: "09:00", end_time: "11:00",
    address: "Hauptstraße 15, 10317 Berlin",
    bezirk: "Lichtenberg", kiez: "Rummelsburg",
    event_type: "Wellness", energy_score: 4, social_score: 3,
  },
  {
    title: "Vintage Kino at Lichtblick",
    description: "Tiny 32-seat cinema showing restored classics. Tonight: Wings of Desire by Wim Wenders.",
    date: d(3), start_time: "20:30", end_time: "22:30",
    address: "Kastanienallee 77, 10435 Berlin",
    bezirk: "Prenzlauer Berg", kiez: "Kastanienallee",
    event_type: "Arts & Culture", energy_score: 1, social_score: 2,
  },
  {
    title: "Späti Crawl Neukölln",
    description: "A guided tour of Neukölln's best Spätis (corner shops). Beer, snacks, and local lore.",
    date: d(6), start_time: "19:00", end_time: "22:00",
    address: "Sonnenallee 67, 12045 Berlin",
    bezirk: "Neukölln", kiez: "Sonnenallee",
    event_type: "Food & Drink", energy_score: 3, social_score: 4,
  },
  {
    title: "Outdoor Calisthenics at Görlitzer Park",
    description: "Join the regulars at the outdoor gym. All fitness levels, chill atmosphere, free workout.",
    date: d(1), start_time: "16:00", end_time: "18:00",
    address: "Görlitzer Str. 1, 10997 Berlin",
    bezirk: "Kreuzberg", kiez: "Görlitzer Park",
    event_type: "Fitness/Sports", energy_score: 5, social_score: 3,
  },
  {
    title: "Rooftop Session at Klunkerkranich",
    description: "Neukölln's rooftop garden bar with DJs, cocktails, and sunset views over the city.",
    date: d(4), start_time: "17:00", end_time: "23:00",
    address: "Karl-Marx-Straße 66, 12043 Berlin",
    bezirk: "Neukölln", kiez: "Karl-Marx-Straße",
    event_type: "Music & Nightlife", energy_score: 3, social_score: 4,
  },
];

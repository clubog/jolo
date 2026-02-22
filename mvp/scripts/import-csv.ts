/**
 * Import events from The Next Day CSV into the JOLO MVP database.
 *
 * Usage: npx tsx scripts/import-csv.ts /path/to/file.csv
 *
 * Maps CSV categories to our schema and infers event traits from descriptions.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

// --- Category mapping from The Next Day newsletter categories ---
const CATEGORY_MAP: Record<string, string> = {
  live: "music",
  frequency: "music",
  sweat: "community",  // fitness, dance, movement
  watch: "film",
  look: "art",
  misc: "other",
  save_the_date: "other",
  community: "community",
  taste: "other",
};

// --- Keyword-based category refinement ---
function refineCategory(baseCategory: string, title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (baseCategory === "other" || baseCategory === "community") {
    if (/\b(tech|ai|startup|hack|code|web3|blockchain|crypto)\b/.test(text)) return "tech";
    if (/\b(workshop|class|course|learn|hands-on|masterclass)\b/.test(text)) return "workshop";
    if (/\b(club|techno|rave|dj set|dance floor)\b/.test(text)) return "club";
    if (/\b(gallery|exhibit|museum|art|installation)\b/.test(text)) return "art";
    if (/\b(film|cinema|screening|movie)\b/.test(text)) return "film";
    if (/\b(concert|live music|gig|band|orchestra)\b/.test(text)) return "music";
  }

  if (baseCategory === "music") {
    if (/\b(club|techno|rave|dance floor|dj set)\b/.test(text)) return "club";
  }

  if (baseCategory === "community") {
    if (/\b(yoga|pilates|meditation|wellness|sauna|spa|breathwork)\b/.test(text)) return "community";
    if (/\b(workshop|class|course)\b/.test(text)) return "workshop";
  }

  return baseCategory;
}

// --- Infer event traits from description + category ---
function inferTraits(category: string, title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  let socialDensity = 0.5;
  let socialOpenness = 0.5;
  let energyLevel = 0.5;
  let accessDifficulty = 0.3;
  const crowdVector: Record<string, number> = {};

  // Category-based defaults
  switch (category) {
    case "art":
      socialDensity = 0.3; socialOpenness = 0.4; energyLevel = 0.3; break;
    case "film":
      socialDensity = 0.3; socialOpenness = 0.2; energyLevel = 0.2; break;
    case "music":
      socialDensity = 0.5; socialOpenness = 0.5; energyLevel = 0.5; break;
    case "club":
      socialDensity = 0.8; socialOpenness = 0.4; energyLevel = 0.85; accessDifficulty = 0.5; break;
    case "tech":
      socialDensity = 0.6; socialOpenness = 0.6; energyLevel = 0.5; break;
    case "workshop":
      socialDensity = 0.4; socialOpenness = 0.6; energyLevel = 0.4; break;
    case "community":
      socialDensity = 0.4; socialOpenness = 0.7; energyLevel = 0.4; break;
  }

  // Keyword adjustments
  if (/\b(intimate|small|quiet|calm|gentle|mellow)\b/.test(text)) {
    socialDensity = Math.max(0.1, socialDensity - 0.2);
    energyLevel = Math.max(0.1, energyLevel - 0.2);
  }
  if (/\b(loud|massive|packed|wild|intense|high.?energy)\b/.test(text)) {
    socialDensity = Math.min(0.95, socialDensity + 0.2);
    energyLevel = Math.min(0.95, energyLevel + 0.2);
  }
  if (/\b(networking|pitch|founder|startup|vc|investor)\b/.test(text)) {
    crowdVector.founders = 0.7;
    crowdVector.investors = 0.5;
    socialDensity = Math.max(socialDensity, 0.6);
  }
  if (/\b(artist|creative|curator|gallery)\b/.test(text)) {
    crowdVector.artists = 0.6;
  }
  if (/\b(tourist|sightseeing|guided tour)\b/.test(text)) {
    crowdVector.tourists = 0.5;
  }
  if (/\b(yoga|meditation|breathwork|wellness|spa|sauna)\b/.test(text)) {
    socialDensity = 0.2; energyLevel = 0.2; socialOpenness = 0.3; accessDifficulty = 0.1;
  }
  if (/\b(invite.?only|exclusive|members|private)\b/.test(text)) {
    accessDifficulty = Math.max(accessDifficulty, 0.7);
  }
  if (/\b(free|no.?cover|donation)\b/.test(text)) {
    accessDifficulty = Math.max(0, accessDifficulty - 0.1);
  }

  return {
    socialDensity: Math.round(socialDensity * 100) / 100,
    socialOpenness: Math.round(socialOpenness * 100) / 100,
    energyLevel: Math.round(energyLevel * 100) / 100,
    accessDifficulty: Math.round(accessDifficulty * 100) / 100,
    crowdVector,
  };
}

// --- Extract subtags from description ---
function extractSubtags(category: string, title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];

  const tagPatterns: [RegExp, string][] = [
    [/\b(techno|house|electronic|ambient|drone)\b/, "$1"],
    [/\b(jazz|classical|chamber|orchestr)\b/, "$1"],
    [/\b(punk|rock|indie|pop|folk|hip.?hop|rap)\b/, "$1"],
    [/\b(yoga|pilates|meditation|breathwork)\b/, "$1"],
    [/\b(workshop|class|masterclass)\b/, "workshop"],
    [/\b(networking|pitch|meetup)\b/, "$1"],
    [/\b(gallery|exhibit|installation|sculpture)\b/, "$1"],
    [/\b(film|cinema|screening|documentary)\b/, "$1"],
    [/\b(food|cooking|tasting|brunch)\b/, "$1"],
    [/\b(market|flea|vintage)\b/, "$1"],
    [/\b(comedy|stand.?up|improv)\b/, "comedy"],
    [/\b(reading|book|literary|poetry)\b/, "literary"],
    [/\b(dance|ballet|contemporary dance)\b/, "dance"],
    [/\b(outdoor|park|garden|rooftop)\b/, "outdoor"],
    [/\b(queer|lgbtq|feminist)\b/, "queer"],
    [/\b(kids|family|children)\b/, "family"],
    [/\b(free entry|free event|no cover)\b/, "free"],
  ];

  for (const [pattern, tag] of tagPatterns) {
    const match = text.match(pattern);
    if (match) tags.push(tag === "$1" ? match[1] : tag);
  }

  return [...new Set(tags)].slice(0, 6);
}

// --- Parse price ---
function parsePrice(priceStr: string, isFree: string): { min: number | null; max: number | null } {
  if (isFree === "True" || isFree === "true") return { min: 0, max: 0 };
  if (!priceStr || priceStr.trim() === "") return { min: null, max: null };

  const clean = priceStr.replace(/[€EUR\s]/g, "");

  // Range: "12-20" or "14–15"
  const rangeMatch = clean.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }

  // Single value
  const single = parseFloat(clean);
  if (!isNaN(single)) return { min: single, max: single };

  return { min: null, max: null };
}

// --- Parse CSV (handle quoted fields with commas) ---
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  let i = 1;
  while (i < lines.length) {
    let line = lines[i];
    // Handle multi-line quoted fields
    while (countQuotes(line) % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += "\n" + lines[i];
    }
    if (line.trim()) {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] ?? "";
      }
      rows.push(row);
    }
    i++;
  }

  return rows;
}

function countQuotes(s: string): number {
  return (s.match(/"/g) || []).length;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// --- Main ---
async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-csv.ts <path-to-csv>");
    process.exit(1);
  }

  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} rows from CSV`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = row.title?.trim();
    const startDate = row.start_date?.trim();

    if (!title || !startDate) {
      skipped++;
      continue;
    }

    // Extract date and time
    const date = startDate.slice(0, 10); // YYYY-MM-DD
    const startTime = startDate.length > 10 ? startDate.slice(11, 16) : null; // HH:MM

    // Map category
    const csvCategory = row.category?.trim().toLowerCase() ?? "";
    const baseCategory = CATEGORY_MAP[csvCategory] ?? "other";
    const category = refineCategory(baseCategory, title, row.description ?? "");

    // Infer traits
    const traits = inferTraits(category, title, row.description ?? "");
    const subtags = extractSubtags(category, title, row.description ?? "");
    const { min: priceMin, max: priceMax } = parsePrice(row.price ?? "", row.is_free ?? "");

    // Check for duplicates by title + date
    const existing = await prisma.event.findFirst({
      where: { title, date },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.event.create({
      data: {
        title,
        date,
        startTime,
        endTime: null,
        district: row.region?.trim() || null,
        venue: row.venue_name?.trim() || null,
        category,
        subtags: JSON.stringify(subtags),
        priceEurMin: priceMin,
        priceEurMax: priceMax,
        socialDensity: traits.socialDensity,
        socialOpenness: traits.socialOpenness,
        energyLevel: traits.energyLevel,
        crowdVector: JSON.stringify(traits.crowdVector),
        accessDifficulty: traits.accessDifficulty,
        source: `nextday-${row.newsletter ?? ""}`,
        sourceUrl: row.url?.trim() || null,
      },
    });
    imported++;
  }

  console.log(`Imported: ${imported}, Skipped: ${skipped} (no title/date or duplicate)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export const BEZIRKE = [
  "Mitte",
  "Kreuzberg",
  "Friedrichshain",
  "Neukölln",
  "Prenzlauer Berg",
  "Charlottenburg",
  "Schöneberg",
  "Wilmersdorf",
  "Treptow-Köpenick",
  "Pankow",
] as const;

export const EVENT_TYPES = [
  "Fitness/Sports",
  "Food & Drink",
  "Arts & Culture",
  "Music & Nightlife",
  "Shopping & Markets",
  "Networking",
  "Outdoors",
  "Wellness",
  "Workshops",
  "Community",
] as const;

export const TIME_BLOCKS = {
  morning: { label: "Morning", range: "08:00 – 12:00", emoji: "🌅" },
  afternoon: { label: "Afternoon", range: "12:00 – 17:00", emoji: "☀️" },
  evening: { label: "Evening", range: "17:00 – 23:00", emoji: "🌙" },
} as const;

export const VIBE_LABELS: Record<string, string> = {
  "1-1": "Quiet Solo Recharge",
  "1-2": "Calm & Cozy",
  "1-3": "Chill Explorer",
  "1-4": "Relaxed Social",
  "1-5": "Mellow Hangout",
  "2-1": "Solo Wanderer",
  "2-2": "Laid-back Stroll",
  "2-3": "Easy-going Day",
  "2-4": "Cozy Hangout",
  "2-5": "Social Butterfly",
  "3-1": "Focused Explorer",
  "3-2": "Curious Wanderer",
  "3-3": "Balanced Berlin Day",
  "3-4": "Fun with Friends",
  "3-5": "Group Adventure",
  "4-1": "Solo Adventurer",
  "4-2": "Active Explorer",
  "4-3": "Energetic Day Out",
  "4-4": "High-Vibe Crew",
  "4-5": "Party Squad",
  "5-1": "Intense Solo Mission",
  "5-2": "Power Explorer",
  "5-3": "Full Throttle",
  "5-4": "Wild Night Out",
  "5-5": "Maximum Berlin",
};

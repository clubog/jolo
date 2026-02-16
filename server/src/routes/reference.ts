import { Router } from "express";

export const referenceRouter = Router();

const BEZIRKE = [
  { name: "Mitte", kieze: ["Scheunenviertel", "Rosenthaler Vorstadt", "Moabit", "Fischerinsel"] },
  { name: "Kreuzberg", kieze: ["Wrangelkiez", "Oranienplatz", "Görlitzer Park", "Kottbusser Tor", "Gleisdreieck", "Luisenstadt", "Mariannenplatz", "Checkpoint Charlie"] },
  { name: "Friedrichshain", kieze: ["Boxhagener Platz", "Warschauer", "Karl-Marx-Allee", "Volkspark"] },
  { name: "Neukölln", kieze: ["Reuterkiez", "Maybachufer", "Sonnenallee", "Karl-Marx-Straße", "Tempelhof"] },
  { name: "Prenzlauer Berg", kieze: ["Helmholtzkiez", "Kastanienallee", "Mauerpark", "Gleimviertel"] },
  { name: "Charlottenburg", kieze: ["City West", "Savignyplatz"] },
  { name: "Schöneberg", kieze: ["Nollendorfplatz", "Winterfeldtplatz"] },
  { name: "Wilmersdorf", kieze: ["Dahlem", "Bundesplatz"] },
  { name: "Treptow-Köpenick", kieze: ["Alt-Treptow", "Köpenick"] },
  { name: "Pankow", kieze: ["Schönholz", "Weißensee"] },
];

const EVENT_TYPES = [
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
];

referenceRouter.get("/bezirke", (_req, res) => {
  res.json(BEZIRKE);
});

referenceRouter.get("/event-types", (_req, res) => {
  res.json(EVENT_TYPES);
});

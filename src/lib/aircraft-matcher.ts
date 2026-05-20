import { aircraftDatabase, AircraftEntry } from "./aircraft-db";

export interface VisualFeatures {
  engineCount?: number;
  engineType?: string;
  enginePlacement?: string;
  wingPosition?: string;
  wingShape?: string;
  tailType?: string;
  landingGear?: string;
  sizeClass?: string;
  era?: string;
  distinguishingFeatures?: string[];
  markings?: string;
  livery?: string;
}

interface ScoredEntry {
  entry: AircraftEntry;
  score: number;
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalizeString(a);
  const nb = normalizeString(b);
  return na.includes(nb) || nb.includes(na);
}

export function matchAircraft(
  features: VisualFeatures,
  topN: number = 10
): AircraftEntry[] {
  const scored: ScoredEntry[] = aircraftDatabase.map((entry) => {
    let score = 0;
    const v = entry.visual;

    // Engine count is a very strong signal (worth the most)
    if (features.engineCount !== undefined) {
      if (features.engineCount === v.engineCount) {
        score += 30;
      } else {
        // Wrong engine count is a strong negative
        score -= 20;
      }
    }

    // Engine type
    if (features.engineType) {
      if (fuzzyMatch(features.engineType, v.engineType)) {
        score += 15;
      } else {
        score -= 5;
      }
    }

    // Engine placement
    if (features.enginePlacement) {
      if (fuzzyMatch(features.enginePlacement, v.enginePlacement)) {
        score += 10;
      }
    }

    // Wing position is very distinctive
    if (features.wingPosition) {
      if (fuzzyMatch(features.wingPosition, v.wingPosition)) {
        score += 20;
      } else {
        score -= 10;
      }
    }

    // Wing shape
    if (features.wingShape) {
      if (fuzzyMatch(features.wingShape, v.wingShape)) {
        score += 12;
      } else {
        score -= 3;
      }
    }

    // Tail type is extremely distinctive (triple tail, T-tail, twin tail, etc.)
    if (features.tailType) {
      if (fuzzyMatch(features.tailType, v.tailType)) {
        score += 25;
      } else {
        score -= 15;
      }
    }

    // Landing gear
    if (features.landingGear) {
      if (fuzzyMatch(features.landingGear, v.landingGear)) {
        score += 8;
      }
    }

    // Size class
    if (features.sizeClass) {
      if (fuzzyMatch(features.sizeClass, v.sizeClass)) {
        score += 10;
      } else {
        score -= 3;
      }
    }

    // Era
    if (features.era) {
      if (fuzzyMatch(features.era, v.era)) {
        score += 8;
      } else {
        score -= 2;
      }
    }

    // Distinguishing features — each match is very valuable
    if (features.distinguishingFeatures && features.distinguishingFeatures.length > 0) {
      for (const feat of features.distinguishingFeatures) {
        const featLower = feat.toLowerCase();
        for (const dbFeat of v.distinguishingFeatures) {
          if (
            dbFeat.toLowerCase().includes(featLower) ||
            featLower.includes(dbFeat.toLowerCase())
          ) {
            score += 20;
            break;
          }
        }
      }
    }

    // Markings/text matching against aliases and name
    if (features.markings) {
      const markingsLower = features.markings.toLowerCase();
      // Check against aircraft name, manufacturer, and aliases
      const allNames = [
        entry.name,
        entry.manufacturer,
        ...(entry.aliases || []),
      ];
      for (const name of allNames) {
        if (markingsLower.includes(name.toLowerCase())) {
          score += 30;
          break;
        }
        if (name.toLowerCase().includes(markingsLower)) {
          score += 15;
          break;
        }
      }
    }

    // Livery matching against operator field or aliases
    if (features.livery) {
      const liveryLower = features.livery.toLowerCase();
      const allNames = [entry.name, ...(entry.aliases || [])];
      for (const name of allNames) {
        if (liveryLower.includes(name.toLowerCase())) {
          score += 10;
          break;
        }
      }
    }

    return { entry, score };
  });

  // Sort by score descending and return top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN).filter((s) => s.score > 0).map((s) => s.entry);
}

export function formatCandidatesForAI(candidates: AircraftEntry[]): string {
  return candidates
    .map((c, i) => {
      const feats = c.visual.distinguishingFeatures.join(", ");
      return `${i + 1}. ${c.name} (${c.manufacturer}) — ${c.type}, ${c.visual.engineCount} ${c.visual.engineType} engine(s), ${c.visual.wingPosition} ${c.visual.wingShape} wing, ${c.visual.tailType} tail, ${c.visual.sizeClass} size, ${c.visual.era} era. Key features: ${feats}. Aliases: ${c.aliases.join(", ")}`;
    })
    .join("\n");
}

export function getEntryByName(name: string): AircraftEntry | undefined {
  const nameLower = name.toLowerCase();
  return aircraftDatabase.find(
    (e) =>
      e.name.toLowerCase() === nameLower ||
      e.aliases.some((a) => a.toLowerCase() === nameLower) ||
      e.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(e.name.toLowerCase())
  );
}

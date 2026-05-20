export interface AircraftEntry {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  variant?: string;
  natoReportingName?: string;
  firstFlight?: string;
  inService?: string;
  role: string;
  country: string;
  specs: {
    wingspan?: string;
    length?: string;
    maxSpeed?: string;
    range?: string;
    ceiling?: string;
    engines?: string;
    crew?: string;
    capacity?: string;
  };
  description: string;
  funFact: string;
  visual: {
    engineCount: number;
    engineType: "piston" | "turboprop" | "turbofan" | "turbojet" | "turboshaft" | "electric";
    enginePlacement: string;
    wingPosition: "high" | "mid" | "low" | "biplane" | "parasol" | "variable";
    wingShape: "straight" | "swept" | "delta" | "forward-swept" | "variable-sweep" | "cranked-delta" | "trapezoidal";
    tailType: "conventional" | "t-tail" | "triple" | "twin" | "v-tail" | "twin-boom" | "no-tail" | "cruciform" | "h-tail";
    landingGear: "tricycle" | "taildragger" | "tandem" | "skids" | "retractable" | "fixed";
    sizeClass: "ultralight" | "light" | "medium" | "large" | "heavy" | "super-heavy";
    era: "pre-wwii" | "wwii" | "early-jet" | "cold-war" | "modern" | "contemporary";
    distinguishingFeatures: string[];
  };
  aliases: string[];
}

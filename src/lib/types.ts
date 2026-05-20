export interface AircraftIdentification {
  identified: boolean;
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
  confidence: "high" | "medium" | "low";
  visualCues?: string;
  description: string;
  funFact: string;
  livery?: string;
  operator?: string;
}

export interface HistoryEntry {
  id: string;
  imageData: string;
  result: AircraftIdentification;
  timestamp: string;
}

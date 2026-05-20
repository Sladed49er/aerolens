// Master aircraft database — combines all category files
import { AircraftEntry } from "./db/types";
import { commercialBoeing } from "./db/commercial-boeing";
import { commercialAirbus } from "./db/commercial-airbus";
import { commercialOther } from "./db/commercial-other";
import { militaryFighters } from "./db/military-fighters";
import { militaryOther } from "./db/military-other";
import { warbirdFighters } from "./db/warbirds-fighters";
import { warbirdBombers } from "./db/warbirds-bombers";
import { helicopters } from "./db/helicopters";
import { generalAviation } from "./db/general-aviation";
import { businessJets } from "./db/business-jets";
import { specialAircraft } from "./db/special";

export type { AircraftEntry };

export const aircraftDatabase: AircraftEntry[] = [
  ...commercialBoeing,
  ...commercialAirbus,
  ...commercialOther,
  ...militaryFighters,
  ...militaryOther,
  ...warbirdFighters,
  ...warbirdBombers,
  ...helicopters,
  ...generalAviation,
  ...businessJets,
  ...specialAircraft,
];

export const aircraftCount = aircraftDatabase.length;

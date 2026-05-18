import { countries } from "./countries";

export type VisaRequirement = "visa-free" | "visa-on-arrival" | "e-visa" | "visa-required" | "eta";

export interface VisaMatrixEntry {
  requirement: VisaRequirement;
  duration?: string;
  notes?: string;
}

export const availablePassports = countries.map((country) => country.code);

const countryByCode = new Map(countries.map((country) => [country.code, country]));

const rankDestination = (passportCode: string, destinationCode: string): number => {
  const seed = `${passportCode}:${destinationCode}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % 1000;
};

const getPassportAccessCount = (passportCode: string): number => {
  const passport = countryByCode.get(passportCode);
  const maxDestinations = Math.max(availablePassports.length - 1, 0);
  const storedScore = passport?.visaFreeDestinations ?? 0;

  return Math.max(0, Math.min(storedScore, maxDestinations));
};

export const getVisaRequirementFromMatrix = (
  passportCode: string,
  destinationCode: string,
): VisaMatrixEntry | undefined => {
  if (passportCode === destinationCode) return undefined;

  const accessCount = getPassportAccessCount(passportCode);
  const accessPercentile = accessCount / Math.max(availablePassports.length - 1, 1);
  const destinationRank = rankDestination(passportCode, destinationCode) / 1000;

  if (destinationRank <= accessPercentile * 0.72) {
    return { requirement: "visa-free", duration: "90 days" };
  }

  if (destinationRank <= accessPercentile * 0.82) {
    return { requirement: "visa-on-arrival" };
  }

  if (destinationRank <= accessPercentile * 0.9) {
    return { requirement: "eta" };
  }

  if (destinationRank <= Math.min(accessPercentile + 0.18, 0.96)) {
    return { requirement: "e-visa" };
  }

  return { requirement: "visa-required" };
};

export const getVisaRequirementColor = (requirement: VisaRequirement): string => {
  switch (requirement) {
    case "visa-free":
      return "#22c55e";
    case "visa-on-arrival":
      return "#166534";
    case "e-visa":
      return "#eab308";
    case "eta":
      return "#f97316";
    case "visa-required":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

export const getVisaRequirementLabel = (requirement: VisaRequirement): string => {
  switch (requirement) {
    case "visa-free":
      return "Visa Free";
    case "visa-on-arrival":
      return "Visa on Arrival";
    case "e-visa":
      return "e-Visa";
    case "eta":
      return "ETA Required";
    case "visa-required":
      return "Visa Required";
    default:
      return "Unknown";
  }
};

export const getPassportStats = (passportCode: string) => {
  if (!countryByCode.has(passportCode)) return null;

  const stats = { visaFree: 0, visaOnArrival: 0, eVisa: 0, eta: 0, visaRequired: 0 };
  let total = 0;

  availablePassports.forEach((destinationCode) => {
    if (destinationCode === passportCode) return;

    total += 1;
    const entry = getVisaRequirementFromMatrix(passportCode, destinationCode);

    switch (entry?.requirement) {
      case "visa-free":
        stats.visaFree += 1;
        break;
      case "visa-on-arrival":
        stats.visaOnArrival += 1;
        break;
      case "e-visa":
        stats.eVisa += 1;
        break;
      case "eta":
        stats.eta += 1;
        break;
      default:
        stats.visaRequired += 1;
        break;
    }
  });

  return {
    total,
    ...stats,
  };
};

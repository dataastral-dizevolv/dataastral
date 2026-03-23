export type CalcStep = 1 | 2 | 3;
export type CalcState = "flow" | "loading" | "result";

export interface ThemeOption {
  id: "amor" | "carreira" | "financas" | "saude" | "familia" | "viagens";
  name: string;
}

export type ThemeId = ThemeOption["id"];

export interface LocationData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string | null;
  displayName: string;
  rank?: number;
  type?: string;
  addresstype?: string;
}

export interface PredictSuccessResponse {
  prediction: string;
  eventDate?: string;
  eventDateIso?: string;
  remainingCredits: number;
  cached?: boolean;
  engineCode?: string;
  requestId?: string;
}

export interface PredictErrorResponse {
  error: string;
  code?: string;
  details?: string;
  requestId?: string;
}

export interface GeneratePredictionInput {
  date: string;
  time: string;
  placeQuery: string;
  birthLocation: string;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
  targetBirthDate?: string;
  targetBirthTime?: string;
  targetBirthTimezone?: string | null;
  conflictDate?: string;
}

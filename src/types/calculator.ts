export type CalcStep = 1 | 2 | 3;
export type CalcState = "flow" | "loading" | "result";
export type CalculatorQuestionType = "select" | "text" | "checkbox";
export type DynamicAnswerValue = string | string[];

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
  prediction_text?: string;
  audio_text?: string;
  whatsapp_text?: string;
  eventDate?: string;
  eventDateIso?: string;
  predictionId?: string;
  remainingCredits: number;
  remainingFreeQuestions?: number;
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
  gender?: "homem" | "mulher" | "nao_binario";
  placeQuery: string;
  birthLocation: string;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
  targetBirthDate?: string;
  targetBirthTime?: string;
  targetBirthTimezone?: string | null;
  conflictDate?: string;
  dynamicAnswers?: Record<string, DynamicAnswerValue>;
}

export interface CalculatorQuestionOption {
  value: string;
  label: string;
}

export interface CalculatorQuestion {
  id: number;
  category: "amor" | "carreira" | "financas" | "saude" | "familia" | "viagens";
  label: string;
  fieldName: string;
  type: CalculatorQuestionType;
  options: CalculatorQuestionOption[];
  order: number;
  isRequired: boolean;
}

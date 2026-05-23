    export interface Participant {
  id: number;
  name: string;
  mobile: string;         // full e.g. "+923001234567"
  mobileRaw: string;      // digits only e.g. "3001234567"
  countryCode: string;    // e.g. "+92"
  email: string;
  score: number;
  totalQuestions: number;
  timeSec: number;
  timeStr: string;        // "1:42"
  date: string;           // "Jun 5"
  sessionId: string;
  answers: Record<number, string>;
}

export interface Question {
  id: number;
  text: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: { letter: string; text: string }[];
  correctAnswer: string;
}

export interface CurrentUser {
  name: string;
  mobile: string;
  mobileRaw: string;
  countryCode: string;
  email: string;
}
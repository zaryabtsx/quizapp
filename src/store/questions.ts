import { Question } from "../types";

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is the capital of France?",
    difficulty: "EASY",
    options: [
      { letter: "A", text: "London" },
      { letter: "B", text: "Paris" },
      { letter: "C", text: "Berlin" },
      { letter: "D", text: "Madrid" },
      { letter: "E", text: "Rome" },
    ],
    correctAnswer: "B",
  },
  {
    id: 2,
    text: "Which planet is known as the Red Planet?",
    difficulty: "EASY",
    options: [
      { letter: "A", text: "Venus" },
      { letter: "B", text: "Jupiter" },
      { letter: "C", text: "Mars" },
      { letter: "D", text: "Saturn" },
      { letter: "E", text: "Neptune" },
    ],
    correctAnswer: "C",
  },
  {
    id: 3,
    text: "What is the largest ocean on Earth?",
    difficulty: "MEDIUM",
    options: [
      { letter: "A", text: "Atlantic Ocean" },
      { letter: "B", text: "Indian Ocean" },
      { letter: "C", text: "Arctic Ocean" },
      { letter: "D", text: "Pacific Ocean" },
      { letter: "E", text: "Southern Ocean" },
    ],
    correctAnswer: "D",
  },
  {
    id: 4,
    text: "Who painted the Mona Lisa?",
    difficulty: "MEDIUM",
    options: [
      { letter: "A", text: "Vincent van Gogh" },
      { letter: "B", text: "Pablo Picasso" },
      { letter: "C", text: "Leonardo da Vinci" },
      { letter: "D", text: "Michelangelo" },
      { letter: "E", text: "Rembrandt" },
    ],
    correctAnswer: "C",
  },
  {
    id: 5,
    text: "What is the smallest prime number?",
    difficulty: "HARD",
    options: [
      { letter: "A", text: "0" },
      { letter: "B", text: "1" },
      { letter: "C", text: "2" },
      { letter: "D", text: "3" },
      { letter: "E", text: "5" },
    ],
    correctAnswer: "C",
  },
];
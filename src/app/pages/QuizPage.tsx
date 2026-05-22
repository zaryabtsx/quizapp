import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

const MOCK_QUESTIONS = [
  {
    id: 1,
    text: "What is the capital of France?",
    difficulty: "EASY",
    options: [
      { letter: "A", text: "London" },
      { letter: "B", text: "Paris" },
      { letter: "C", text: "Berlin" },
      { letter: "D", text: "Madrid" },
      { letter: "E", text: "Rome" }
    ],
    correctAnswer: "B"
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
      { letter: "E", text: "Neptune" }
    ],
    correctAnswer: "C"
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
      { letter: "E", text: "Southern Ocean" }
    ],
    correctAnswer: "D"
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
      { letter: "E", text: "Rembrandt" }
    ],
    correctAnswer: "C"
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
      { letter: "E", text: "5" }
    ],
    correctAnswer: "C"
  }
];

export function QuizPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [inactivityTime, setInactivityTime] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inactivity tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setInactivityTime(prev => {
        const newTime = prev + 1;
        if (newTime === 240) { // 4 minutes
          setShowInactivityWarning(true);
          setWarningCountdown(60);
        }
        if (newTime === 300) { // 5 minutes
          navigate("/session-expired");
        }
        return newTime;
      });
    }, 1000);

    const resetInactivity = () => {
      setInactivityTime(0);
      setShowInactivityWarning(false);
    };

    window.addEventListener("click", resetInactivity);
    window.addEventListener("keypress", resetInactivity);
    window.addEventListener("touchstart", resetInactivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", resetInactivity);
      window.removeEventListener("keypress", resetInactivity);
      window.removeEventListener("touchstart", resetInactivity);
    };
  }, [navigate]);

  // Warning countdown
  useEffect(() => {
    if (showInactivityWarning && warningCountdown > 0) {
      const interval = setInterval(() => {
        setWarningCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showInactivityWarning, warningCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (letter: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: letter }));
  };

  const handleNext = () => {
    if (currentQuestion < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz complete
      setShowCompletionModal(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        navigate(`/campaign/${campaignId}/results`, {
          state: { answers: selectedAnswers, timeElapsed }
        });
      }, 1500);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const question = MOCK_QUESTIONS[currentQuestion];
  const difficultyColor = 
    question.difficulty === "EASY" ? "bg-[#10B981] text-white" :
    question.difficulty === "MEDIUM" ? "bg-[#F59E0B] text-white" :
    "bg-[#EF4444] text-white";

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-card border-b border-border shadow-sm px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Summer Quiz Challenge</span>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#4F46E5]">
              Question {currentQuestion + 1} of {MOCK_QUESTIONS.length}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-foreground" />
              <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColor}`}>
              {question.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-center mb-4">{question.text}</h3>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option) => {
            const isSelected = selectedAnswers[currentQuestion] === option.letter;
            return (
              <button
                key={option.letter}
                onClick={() => handleSelectAnswer(option.letter)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-[#4F46E5] bg-[#4F46E5]/5 ring-1 ring-[#4F46E5]"
                    : "border-border hover:border-[#4F46E5] hover:shadow-sm"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  isSelected ? "bg-[#4F46E5] text-white" : "bg-[#4F46E5]/10 text-[#4F46E5]"
                }`}>
                  {option.letter}
                </div>
                <span className="flex-1 text-left">{option.text}</span>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  isSelected ? "border-[#4F46E5] bg-[#4F46E5]" : "border-border"
                }`}>
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border-2 border-border rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#4F46E5] transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion]}
            className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {currentQuestion === MOCK_QUESTIONS.length - 1 ? "Submit" : "Next"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {MOCK_QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentQuestion
                  ? "bg-[#4F46E5] w-6"
                  : selectedAnswers[index]
                  ? "bg-[#4F46E5]/50"
                  : "bg-border"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Session Expiring Soon</h3>
            <p className="text-center text-muted-foreground mb-4">
              You'll be disconnected due to inactivity in {warningCountdown} seconds
            </p>
            <button
              onClick={() => {
                setShowInactivityWarning(false);
                setInactivityTime(0);
              }}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold"
            >
              Stay Active
            </button>
          </div>
        </div>
      )}

      {/* Quiz Complete Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-muted-foreground mt-4">Calculating your results...</p>
          </div>
        </div>
      )}
    </div>
  );
}

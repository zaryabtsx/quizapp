import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "../../store/StoreContext";
import { QUESTIONS } from "../../store/questions";
import { saveQuizResult } from "../lib/api";
import { formatTimePadded, formatTime, generateSessionId, formatDate } from "../../store/utils";
import { Participant } from "../../types";

const INACTIVITY_WARN_SEC = 240; // 4 min
const INACTIVITY_EXPIRE_SEC = 300; // 5 min

export function QuizPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { currentUser, setQuizStartTime, addParticipant } = useStore();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [inactivityTime, setInactivityTime] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  // Redirect if no user
  useEffect(() => {
    if (!currentUser) navigate(`/campaign/${campaignId}/register`);
    else {
      startTimeRef.current = Date.now();
      setQuizStartTime(startTimeRef.current);
    }
  }, [currentUser, campaignId, navigate, setQuizStartTime]);

  // Global timer
  useEffect(() => {
    const id = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Inactivity tracking
  useEffect(() => {
    const id = setInterval(() => {
      setInactivityTime((prev) => {
        const next = prev + 1;
        if (next === INACTIVITY_WARN_SEC) {
          setShowInactivityWarning(true);
          setWarningCountdown(60);
        }
        if (next >= INACTIVITY_EXPIRE_SEC) {
          navigate("/session-expired");
        }
        return next;
      });
    }, 1000);

    const reset = () => {
      setInactivityTime(0);
      setShowInactivityWarning(false);
    };

    window.addEventListener("click", reset);
    window.addEventListener("keypress", reset);
    window.addEventListener("touchstart", reset);

    return () => {
      clearInterval(id);
      window.removeEventListener("click", reset);
      window.removeEventListener("keypress", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [navigate]);

  // Warning countdown
  useEffect(() => {
    if (!showInactivityWarning || warningCountdown <= 0) return;
    const id = setInterval(() => setWarningCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [showInactivityWarning, warningCountdown]);

  const question = QUESTIONS[currentQuestion];
  const totalQuestions = QUESTIONS.length;
  const progressPct = ((currentQuestion + 1) / totalQuestions) * 100;

  const difficultyStyle: Record<string, string> = {
    EASY: "bg-emerald-500 text-white",
    MEDIUM: "bg-amber-500 text-white",
    HARD: "bg-red-500 text-white",
  };

  const handleSelectAnswer = (letter: string) => {
    if (showAnswer) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: letter }));
    setShowAnswer(true);
  };

  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      finishQuiz();
    } else {
      setCurrentQuestion((q) => q + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
      setShowAnswer(!!selectedAnswers[currentQuestion - 1]);
    }
  };

  const finishQuiz = async () => {
    const timeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const score = QUESTIONS.reduce(
      (acc:any, q:any, i:any) => acc + (selectedAnswers[i] === q.correctAnswer ? 1 : 0),
      0
    );

    const participant: Participant = {
      id: Date.now(),
      name: currentUser!.name,
      mobile: currentUser!.mobile,
      mobileRaw: currentUser!.mobileRaw,
      countryCode: currentUser!.countryCode,
      email: currentUser!.email || "—",
      score,
      totalQuestions,
      timeSec,
      timeStr: formatTime(timeSec),
      date: formatDate(new Date()),
      sessionId: generateSessionId(),
      answers: selectedAnswers,
    };

    addParticipant(participant);
    localStorage.setItem("latest_quiz_result", JSON.stringify(participant));

    try {
      const responsePayload: any = {
        campaign_id: campaignId ?? "",
        score,
        time_taken: timeSec,
        total: totalQuestions,
      };

      const result = await saveQuizResult(
        {
          full_name: currentUser!.name,
          email: currentUser!.email || null,
          mobile: currentUser!.mobile,
        },
        responsePayload
      );

      if (result?.response?.id) {
        localStorage.setItem("latest_response_id", result.response.id);
      }
    } catch (err) {
      console.error("Failed to persist quiz result:", err);
    }

    setShowCompletionModal(true);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    setTimeout(() => {
      navigate(`/campaign/${campaignId}/results`, {
        state: { participantId: participant.id, answers: selectedAnswers, timeSec },
      });
    }, 1600);
  };

  const getOptionClass = (letter: string) => {
    const isSelected = selectedAnswers[currentQuestion] === letter;
    const isCorrect = letter === question.correctAnswer;

    if (!showAnswer) {
      return isSelected
        ? "border-[#4F46E5] bg-[#4F46E5]/5 ring-1 ring-[#4F46E5]"
        : "border-border hover:border-[#4F46E5] hover:shadow-sm";
    }
    if (isCorrect) return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500";
    if (isSelected && !isCorrect) return "border-red-400 bg-red-50 dark:bg-red-900/20";
    return "border-border opacity-60";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-card border-b border-border shadow-sm px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Summer Quiz Challenge 2025</span>
            <span className="text-sm font-semibold text-[#4F46E5]">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-foreground" />
              <span className="font-mono text-lg font-semibold">
                {formatTimePadded(timeElapsed)}
              </span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyStyle[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-3">
            Question {currentQuestion + 1}
          </p>
          <h3 className="text-xl font-semibold text-center leading-relaxed">
            {question.text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option:any) => {
            const isSelected = selectedAnswers[currentQuestion] === option.letter;
            const isCorrect = showAnswer && option.letter === question.correctAnswer;
            const isWrong = showAnswer && isSelected && !isCorrect;

            return (
              <button
                key={option.letter}
                onClick={() => handleSelectAnswer(option.letter)}
                disabled={showAnswer}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${getOptionClass(option.letter)}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                    isCorrect
                      ? "bg-emerald-500 text-white"
                      : isWrong
                      ? "bg-red-400 text-white"
                      : isSelected
                      ? "bg-[#4F46E5] text-white"
                      : "bg-[#4F46E5]/10 text-[#4F46E5]"
                  }`}
                >
                  {option.letter}
                </div>
                <span className="flex-1 text-sm font-medium">{option.text}</span>
                {isCorrect && (
                  <span className="text-emerald-500 font-bold text-lg">✓</span>
                )}
                {isWrong && (
                  <span className="text-red-400 font-bold text-lg">✕</span>
                )}
                {!showAnswer && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-[#4F46E5] bg-[#4F46E5]" : "border-border"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border-2 border-border rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#4F46E5] transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestion]}
            className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLastQuestion ? "Submit" : "Next"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {QUESTIONS.map((_, i:any) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentQuestion
                  ? "w-6 bg-[#4F46E5]"
                  : selectedAnswers[i]
                  ? "w-2 bg-[#4F46E5]/50"
                  : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Inactivity Warning */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Session Expiring</h3>
            <p className="text-center text-muted-foreground text-sm mb-4">
              You'll be disconnected due to inactivity in{" "}
              <span className="font-bold text-amber-500">{warningCountdown}s</span>
            </p>
            <button
              onClick={() => {
                setShowInactivityWarning(false);
                setInactivityTime(0);
              }}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Stay Active
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm">Calculating your results...</p>
          </div>
        </div>
      )}
    </div>
  );
}
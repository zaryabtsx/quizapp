import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Trophy, Clock, CheckCircle, XCircle, RotateCcw, BarChart2 } from "lucide-react";
import { useStore } from "../../store/StoreContext";
import { QUESTIONS } from "../../store/questions";
import { formatTime } from "../../store/utils";
import { Participant } from "../../types";

export function ResultsPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const location = useLocation();
  const { participants, clearCurrentSession } = useStore();

  const { participantId, answers, timeSec } = (location.state as {
    participantId: number;
    answers: Record<number, string>;
    timeSec: number;
  }) ?? {};

  const [storedParticipant, setStoredParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    if (!participantId) {
      const saved = localStorage.getItem("latest_quiz_result");
      if (saved) {
        try {
          setStoredParticipant(JSON.parse(saved));
        } catch {
          setStoredParticipant(null);
        }
      }
    }
  }, [participantId]);

  const participant = participants.find((p:any) => p.id === participantId) || storedParticipant;
  const rank = participant ? participants.findIndex((p:any) => p.id === participant?.id) + 1 : null;

  const score = participant?.score ?? 0;
  const total = QUESTIONS.length;
  const pct = Math.round((score / total) * 100);

  const emoji =
    score === total ? "🏆" :
    score >= 4 ? "🎉" :
    score >= 3 ? "😊" :
    score >= 2 ? "😐" : "😔";

  const title =
    score === total ? "Perfect Score!" :
    score >= 4 ? "Excellent Work!" :
    score >= 3 ? "Well Done!" :
    score >= 2 ? "Good Effort!" : "Keep Practicing!";

  const handlePlayAgain = () => {
    clearCurrentSession();
    navigate(`/campaign/${campaignId}/register`);
  };

  if (!participant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No result data found.</p>
          <button
            onClick={() => navigate(`/campaign/${campaignId}/register`)}
            className="text-[#4F46E5] underline"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Score card */}
        <div className="bg-card border border-border rounded-2xl p-7 text-center mb-5">
          <div className="text-5xl mb-4">{emoji}</div>

          {/* Circular score */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-xs text-muted-foreground">/{total}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1">{title}</h1>
          <p className="text-muted-foreground text-sm mb-5">
            You ranked{" "}
            <span className="text-[#4F46E5] font-bold">#{rank}</span> on the leaderboard
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Trophy className="w-4 h-4" />, label: "Score", val: `${score}/${total}` },
              { icon: <Clock className="w-4 h-4" />, label: "Time", val: formatTime(participant.timeSec) },
              { icon: <BarChart2 className="w-4 h-4" />, label: "Rank", val: `#${rank}` },
            ].map((s) => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-3">
                <div className="flex justify-center mb-1 text-[#4F46E5]">{s.icon}</div>
                <div className="text-lg font-bold">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Answer Review
          </h2>
          <div className="space-y-3">
            {QUESTIONS.map((q:any, i:any) => {
              const userAnswer = answers?.[i];
              const correct = userAnswer === q.correctAnswer;
              const userOpt = q.options.find((o:any) => o.letter === userAnswer);
              const correctOpt = q.options.find((o:any) => o.letter === q.correctAnswer);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border ${
                    correct
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                      : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {correct ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">{q.text}</p>
                      {!correct && userOpt && (
                        <p className="text-xs text-red-500">
                          Your answer: <span className="font-semibold">{userOpt.text}</span>
                        </p>
                      )}
                      {!correct && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Correct: <span className="font-semibold">{correctOpt?.text}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        q.difficulty === "EASY"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : q.difficulty === "MEDIUM"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate("/admin/leaderboard")}
          className="w-full h-12 border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl font-semibold transition-colors mb-3 flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          View Full Leaderboard
        </button>
        <button
          onClick={handlePlayAgain}
          className="w-full h-12 border border-border hover:border-[#4F46E5] text-muted-foreground hover:text-foreground rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
      </div>
    </div>
  );
}
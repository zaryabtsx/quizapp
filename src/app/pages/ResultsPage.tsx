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

  const participant = participants.find((p: any) => p.id === participantId) || storedParticipant;
  const rank = participant ? participants.findIndex((p: any) => p.id === participant?.id) + 1 : null;

  const score = participant?.score ?? 0;
  const total = QUESTIONS.length;
  const pct = Math.round((score / total) * 100);

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
  <div className="h-screen bg-background flex flex-col px-4 py-5 overflow-hidden">
    <div className="max-w-lg mx-auto w-full flex flex-col h-full gap-3">

      {/* Score card */}
      <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 flex-shrink-0">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold leading-none">{score}</span>
            <span className="text-[10px] text-muted-foreground">/{total}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 ">
          <h1 className="text-base font-bold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked <span className="text-[#4F46E5] font-bold">#{rank}</span> on the leaderboard
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {[
            { icon: <Clock className="w-3.5 h-3.5" />, val: formatTime(participant.timeSec) },
            { icon: <BarChart2 className="w-3.5 h-3.5" />, val: `#${rank}` },
          ].map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-lg px-2.5 py-2 text-center">
              <div className="flex justify-center mb-0.5 text-[#4F46E5]">{s.icon}</div>
              <div className="text-xs font-bold whitespace-nowrap">{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer review — shrinks to content, never stretches */}
      <div className="bg-card border border-border rounded-2xl flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-4 pb-2">
          Answer Review
        </h2>
        <div className="px-4 pb-4 space-y-2">
          {QUESTIONS.map((q: any, i: any) => {
            const userAnswer = answers?.[i];
            const correct = userAnswer === q.correctAnswer;
            const userOpt = q.options.find((o: any) => o.letter === userAnswer);
            const correctOpt = q.options.find((o: any) => o.letter === q.correctAnswer);

            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border ${
                  correct
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {correct
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium mb-0.5 leading-snug">{q.text}</p>
                    {!correct && userOpt && (
                      <p className="text-[11px] text-red-500">
                        Your answer: <span className="font-semibold">{userOpt.text}</span>
                      </p>
                    )}
                    {!correct && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        Correct: <span className="font-semibold">{correctOpt?.text}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spacer pushes buttons to bottom */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => navigate("/admin/leaderboard")}
          className="flex-1 h-11 border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Trophy className="w-4 h-4" />
          Leaderboard
        </button>
        <button
          onClick={handlePlayAgain}
          className="flex-1 h-11 border border-border hover:border-[#4F46E5] text-muted-foreground hover:text-foreground rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Play Again
        </button>
      </div>

    </div>
  </div>
)}
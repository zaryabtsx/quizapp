// src/pages/CampaignQuiz.tsx
// Route: /campaign/:campaignId/quiz
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle, Trophy, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DBQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string;
}

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  total: number;
  percentage: number;
  completed_at: string;
}

interface Participant {
  name: string;
  email: string | null;
  startedAt: string;
}

type QuizState = "loading" | "error" | "playing" | "results";
type AnswerState = "unanswered" | "correct" | "wrong";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOptions(q: DBQuestion): { letter: string; text: string }[] {
  return [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e]
    .map((text, i) => ({ letter: OPTION_LETTERS[i], text: text ?? "" }))
    .filter((o) => o.text.length > 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CampaignQuiz() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);

  // Quiz progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [answers, setAnswers] = useState<{ questionId: string; chosen: string; correct: boolean }[]>([]);

  // Results
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Load campaign + questions ──
  useEffect(() => {
    if (!campaignId) return;

    // Read participant from sessionStorage (set by CampaignRegister)
    const raw = sessionStorage.getItem(`quiz_participant_${campaignId}`);
    if (!raw) {
      navigate(`/campaign/${campaignId}/register`);
      return;
    }
    setParticipant(JSON.parse(raw));

    const load = async () => {
      // Campaign
      const { data: camp, error: campErr } = await supabase
        .from("campaigns")
        .select("id, name, is_active")
        .eq("id", campaignId)
        .single();

      if (campErr || !camp) { setErrorMsg("Campaign not found."); setQuizState("error"); return; }
      if (!camp.is_active) { setErrorMsg("This campaign is no longer active."); setQuizState("error"); return; }
      setCampaignName(camp.name);

      // Questions — randomise order for fairness
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option")
        .eq("campaign_id", campaignId);

      if (qErr || !qs || qs.length === 0) {
        setErrorMsg("No questions found for this campaign.");
        setQuizState("error");
        return;
      }

      // Shuffle
      const shuffled = [...qs].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setQuizState("playing");
    };

    load();
  }, [campaignId, navigate]);

  // ── Select an answer ──
  const handleSelectOption = (letter: string) => {
    if (answerState !== "unanswered") return; // already answered
    const q = questions[currentIndex];
    const isCorrect = letter === q.correct_option;
    setSelectedOption(letter);
    setAnswerState(isCorrect ? "correct" : "wrong");
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, chosen: letter, correct: isCorrect },
    ]);
  };

  // ── Next question or finish ──
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswerState("unanswered");
    } else {
      // Calculate score
      const correctCount = [...answers, ...[]].filter((a) => a.correct).length +
        (answerState === "correct" ? 1 : 0); // include current answer
      // (answers state update is async so re-compute from full list)
      const allAnswers = [
        ...answers,
        {
          questionId: questions[currentIndex].id,
          chosen: selectedOption ?? "",
          correct: answerState === "correct",
        },
      ];
      const finalScore = allAnswers.filter((a) => a.correct).length;
      setScore(finalScore);
      await submitResult(finalScore, questions.length);
      setQuizState("results");
    }
  }, [currentIndex, questions, answers, answerState, selectedOption]);

  // ── Submit result to Supabase ──
  const submitResult = async (finalScore: number, total: number) => {
    if (!campaignId || !participant) return;
    setSubmitting(true);
    try {
      await supabase.from("quiz_results").insert({
        campaign_id: campaignId,
        player_name: participant.name,
        player_email: participant.email,
        score: finalScore,
        total: total,
        percentage: Math.round((finalScore / total) * 100),
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to save result:", e);
    } finally {
      setSubmitting(false);
    }
    fetchLeaderboard();
  };

  // ── Fetch leaderboard ──
  const fetchLeaderboard = async () => {
    if (!campaignId) return;
    setLoadingLeaderboard(true);
    const { data } = await supabase
      .from("quiz_results")
      .select("id, player_name, score, total, percentage, completed_at")
      .eq("campaign_id", campaignId)
      .order("percentage", { ascending: false })
      .order("completed_at", { ascending: true })
      .limit(10);
    setLeaderboard((data ?? []) as LeaderboardEntry[]);
    setLoadingLeaderboard(false);
  };

  // ── Retake ──
  const handleRetake = () => {
    sessionStorage.removeItem(`quiz_participant_${campaignId}`);
    navigate(`/campaign/${campaignId}/register`);
  };

  // ─────────────────────── Render ────────────────────────────────────────────

  if (quizState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  if (quizState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ── Results screen ──
  if (quizState === "results") {
    const pct = Math.round((score / questions.length) * 100);
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <div className="min-h-screen bg-background p-4 pb-10">
        <div className="max-w-lg mx-auto space-y-4 pt-8">

          {/* Score card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="h-2 bg-[#4F46E5]" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#4F46E5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-[#4F46E5]" />
              </div>
              <h2 className="text-xl font-bold mb-1">
                {pct >= 80 ? "Excellent! 🎉" : pct >= 50 ? "Good effort! 👍" : "Keep practicing! 💪"}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{participant?.name}</p>

              <div className="text-5xl font-bold text-[#4F46E5] mb-1">
                {score}/{questions.length}
              </div>
              <p className="text-muted-foreground text-sm">{pct}% correct</p>

              {/* Progress bar */}
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4F46E5] rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Answer review */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Answer Review</h3>
            <div className="space-y-3">
              {questions.map((q, i) => {
                const ans = answers[i];
                const isCorrect = ans?.correct ?? false;
                return (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      isCorrect ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-clamp-2">{q.question_text}</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Correct: <span className="font-semibold">{q.correct_option}</span>
                        {" — "}
                        {getOptions(q).find((o) => o.letter === q.correct_option)?.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Leaderboard
              </h3>
              <span className="text-xs text-muted-foreground">{campaignName}</span>
            </div>

            {loadingLeaderboard ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No results yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.player_name === participant?.name;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                        isMe
                          ? "bg-[#4F46E5]/10 border border-[#4F46E5]/20"
                          : "bg-muted/40"
                      }`}
                    >
                      <span className="w-6 text-center text-base">
                        {medals[i] ?? `#${i + 1}`}
                      </span>
                      <span className={`flex-1 font-medium ${isMe ? "text-[#4F46E5]" : ""}`}>
                        {entry.player_name}
                        {isMe && (
                          <span className="ml-2 text-xs bg-[#4F46E5] text-white px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {entry.score}/{entry.total}
                      </span>
                      <span className="text-muted-foreground text-xs w-12 text-right">
                        {entry.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Retake */}
          <button
            onClick={handleRetake}
            className="w-full h-12 border border-border hover:bg-muted rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Playing screen ──
  const q = questions[currentIndex];
  const options = getOptions(q);
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4 pb-10">
      <div className="max-w-lg mx-auto pt-6 space-y-4">

        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{campaignName}</span>
            <span className="text-sm font-semibold text-[#4F46E5]">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wide mb-3">
            Question {currentIndex + 1}
          </p>
          <p className="text-lg font-semibold leading-snug">{q.question_text}</p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map(({ letter, text }) => {
            const isSelected = selectedOption === letter;
            const isCorrect = letter === q.correct_option;
            const revealed = answerState !== "unanswered";

            let cls =
              "w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left text-sm font-medium transition-all ";

            if (!revealed) {
              cls += "border-border bg-card hover:border-[#4F46E5]/40 hover:bg-[#4F46E5]/5 cursor-pointer";
            } else if (isCorrect) {
              cls += "border-emerald-300 bg-emerald-50 text-emerald-800 cursor-default";
            } else if (isSelected && !isCorrect) {
              cls += "border-red-300 bg-red-50 text-red-800 cursor-default";
            } else {
              cls += "border-border bg-muted/30 text-muted-foreground cursor-default";
            }

            return (
              <button
                key={letter}
                className={cls}
                onClick={() => handleSelectOption(letter)}
                disabled={revealed}
              >
                {/* Letter badge */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    revealed && isCorrect
                      ? "bg-emerald-500 text-white"
                      : revealed && isSelected && !isCorrect
                      ? "bg-red-400 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1">{text}</span>
                {revealed && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
                {revealed && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Next button — only shows after answering */}
        {answerState !== "unanswered" && (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {currentIndex < questions.length - 1 ? "Next Question →" : "See Results →"}
          </button>
        )}

        {/* Score so far */}
        <p className="text-center text-xs text-muted-foreground">
          Score so far: {answers.filter((a) => a.correct).length + (answerState === "correct" ? 1 : 0)}{" "}
          / {currentIndex + (answerState !== "unanswered" ? 1 : 0)}
        </p>
      </div>
    </div>
  );
}
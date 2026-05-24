import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { RotateCcw, Share2, Trophy, Clock, Star, ChevronRight } from "lucide-react";
import { useStore } from "../../store/StoreContext";
import { QUESTIONS } from "../../store/questions";
import { formatTime } from "../../store/utils";
import { getLeaderboard } from "../../lib/api";
import { Participant } from "../../types";

// ─── Persistence key ─────────────────────────────────────────────────────────
// FIX 5: define a single key used both here (read) and in the quiz submission
// handler (write). The quiz page must call:
//   localStorage.setItem(RESULT_KEY, JSON.stringify({ name, mobile, score, timeSec }))
// right before navigating to this page.
const RESULT_KEY = "latest_quiz_result";

// ─── Field-normalisation helpers ─────────────────────────────────────────────
// FIX 6 & 7: unify field access across Supabase rows and local store objects.

function getEntryName(entry: any): string {
  // Supabase leaderboard uses participant_name; local store uses name
  return entry?.participant_name ?? entry?.name ?? "—";
}

function getEntryTimeSec(entry: any): number {
  // Supabase leaderboard uses time_taken; local store uses timeSec
  return Number(entry?.time_taken ?? entry?.timeSec ?? 0);
}

function getEntryScore(entry: any, fallbackTotal: number): string {
  const score = entry?.score ?? 0;
  const total = entry?.total ?? entry?.totalQuestions ?? fallbackTotal;
  return `${score}/${total}`;
}

function getEntryMobile(entry: any): string {
  // Supabase uses participant_mobile; local store uses mobile
  return entry?.participant_mobile ?? entry?.mobile ?? "";
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const location = useLocation();
  const { participants, clearCurrentSession } = useStore();

  const locationState = location.state as {
    participantId?: number;
    answers?: Record<number, string>;
    timeSec?: number;
  } | null;

  const { participantId } = locationState ?? {};

  // FIX 5: read persisted result from localStorage (written by quiz page on submit)
  const [storedParticipant, setStoredParticipant] = useState<Participant | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(RESULT_KEY);
    if (saved) {
      try {
        setStoredParticipant(JSON.parse(saved));
      } catch {
        localStorage.removeItem(RESULT_KEY);
      }
    }
  }, []);

  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  // Fetch live leaderboard
  useEffect(() => {
    async function fetchBoard() {
      setLoadingBoard(true);
      try {
        const data = await getLeaderboard(campaignId, 10);
        setLiveLeaderboard(data ?? []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setLiveLeaderboard([]);
      } finally {
        setLoadingBoard(false);
      }
    }
    fetchBoard();
  }, [campaignId]);

  // Resolve the current participant: prefer live store, fall back to persisted
  const participant =
    (participantId != null
      ? participants.find((p: any) => p.id === participantId)
      : null) ?? storedParticipant;

  const total = QUESTIONS.length;
  const score = participant?.score ?? 0;
  const pct   = total > 0 ? Math.round((score / total) * 100) : 0;

  // Board: prefer live Supabase data, fall back to in-memory store
  const board = liveLeaderboard.length > 0 ? liveLeaderboard : participants.slice(0, 10);

  // FIX 6: rank detection uses both mobile (primary, reliable) and name (fallback)
  const myRank = (() => {
    if (!participant) return null;
    const myMobile = (participant as any).mobile ?? "";
    const myName   = (participant as any).name ?? "";

    if (liveLeaderboard.length > 0) {
      const idx = liveLeaderboard.findIndex(
        (e) =>
          (myMobile && getEntryMobile(e) === myMobile) ||
          getEntryName(e) === myName
      );
      return idx >= 0 ? idx + 1 : null;
    }
    const idx = participants.findIndex((p: any) => p.id === (participant as any).id);
    return idx >= 0 ? idx + 1 : null;
  })();

  const isWinner = myRank === 1;
  const isPerfect = score === total;

  const handlePlayAgain = () => {
    clearCurrentSession();
    // FIX 5: clear persisted result when starting fresh
    localStorage.removeItem(RESULT_KEY);
    navigate(`/campaign/${campaignId}/register`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Quiz Result",
        text: `I scored ${score}/${total} on the quiz! Can you beat me?`,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "#F59E0B";
    if (rank === 2) return "#9CA3AF";
    if (rank === 3) return "#CD7C3F";
    return "#E5E7EB";
  };

  const getRankTextColor = (rank: number) => (rank <= 3 ? "#fff" : "#374151");

  // ── No result guard ────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FB] px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-4">

        {/* ── Winner Hero Card ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          {/* Top banner */}
          <div
            className="px-6 pt-8 pb-6 text-center relative"
            style={{
              background: isWinner
                ? "linear-gradient(160deg, #1a1040 0%, #2d1b6e 60%, #4c2b9e 100%)"
                : "linear-gradient(160deg, #1e3a5f 0%, #1a4a8a 60%, #2563eb 100%)",
            }}
          >
            {/* Confetti dots */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6"][i % 5],
                  top: `${10 + (i % 4) * 18}%`,
                  left: `${5 + i * 8}%`,
                  opacity: 0.7,
                }}
              />
            ))}

            <p className="text-white/80 text-sm font-medium mb-1">Congratulations!</p>
            {isWinner ? (
              <h1 className="text-white font-black text-4xl leading-tight mb-1">
                You are the<br />
                <span style={{ color: "#F59E0B", fontSize: "2.75rem" }}>WINNER!</span>
              </h1>
            ) : (
              <h1 className="text-white font-black text-3xl leading-tight mb-1">
                Quiz Complete!
              </h1>
            )}
            <p className="text-white/70 text-sm">
              {isPerfect
                ? "Outstanding performance!"
                : pct >= 60
                ? "Great effort!"
                : "Keep practicing!"}
            </p>

            {isWinner && (
              <div className="flex justify-center mt-4 mb-2">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                  style={{ background: "rgba(245,158,11,0.2)", border: "3px solid #F59E0B" }}
                >
                  🏆
                </div>
              </div>
            )}
          </div>

          {/* User card */}
          <div className="bg-white px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{ background: "#4F46E5" }}
              >
                {(participant as any).name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-base">{(participant as any).name}</p>
                <p className="text-sm font-medium" style={{ color: "#F59E0B" }}>
                  {isWinner ? "Champion of the Quiz!" : myRank ? `Rank #${myRank}` : "Result submitted"}
                </p>
              </div>
              {myRank && myRank <= 3 && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: getRankBg(myRank) }}
                >
                  {myRank}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-xs text-gray-500 font-medium">Your Time</span>
                </div>
                {/* FIX 7: use timeSec from store participant (set by quiz page) */}
                <p className="font-black text-gray-900 text-xl">
                  {formatTime((participant as any).timeSec ?? 0)}
                </p>
                {isWinner && (
                  <p className="text-[10px] text-[#F59E0B] font-semibold mt-0.5">Fastest Time 🚀</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-xs text-gray-500 font-medium">Score</span>
                </div>
                <p className="font-black text-gray-900 text-xl">{score} / {total}</p>
                {isPerfect && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Perfect Score! 🎯</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Leaderboard Card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span className="font-bold text-gray-900 text-sm">LEADERBOARD</span>
            </div>
            <button
              onClick={() => navigate("/admin/leaderboard")}
              className="flex items-center gap-1 text-xs font-semibold text-[#4F46E5]"
            >
              View Full
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingBoard ? (
            <div className="px-5 py-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-7 h-7 bg-gray-100 rounded-full" />
                  <div className="w-8 h-8 bg-gray-100 rounded-full" />
                  <div className="flex-1 h-4 bg-gray-100 rounded" />
                  <div className="w-12 h-4 bg-gray-100 rounded" />
                  <div className="w-8 h-4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : board.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No participants yet
            </div>
          ) : (
            <div className="px-5 py-3 space-y-2">
              {board.slice(0, 10).map((entry: any, i: number) => {
                const rank = entry?.rank ?? i + 1;
                const myMobile = (participant as any).mobile ?? "";
                const myName   = (participant as any).name ?? "";

                // FIX 6: normalised "is me" check
                const isMe =
                  (myMobile && getEntryMobile(entry) === myMobile) ||
                  getEntryName(entry) === myName;

                return (
                  <div
                    key={entry?.id ?? i}
                    className="flex items-center gap-3 py-2 rounded-2xl transition-colors"
                    style={
                      isMe
                        ? { background: "#EEF2FF", padding: "8px 10px", margin: "0 -10px" }
                        : {}
                    }
                  >
                    {/* Rank badge */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: getRankBg(rank), color: getRankTextColor(rank) }}
                    >
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{
                        background: isMe
                          ? "#4F46E5"
                          : ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"][i % 5],
                      }}
                    >
                      {getEntryName(entry).charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: isMe ? "#4F46E5" : "#111827" }}
                      >
                        {getEntryName(entry)}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] font-bold text-[#4F46E5] bg-indigo-100 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                    </div>

                    {/* FIX 7: normalised time using unified helper */}
                    <p className="text-xs text-gray-500 font-mono font-medium tabular-nums flex-shrink-0">
                      {formatTime(getEntryTimeSec(entry))}
                    </p>

                    {/* Rank label */}
                    <p
                      className="text-xs font-bold flex-shrink-0 w-8 text-right"
                      style={{ color: rank <= 3 ? "#F59E0B" : "#9CA3AF" }}
                    >
                      {getRankLabel(rank)}
                      {rank <= 3 && " 🏅"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 h-12 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={handleShare}
            className="flex-1 h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
            style={{ background: "#4F46E5" }}
          >
            <Share2 className="w-4 h-4" />
            Share Result
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          🎉 Keep playing, keep winning!<br />
          More quizzes, more rewards await you.
        </p>
      </div>
    </div>
  );
}
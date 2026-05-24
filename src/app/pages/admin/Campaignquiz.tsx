// src/pages/CampaignQuiz.tsx
// Route: /campaign/:campaignId/quiz
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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
  elapsed_seconds: number | null;
  completed_at: string;
}

interface Participant {
  name: string;
  email: string | null;
  startedAt: string;
}

type QuizState = "loading" | "error" | "playing" | "results";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

function getOptions(q: DBQuestion): { letter: string; text: string }[] {
  return [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e]
    .map((text, i) => ({ letter: OPTION_LETTERS[i], text: text ?? "" }))
    .filter((o) => o.text.length > 0);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&family=Poppins:wght@500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.cq { font-family: 'Nunito', sans-serif; min-height: 100vh; background: #FAFAF9; }

/* ══ QUIZ SCREEN ══════════════════════════════════════════════════════════ */

.cq-play { max-width: 480px; margin: 0 auto; padding: 0 0 48px; }

/* Top bar */
.cq-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 12px;
}
.cq-topbar-left { font-size: 14px; font-weight: 700; color: #1A1530; }
.cq-topbar-right { display: flex; align-items: center; gap: 10px; }

/* Timer pill — matches the reference clock icon + "18 sec" */
.cq-timer {
  display: flex; align-items: center; gap: 5px;
  background: #fff; border: 1.5px solid #EAE6FF;
  border-radius: 100px; padding: 5px 13px;
  font-family: 'Poppins', sans-serif; font-size: 13px;
  font-weight: 700; color: #5B21B6;
}
.cq-timer svg { width: 15px; height: 15px; stroke: #7C3AED; stroke-width: 2; fill: none; }
.cq-timer.urgent { border-color: #FECACA; color: #DC2626; }
.cq-timer.urgent svg { stroke: #DC2626; }

/* Progress bar — indigo/purple like the reference */
.cq-progress-wrap { padding: 0 20px 20px; }
.cq-progress-track {
  height: 5px; background: #EDE9FE; border-radius: 100px; overflow: hidden;
}
.cq-progress-fill {
  height: 100%; background: #6D28D9; border-radius: 100px;
  transition: width 0.45s cubic-bezier(.4,0,.2,1);
}

/* Question number label */
.cq-q-label {
  padding: 0 20px 10px;
  font-size: 13px; font-weight: 700; color: #9CA3AF; letter-spacing: .3px;
}

/* Question text */
.cq-q-text {
  padding: 0 20px 28px;
  font-family: 'Poppins', sans-serif;
  font-size: 20px; font-weight: 700; color: #0F0A27; line-height: 1.4;
}

/* Options list */
.cq-options { padding: 0 20px; display: flex; flex-direction: column; gap: 11px; }

.cq-opt {
  display: flex; align-items: center; gap: 14px;
  padding: 15px 18px; border-radius: 16px;
  border: 1.5px solid #E8E4F7;
  background: #fff;
  cursor: pointer; text-align: left;
  font-family: 'Nunito', sans-serif; font-size: 15px;
  font-weight: 700; color: #1A1530;
  transition: border-color .15s, background .15s, transform .1s;
  -webkit-tap-highlight-color: transparent;
}
.cq-opt:hover { border-color: #A78BFA; background: #F5F3FF; }
.cq-opt:active { transform: scale(.985); }

/* Selected state — purple outline, NO correct/wrong reveal */
.cq-opt.selected {
  border-color: #6D28D9; background: #F5F3FF;
  box-shadow: 0 0 0 3px rgba(109,40,217,.12);
}

/* Letter badge */
.cq-opt-letter {
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 800;
  background: #EDE9FE; color: #6D28D9;
  transition: background .15s, color .15s;
}
.cq-opt.selected .cq-opt-letter { background: #6D28D9; color: #fff; }

/* Next button */
.cq-next-wrap { padding: 22px 20px 0; }
.cq-next {
  width: 100%; height: 54px; border: none; border-radius: 16px;
  background: #6D28D9; color: #fff;
  font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(109,40,217,.35);
  transition: background .15s, transform .1s, box-shadow .15s;
}
.cq-next:hover { background: #5B21B6; box-shadow: 0 6px 24px rgba(109,40,217,.45); }
.cq-next:active { transform: scale(.98); }
.cq-next:disabled { opacity: .65; cursor: not-allowed; transform: none; }

/* Score footer */
.cq-score-note {
  text-align: center; font-size: 12px; font-weight: 700;
  color: #9CA3AF; padding: 16px 0 0;
}

/* ══ RESULTS SCREEN ═══════════════════════════════════════════════════════ */

.cq-results { max-width: 480px; margin: 0 auto; padding: 0 0 48px; }

/* ── Hero banner ── */
.cq-hero {
  position: relative; overflow: hidden;
  background: linear-gradient(175deg, #1E0A45 0%, #3B0764 40%, #5B21B6 80%, #7C3AED 100%);
  padding: 32px 24px 28px;
  border-radius: 0 0 32px 32px;
}

/* Stars / sparkle background dots */
.cq-hero::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    radial-gradient(circle, rgba(255,255,255,.55) 1px, transparent 1px),
    radial-gradient(circle, rgba(255,255,255,.3) 1px, transparent 1px);
  background-size: 40px 40px, 23px 23px;
  background-position: 0 0, 12px 12px;
}

/* Confetti particles */
.cq-hero-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.cq-hero-confetti span {
  position: absolute; border-radius: 2px; opacity: 0;
  animation: cq-confetti-fall 2.8s ease-in infinite;
}
@keyframes cq-confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: .9; }
  100% { transform: translateY(340px) rotate(540deg); opacity: 0; }
}

/* Share button */
.cq-share-btn {
  position: absolute; top: 16px; right: 16px;
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; gap: 2px;
}
.cq-share-btn svg { width: 16px; height: 16px; stroke: #fff; stroke-width: 2; fill: none; }
.cq-share-btn span { font-size: 9px; font-weight: 700; color: rgba(255,255,255,.85); letter-spacing: .2px; }

/* Congrats text */
.cq-congrats-label {
  text-align: center; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,.8); letter-spacing: .5px; margin-bottom: 2px;
}
.cq-winner-text {
  text-align: center; font-family: 'Poppins', sans-serif;
  font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 0;
  line-height: 1.15;
}
.cq-winner-text .big {
  display: block; font-size: 38px; font-weight: 900;
  background: linear-gradient(90deg, #FFD700 0%, #FFEC6E 50%, #FFD700 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; letter-spacing: -1px;
}
.cq-outstanding {
  display: inline-block; margin: 8px auto 20px;
  background: linear-gradient(90deg, #6D28D9, #A855F7);
  border-radius: 100px; padding: 5px 20px;
  font-size: 12px; font-weight: 800; color: #fff; letter-spacing: .3px;
}

/* Trophy */
.cq-trophy {
  width: 90px; height: 90px; margin: 0 auto 18px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 42px; line-height: 1;
  box-shadow: 0 0 0 10px rgba(255,215,0,.15), 0 8px 32px rgba(255,165,0,.5);
  position: relative;
}

/* Player card inside hero */
.cq-player-card {
  background: #fff; border-radius: 20px;
  padding: 18px 20px; margin: 0 0 16px;
  display: flex; align-items: center; gap: 16px;
  position: relative;
}
.cq-player-avatar {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 900; color: #fff;
  flex-shrink: 0; position: relative;
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px #FFD700;
}
.cq-player-avatar-crown {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  font-size: 16px;
}
.cq-player-rank-badge {
  position: absolute; bottom: -4px; right: -4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #6D28D9; border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 900; color: #fff;
}
.cq-player-info { flex: 1; }
.cq-player-name {
  font-family: 'Poppins', sans-serif; font-size: 17px; font-weight: 800;
  color: #0F0A27; margin-bottom: 2px;
}
.cq-player-sub { font-size: 12px; font-weight: 700; color: #7C3AED; }

/* Stats row */
.cq-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cq-stat {
  background: #F9F7FF; border: 1.5px solid #EDE9FE; border-radius: 16px;
  padding: 14px 16px; text-align: center;
}
.cq-stat-icon-row {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-bottom: 4px;
}
.cq-stat-icon-row svg { width: 18px; height: 18px; stroke-width: 2; fill: none; }
.cq-stat-label { font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: .3px; margin-bottom: 2px; }
.cq-stat-value {
  font-family: 'Poppins', sans-serif; font-size: 26px; font-weight: 900; color: #1A1530; line-height: 1;
}
.cq-stat-sub { font-size: 10px; font-weight: 700; color: #A78BFA; margin-top: 3px; }

/* ── Leaderboard card ── */
.cq-lb-card {
  margin: 16px 16px 0;
  background: #fff; border: 1.5px solid #EDE9FE; border-radius: 20px; overflow: hidden;
}
.cq-lb-head {
  padding: 14px 18px 12px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #F0EDFF;
}
.cq-lb-title {
  font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 800; color: #0F0A27;
  display: flex; align-items: center; gap: 7px;
}
.cq-lb-title svg { width: 18px; height: 18px; stroke-width: 2; fill: none; stroke: #F59E0B; }
.cq-lb-viewall {
  font-size: 12px; font-weight: 700; color: #7C3AED;
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 2px;
}
.cq-lb-viewall svg { width: 13px; height: 13px; stroke: #7C3AED; stroke-width: 2.5; fill: none; }
.cq-lb-body { padding: 10px 14px 14px; display: flex; flex-direction: column; gap: 7px; }

.cq-lb-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 12px;
  background: #F9F8FF; border: 1px solid transparent;
  font-size: 13px;
}
.cq-lb-row.me { background: #EDE9FF; border-color: #C4B5FD; }

.cq-lb-rank-num {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 900;
}
.cq-lb-rank-num.r1 { background: linear-gradient(135deg,#FFD700,#FFA500); color: #7A4500; }
.cq-lb-rank-num.r2 { background: linear-gradient(135deg,#D1D5DB,#9CA3AF); color: #374151; }
.cq-lb-rank-num.r3 { background: linear-gradient(135deg,#CD7F32,#A0522D); color: #fff; }
.cq-lb-rank-num.rn { background: #E5E7EB; color: #6B7280; }

.cq-lb-avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 900; color: #fff;
  background: linear-gradient(135deg, #A78BFA, #6D28D9);
}
.cq-lb-name {
  flex: 1; font-weight: 800; color: #0F0A27;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cq-lb-name.me { color: #6D28D9; }
.cq-lb-you {
  font-size: 10px; font-weight: 900; background: #6D28D9; color: #fff;
  padding: 2px 7px; border-radius: 100px; margin-left: 5px;
}
.cq-lb-time { font-size: 12px; font-weight: 700; color: #6B7280; flex-shrink: 0; }
.cq-lb-place {
  font-size: 12px; font-weight: 900; color: #374151; flex-shrink: 0; min-width: 36px; text-align: right;
}
.cq-lb-place.p1 { color: #D97706; }

/* ── Answer review card ── */
.cq-review-card {
  margin: 14px 16px 0;
  background: #fff; border: 1.5px solid #EDE9FE; border-radius: 20px; overflow: hidden;
}
.cq-review-head {
  padding: 14px 18px 12px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #F0EDFF;
}
.cq-review-title {
  font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 800; color: #0F0A27;
  display: flex; align-items: center; gap: 7px;
}
.cq-review-title svg { width: 17px; height: 17px; }
.cq-review-score { font-size: 12px; font-weight: 800; color: #7C3AED; }
.cq-review-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 8px; }
.cq-review-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 13px; border-radius: 12px; border: 1.5px solid transparent;
}
.cq-review-item.ok  { background: #F0FDF4; border-color: #BBF7D0; }
.cq-review-item.bad { background: #FFF1F2; border-color: #FECDD3; }
.cq-review-item svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
.cq-review-q { font-size: 13px; font-weight: 800; color: #111827; line-height: 1.4; }
.cq-review-ans { font-size: 11px; font-weight: 600; color: #6B7280; margin-top: 3px; }
.cq-review-ans strong { color: #374151; }

/* ── Action buttons ── */
.cq-actions { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 11px; }
.cq-btn-reward {
  width: 100%; height: 54px; border: none; border-radius: 16px;
  background: linear-gradient(135deg, #6D28D9, #A855F7);
  color: #fff; font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 800;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(109,40,217,.4);
  transition: transform .1s, box-shadow .15s;
}
.cq-btn-reward:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(109,40,217,.5); }
.cq-btn-reward svg { width: 18px; height: 18px; stroke: #fff; stroke-width: 2; fill: none; }
.cq-btn-again {
  width: 100%; height: 54px; border: 1.5px solid #E5E7EB; border-radius: 16px;
  background: #fff; color: #374151;
  font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: border-color .15s, color .15s;
}
.cq-btn-again:hover { border-color: #A78BFA; color: #6D28D9; }
.cq-btn-again svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2; fill: none; }

/* Footer tagline */
.cq-footer { text-align: center; padding: 18px 16px 0; }
.cq-footer p { font-size: 12px; font-weight: 700; color: #9CA3AF; line-height: 1.7; }
`;

// ─── Confetti Component ───────────────────────────────────────────────────────

const DOTS = [
  { color:"#FFD700", l:"6%",  d:"0s",    w:9,  h:9  },
  { color:"#FF6B6B", l:"18%", d:".4s",   w:7,  h:7  },
  { color:"#4ADE80", l:"30%", d:".8s",   w:10, h:5  },
  { color:"#60A5FA", l:"44%", d:"1.1s",  w:6,  h:10 },
  { color:"#F472B6", l:"58%", d:".25s",  w:8,  h:8  },
  { color:"#A78BFA", l:"72%", d:".65s",  w:9,  h:5  },
  { color:"#FB923C", l:"85%", d:"1.5s",  w:6,  h:9  },
  { color:"#FFD700", l:"95%", d:".9s",   w:7,  h:7  },
  { color:"#4ADE80", l:"12%", d:"1.8s",  w:6,  h:6  },
  { color:"#60A5FA", l:"50%", d:"2.1s",  w:8,  h:5  },
  { color:"#FF6B6B", l:"78%", d:"2.4s",  w:5,  h:9  },
  { color:"#F472B6", l:"92%", d:"1.3s",  w:9,  h:6  },
];

function Confetti() {
  return (
    <div className="cq-hero-confetti">
      {DOTS.map((d, i) => (
        <span key={i} style={{
          background: d.color,
          left: d.l, width: d.w, height: d.h,
          animationDelay: d.d, top: 0,
        }} />
      ))}
    </div>
  );
}

// ─── Timer Hook ───────────────────────────────────────────────────────────────

function useElapsed(active: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return secs;
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const RANK_MEDALS = ["🏆", "🥈", "🥉"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CampaignQuiz() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; chosen: string; correct: boolean }[]>([]);

  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [timerActive, setTimerActive] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const elapsed = useElapsed(timerActive);

  // ── Load ──
  useEffect(() => {
    if (!campaignId) return;
    const raw = sessionStorage.getItem(`quiz_participant_${campaignId}`);
    if (!raw) { navigate(`/campaign/${campaignId}/register`); return; }
    setParticipant(JSON.parse(raw));

    (async () => {
      const { data: camp, error: campErr } = await supabase
        .from("campaigns").select("id, name, is_active").eq("id", campaignId).single();
      if (campErr || !camp) { setErrorMsg("Campaign not found."); setQuizState("error"); return; }
      if (!camp.is_active) { setErrorMsg("This campaign is no longer active."); setQuizState("error"); return; }
      setCampaignName(camp.name);

      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option")
        .eq("campaign_id", campaignId);
      if (qErr || !qs || qs.length === 0) { setErrorMsg("No questions found."); setQuizState("error"); return; }

      setQuestions([...qs].sort(() => Math.random() - 0.5));
      setQuizState("playing");
      setTimerActive(true);
    })();
  }, [campaignId, navigate]);

  // ── Select answer ──
  const handleSelectOption = (letter: string) => {
    if (selectedOption !== null) return;
    const q = questions[currentIndex];
    setSelectedOption(letter);
    setAnswers(prev => [...prev, { questionId: q.id, chosen: letter, correct: letter === q.correct_option }]);
  };

  // ── Next / Finish ──
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
    } else {
      const allAnswers = answers; // already includes current (set in handleSelectOption)
      const finalScore = allAnswers.filter(a => a.correct).length;
      setScore(finalScore);
      setFinalTime(elapsed);
      setTimerActive(false);
      await submitResult(finalScore, questions.length);
      setQuizState("results");
    }
  }, [currentIndex, questions, answers, elapsed]);

  // ── Submit ──
  const submitResult = async (finalScore: number, total: number) => {
    if (!campaignId || !participant) return;
    setSubmitting(true);
    try {
      await supabase.from("quiz_results").insert({
        campaign_id: campaignId,
        player_name: participant.name,
        player_email: participant.email,
        score: finalScore, total,
        percentage: Math.round((finalScore / total) * 100),
        elapsed_seconds: elapsed,
        completed_at: new Date().toISOString(),
      });
    } catch (e) { console.error(e); }
    setSubmitting(false);
    fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    if (!campaignId) return;
    setLoadingLeaderboard(true);
    const { data } = await supabase
      .from("quiz_results").select("id, player_name, score, total, percentage, elapsed_seconds, completed_at")
      .eq("campaign_id", campaignId)
      .order("percentage", { ascending: false })
      .order("completed_at", { ascending: true })
      .limit(10);
    setLeaderboard((data ?? []) as LeaderboardEntry[]);
    setLoadingLeaderboard(false);
  };

  const handleRetake = () => {
    sessionStorage.removeItem(`quiz_participant_${campaignId}`);
    navigate(`/campaign/${campaignId}/register`);
  };

  // ─── Render: Loading ──────────────────────────────────────────────────────
  if (quizState === "loading") return (
    <>
      <style>{CSS}</style>
      <div className="cq" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={32} style={{ animation:"spin 1s linear infinite", color:"#6D28D9" }} />
      </div>
    </>
  );

  // ─── Render: Error ────────────────────────────────────────────────────────
  if (quizState === "error") return (
    <>
      <style>{CSS}</style>
      <div className="cq" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ maxWidth:300, textAlign:"center" }}>
          <div style={{ width:64, height:64, background:"#FFF1F2", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <AlertCircle size={28} color="#E11D48" />
          </div>
          <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:18, fontWeight:800, color:"#0F0A27", marginBottom:8 }}>Oops!</p>
          <p style={{ fontSize:14, fontWeight:600, color:"#6B7280" }}>{errorMsg}</p>
        </div>
      </div>
    </>
  );

  // ─── Render: Results ──────────────────────────────────────────────────────
  if (quizState === "results") {
    const pct = Math.round((score / questions.length) * 100);
    const myRank = leaderboard.findIndex(e => e.player_name === participant?.name);
    const initials = (participant?.name ?? "?")[0].toUpperCase();
    const isWinner = pct >= 80;

    return (
      <>
        <style>{CSS}</style>
        <div className="cq">
          <div className="cq-results">

            {/* ── Hero ── */}
            <div className="cq-hero">
              <Confetti />

              {/* Share */}
              <button className="cq-share-btn">
                <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Share<br/>Result</span>
              </button>

              {/* Congrats text */}
              <p className="cq-congrats-label">Congratulations!</p>
              <div className="cq-winner-text">
                You are the
                <span className="big">{isWinner ? "WINNER!" : pct >= 50 ? "FINALIST!" : "PLAYER!"}</span>
              </div>
              <div style={{ textAlign:"center" }}>
                <span className="cq-outstanding">
                  {isWinner ? "Outstanding performance!" : pct >= 50 ? "Good effort!" : "Keep practicing!"}
                </span>
              </div>

              {/* Trophy */}
              <div className="cq-trophy">🏆</div>

              {/* Player card */}
              <div className="cq-player-card">
                <div className="cq-player-avatar">
                  <span className="cq-player-avatar-crown">👑</span>
                  {initials}
                  {myRank >= 0 && <span className="cq-player-rank-badge">{myRank + 1}</span>}
                </div>
                <div className="cq-player-info">
                  <p className="cq-player-name">{participant?.name}</p>
                  <p className="cq-player-sub">Champion of the Quiz!</p>
                </div>
              </div>

              {/* Stats */}
              <div className="cq-stats-row">
                <div className="cq-stat">
                  <div className="cq-stat-icon-row">
                    <svg viewBox="0 0 24 24" style={{ stroke:"#6D28D9" }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span className="cq-stat-label">Your Time</span>
                  </div>
                  <p className="cq-stat-value">{formatTime(finalTime)}</p>
                  <p className="cq-stat-sub">{myRank === 0 ? "Fastest Time 🚀" : "Total time"}</p>
                </div>
                <div className="cq-stat">
                  <div className="cq-stat-icon-row">
                    <svg viewBox="0 0 24 24" style={{ stroke:"#F59E0B" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span className="cq-stat-label">Score</span>
                  </div>
                  <p className="cq-stat-value">{score}/{questions.length}</p>
                  <p className="cq-stat-sub">{pct === 100 ? "Perfect Score! 🎉" : `${pct}% correct`}</p>
                </div>
              </div>
            </div>

            {/* ── Leaderboard ── */}
            <div className="cq-lb-card">
              <div className="cq-lb-head">
                <span className="cq-lb-title">
                  <svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                  LEADERBOARD
                </span>
                <button className="cq-lb-viewall">
                  View Full Leaderboard
                  <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="cq-lb-body">
                {loadingLeaderboard ? (
                  <div style={{ display:"flex", justifyContent:"center", padding:"16px 0" }}>
                    <Loader2 size={20} style={{ color:"#9CA3AF" }} />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p style={{ textAlign:"center", fontSize:13, color:"#9CA3AF", padding:"12px 0" }}>No results yet.</p>
                ) : leaderboard.map((entry, i) => {
                  const isMe = entry.player_name === participant?.name;
                  const rankClass = i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : "rn";
                  return (
                    <div key={entry.id} className={`cq-lb-row${isMe ? " me" : ""}`}>
                      <div className={`cq-lb-rank-num ${rankClass}`}>{i + 1}</div>
                      <div className="cq-lb-avatar">{entry.player_name[0].toUpperCase()}</div>
                      <span className={`cq-lb-name${isMe ? " me" : ""}`}>
                        {entry.player_name}
                        {isMe && <span className="cq-lb-you">You</span>}
                      </span>
                      <span className="cq-lb-time">{formatTime(entry.elapsed_seconds ?? 0)}</span>
                      <span className={`cq-lb-place${i === 0 ? " p1" : ""}`}>
                        {RANK_LABELS[i] ?? `#${i+1}`} {RANK_MEDALS[i] ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Answer Review ── */}
            <div className="cq-review-card">
              <div className="cq-review-head">
                <span className="cq-review-title">
                  <CheckCircle2 size={17} color="#22C55E" />
                  Answer Review
                </span>
                <span className="cq-review-score">{score}/{questions.length} correct</span>
              </div>
              <div className="cq-review-body">
                {questions.map((q, i) => {
                  const ans = answers[i];
                  const ok = ans?.correct ?? false;
                  return (
                    <div key={q.id} className={`cq-review-item ${ok ? "ok" : "bad"}`}>
                      {ok
                        ? <CheckCircle2 size={18} color="#22C55E" />
                        : <XCircle size={18} color="#EF4444" />
                      }
                      <div>
                        <p className="cq-review-q">{q.question_text}</p>
                        <p className="cq-review-ans">
                          Correct: <strong>{q.correct_option}</strong>
                          {" — "}{getOptions(q).find(o => o.letter === q.correct_option)?.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Buttons ── */}
            <div className="cq-actions">
              <button className="cq-btn-reward">
                <svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                Claim Your Reward
              </button>
              <button className="cq-btn-again" onClick={handleRetake}>
                <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></svg>
                Play Again
              </button>
            </div>

            {/* Footer */}
            <div className="cq-footer">
              <p>🎉 Keep playing, keep winning!<br/>More quizzes, more rewards await you.</p>
            </div>

          </div>
        </div>
      </>
    );
  }

  // ─── Render: Playing ──────────────────────────────────────────────────────
  const q = questions[currentIndex];
  const options = getOptions(q);
  const progress = (currentIndex / questions.length) * 100;
  const isUrgent = elapsed > 20;
  const currentScore = answers.filter(a => a.correct).length;
  const hasAnswered = selectedOption !== null;

  return (
    <>
      <style>{CSS}</style>
      <div className="cq">
        <div className="cq-play">

          {/* Top bar */}
          <div className="cq-topbar">
            <span className="cq-topbar-left">{campaignName}</span>
            <div className="cq-topbar-right">
              <div className={`cq-timer${isUrgent ? " urgent" : ""}`}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {elapsed} sec
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="cq-progress-wrap">
            <div className="cq-progress-track">
              <div className="cq-progress-fill" style={{ width:`${progress}%` }} />
            </div>
          </div>

          {/* Q label */}
          <p className="cq-q-label">Question {currentIndex + 1} of {questions.length}</p>

          {/* Question */}
          <p className="cq-q-text">{q.question_text}</p>

          {/* Options */}
          <div className="cq-options">
            {options.map(({ letter, text }) => (
              <button
                key={letter}
                className={`cq-opt${selectedOption === letter ? " selected" : ""}`}
                onClick={() => handleSelectOption(letter)}
                disabled={hasAnswered}
              >
                <span className="cq-opt-letter">{letter}</span>
                <span style={{ flex:1 }}>{text}</span>
              </button>
            ))}
          </div>

          {/* Next button — only after answering */}
          {hasAnswered && (
            <div className="cq-next-wrap">
              <button className="cq-next" onClick={handleNext} disabled={submitting}>
                {submitting && <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} />}
                {currentIndex < questions.length - 1 ? "Next Question →" : "See Results →"}
              </button>
            </div>
          )}

          {/* Score note */}
          <p className="cq-score-note">
            Score: {currentScore} / {currentIndex + (hasAnswered ? 1 : 0)}
          </p>

        </div>
      </div>
    </>
  );
}
import { useNavigate, useParams, useLocation } from "react-router";
import { Clock, ChevronDown, ChevronUp, Share2, Trophy, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function ResultsPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const location = useLocation();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Mock results based on quiz answers
  const correctAnswers = ["B", "C", "D", "C", "C"];
  const score = 4;
  const totalQuestions = 5;
  const percentage = (score / totalQuestions) * 100;
  const timeElapsed = 155; // 2:35
  const rank = 3;
  const previousRank = 7;

  const questions = [
    { id: 1, text: "What is the capital of France?", userAnswer: "B", correctAnswer: "B", isCorrect: true },
    { id: 2, text: "Which planet is known as the Red Planet?", userAnswer: "C", correctAnswer: "C", isCorrect: true },
    { id: 3, text: "What is the largest ocean on Earth?", userAnswer: "D", correctAnswer: "D", isCorrect: true },
    { id: 4, text: "Who painted the Mona Lisa?", userAnswer: "B", correctAnswer: "C", isCorrect: false, explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519." },
    { id: 5, text: "What is the smallest prime number?", userAnswer: "C", correctAnswer: "C", isCorrect: true }
  ];

  const toggleQuestion = (id: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏆";
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Score Card */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            {/* Circular Progress */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#4F46E5"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{score}/{totalQuestions}</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Correct Answers</p>
          
          {/* Time Badge */}
          <div className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Completed in {formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Ranking Card */}
        <div className="bg-gradient-to-r from-[#4F46E5]/10 to-[#F59E0B]/10 border-2 border-[#4F46E5]/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{getRankMedal(rank)}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Your Rank: #{rank} on Today's Leaderboard</h3>
              {previousRank > rank && (
                <p className="text-sm text-[#10B981] flex items-center gap-1">
                  <span>↑</span> Improved from #{previousRank}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Question Summary</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {questions.map((q, index) => (
              <div key={q.id} className={index !== questions.length - 1 ? "border-b border-border" : ""}>
                <button
                  onClick={() => !q.isCorrect && toggleQuestion(q.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    q.isCorrect ? "bg-[#10B981]/10" : "bg-[#EF4444]/10"
                  }`}>
                    {q.isCorrect ? (
                      <span className="text-[#10B981] text-sm">✓</span>
                    ) : (
                      <span className="text-[#EF4444] text-sm">✕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{q.text}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {q.isCorrect ? (
                      <span className="text-xs px-2 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full">
                        Correct: {q.correctAnswer}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full">
                        You: {q.userAnswer} • Correct: {q.correctAnswer}
                      </span>
                    )}
                    {!q.isCorrect && (
                      expandedQuestions.has(q.id) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )
                    )}
                  </div>
                </button>
                {!q.isCorrect && expandedQuestions.has(q.id) && q.explanation && (
                  <div className="px-4 py-3 bg-muted/30 border-t border-border">
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => navigate(`/campaign/${campaignId}/leaderboard`)}
            className="w-full h-13 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            View Full Leaderboard
          </button>
          
          <button
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'My Quiz Score',
                  text: `I scored ${score}/${totalQuestions} on Summer Quiz Challenge 2024!`,
                });
              }
            }}
            className="w-full h-13 border-2 border-border hover:border-[#4F46E5] rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share My Score
          </button>
          
          <button
            onClick={() => navigate(`/campaign/${campaignId}`)}
            className="w-full text-center text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaign
          </button>
        </div>

        {/* Social Share Preview */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3">Share on social media</p>
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-lg p-4 mb-3 text-white text-center">
            <p className="text-lg font-bold">I scored {score}/{totalQuestions}!</p>
            <p className="text-sm opacity-90">Summer Quiz Challenge 2024</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium transition-colors">
              WhatsApp
            </button>
            <button className="flex-1 py-2 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-lg font-medium transition-colors">
              Twitter
            </button>
            <button className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

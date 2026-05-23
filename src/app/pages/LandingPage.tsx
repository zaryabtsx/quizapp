import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Users, Lock } from "lucide-react";
import { useState } from "react";

export function LandingPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  // Mock campaign data
  const campaign = {
    id: campaignId || "summer-quiz-2024",
    name: "Summer Quiz Challenge 2024",
    description: "Test your knowledge and win exciting prizes! Join thousands of participants.",
    participantCount: 1247,
    icon: "🎯"
  };

  const handleStartQuiz = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate(`/campaign/${campaign.id}/register`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 flex flex-col items-center">
      <div className="w-full max-w-md mx-auto">
        {/* Campaign Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-2xl mb-4 mx-auto">
            {campaign.icon}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{campaign.name}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {campaign.description}
          </p>
        </div>

        {/* Hero Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="w-60 h-40 bg-gradient-to-br from-[#4F46E5]/10 to-[#F59E0B]/10 rounded-2xl flex items-center justify-center">
            <span className="text-6xl">📝</span>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">How it works</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-xs text-muted-foreground">Answer 5 questions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-xs text-muted-foreground">Compete on leaderboard</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-xs text-muted-foreground">Win daily prizes</p>
            </div>
          </div>

          <div className="h-px bg-border mb-4"></div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Name & mobile required</span>
          </div>
        </div>

        {/* Campaign Stats Badge */}
        <div className="bg-[#4F46E5]/10 rounded-full px-4 py-2 inline-flex items-center gap-2 mb-6 mx-auto">
          <Users className="w-4 h-4 text-[#4F46E5]" />
          <span className="text-sm text-foreground">
            {campaign.participantCount.toLocaleString()} participated this week
          </span>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleStartQuiz}
          disabled={isLoading}
          className="w-full h-14 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Start Quiz"}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <button className="hover:text-foreground">Terms & Conditions</button>
            <span>•</span>
            <button className="hover:text-foreground">Support</button>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Campaign Quiz Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

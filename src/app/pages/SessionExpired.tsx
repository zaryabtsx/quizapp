import { useNavigate } from "react-router";
import { AlertTriangle } from "lucide-react";

export function SessionExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Session Expired</h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You were disconnected due to 5 minutes of inactivity to maintain leaderboard integrity.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/campaign/summer-quiz-2024")}
            className="w-full h-13 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors"
          >
            Start New Quiz
          </button>
          
          <button
            onClick={() => navigate("/campaign/summer-quiz-2024")}
            className="w-full h-13 border-2 border-border hover:border-[#4F46E5] rounded-xl font-semibold transition-colors"
          >
            Back to Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

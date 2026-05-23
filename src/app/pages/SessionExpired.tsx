import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext";

export function SessionExpired() {
  const navigate = useNavigate();
  const { clearCurrentSession } = useStore();

  const handleRestart = () => {
    clearCurrentSession();
    navigate("/campaign/summer2025/register");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-xl font-bold mb-2">Session Expired</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your session ended due to inactivity. Please register again to continue.
        </p>
        <button
          onClick={handleRestart}
          className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
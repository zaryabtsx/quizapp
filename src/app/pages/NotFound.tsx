import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#4F46E5]/10 to-[#F59E0B]/10 flex items-center justify-center">
            <Search className="w-16 h-16 text-muted-foreground" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Campaign Not Found</h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The campaign you're looking for doesn't exist or has been deactivated.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full h-13 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors"
          >
            Go to Home
          </button>
          
          <a
            href="mailto:support@platform.com"
            className="block w-full text-center text-[#4F46E5] hover:text-[#4338CA] py-2"
          >
            Contact Support
          </a>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need help? Email us at support@platform.com
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (email === "admin@example.com" && password === "admin123") {
        setShow2FA(true);
      } else {
        setError("Invalid credentials. Please try again.");
      }
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }

      // Auto-submit when all filled
      if (newOtp.every(digit => digit) && index === 5) {
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 500);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-[#F59E0B]/10 flex items-center justify-center px-6">
        <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#4F46E5] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
              🔐
            </div>
            <h2 className="text-2xl font-bold mb-2">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-6">
            <label htmlFor="otp-0" className="sr-only">OTP Code</label>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold border-2 border-border rounded-lg focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold transition-colors mb-3"
            title="Verify OTP"
          >
            Verify
          </button>

          <button 
            className="w-full text-center text-sm text-[#4F46E5] hover:text-[#4338CA]"
            title="Resend verification code"
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-[#F59E0B]/10 flex items-center justify-center px-6">
      <div className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Campaign Quiz Platform</h2>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-12 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Remember me</span>
            </label>
            <button type="button" className="text-sm text-[#4F46E5] hover:text-[#4338CA]">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

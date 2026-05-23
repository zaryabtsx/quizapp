import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useStore } from "../../store/StoreContext";
import { generateOTP, sendVerificationEmail } from "../lib/resend";

const OTP_LENGTH = 6;

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { currentUser, currentOTP, setCurrentOTP } = useStore();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no user context
  useEffect(() => {
    if (!currentUser || !currentOTP) navigate(`/campaign/${campaignId}/register`);
  }, [currentUser, currentOTP, campaignId, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError("");
    setStatusMessage("");
    setShakeError(false);
    if (val && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const enteredOTP = digits.join("");

  const handleVerify = async () => {
    if (enteredOTP.length !== OTP_LENGTH) {
      setError(`Please enter a ${OTP_LENGTH}-digit code.`);
      return;
    }
    if (!currentUser?.email) {
      setError("Unable to verify OTP: missing email.");
      return;
    }
    if (!currentOTP) {
      setError("Verification code expired. Please resend the code.");
      return;
    }
    setIsLoading(true);

    if (enteredOTP !== currentOTP) {
      setIsLoading(false);
      setError("Incorrect code. Please try again.");
      setShakeError(true);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
        setShakeError(false);
      }, 500);
      return;
    }

    navigate(`/campaign/${campaignId}/quiz`);
  };

  const handleResend = async () => {
    if (!currentUser?.email) {
      setError("Unable to resend code: missing email.");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsLoading(true);
    const otp = generateOTP();

    try {
      await sendVerificationEmail({
        email: currentUser.email,
        otp,
        campaignId: campaignId ?? "campaign",
      });
      setCurrentOTP(otp);
      setStatusMessage("A new verification code was sent.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Resend email error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = currentUser ? currentUser.email : "";

  return (
    <div className="min-h-screen bg-background px-6 py-8 flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Step 2 of 3</span>
            <span className="text-xs font-semibold text-[#4F46E5]">Verification</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-[#4F46E5] rounded-full transition-all" />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-7 border border-border text-center">
          {/* Icon */}
          <div className="w-14 h-14 bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-[#4F46E5]" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-sm text-muted-foreground mb-1">We sent a verification code to</p>
          <p className="text-[#4F46E5] font-semibold text-sm mb-6">{maskedEmail}</p>

          {/* OTP Inputs */}
          <div
            className={`flex gap-2 justify-center mb-4 ${shakeError ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
                className={[
                  "w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-background focus:outline-none transition-all",
                  "focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20",
                  shakeError
                    ? "border-red-500 text-red-500"
                    : d
                    ? "border-[#4F46E5] text-[#4F46E5]"
                    : "border-border",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 mb-4">{error}</p>
          )}
          {statusMessage && (
            <p className="text-xs text-emerald-500 mb-4">{statusMessage}</p>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || enteredOTP.length !== OTP_LENGTH}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Start Quiz"
            )}
          </button>

          <p className="text-xs text-muted-foreground mb-3">
            Didn't receive it?{" "}
            <button
              onClick={handleResend}
              className="text-[#4F46E5] underline font-medium"
            >
              Resend code
            </button>
          </p>

          <button
            onClick={() => navigate(`/campaign/${campaignId}/register`)}
            className="text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-1 w-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration
          </button>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    </div>
  );
}
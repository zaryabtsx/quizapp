import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Lock, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ysnpcerudhoygtccwlzc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbnBjZXJ1ZGhveWd0Y2N3bHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzEwMzUsImV4cCI6MjA5NTAwNzAzNX0.L7UVYj71UMWVYuzyHqPpeD2nji51vszAMp08p-1ECHw";

// Single shared Supabase client — reuse across the app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "form" | "otp" | "done";

interface FormData {
  fullName: string;
  dialCode: string;
  mobile: string;
  email: string;
  termsAccepted: boolean;
}

// ─── Rate limiting helpers ───────────────────────────────────────────────────

const OTP_RATE_LIMIT_KEY = "otp_last_sent_";
const OTP_RATE_LIMIT_SECONDS = 60; // Wait 60 seconds between OTP requests

function getLastOtpTime(email: string): number {
  const stored = localStorage.getItem(OTP_RATE_LIMIT_KEY + email);
  return stored ? parseInt(stored, 10) : 0;
}

function setLastOtpTime(email: string): void {
  localStorage.setItem(OTP_RATE_LIMIT_KEY + email, Date.now().toString());
}

function getOtpRateLimitError(email: string): string | null {
  const lastSent = getLastOtpTime(email);
  if (!lastSent) return null;
  
  const elapsed = Math.floor((Date.now() - lastSent) / 1000);
  const remaining = OTP_RATE_LIMIT_SECONDS - elapsed;
  
  if (remaining > 0) {
    return `Please wait ${remaining}s before requesting another code`;
  }
  return null;
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

// Sends a 6-digit OTP to the user's email (no magic link)
async function sendOtp(email: string): Promise<void> {
  // Check client-side rate limit first
  const rateLimitError = getOtpRateLimitError(email);
  if (rateLimitError) throw new Error(rateLimitError);

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // No emailRedirectTo → Supabase sends a 6-digit code, not a magic link
      },
    });
    if (error) throw new Error(error.message);
    
    // Record successful OTP send
    setLastOtpTime(email);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    
    // Handle specific rate limit errors
    if (message.includes("429") || message.includes("too many")) {
      setLastOtpTime(email);
      throw new Error("Too many requests. Please wait 60 seconds before trying again.");
    }
    
    throw err;
  }
}

// Verifies the 6-digit token and returns the session + user
async function verifyOtp(
  email: string,
  token: string
): Promise<{ access_token: string; refresh_token: string; user: { id: string } }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email", // matches the OTP type sent above
  });
  if (error) throw new Error(error.message);
  if (!data.session || !data.user) throw new Error("Verification failed — please try again");
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id },
  };
}

async function saveParticipant(
  userId: string,
  data: FormData,
  accessToken: string
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/participants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: userId,
      full_name: data.fullName,
      mobile: data.dialCode + data.mobile,
      email: data.email,
    }),
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegistrationPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  // ── Step state ──
  const [step, setStep] = useState<Step>("form");

  // ── Form state ──
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dialCode: "+92",
    mobile: "",
    email: "",
    termsAccepted: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // ── OTP state ──
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer when on OTP step
  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(60);
    setCanResend(false);
    
    // Initialize rate limit countdown
    const lastSent = getLastOtpTime(formData.email);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - lastSent) / 1000);
      const remaining = Math.max(0, OTP_RATE_LIMIT_SECONDS - elapsed);
      setRateLimitCountdown(remaining);
    }
    
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return c - 1;
      });
      
      // Update rate limit countdown
      setRateLimitCountdown((r) => {
        if (r <= 1) {
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, formData.email]);

  // ── Form validation ──
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = "Name is required";
    if (!formData.mobile.trim()) errors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile))
      errors.mobile = "Enter a valid 10-digit number";
    if (!formData.email.trim()) errors.email = "Email is required for OTP";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Enter a valid email address";
    if (!formData.termsAccepted) errors.terms = "You must accept the terms and conditions";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: string) =>
    setFormErrors((prev) => ({ ...prev, [field]: "" }));

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field === "termsAccepted" ? "terms" : field);
  };

  // ── Step 1: Send OTP ──
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      await sendOtp(formData.email);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFormErrors((prev) => ({ ...prev, email: msg }));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const data = await verifyOtp(formData.email, token);
      // Persist session
      localStorage.setItem("sb_access_token", data.access_token);
      localStorage.setItem("sb_refresh_token", data.refresh_token || "");
      // Save participant record
      await saveParticipant(data.user.id, formData, data.access_token);
      setStep("done");
      setTimeout(() => navigate(`/campaign/${campaignId}/quiz`), 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    try {
      await sendOtp(formData.email);
      setStep("otp"); // re-triggers countdown via useEffect
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not resend. Please try again.";
      setOtpError(msg);
      setCanResend(true);
    }
  };

  // ── OTP input helpers ──
  const handleOtpInput = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (idx === 5 && digit) handleVerifyOtp();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const progressWidth = step === "form" ? "33%" : step === "otp" ? "66%" : "100%";

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {step === "form" ? "Step 1 of 3" : step === "otp" ? "Step 2 of 3" : "Step 3 of 3"}
            </span>
            <span className="text-xs font-semibold text-[#4F46E5]">
              {step === "form" ? "Registration" : step === "otp" ? "Verification" : "Complete"}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] transition-all duration-500"
              style={{ width: progressWidth }}
            />
          </div>
        </div>

        {/* ── STEP 1: Registration form ── */}
        {step === "form" && (
          <>
            <div className="inline-flex items-center bg-[#4F46E5]/10 text-[#4F46E5] px-4 py-2 rounded-full text-sm mb-6">
              Summer Quiz Challenge 2024
            </div>
            <form
              onSubmit={handleSubmitForm}
              className="bg-card rounded-2xl p-5 border border-border mb-6"
            >
              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="fullName" className="block text-sm font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full h-12 px-4 rounded-lg border ${
                      formErrors.fullName
                        ? "border-[#EF4444]"
                        : formData.fullName
                        ? "border-[#10B981]"
                        : "border-border"
                    } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
                  />
                  {formData.fullName && !formErrors.fullName && (
                    <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
                  )}
                </div>
                {formErrors.fullName && (
                  <p className="text-xs text-[#EF4444] mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="mobile" className="text-sm font-semibold">
                    Mobile Number
                  </label>
                  <span className="inline-flex items-center gap-1 bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full text-xs">
                    <Lock className="w-3 h-3" />
                    Primary identifier
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={formData.dialCode}
                    onChange={(e) => handleInputChange("dialCode", e.target.value)}
                    className="h-12 px-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  >
                    <option>+92</option>
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleInputChange("mobile", e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="3001234567"
                      maxLength={10}
                      className={`w-full h-12 px-4 rounded-lg border ${
                        formErrors.mobile
                          ? "border-[#EF4444]"
                          : formData.mobile.length === 10
                          ? "border-[#10B981]"
                          : "border-border"
                      } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
                    />
                    {formData.mobile.length === 10 && !formErrors.mobile && (
                      <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
                    )}
                  </div>
                </div>
                {formErrors.mobile && (
                  <p className="text-xs text-[#EF4444] mt-1">{formErrors.mobile}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label htmlFor="email" className="text-sm font-semibold">
                    Email Address
                  </label>
                  <span className="inline-flex items-center gap-1 bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full text-xs">
                    <Mail className="w-3 h-3" />
                    Used for OTP
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full h-12 px-4 rounded-lg border ${
                      formErrors.email
                        ? "border-[#EF4444]"
                        : formData.email &&
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                        ? "border-[#10B981]"
                        : "border-border"
                    } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
                  />
                  {formData.email &&
                    !formErrors.email &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                      <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
                    )}
                </div>
                {formErrors.email && (
                  <p className="text-xs text-[#EF4444] mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-border appearance-none checked:bg-[#4F46E5] checked:border-[#4F46E5] cursor-pointer"
                    />
                    {formData.termsAccepted && (
                      <Check className="absolute top-0 left-0 w-5 h-5 text-white pointer-events-none" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">
                    I agree to the{" "}
                    <a href="#" className="underline text-[#4F46E5]">
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline text-[#4F46E5]">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {formErrors.terms && (
                  <p className="text-xs text-[#EF4444] mt-1 ml-8">{formErrors.terms}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full h-13 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 mb-3 py-3"
              >
                {formLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending code…
                  </span>
                ) : (
                  "Proceed to Verification"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/campaign/${campaignId}`)}
                className="w-full text-center text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaign
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: OTP verification ── */}
        {step === "otp" && (
          <>
            <div className="inline-flex items-center bg-[#4F46E5]/10 text-[#4F46E5] px-4 py-2 rounded-full text-sm mb-6">
              <Mail className="w-4 h-4 mr-2" />
              Check your inbox
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border mb-6">
              <p className="text-center text-sm text-muted-foreground mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-center font-semibold text-sm mb-5">{formData.email}</p>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center mb-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-lg border ${
                      otpError ? "border-[#EF4444]" : "border-border"
                    } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs text-[#EF4444] text-center mb-3">{otpError}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading}
                className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 py-3 mb-3"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive it?{" "}
                {canResend && rateLimitCountdown === 0 ? (
                  <button
                    onClick={handleResend}
                    className="text-[#4F46E5] font-medium hover:underline"
                  >
                    Resend code
                  </button>
                ) : (
                  <span>Resend in {Math.max(countdown, rateLimitCountdown)}s</span>
                )}
              </p>

              <button
                onClick={() => {
                  setStep("form");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
                className="w-full text-center text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-1 mt-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit details
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "done" && (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="font-semibold text-lg mb-1">You're verified!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account has been created. Heading to the quiz now…
            </p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-[#4F46E5]/30 border-t-[#4F46E5] rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
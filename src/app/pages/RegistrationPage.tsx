import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Lock, ArrowLeft } from "lucide-react";
import { useStore } from "../../store/StoreContext";
import { CurrentUser } from "../../types";

type FieldErrors = Record<string, string>;

function validateName(val: string): string {
  if (!val.trim()) return "Full name is required";
  return "";
}

function validateMobile(val: string): string {
  if (!val.trim()) return "Mobile number is required";
  if (!/^\d{10}$/.test(val)) return "Please enter a valid 10-digit number";
  return "";
}

function validateEmail(val: string): string {
  if (!val.trim()) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Please enter a valid email";
  return "";
}

export function RegistrationPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { setCurrentUser, setCurrentOTP } = useStore();

  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    countryCode: "+92",
    mobile: "",
    email: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const getFieldState = (field: string, value: string, isValid: boolean) => {
    if (errors[field]) return "error";
    if (value && isValid) return "valid";
    return "idle";
  };

  const nameState = getFieldState("fullName", form.fullName, !validateName(form.fullName));
  const mobileState = getFieldState("mobile", form.mobile, !validateMobile(form.mobile));
  const emailState = getFieldState(
    "email",
    form.email,
    form.email.length > 0 && !validateEmail(form.email)
  );

  const inputClass = (state: string) =>
    [
      "w-full h-12 px-4 pr-11 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 transition-all text-sm",
      state === "error"
        ? "border-red-500 focus:border-red-500"
        : state === "valid"
        ? "border-emerald-500 focus:border-emerald-500"
        : "border-border focus:border-[#4F46E5]",
    ].join(" ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const newErrors: FieldErrors = {};
    const nameErr = validateName(form.fullName);
    const mobileErr = validateMobile(form.mobile);
    const emailErr = validateEmail(form.email);
    if (nameErr) newErrors.fullName = nameErr;
    if (mobileErr) newErrors.mobile = mobileErr;
    if (emailErr) newErrors.email = emailErr;
    if (!form.termsAccepted) newErrors.terms = "You must accept the terms and conditions";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    // DUMMY MODE — no API calls
    const DUMMY_OTP = "123456";

    const user: CurrentUser = {
      name: form.fullName.trim(),
      mobile: form.countryCode + form.mobile,
      mobileRaw: form.mobile,
      countryCode: form.countryCode,
      email: form.email.trim() || "demo@test.com",
    };

    setCurrentUser(user);
    setCurrentOTP(DUMMY_OTP);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/campaign/${campaignId}/verify`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Step 1 of 3</span>
            <span className="text-xs font-semibold text-[#4F46E5]">Registration</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-[#4F46E5] rounded-full transition-all" />
          </div>
        </div>

        {/* Campaign pill */}
        <div className="inline-flex items-center bg-[#4F46E5]/10 text-[#4F46E5] px-4 py-2 rounded-full text-sm font-medium mb-6">
          🏆 Summer Quiz Challenge 2025
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 border border-border mb-6">
          {/* Full Name */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-semibold mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                className={inputClass(nameState)}
              />
              {nameState === "valid" && (
                <Check className="absolute right-3 top-3.5 w-5 h-5 text-emerald-500" />
              )}
              {nameState === "error" && (
                <span className="absolute right-3 top-3 text-red-500 text-lg">✕</span>
              )}
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Mobile */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="mobile" className="text-sm font-semibold">Mobile Number</label>
              <span className="inline-flex items-center gap-1 bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-0.5 rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" />
                Primary ID
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => handleChange("countryCode", e.target.value)}
                className="h-12 px-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-[#4F46E5] text-sm"
                aria-label="Country code"
              >
                <option value="+92">+92</option>
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <div className="relative flex-1">
                <input
                  id="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    handleChange("mobile", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="3001234567"
                  maxLength={10}
                  className={inputClass(mobileState)}
                />
                {mobileState === "valid" && (
                  <Check className="absolute right-3 top-3.5 w-5 h-5 text-emerald-500" />
                )}
              </div>
            </div>
            {errors.mobile && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="email" className="text-sm font-semibold">Email Address</label>
              <span className="text-xs text-muted-foreground">(optional in demo)</span>
            </div>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                className={inputClass(emailState)}
              />
              {emailState === "valid" && (
                <Check className="absolute right-3 top-3.5 w-5 h-5 text-emerald-500" />
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Terms */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => handleChange("termsAccepted", e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-border appearance-none checked:bg-[#4F46E5] checked:border-[#4F46E5] cursor-pointer"
                />
                {form.termsAccepted && (
                  <Check className="absolute top-0 left-0 w-5 h-5 text-white pointer-events-none" />
                )}
              </div>
              <span className="text-sm text-foreground leading-relaxed">
                I agree to the{" "}
                <a href="#" className="underline text-[#4F46E5]">Terms & Conditions</a>
                {" "}and{" "}
                <a href="#" className="underline text-[#4F46E5]">Privacy Policy</a>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500 mt-1 ml-8">{errors.terms}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 mb-3 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue to Verification →"
            )}
          </button>

          {formError && (
            <p className="text-xs text-red-500 mb-3">{formError}</p>
          )}

          <button
            type="button"
            onClick={() => navigate(`/campaign/${campaignId}`)}
            className="w-full text-center text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaign
          </button>
        </form>
      </div>
    </div>
  );
}
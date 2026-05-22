import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Lock } from "lucide-react";

export function RegistrationPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    termsAccepted: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Name is required";
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.termsAccepted) {
      newErrors.terms = "You must accept the terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        navigate(`/campaign/${campaignId}/quiz`);
      }, 1000);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Step 1 of 3</span>
            <span className="text-xs font-semibold text-[#4F46E5]">Registration</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-[#4F46E5] transition-all duration-300" style={{ width: "33%" }}></div>
          </div>
        </div>

        {/* Campaign Name Pill */}
        <div className="inline-flex items-center bg-[#4F46E5]/10 text-[#4F46E5] px-4 py-2 rounded-full text-sm mb-6">
          Summer Quiz Challenge 2024
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border mb-6">
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
                  errors.fullName 
                    ? "border-[#EF4444]" 
                    : formData.fullName 
                    ? "border-[#10B981]" 
                    : "border-border"
                } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
              />
              {formData.fullName && !errors.fullName && (
                <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
              )}
            </div>
            {errors.fullName && (
              <p className="text-xs text-[#EF4444] mt-1">{errors.fullName}</p>
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
              <select className="h-12 px-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]">
                <option>+91</option>
                <option>+1</option>
                <option>+44</option>
              </select>
              <div className="relative flex-1">
                <input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full h-12 px-4 rounded-lg border ${
                    errors.mobile 
                      ? "border-[#EF4444]" 
                      : formData.mobile.length === 10 
                      ? "border-[#10B981]" 
                      : "border-border"
                  } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
                />
                {formData.mobile.length === 10 && !errors.mobile && (
                  <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
                )}
              </div>
            </div>
            {errors.mobile && (
              <p className="text-xs text-[#EF4444] mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="email" className="text-sm font-semibold">
                Email Address
              </label>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="you@example.com"
                className={`w-full h-12 px-4 rounded-lg border ${
                  errors.email 
                    ? "border-[#EF4444]" 
                    : formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                    ? "border-[#10B981]" 
                    : "border-border"
                } bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]`}
              />
              {formData.email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <Check className="absolute right-3 top-3.5 w-5 h-5 text-[#10B981]" />
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-[#EF4444] mt-1">{errors.email}</p>
            )}
          </div>

          {/* Terms Checkbox */}
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
                <a href="#" className="underline text-[#4F46E5]">Terms & Conditions</a>
                {" "}and{" "}
                <a href="#" className="underline text-[#4F46E5]">Privacy Policy</a>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-[#EF4444] mt-1 ml-8">{errors.terms}</p>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 mb-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              "Proceed to Quiz"
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
      </div>
    </div>
  );
}

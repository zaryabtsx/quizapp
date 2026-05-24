import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Lock, ArrowLeft } from "lucide-react";
import { useStore } from "../../store/StoreContext";
import { CurrentUser } from "../../types";

type FieldErrors = Record<string, string>;

// Country phone format validation
const COUNTRY_FORMATS: Record<string, { length: number; regex: RegExp; example: string }> = {
  // Gulf Countries
  "+971": { length: 9, regex: /^[5]\d{8}$/, example: "501234567" },   // UAE
  "+966": { length: 9, regex: /^[5]\d{8}$/, example: "512345678" },   // Saudi Arabia
  "+965": { length: 8, regex: /^[569]\d{7}$/, example: "51234567" },  // Kuwait
  "+968": { length: 8, regex: /^[79]\d{7}$/, example: "91234567" },   // Oman
  "+974": { length: 8, regex: /^[3-7]\d{7}$/, example: "33123456" },  // Qatar
  "+973": { length: 8, regex: /^[369]\d{7}$/, example: "36001234" },  // Bahrain
  "+967": { length: 9, regex: /^[17]\d{8}$/, example: "712345678" },  // Yemen

  // South Asia
  "+92":  { length: 10, regex: /^3\d{9}$/,          example: "3001234567" }, // Pakistan
  "+91":  { length: 10, regex: /^[6-9]\d{9}$/,       example: "9876543210" }, // India
  "+880": { length: 10, regex: /^1[3-9]\d{8}$/,      example: "1712345678" }, // Bangladesh
  "+94":  { length: 9,  regex: /^[7]\d{8}$/,         example: "712345678"  }, // Sri Lanka
  "+977": { length: 10, regex: /^9[78]\d{8}$/,       example: "9841234567" }, // Nepal
  "+93":  { length: 9,  regex: /^[7]\d{8}$/,         example: "701234567"  }, // Afghanistan

  // North America
  "+1":   { length: 10, regex: /^[2-9]\d{2}[2-9]\d{6}$/, example: "2025551234" }, // USA/Canada

  // Europe
  "+44":  { length: 10, regex: /^[1-9]\d{9}$/,  example: "2071838750" }, // UK
  "+49":  { length: 10, regex: /^[1-9]\d{9}$/,  example: "1512345678" }, // Germany
  "+33":  { length: 9,  regex: /^[6-7]\d{8}$/,  example: "612345678"  }, // France
  "+39":  { length: 10, regex: /^3\d{9}$/,       example: "3123456789" }, // Italy
  "+34":  { length: 9,  regex: /^[6-7]\d{8}$/,  example: "612345678"  }, // Spain
  "+31":  { length: 9,  regex: /^6\d{8}$/,       example: "612345678"  }, // Netherlands
  "+32":  { length: 9,  regex: /^4\d{8}$/,       example: "412345678"  }, // Belgium
  "+41":  { length: 9,  regex: /^7[5-9]\d{7}$/,  example: "751234567"  }, // Switzerland
  "+43":  { length: 10, regex: /^6\d{9}$/,       example: "6501234567" }, // Austria
  "+48":  { length: 9,  regex: /^[4-8]\d{8}$/,   example: "512345678"  }, // Poland
  "+30":  { length: 10, regex: /^6\d{9}$/,        example: "6912345678" }, // Greece
  "+351": { length: 9,  regex: /^9[1-6]\d{7}$/,  example: "912345678"  }, // Portugal
  "+46":  { length: 9,  regex: /^7[02369]\d{7}$/, example: "701234567"  }, // Sweden
  "+47":  { length: 8,  regex: /^[49]\d{7}$/,    example: "91234567"   }, // Norway
  "+45":  { length: 8,  regex: /^[2-9]\d{7}$/,   example: "20123456"   }, // Denmark
  "+358": { length: 9,  regex: /^4\d{8}$/,        example: "412345678"  }, // Finland
  "+353": { length: 9,  regex: /^8[5-9]\d{7}$/,  example: "851234567"  }, // Ireland
  "+420": { length: 9,  regex: /^[67]\d{8}$/,    example: "601234567"  }, // Czech Republic
  "+36":  { length: 9,  regex: /^[237]\d{8}$/,   example: "201234567"  }, // Hungary
  "+40":  { length: 9,  regex: /^7[2-8]\d{7}$/,  example: "721234567"  }, // Romania
  "+7":   { length: 10, regex: /^9\d{9}$/,        example: "9123456789" }, // Russia/Kazakhstan

  // East Asia
  "+86":  { length: 11, regex: /^1[3-9]\d{9}$/,  example: "13123456789" }, // China
  "+81":  { length: 10, regex: /^[7-9]0\d{8}$/,  example: "7012345678"  }, // Japan
  "+82":  { length: 10, regex: /^1[0-9]\d{8}$/,  example: "1012345678"  }, // South Korea
  "+886": { length: 9,  regex: /^9\d{8}$/,        example: "912345678"   }, // Taiwan
  "+852": { length: 8,  regex: /^[5-9]\d{7}$/,   example: "51234567"    }, // Hong Kong
  "+853": { length: 8,  regex: /^6\d{7}$/,        example: "61234567"    }, // Macau

  // Southeast Asia
  "+60":  { length: 10, regex: /^1\d{9}$/,        example: "1123456789"  }, // Malaysia
  "+65":  { length: 8,  regex: /^[89]\d{7}$/,    example: "81234567"    }, // Singapore
  "+66":  { length: 9,  regex: /^[689]\d{8}$/,   example: "812345678"   }, // Thailand
  "+62":  { length: 11, regex: /^8\d{10}$/,       example: "81234567890" }, // Indonesia
  "+63":  { length: 10, regex: /^9\d{9}$/,        example: "9123456789"  }, // Philippines
  "+84":  { length: 9,  regex: /^[35789]\d{8}$/,  example: "912345678"   }, // Vietnam
  "+95":  { length: 9,  regex: /^9\d{8}$/,        example: "912345678"   }, // Myanmar
  "+855": { length: 9,  regex: /^[1-9]\d{8}$/,   example: "123456789"   }, // Cambodia

  // Middle East (non-Gulf)
  "+90":  { length: 10, regex: /^5\d{9}$/,        example: "5321234567"  }, // Turkey
  "+98":  { length: 10, regex: /^9\d{9}$/,        example: "9123456789"  }, // Iran
  "+962": { length: 9,  regex: /^7[789]\d{7}$/,  example: "791234567"   }, // Jordan
  "+961": { length: 8,  regex: /^[37]\d{7}$/,    example: "71234567"    }, // Lebanon
  "+963": { length: 9,  regex: /^9[4-6]\d{7}$/,  example: "944567890"   }, // Syria
  "+972": { length: 9,  regex: /^5[0-9]\d{7}$/,  example: "501234567"   }, // Israel
  "+964": { length: 10, regex: /^7[3-9]\d{8}$/,  example: "7301234567"  }, // Iraq
  "+20":  { length: 10, regex: /^1[0-2]\d{8}$/,  example: "1012345678"  }, // Egypt

  // Africa
  "+27":  { length: 9,  regex: /^[6-8]\d{8}$/,   example: "812345678"   }, // South Africa
  "+234": { length: 10, regex: /^[7-9]\d{9}$/,   example: "8123456789"  }, // Nigeria
  "+254": { length: 9,  regex: /^7\d{8}$/,        example: "712345678"   }, // Kenya
  "+251": { length: 9,  regex: /^9\d{8}$/,        example: "912345678"   }, // Ethiopia
  "+255": { length: 9,  regex: /^7[5-9]\d{7}$/,  example: "751234567"   }, // Tanzania
  "+256": { length: 9,  regex: /^7[1-9]\d{7}$/,  example: "712345678"   }, // Uganda
  "+233": { length: 9,  regex: /^[235]\d{8}$/,   example: "201234567"   }, // Ghana
  "+212": { length: 9,  regex: /^6[0-9]\d{7}$/,  example: "612345678"   }, // Morocco
  "+216": { length: 8,  regex: /^[29]\d{7}$/,    example: "20123456"    }, // Tunisia
  "+213": { length: 9,  regex: /^[567]\d{8}$/,   example: "551234567"   }, // Algeria

  // Oceania
  "+61":  { length: 9,  regex: /^4\d{8}$/,        example: "412345678"   }, // Australia
  "+64":  { length: 9,  regex: /^2\d{8}$/,        example: "212345678"   }, // New Zealand

  // Latin America
  "+55":  { length: 11, regex: /^[1-9]{2}9\d{8}$/, example: "11912345678" }, // Brazil
  "+52":  { length: 10, regex: /^1\d{9}$/,          example: "1234567890"  }, // Mexico
  "+54":  { length: 10, regex: /^9\d{9}$/,          example: "9123456789"  }, // Argentina
  "+56":  { length: 9,  regex: /^9\d{8}$/,          example: "912345678"   }, // Chile
  "+57":  { length: 10, regex: /^3\d{9}$/,          example: "3123456789"  }, // Colombia
  "+58":  { length: 10, regex: /^4\d{9}$/,          example: "4121234567"  }, // Venezuela
  "+51":  { length: 9,  regex: /^9\d{8}$/,          example: "912345678"   }, // Peru
};

// Grouped country list for the dropdown
const COUNTRY_LIST = [
  // Gulf
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+967", flag: "🇾🇪", name: "Yemen" },
  // South Asia
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+93",  flag: "🇦🇫", name: "Afghanistan" },
  // North America
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
  // Europe
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+39",  flag: "🇮🇹", name: "Italy" },
  { code: "+34",  flag: "🇪🇸", name: "Spain" },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "+32",  flag: "🇧🇪", name: "Belgium" },
  { code: "+41",  flag: "🇨🇭", name: "Switzerland" },
  { code: "+43",  flag: "🇦🇹", name: "Austria" },
  { code: "+48",  flag: "🇵🇱", name: "Poland" },
  { code: "+30",  flag: "🇬🇷", name: "Greece" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+46",  flag: "🇸🇪", name: "Sweden" },
  { code: "+47",  flag: "🇳🇴", name: "Norway" },
  { code: "+45",  flag: "🇩🇰", name: "Denmark" },
  { code: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+420", flag: "🇨🇿", name: "Czech Republic" },
  { code: "+36",  flag: "🇭🇺", name: "Hungary" },
  { code: "+40",  flag: "🇷🇴", name: "Romania" },
  { code: "+7",   flag: "🇷🇺", name: "Russia" },
  // East Asia
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
  { code: "+886", flag: "🇹🇼", name: "Taiwan" },
  { code: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+853", flag: "🇲🇴", name: "Macau" },
  // Southeast Asia
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+63",  flag: "🇵🇭", name: "Philippines" },
  { code: "+84",  flag: "🇻🇳", name: "Vietnam" },
  { code: "+95",  flag: "🇲🇲", name: "Myanmar" },
  { code: "+855", flag: "🇰🇭", name: "Cambodia" },
  // Middle East (non-Gulf)
  { code: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "+98",  flag: "🇮🇷", name: "Iran" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+963", flag: "🇸🇾", name: "Syria" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt" },
  // Africa
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "+213", flag: "🇩🇿", name: "Algeria" },
  // Oceania
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand" },
  // Latin America
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+52",  flag: "🇲🇽", name: "Mexico" },
  { code: "+54",  flag: "🇦🇷", name: "Argentina" },
  { code: "+56",  flag: "🇨🇱", name: "Chile" },
  { code: "+57",  flag: "🇨🇴", name: "Colombia" },
  { code: "+58",  flag: "🇻🇪", name: "Venezuela" },
  { code: "+51",  flag: "🇵🇪", name: "Peru" },
];

function validateName(val: string): string {
  if (!val.trim()) return "Full name is required";
  return "";
}

function validateMobile(val: string, countryCode: string): string {
  if (!val.trim()) return "Mobile number is required";
  const format = COUNTRY_FORMATS[countryCode];
  if (!format) return "Invalid country code";
  if (val.length !== format.length) return `Must be ${format.length} digits for ${countryCode}`;
  if (!format.regex.test(val)) return `Invalid phone format for ${countryCode}`;
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
  const { setCurrentUser } = useStore();

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
  const mobileState = getFieldState("mobile", form.mobile, !validateMobile(form.mobile, form.countryCode));
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
    const mobileErr = validateMobile(form.mobile, form.countryCode);
    const emailErr = validateEmail(form.email);
    if (nameErr) newErrors.fullName = nameErr;
    if (mobileErr) newErrors.mobile = mobileErr;
    if (emailErr) newErrors.email = emailErr;
    if (!form.termsAccepted) newErrors.terms = "You must accept the terms and conditions";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    const user: CurrentUser = {
      name: form.fullName.trim(),
      mobile: form.countryCode + form.mobile,
      mobileRaw: form.mobile,
      countryCode: form.countryCode,
      email: form.email.trim() || "demo@test.com",
    };

    setCurrentUser(user);

    setTimeout(() => {
      setIsLoading(false);
      navigate(`/campaign/${campaignId}/quiz`);
    }, 500);
  };

  const selectedFormat = COUNTRY_FORMATS[form.countryCode];
  const selectedCountry = COUNTRY_LIST.find((c) => c.code === form.countryCode);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Registration</span>
            <span className="text-xs font-semibold text-[#4F46E5]">1 of 2</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#4F46E5] rounded-full transition-all" />
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
                Required
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => {
                  handleChange("countryCode", e.target.value);
                  handleChange("mobile", ""); // reset number on country change
                }}
                className="h-12 px-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:border-[#4F46E5] text-sm font-medium max-w-[140px]"
                aria-label="Country code"
              >
                {COUNTRY_LIST.map(({ code, flag, name }) => (
                  <option key={code} value={code}>
                    {flag} {code} {name}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <input
                  id="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, selectedFormat?.length || 12))
                  }
                  placeholder={selectedFormat?.example || "Enter number"}
                  className={inputClass(mobileState)}
                />
                {mobileState === "valid" && (
                  <Check className="absolute right-3 top-3.5 w-5 h-5 text-emerald-500" />
                )}
                {mobileState === "error" && (
                  <span className="absolute right-3 top-3 text-red-500 text-lg">✕</span>
                )}
              </div>
            </div>
            {errors.mobile && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
            )}
            {form.mobile && !errors.mobile && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCountry?.flag} {selectedCountry?.name}: {selectedFormat?.example} ({selectedFormat?.length} digits)
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="email" className="text-sm font-semibold">Email Address</label>
              <span className="text-xs text-muted-foreground">(optional)</span>
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
                Starting Quiz...
              </>
            ) : (
              "Start Quiz →"
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
// src/pages/admin/CampaignManagement.tsx
// npm install qrcode @types/qrcode
import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { ArrowLeft, Loader2, Trash2, Download, RefreshCw, Search, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

type FormData = {
  name: string;
  description: string;
  is_active: boolean;
  allowed_country_codes: string[] | null; // null = all countries
};

const DEFAULT_FORM: FormData = {
  name: "",
  description: "",
  is_active: true,
  allowed_country_codes: null,
};

// ─── Country list (shared with register page) ────────────────────────────────

export const COUNTRY_LIST = [
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+967", flag: "🇾🇪", name: "Yemen" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+93",  flag: "🇦🇫", name: "Afghanistan" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
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
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
  { code: "+886", flag: "🇹🇼", name: "Taiwan" },
  { code: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+853", flag: "🇲🇴", name: "Macau" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+63",  flag: "🇵🇭", name: "Philippines" },
  { code: "+84",  flag: "🇻🇳", name: "Vietnam" },
  { code: "+95",  flag: "🇲🇲", name: "Myanmar" },
  { code: "+855", flag: "🇰🇭", name: "Cambodia" },
  { code: "+90",  flag: "🇹🇷", name: "Turkey" },
  { code: "+98",  flag: "🇮🇷", name: "Iran" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+963", flag: "🇸🇾", name: "Syria" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+20",  flag: "🇪🇬", name: "Egypt" },
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
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+52",  flag: "🇲🇽", name: "Mexico" },
  { code: "+54",  flag: "🇦🇷", name: "Argentina" },
  { code: "+56",  flag: "🇨🇱", name: "Chile" },
  { code: "+57",  flag: "🇨🇴", name: "Colombia" },
  { code: "+58",  flag: "🇻🇪", name: "Venezuela" },
  { code: "+51",  flag: "🇵🇪", name: "Peru" },
];

// ─── Country Selector Component ───────────────────────────────────────────────

function CountryCodeSelector({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (val: string[] | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  // null means "all allowed"
  const isAllMode = value === null;
  const selected = new Set(value ?? []);

  const filtered = COUNTRY_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const toggleCountry = (code: string) => {
    if (isAllMode) {
      // Switch from "all" to explicit list: start with all EXCEPT this one
      const newSet = new Set(COUNTRY_LIST.map((c) => c.code));
      newSet.delete(code);
      onChange(Array.from(newSet));
    } else {
      const next = new Set(selected);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      // If all are selected → revert to null (all mode)
      if (next.size === COUNTRY_LIST.length) {
        onChange(null);
      } else {
        onChange(Array.from(next));
      }
    }
  };

  const selectAll = () => onChange(null);
  const clearAll = () => onChange([]);

  const enabledCount = isAllMode ? COUNTRY_LIST.length : selected.size;
  const isRestricted = !isAllMode && selected.size < COUNTRY_LIST.length;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Allowed Country Codes</span>
          {isRestricted ? (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {enabledCount} of {COUNTRY_LIST.length} enabled
            </span>
          ) : (
            <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
              All countries
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs text-[#4F46E5] font-medium hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Configure</>
          )}
        </button>
      </div>

      {/* Selected chips preview (always visible) */}
      {isRestricted && !expanded && (
        <div className="flex flex-wrap gap-1.5">
          {COUNTRY_LIST.filter((c) => selected.has(c.code)).slice(0, 8).map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 text-xs bg-[#4F46E5]/10 text-[#4F46E5] px-2 py-1 rounded-full font-medium"
            >
              {c.flag} {c.code}
            </span>
          ))}
          {selected.size > 8 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{selected.size - 8} more
            </span>
          )}
        </div>
      )}

      {/* Expanded checklist */}
      {expanded && (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
            >
              All
            </button>
            <span className="text-muted-foreground text-xs">|</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-600 font-medium whitespace-nowrap"
            >
              None
            </button>
          </div>

          {/* Scrollable list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No countries match "{search}"
              </div>
            ) : (
              filtered.map((country) => {
                const checked = isAllMode || selected.has(country.code);
                return (
                  <label
                    key={country.code}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCountry(country.code)}
                        className="w-4 h-4 rounded border-2 border-border appearance-none checked:bg-[#4F46E5] checked:border-[#4F46E5] cursor-pointer"
                      />
                      {checked && (
                        <svg
                          className="absolute top-0 left-0 w-4 h-4 text-white pointer-events-none"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 8l3.5 3.5L13 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="text-sm font-medium text-foreground flex-1">
                      {country.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {country.code}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {enabledCount} of {COUNTRY_LIST.length} countries enabled
            </span>
            {isRestricted && (
              <span className="text-xs text-amber-600 font-medium">
                ⚠ Registration restricted
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QR helpers ───────────────────────────────────────────────────────────────

function buildQuizUrl(campaignId: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL ?? window.location.origin;
  return `${base}/campaign/${campaignId}/register`;
}

async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

async function uploadQRToStorage(
  campaignId: string,
  dataUrl: string
): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `qr-codes/${campaignId}.png`;

  const { error: uploadError } = await supabase.storage
    .from("campaign-assets-new")
    .upload(path, blob, { contentType: "image/png", upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("campaign-assets-new")
    .getPublicUrl(path);

  return data.publicUrl;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CampaignManagement() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const isEditing = !!campaignId && campaignId !== "new";

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrStorageUrl, setQrStorageUrl] = useState<string | null>(null);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(
    isEditing ? campaignId! : null
  );

  const [loadingInit, setLoadingInit] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load existing campaign ──
  useEffect(() => {
    if (!isEditing || !campaignId) return;
    const load = async () => {
      setLoadingInit(true);
      setError(null);
      try {
        const c = await getCampaign(campaignId);
        setFormData({
          name: c.name,
          description: c.description ?? "",
          is_active: c.is_active,
          // null → all countries, array → restricted list
          allowed_country_codes: c.allowed_country_codes ?? null,
        });
        if (c.qr_code_url) {
          setQrStorageUrl(c.qr_code_url);
          setQrDataUrl(c.qr_code_url);
        }
      } catch (err: any) {
        setError(err.message || "Campaign not found");
      } finally {
        setLoadingInit(false);
      }
    };
    load();
  }, [campaignId, isEditing]);

  // ── Save campaign ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        // Empty array treated same as null (all countries)
        allowed_country_codes:
          formData.allowed_country_codes === null ||
          formData.allowed_country_codes.length === 0
            ? null
            : formData.allowed_country_codes,
      };

      let id = savedCampaignId;

      if (isEditing) {
        await updateCampaign(campaignId!, payload);
        id = campaignId!;
      } else {
        const created = await createCampaign(payload);
        id = created.id;
        setSavedCampaignId(id);
      }

      if (id && !qrStorageUrl) {
        await handleGenerateQR(id);
      }

      alert(`✅ Campaign ${isEditing ? "updated" : "created"} successfully!`);
      navigate("/admin/campaigns");
    } catch (err: any) {
      setError(err?.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  // ── Generate / regenerate QR ──
  const handleGenerateQR = async (idOverride?: string) => {
    const id = idOverride ?? savedCampaignId;
    if (!id) {
      setError("Save the campaign first before generating a QR code.");
      return;
    }
    setGeneratingQR(true);
    setError(null);
    try {
      const url = buildQuizUrl(id);
      const dataUrl = await generateQRDataUrl(url);
      setQrDataUrl(dataUrl);

      const publicUrl = await uploadQRToStorage(id, dataUrl);
      setQrStorageUrl(publicUrl);

      await supabase
        .from("campaigns")
        .update({ qr_code_url: publicUrl })
        .eq("id", id);
    } catch (err: any) {
      setError(err?.message || "Failed to generate QR code");
    } finally {
      setGeneratingQR(false);
    }
  };

  // ── Download QR ──
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${formData.name.replace(/\s+/g, "-").toLowerCase() || savedCampaignId}.png`;
    a.click();
  };

  // ── Delete campaign ──
  const handleDelete = async () => {
    if (!confirm(`Delete "${formData.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteCampaign(campaignId!);
      navigate("/admin/campaigns");
    } catch (err: any) {
      setError(err?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingInit) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/campaigns")}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Campaign" : "Create New Campaign"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update details" : "Set up a new campaign"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Campaign Info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-5">Campaign Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                    placeholder="Summer Quiz Challenge"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                    placeholder="Describe your campaign..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: !formData.is_active,
                      })
                    }
                    className={`px-5 py-2.5 rounded-full font-semibold text-sm ${
                      formData.is_active
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {formData.is_active ? "✓ Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Country Code Restrictions ── */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <CountryCodeSelector
                value={formData.allowed_country_codes}
                onChange={(val) =>
                  setFormData({ ...formData, allowed_country_codes: val })
                }
              />
              <p className="text-xs text-muted-foreground mt-3">
                Leave as "All countries" to allow everyone, or uncheck specific
                countries to restrict registration to the remaining ones.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/admin/campaigns")}
                className="px-6 py-3 border border-border hover:bg-muted rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving
                  ? "Saving..."
                  : isEditing
                  ? "Update"
                  : "Create Campaign"}
              </button>
            </div>
          </form>

          {/* ── QR Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-1">QR Code</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Scan → register → take quiz
              </p>

              <div className="bg-white border border-border rounded-xl p-6 flex items-center justify-center min-h-[220px] mb-4">
                {generatingQR ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs">Generating…</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Campaign QR code"
                    className="w-full max-w-[180px]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground text-center">
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                      <span className="text-2xl">⬛</span>
                    </div>
                    <p className="text-xs">
                      {savedCampaignId
                        ? "Click generate below"
                        : "Save campaign first"}
                    </p>
                  </div>
                )}
              </div>

              {savedCampaignId && (
                <p className="text-[11px] text-muted-foreground break-all mb-4 bg-muted rounded-lg px-3 py-2 font-mono">
                  {buildQuizUrl(savedCampaignId)}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQR()}
                  disabled={generatingQR || !savedCampaignId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-40 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {generatingQR ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {qrDataUrl ? "Regenerate QR" : "Generate QR"}
                </button>

                {qrDataUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border hover:bg-muted rounded-xl font-medium text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                )}
              </div>

              {!savedCampaignId && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Save the campaign first to generate a QR code
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
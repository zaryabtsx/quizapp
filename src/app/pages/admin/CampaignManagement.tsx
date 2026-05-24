// src/pages/admin/CampaignManagement.tsx
// npm install qrcode @types/qrcode
import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { ArrowLeft, Loader2, Trash2, Download, RefreshCw } from "lucide-react";
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
};

const DEFAULT_FORM: FormData = {
  name: "",
  description: "",
  is_active: true,
};

// ─── QR helpers ───────────────────────────────────────────────────────────────

/** Builds the public URL a user lands on after scanning */
function buildQuizUrl(campaignId: string): string {
  const base = import.meta.env.VITE_PUBLIC_URL ?? window.location.origin;
  return `${base}/campaign/${campaignId}/register`;
}

/** Renders QR to a canvas and returns a PNG data-URL */
async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/** Uploads the PNG data-URL to Supabase Storage and returns the public URL */
async function uploadQRToStorage(
  campaignId: string,
  dataUrl: string
): Promise<string> {
  // Convert data-URL → Blob
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

// ─── Component ────────────────────────────────────────────────────────────────

export function CampaignManagement() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const isEditing = !!campaignId && campaignId !== "new";

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);   // local preview
  const [qrStorageUrl, setQrStorageUrl] = useState<string | null>(null); // saved URL
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
      };

      let id = savedCampaignId;

      if (isEditing) {
        await updateCampaign(campaignId!, payload);
        id = campaignId!;
      } else {
        const created = await createCampaign(payload);
        id = created.id; // ← make sure createCampaign returns the new row
        setSavedCampaignId(id);
      }

      // Auto-generate QR after first save if none exists yet
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

      // Upload to Supabase Storage & save public URL back to campaigns row
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

  // ── Download QR as PNG ──
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                    placeholder="Summer Quiz Challenge"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                    placeholder="Describe your campaign..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, is_active: !formData.is_active })
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
                {saving ? "Saving..." : isEditing ? "Update" : "Create Campaign"}
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

              {/* QR preview */}
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

              {/* QR URL label */}
              {savedCampaignId && (
                <p className="text-[11px] text-muted-foreground break-all mb-4 bg-muted rounded-lg px-3 py-2 font-mono">
                  {buildQuizUrl(savedCampaignId)}
                </p>
              )}

              {/* Actions */}
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
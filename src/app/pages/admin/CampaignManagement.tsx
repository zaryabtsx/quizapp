// src/pages/admin/CampaignManagement.tsx
import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { ArrowLeft, QrCode, Loader2, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../../../lib/api";

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

export function CampaignManagement() {
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const isEditing = !!campaignId && campaignId !== "new";

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing || !campaignId) return;

    const loadCampaign = async () => {
      setLoadingInit(true);
      setError(null);

      try {
        const c = await getCampaign(campaignId);
        
        setFormData({
          name: c.name,
          description: c.description ?? "",
          is_active: c.is_active,
        });
        setQrCodeUrl(c.qr_code_url ?? null);
      } catch (err: any) {
        console.error("Failed to load campaign:", err);
        setError(err.message || "Campaign not found");
      } finally {
        setLoadingInit(false);
      }
    };

    loadCampaign();
  }, [campaignId, isEditing]);

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

    console.log("📤 Sending payload to Supabase:", { campaignId, payload });

    if (isEditing) {
      await updateCampaign(campaignId!, payload);
    } else {
      await createCampaign(payload);
    }

    alert(`✅ Campaign ${isEditing ? "updated" : "created"} successfully!`);
    navigate("/admin/campaigns");
  } catch (err: any) {
    console.error("💥 Final Error Object:", err);
    setError(err?.message || "Failed to save campaign");
  } finally {
    setSaving(false);
  }
};

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
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`px-5 py-2.5 rounded-full font-semibold text-sm ${
                      formData.is_active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
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

          {/* QR Code Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">QR Code</h3>
              <div className="bg-white border rounded-xl p-8 flex justify-center min-h-[240px]">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR" className="max-h-52" />
                ) : (
                  <QrCode className="w-24 h-24 text-gray-300" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
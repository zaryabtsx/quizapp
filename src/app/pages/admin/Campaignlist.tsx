// src/pages/admin/CampaignList.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/AdminLayout";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { getCampaigns, deleteCampaign } from "../../lib/api";
import type { Campaign } from "../../../types/database";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? "bg-[#10B981]/10 text-[#10B981]"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function QRCodePreview({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground text-sm">—</span>;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[#4F46E5] hover:underline text-sm"
    >
      <Eye className="w-4 h-4" />
      View QR
    </a>
  );
}

export function CampaignList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: campaigns = [], loading, error, refetch } = useAsync(getCampaigns, [], true);

  const filtered = (campaigns ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Delete "${campaign.name}"? This action cannot be undone.`)) return;
    
    setDeletingId(campaign.id);
    try {
      await deleteCampaign(campaign.id);
      await refetch();
    } catch (err) {
      alert("Failed to delete: " + (err instanceof Error ? err.message : err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${(campaigns ?? []).length} total campaign${(campaigns ?? []).length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/campaigns/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ⚠️ {error instanceof Error ? error.message : "An error occurred"}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm h-11 pl-10 pr-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-4">Campaign</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">QR Code</div>
            <div className="col-span-2">Created At</div>
            <div className="col-span-2">Actions</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">
              Loading campaigns…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-3">
                {search ? "No campaigns match your search." : "No campaigns yet."}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/admin/campaigns/new")}
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-medium"
                >
                  Create your first campaign
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 items-center"
              >
                {/* Name + Description */}
                <div className="col-span-4">
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge isActive={c.is_active} />
                </div>

                {/* QR Code */}
                <div className="col-span-2">
                  <QRCodePreview url={c.qr_code_url} />
                </div>

                {/* Created At */}
                <div className="col-span-2 text-sm text-muted-foreground">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : '—'}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/campaigns/${c.id}`)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit Campaign"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="p-2 hover:bg-[#EF4444]/10 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4 text-[#EF4444]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
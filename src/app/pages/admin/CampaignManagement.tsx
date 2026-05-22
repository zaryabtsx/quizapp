import { useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Upload, Download, RefreshCw, Trash2, ArrowLeft, QrCode } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export function CampaignManagement() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const isEditing = !!campaignId;

  const [formData, setFormData] = useState({
    name: isEditing ? "Summer Quiz Challenge 2024" : "",
    description: isEditing ? "Test your knowledge and win exciting prizes!" : "",
    isActive: isEditing ? true : false,
    startDate: isEditing ? "2024-05-01" : "",
    endDate: isEditing ? "2024-05-31" : "",
    questionsPerQuiz: 5,
    timeLimit: "none",
    leaderboardPublic: true,
    showWinner: true,
  });

  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save campaign logic
    navigate("/admin/campaigns");
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
              {isEditing ? "Update campaign details" : "Set up a new quiz campaign"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Campaign Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      maxLength={100}
                      placeholder="Enter campaign name"
                      className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-muted-foreground">
                      {formData.name.length}/100
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Enter campaign description"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold mb-2">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-semibold mb-2">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Campaign Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                      formData.isActive
                        ? "bg-[#10B981] text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Campaign Banner</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {bannerImage ? (
                      <div className="relative">
                        <img src={bannerImage} alt="Campaign banner" className="w-full h-32 object-cover rounded-lg mb-3" />
                        <button
                          type="button"
                          onClick={() => setBannerImage(null)}
                          className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626]"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">Drop image here or click to browse</p>
                        <p className="text-xs text-muted-foreground">16:9 aspect ratio recommended</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="questionsPerQuiz" className="block text-sm font-semibold mb-2">
                    Questions per Quiz
                  </label>
                  <select
                    id="questionsPerQuiz"
                    value={formData.questionsPerQuiz}
                    onChange={(e) => setFormData({ ...formData, questionsPerQuiz: parseInt(e.target.value) })}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timeLimit" className="block text-sm font-semibold mb-2">
                    Time Limit per Question
                  </label>
                  <select
                    id="timeLimit"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
                  >
                    <option value="none">No Limit</option>
                    <option value="30">30 seconds</option>
                    <option value="60">60 seconds</option>
                    <option value="120">120 seconds</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.leaderboardPublic}
                      onChange={(e) => setFormData({ ...formData, leaderboardPublic: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border"
                    />
                    <span className="text-sm font-medium">Public Leaderboard</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showWinner}
                      onChange={(e) => setFormData({ ...formData, showWinner: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-border"
                    />
                    <span className="text-sm font-medium">Show Winner Banner</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="px-6 py-3 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Campaign
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/campaigns")}
                  className="px-6 py-3 border-2 border-border hover:border-[#4F46E5] rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-semibold transition-colors"
                >
                  Save Campaign
                </button>
              </div>
            </div>
          </form>

          {/* QR Code Preview */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">QR Code</h3>
              
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-48 h-48 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-white" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mb-4">
                Scan with any QR reader
              </p>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
                <button className="w-full px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download SVG
                </button>
                <button className="w-full px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate QR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

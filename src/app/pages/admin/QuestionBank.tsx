// src/pages/admin/QuestionBank.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import {
  Upload, Search, Edit, Trash2, Plus, Download,
  ChevronDown, ChevronUp, X, Loader2, Check, PenLine, BookOpen,
} from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

interface DBQuestion {
  id: string;
  campaign_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string;
  // difficulty: "EASY" | "MEDIUM" | "HARD";
  created_at: string;
}

type CorrectOption = "A" | "B" | "C" | "D" | "E";
const OPTION_LETTERS: CorrectOption[] = ["A", "B", "C", "D", "E"];

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, description, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchQuestions(
  campaignId?: string,
  opts?: { search?: string; difficulty?: string; page?: number; pageSize?: number }
): Promise<{ data: DBQuestion[]; count: number }> {
  const { search = "", difficulty = "all", page = 0, pageSize = 25 } = opts ?? {};
  let query = supabase
    .from("questions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (search) query = query.ilike("question_text", `%${search}%`);
  if (difficulty !== "all") query = query.eq("difficulty", difficulty.toUpperCase());

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data ?? []) as DBQuestion[], count: count ?? 0 };
}

async function saveQuestion(payload: Omit<DBQuestion, "id" | "created_at">) {
  const { error } = await supabase.from("questions").insert(payload);
  if (error) throw error;
}

async function editQuestion(id: string, payload: Partial<Omit<DBQuestion, "id" | "created_at">>) {
  const { error } = await supabase.from("questions").update(payload).eq("id", id);
  if (error) throw error;
}

async function removeQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

async function removeQuestions(ids: string[]) {
  const { error } = await supabase.from("questions").delete().in("id", ids);
  if (error) throw error;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-[#10B981] text-white",
  MEDIUM: "bg-[#F59E0B] text-white",
  HARD: "bg-[#EF4444] text-white",
};

const PAGE_SIZE = 25;

// ─── Question Form ────────────────────────────────────────────────────────────
interface QuestionFormProps {
  initial?: DBQuestion;
  campaignId: string;
  onSaved: () => void;
  onClose: () => void;
  saveLabel?: string;
  showSaveAndAnother?: boolean;
  onSaveAndAnother?: () => void;
  successCount?: number;
}

function QuestionForm({
  initial,
  campaignId,
  onSaved,
  onClose,
  saveLabel = "Save Question",
  showSaveAndAnother,
  onSaveAndAnother,
  successCount,
}: QuestionFormProps) {
  const isEdit = !!initial;

  const [questionText, setQuestionText] = useState(initial?.question_text ?? "");
  const [difficulty, setDifficulty] = useState<DBQuestion["difficulty"]>(initial?.difficulty ?? "EASY");
  const [optionA, setOptionA] = useState(initial?.option_a ?? "");
  const [optionB, setOptionB] = useState(initial?.option_b ?? "");
  const [optionC, setOptionC] = useState(initial?.option_c ?? "");
  const [optionD, setOptionD] = useState(initial?.option_d ?? "");
  const [optionE, setOptionE] = useState(initial?.option_e ?? "");
  const [correctOption, setCorrectOption] = useState<CorrectOption>(
    (initial?.correct_option as CorrectOption) ?? "A"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionValues: Record<CorrectOption, string> = {
    A: optionA, B: optionB, C: optionC, D: optionD, E: optionE,
  };
  const setters: Record<CorrectOption, (v: string) => void> = {
    A: setOptionA, B: setOptionB, C: setOptionC, D: setOptionD, E: setOptionE,
  };

  const validate = (): string | null => {
    if (!questionText.trim()) return "Question text is required.";
    if (!optionA.trim()) return "Option A is required.";
    if (!optionB.trim()) return "Option B is required.";
    if (!optionValues[correctOption]?.trim()) return `Correct option (${correctOption}) has no text.`;
    return null;
  };

  const buildPayload = (): Omit<DBQuestion, "id" | "created_at"> => ({
    campaign_id: campaignId,
    question_text: questionText.trim(),
    difficulty,
    option_a: optionA.trim(),
    option_b: optionB.trim(),
    option_c: optionC.trim() || null,
    option_d: optionD.trim() || null,
    option_e: optionE.trim() || null,
    correct_option: correctOption,
  });

  const handleSave = async (andAnother = false) => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await editQuestion(initial!.id, buildPayload());
      } else {
        await saveQuestion(buildPayload());
      }
      onSaved();
      if (andAnother && onSaveAndAnother) {
        onSaveAndAnother();
      } else {
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {successCount !== undefined && successCount > 0 && (
        <p className="text-xs text-[#10B981] font-medium">
          ✓ {successCount} question{successCount !== 1 ? "s" : ""} added this session
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Question Text <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] resize-none text-sm"
              placeholder="Type your question here…"
            />
          </div>

          <div>
            {/* <label className="block text-sm font-semibold mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    difficulty === d
                      ? DIFFICULTY_COLORS[d] + " shadow-sm"
                      : "border-2 border-border hover:border-[#4F46E5] text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div> */}
          </div>
        </div>

        {/* Right — options */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Answer Options{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (click circle = correct answer)
            </span>
          </label>
          <div className="space-y-2">
            {OPTION_LETTERS.map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOption(letter)}
                  title={`Mark ${letter} as correct`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                    correctOption === letter
                      ? "bg-[#10B981] text-white shadow-sm scale-110"
                      : "border-2 border-border hover:border-[#10B981] text-muted-foreground"
                  }`}
                >
                  {correctOption === letter ? <Check className="w-4 h-4" /> : letter}
                </button>
                <input
                  type="text"
                  value={optionValues[letter]}
                  onChange={(e) => setters[letter](e.target.value)}
                  placeholder={`Option ${letter}${letter === "A" || letter === "B" ? " (required)" : " (optional)"}`}
                  className={`flex-1 h-10 px-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] bg-input-background ${
                    correctOption === letter
                      ? "border-[#10B981]/50 bg-[#10B981]/5"
                      : "border-border"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          {showSaveAndAnother && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save & Add Another
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  question,
  onClose,
  onSaved,
}: {
  question: DBQuestion;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Question</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <QuestionForm
          initial={question}
          campaignId={question.campaign_id}
          onSaved={onSaved}
          onClose={onClose}
          saveLabel="Save Changes"
        />
      </div>
    </div>
  );
}

// ─── Inline Add Panel ─────────────────────────────────────────────────────────
function AddPanel({
  campaignId,
  onSaved,
  onClose,
}: {
  campaignId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  // onSaved refreshes the list; onClose closes the panel — both happen on save
  const handleSaved = () => {
    onSaved();
    onClose();
  };

  return (
    <div
      className="bg-card border-2 border-[#4F46E5]/30 rounded-2xl p-6 mb-6"
      id="manual-entry-panel"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#4F46E5]/10 rounded-xl flex items-center justify-center">
            <PenLine className="w-5 h-5 text-[#4F46E5]" />
          </div>
          <h3 className="text-base font-bold">Add Question Manually</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <QuestionForm
        campaignId={campaignId}
        onSaved={handleSaved}
        onClose={onClose}
        saveLabel="Save Question"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function QuestionBank() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [page, setPage] = useState(0);

  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<DBQuestion | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Fetch campaigns on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetchCampaigns()
      .then(setCampaigns)
      .catch((e) => console.error("Failed to load campaigns:", e))
      .finally(() => setCampaignsLoading(false));
  }, []);

  // ── Fetch questions whenever filters change ────────────────────────────────
  // Use a ref to track the latest fetch so stale responses don't overwrite newer ones
  const fetchIdRef = useRef(0);

  const loadQuestions = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoadingQuestions(true);
    try {
      const result = await fetchQuestions(selectedCampaignId || undefined, {
        search: searchQuery,
        difficulty: selectedDifficulty,
        page,
        pageSize: PAGE_SIZE,
      });
      // Only apply if this is still the latest fetch
      if (id === fetchIdRef.current) {
        setQuestions(result.data);
        setTotalCount(result.count);
      }
    } catch (e) {
      console.error("Failed to load questions:", e);
    } finally {
      if (id === fetchIdRef.current) setLoadingQuestions(false);
    }
  }, [selectedCampaignId, searchQuery, selectedDifficulty, page]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === questions.length && questions.length > 0
        ? new Set()
        : new Set(questions.map((q) => q.id))
    );
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected question${selectedIds.size !== 1 ? "s" : ""}?`)) return;
    try {
      await removeQuestions([...selectedIds]);
      setSelectedIds(new Set());
      loadQuestions();
    } catch (e) {
      alert("Delete failed: " + (e instanceof Error ? e.message : e));
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await removeQuestion(id);
      loadQuestions();
    } catch (e) {
      alert("Delete failed: " + (e instanceof Error ? e.message : e));
    }
  };

  const handleOpenAdd = () => {
    if (!selectedCampaignId) {
      alert("Please select a campaign first.");
      return;
    }
    setShowAddPanel(true);
    setTimeout(() => {
      document.getElementById("manual-entry-panel")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleCampaignChange = (id: string) => {
    setSelectedCampaignId(id);
    setPage(0);
    setSelectedIds(new Set());
    setShowAddPanel(false);
    setSearchQuery("");
    setSelectedDifficulty("all");
  };

  // ── Bulk upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCampaignId) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const parsed: Omit<DBQuestion, "id" | "created_at">[] = rows
        .map((r) => ({
          campaign_id: selectedCampaignId,
          question_text: String(r.question_text ?? r.text ?? "").trim(),
          difficulty: (String(r.difficulty ?? "EASY").toUpperCase()) as DBQuestion["difficulty"],
          option_a: String(r.option_a ?? "").trim(),
          option_b: String(r.option_b ?? "").trim(),
          option_c: String(r.option_c ?? "").trim() || null,
          option_d: String(r.option_d ?? "").trim() || null,
          option_e: String(r.option_e ?? "").trim() || null,
          correct_option: String(r.correct_option ?? "A").toUpperCase() as CorrectOption,
        }))
        .filter((r) => r.question_text && r.option_a && r.option_b);

      if (parsed.length === 0) {
        throw new Error(
          "No valid rows found. Need columns: question_text, option_a, option_b, correct_option, difficulty"
        );
      }

      const { error } = await supabase.from("questions").insert(parsed);
      if (error) throw error;

      setUploadStatus(`✓ Imported ${parsed.length} question${parsed.length !== 1 ? "s" : ""} successfully!`);
      loadQuestions();
    } catch (e) {
      setUploadStatus("⚠️ " + (e instanceof Error ? e.message : "Import failed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        question_text: "What is the capital of France?",
        difficulty: "EASY",
        option_a: "London",
        option_b: "Berlin",
        option_c: "Paris",
        option_d: "Madrid",
        option_e: "Rome",
        correct_option: "C",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "questions_template.xlsx");
  };

  const getOptions = (q: DBQuestion) =>
    [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e].filter(Boolean) as string[];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {editingQuestion && (
        <EditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            loadQuestions();
            setEditingQuestion(null);
          }}
        />
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Question Bank Management</h1>
          <p className="text-sm text-muted-foreground">Manage quiz questions for all campaigns</p>
        </div>

        {/* Campaign Selector */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Current Campaign</p>
              {campaignsLoading ? (
                <span className="text-sm text-muted-foreground">Loading campaigns…</span>
              ) : (
                <select
                  value={selectedCampaignId}
                  onChange={(e) => handleCampaignChange(e.target.value)}
                  className="font-semibold bg-transparent border-none focus:outline-none text-sm"
                  aria-label="Select campaign"
                >
                  <option value="">— All Campaigns —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#4F46E5]/10 text-[#4F46E5] rounded-full text-sm font-semibold">
                {totalCount} question{totalCount !== 1 ? "s" : ""}
              </span>
              {selectedCampaignId && !showAddPanel && (
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <PenLine className="w-4 h-4" /> Add Question
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Add Panel */}
        {showAddPanel && selectedCampaignId && (
          <AddPanel
            campaignId={selectedCampaignId}
            onSaved={loadQuestions}
            onClose={() => setShowAddPanel(false)}
          />
        )}

        {/* Bulk Upload */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Bulk Upload via Excel</h3>
          </div>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Required columns:{" "}
              {["question_text", "option_a", "option_b", "correct_option", "difficulty"].map((c) => (
                <code key={c} className="bg-muted px-1 rounded text-xs mx-0.5">{c}</code>
              ))}
              — optional:{" "}
              {["option_c", "option_d", "option_e"].map((c) => (
                <code key={c} className="bg-muted px-1 rounded text-xs mx-0.5">{c}</code>
              ))}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              <strong>correct_option</strong> = letter of the correct answer (A, B, C, D, or E)
            </p>
            {selectedCampaignId && (
              <p className="text-xs text-[#4F46E5] font-medium mb-3">
                📁 Uploading into:{" "}
                <strong>{campaigns.find((c) => c.id === selectedCampaignId)?.name ?? "Selected Campaign"}</strong>
                {" "}— any campaign_id column in your file will be ignored.
              </p>
            )}
            {uploadStatus && (
              <p
                className={`text-sm mb-3 ${
                  uploadStatus.startsWith("✓") ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {uploadStatus}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <label
                htmlFor="file-upload"
                className={`px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-2 text-sm ${
                  !selectedCampaignId
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload File
                  </>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={!selectedCampaignId || uploading}
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            {!selectedCampaignId && (
              <p className="text-xs text-muted-foreground mt-2">Select a campaign first to upload</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
          </div>
          <div className="flex gap-2">
            {["all", "EASY", "MEDIUM", "HARD"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDifficulty(d);
                  setPage(0);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDifficulty === d
                    ? "bg-[#4F46E5] text-white"
                    : "border-2 border-border hover:border-[#4F46E5]"
                }`}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-[#4F46E5] text-white rounded-lg px-6 py-3 mb-4 flex items-center justify-between">
            <span className="font-semibold">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.size === questions.length && questions.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-border"
                aria-label="Select all"
              />
            </div>
            <div className="col-span-5">Question</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Correct</div>
            <div className="col-span-2">Actions</div>
          </div>

          {loadingQuestions ? (
            <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">
              Loading questions…
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm mb-3">No questions found.</p>
              {selectedCampaignId && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add your first question
                </button>
              )}
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id}>
                <div className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-muted/30">
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleId(q.id)}
                      className="w-4 h-4 rounded border-border"
                      aria-label={`Select question`}
                    />
                  </div>
                  <div className="col-span-5">
                    <p className="text-sm font-medium line-clamp-2">{q.question_text}</p>
                    <button
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1"
                    >
                      {expandedId === q.id ? (
                        <><ChevronUp className="w-3 h-3" /> Hide options</>
                      ) : (
                        <><ChevronDown className="w-3 h-3" /> View options</>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${DIFFICULTY_COLORS[q.difficulty]}`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-sm font-bold">
                      {q.correct_option}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDeleteOne(q.id)}
                      className="p-2 hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                    </button>
                  </div>
                </div>

                {expandedId === q.id && (
                  <div className="px-14 pb-4 bg-muted/20 border-b border-border">
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {getOptions(q).map((opt, i) => {
                        const letter = OPTION_LETTERS[i];
                        const isCorrect = q.correct_option === letter;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              isCorrect
                                ? "bg-[#10B981]/10 text-[#10B981] font-medium"
                                : "bg-muted"
                            }`}
                          >
                            <span className="font-bold">{letter}.</span>
                            {opt}
                            {isCorrect && <Check className="w-3.5 h-3.5 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0
              ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`
              : "No results"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* FAB */}
        {!showAddPanel && (
          <button
            onClick={handleOpenAdd}
            className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
            title="Add Question"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </AdminLayout>
  );
}
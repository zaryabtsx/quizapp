import { useState } from "react";
import { AdminLayout } from "../../components/AdminLayout";
import { Upload, Search, Edit, Trash2, Plus, Download, ChevronDown } from "lucide-react";

const MOCK_QUESTIONS = [
  { id: 1, text: "What is the capital of France?", difficulty: "EASY", correctAnswer: "B", options: ["London", "Paris", "Berlin", "Madrid", "Rome"] },
  { id: 2, text: "Which planet is known as the Red Planet?", difficulty: "EASY", correctAnswer: "C", options: ["Venus", "Jupiter", "Mars", "Saturn", "Neptune"] },
  { id: 3, text: "What is the largest ocean on Earth?", difficulty: "MEDIUM", correctAnswer: "D", options: ["Atlantic", "Indian", "Arctic", "Pacific", "Southern"] },
  { id: 4, text: "Who painted the Mona Lisa?", difficulty: "MEDIUM", correctAnswer: "C", options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo", "Rembrandt"] },
  { id: 5, text: "What is the smallest prime number?", difficulty: "HARD", correctAnswer: "C", options: ["0", "1", "2", "3", "5"] },
];

export function QuestionBank() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredQuestions = MOCK_QUESTIONS.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const toggleQuestion = (id: number) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQuestions(newSet);
  };

  const toggleAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-[#10B981] text-white";
      case "MEDIUM": return "bg-[#F59E0B] text-white";
      case "HARD": return "bg-[#EF4444] text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Question Bank Management</h1>
          <p className="text-sm text-muted-foreground">Manage quiz questions for all campaigns</p>
        </div>

        {/* Campaign Selector */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Campaign</p>
              <p className="font-semibold">Summer Quiz Challenge 2024</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-[#4F46E5]/10 text-[#4F46E5] rounded-full text-sm font-semibold">
                342 questions
              </span>
              <button className="px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors">
                Change Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Upload Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Bulk Upload Questions</h3>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">Drop Excel file here or click to browse</p>
            <p className="text-sm text-muted-foreground mb-4">Supports .xlsx, .xls (max 10MB)</p>
            <div className="flex items-center justify-center gap-3">
              <button className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-medium transition-colors">
                Upload File
              </button>
              <button className="px-4 py-2 border-2 border-border hover:border-[#4F46E5] rounded-lg font-medium transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
          </div>
          
          <div className="flex gap-2">
            {["all", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? "bg-[#4F46E5] text-white"
                    : "border-2 border-border hover:border-[#4F46E5]"
                }`}
              >
                {diff === "all" ? "All" : diff}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedQuestions.size > 0 && (
          <div className="bg-[#4F46E5] text-white rounded-lg px-6 py-3 mb-4 flex items-center justify-between">
            <span className="font-semibold">{selectedQuestions.size} selected</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">
                Export Selected
              </button>
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">
                Change Difficulty
              </button>
              <button className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg font-medium transition-colors">
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-border"
              />
            </div>
            <div className="col-span-5">Question</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Correct Answer</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {filteredQuestions.map((question) => (
            <div key={question.id} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border last:border-b-0 hover:bg-muted/30">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedQuestions.has(question.id)}
                  onChange={() => toggleQuestion(question.id)}
                  className="w-4 h-4 rounded border-border"
                />
              </div>
              <div className="col-span-5">
                <p className="text-sm font-medium truncate">{question.text}</p>
                <button className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1">
                  View options <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="px-3 py-1 bg-[#4F46E5]/10 text-[#4F46E5] rounded-full text-sm font-semibold">
                  {question.correctAnswer}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <select className="px-3 py-2 border border-border rounded-lg bg-input-background">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40">
              Previous
            </button>
            <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
              Next
            </button>
          </div>
        </div>

        {/* Floating Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </AdminLayout>
  );
}

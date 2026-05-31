import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, History, Search, Loader2, Sparkle, Trash2, ArrowRight, X, Copy, Check } from "lucide-react";
import { generateTopics, generateAbstract, getAutocompleteSuggestions, ResearchTopic, GenerationMode, Suggestion } from "./services/geminiService";
import { TopicCard } from "./components/TopicCard";

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.GENERAL);
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [history, setHistory] = useState<ResearchTopic[]>([]);
  const [savedTopics, setSavedTopics] = useState<ResearchTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ResearchTopic | null>(null);
  const [abstract, setAbstract] = useState<string | null>(null);
  const [isGeneratingAbstract, setIsGeneratingAbstract] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedStructure, setCopiedStructure] = useState(false);

  // Math IA filters
  const [interestArea, setInterestArea] = useState("Any");
  const [course, setCourse] = useState("Any");
  const [level, setLevel] = useState("Any");
  const [mathArea, setMathArea] = useState("Any");
  const [dataType, setDataType] = useState("Any");
  const [country, setCountry] = useState("");
  const [difficulty, setDifficulty] = useState("Any");
  const [count, setCount] = useState<number>(5);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("ideasphere-saved");
    if (saved) setSavedTopics(JSON.parse(saved));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("ideasphere-saved", JSON.stringify(savedTopics));
  }, [savedTopics]);

  // Autocomplete logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.length >= 2) {
        const results = await getAutocompleteSuggestions(keyword, mode);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword, mode]);

  const selectSuggestion = (s: Suggestion) => {
    setKeyword(s.text);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);

    // In MATH_IA mode, keyword can be empty as long as we use filters
    if (mode !== GenerationMode.MATH_IA && !keyword.trim()) return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const historyTitles = [...topics, ...history].map(t => t.title);
      
      let newTopics: ResearchTopic[];
      if (mode === GenerationMode.MATH_IA) {
        newTopics = await generateTopics(keyword, historyTitles, mode, {
          interestArea,
          course,
          level,
          mathArea,
          dataType,
          country,
          difficulty,
          count
        });
      } else {
        newTopics = await generateTopics(keyword, historyTitles, mode);
      }
      
      setTopics(newTopics);
      setHistory(prev => [...newTopics, ...prev].slice(0, 50));
      
      // Auto-scroll to results
      setTimeout(() => {
        const results = document.getElementById('results-section');
        results?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("The inspiration pulse is weak... Try a different keyword or check your API key.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAbstract = async (topic: ResearchTopic) => {
    setSelectedTopic(topic);
    setIsGeneratingAbstract(true);
    setAbstract(null);
    try {
      const result = await generateAbstract(topic);
      setAbstract(result);
    } catch (err) {
      setError("Failed to generate PhD-level abstract. Please try again.");
    } finally {
      setIsGeneratingAbstract(false);
    }
  };

  const copyToClipboard = () => {
    if (abstract) {
      navigator.clipboard.writeText(abstract);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveTopic = (topic: ResearchTopic) => {
    if (!savedTopics.find(t => t.id === topic.id)) {
      setSavedTopics(prev => [topic, ...prev]);
    }
  };

  const removeSaved = (id: string) => {
    setSavedTopics(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass py-4 px-6 md:px-12 flex justify-between items-center bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white">
            <Sparkle size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter leading-none">IdeaSphere</h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Research Engine v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 text-xs font-medium text-gray-500">
            <TrendingUpIndicator />
            <span className="ml-1 uppercase tracking-tighter shrink-0">Live Pulse Active</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col">
        {/* Search Section */}
        <section className="relative px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl -z-10" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full"
          >
            <h2 className="text-5xl md:text-7xl font-display italic font-black mb-6 leading-[0.9] text-brand-primary">
              Where will your <span className="text-brand-accent">curiosity</span> lead?
            </h2>
            
            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setMode(GenerationMode.GENERAL)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === GenerationMode.GENERAL 
                    ? "bg-white text-brand-primary shadow-sm" 
                    : "text-gray-500 hover:text-brand-primary"
                  }`}
                >
                  General Research
                </button>
                <button
                  onClick={() => setMode(GenerationMode.BM_IA)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === GenerationMode.BM_IA 
                    ? "bg-brand-primary text-white shadow-sm" 
                    : "text-gray-500 hover:text-brand-primary"
                  }`}
                >
                  Business IA Mode
                </button>
                <button
                  onClick={() => setMode(GenerationMode.MATH_IA)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === GenerationMode.MATH_IA 
                    ? "bg-brand-primary text-white shadow-sm" 
                    : "text-gray-500 hover:text-brand-primary"
                  }`}
                >
                  IB Math IA Mode
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              {mode === GenerationMode.BM_IA 
                ? "Formulate high-scoring Business Management IA questions focusing on real retrospective performance."
                : mode === GenerationMode.MATH_IA
                  ? "Formulate original, student-friendly, high-scoring IB Mathematics IA topic ideas with full tools & context."
                  : "Generate research topics that bridge specialized fields with evolving global trends. Powered by Gemini."}
            </p>

            {mode === GenerationMode.MATH_IA ? (
              <form onSubmit={handleGenerate} className="w-full max-w-3xl mx-auto glass border border-gray-200 p-6 rounded-3xl shadow-xl text-left space-y-6">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-brand-primary font-bold mb-2 flex items-center gap-2">
                    <Sparkle size={16} className="text-brand-accent animate-pulse" />
                    Interactive Math IA Specification Engine
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fine-tune your criteria to synthesize exactly {count} original, syllabus-aligned IB Math Internal Assessment designs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Student Interest Area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Student Interest Area</label>
                    <select
                      value={interestArea}
                      onChange={(e) => setInterestArea(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "Sports", "Music", "Business", "Health", "Environment", "Technology", "Economics", "Physics", "Gaming", "Architecture", "Social Media", "Finance"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Course */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Course Syllabus</label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "Math AA (Analysis & Approaches)", "Math AI (Applications & Interpretation)"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "SL", "HL"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Mathematics */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Preferred Mathematics</label>
                    <select
                      value={mathArea}
                      onChange={(e) => setMathArea(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "Calculus", "Statistics", "Probability", "Modelling", "Optimisation", "Functions", "Trigonometry", "Geometry", "Differential Equations"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Preferred Data Type</label>
                    <select
                      value={dataType}
                      onChange={(e) => setDataType(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "Primary Data", "Secondary Data", "Either"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {["Any", "Easy", "Moderate", "Advanced"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Count */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Number of Topics</label>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
                    >
                      {[5, 10, 15].map(opt => (
                        <option key={opt} value={opt}>{opt} Topics</option>
                      ))}
                    </select>
                  </div>

                  {/* Country or local context */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Country or Local Context (Optional)</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="E.g., United Kingdom, school cafeteria, local NBA club..."
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>

                  {/* Additional Keywords */}
                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Additional Keyword / Focus (Optional)</label>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="E.g., aerodynamics, heart rate..."
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-750 focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-brand-primary hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isLoading ? `Forging ${count} original topics...` : `Forge ${count} Grade 7 Math Topics`}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-3 w-full max-w-2xl mx-auto relative glass p-2 rounded-2xl shadow-lg border-gray-200">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onFocus={() => keyword.length >= 2 && setShowSuggestions(true)}
                    placeholder={
                      mode === GenerationMode.BM_IA 
                        ? "E.g. Starbucks CSR, Tesla strategy, Nike brand image..."
                        : mode === GenerationMode.MATH_IA
                          ? "E.g. Basketball Shot, Music Frequencies, Epidemiology, Voronoi..."
                          : "E.g. AI Ethics, Marine Biology, Sustainable Cities..."
                    }
                    className="w-full pl-12 pr-4 py-4 md:py-3 bg-transparent border-none focus:ring-0 text-lg outline-none"
                  />

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 overflow-y-auto max-h-60"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-none"
                          >
                            <div className="flex items-center gap-3">
                              <Search size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{s.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Citation Potential</span>
                              <span className="text-xs font-bold text-brand-accent bg-orange-50 px-2 py-0.5 rounded-full">
                                {s.citationPotential}%
                              </span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-brand-primary hover:bg-black text-white px-8 py-4 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  {isLoading ? "Consulting trends..." : "Forge Ideas"}
                </button>
              </form>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-gray-400 w-full mb-3">Suggested fields</p>
              {(mode === GenerationMode.BM_IA 
                ? ["RETAIL", "AUTOMOTIVE", "E-COMMERCE", "FINANCE"]
                : mode === GenerationMode.MATH_IA
                  ? ["Calculus", "Voronoi Diagrams", "Bivariate Normal", "Differential Models"]
                  : ["Neuroscience", "Quantum Computing", "Urban Resilience", "Bio-mimicry"]
              ).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setKeyword(tag);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-full hover:border-brand-accent hover:text-brand-accent transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Results Section */}
        <div id="results-section" className="px-6 md:px-12 py-12 bg-white">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
              {/* Main Feed */}
              <div>
                <header className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    Latest Generation
                    {isLoading && <Loader2 className="animate-spin text-brand-accent" size={20} />}
                  </h3>
                  <div className="text-xs font-mono text-gray-400">
                    Showing {topics.length} specific pathways
                  </div>
                </header>

                {topics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                      {topics.map((topic, i) => (
                        <TopicCard 
                          key={topic.id + i} 
                          topic={topic} 
                          onSave={saveTopic} 
                          onGenerateAbstract={handleGenerateAbstract}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                    <History size={48} className="mb-4 opacity-10" />
                    <p className="text-lg">No research forged yet.</p>
                  </div>
                )}
              </div>

              {/* Sidebar / Saved Topics */}
              <aside className="space-y-8">
                <div className="glass p-6 rounded-3xl border-gray-200">
                  <h4 className="text-lg font-bold flex items-center gap-2 mb-6 uppercase tracking-tight">
                    <History size={20} className="text-brand-accent" />
                    Saved Registry
                  </h4>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="popLayout">
                      {savedTopics.length > 0 ? (
                        savedTopics.map((topic) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 bg-white border border-gray-100 rounded-xl group relative"
                          >
                            <h5 className="font-bold text-sm mb-1 leading-snug pr-6">{topic.title}</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400"># {topic.tags[0]}</span>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="text-[10px] text-brand-accent font-semibold">{topic.trendingScore}%</span>
                            </div>
                            <button
                              onClick={() => removeSaved(topic.id)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-400 text-sm italic">
                          Click Arrow on cards to save.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-6 bg-brand-primary text-white rounded-3xl">
                  <h4 className="text-sm font-mono tracking-widest text-gray-400 mb-4 uppercase">AI Intelligence</h4>
                  <p className="text-xs leading-relaxed opacity-80 italic">
                    "IdeaSphere cross-references academic niches with high-velocity news cycles to uncover arbitrage opportunities in knowledge."
                  </p>
                  <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/10">
                    <span className="text-[10px] font-mono">MODEL: GEMINI-3-FLASH</span>
                    <ArrowRight size={16} className="text-brand-accent" />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-xs">
        <p>© 2026 IdeaSphere. Driven by Gemini AI Studio.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-brand-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Methodology</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Documentation</a>
        </div>
      </footer>

      {/* Abstract Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start bg-brand-bg/50">
                <div>
                  <div className="flex items-center gap-2 text-brand-accent font-mono text-[10px] uppercase tracking-widest mb-2">
                    <Sparkles size={12} />
                    {selectedTopic.proposal 
                      ? "IB BM INTERNAL ASSESSMENT MASTER PROPOSAL" 
                      : selectedTopic.mathProposal 
                        ? "IB MATHEMATICS INTERNAL ASSESSMENT MASTER PROPOSAL" 
                        : "PhD-LEVEL ABSTRACT REPORT"}
                  </div>
                  <h2 className="text-xl md:text-2xl font-display italic font-bold text-brand-primary leading-snug">
                    {selectedTopic.title}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 ml-4"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body Grid */}
              <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {selectedTopic.proposal ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                    
                    {/* Left Column: Structured 8-Part Proposal Form */}
                    <div className="pr-0 lg:pr-8 pb-8 lg:pb-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Proposal Specification</h3>
                        <button
                          onClick={() => {
                            if (selectedTopic && selectedTopic.proposal) {
                              const p = selectedTopic.proposal;
                              const text = `Research Question:\n${selectedTopic.title}\n\n` +
                                `1. Name of company:\n${p.companyName}\n\n` +
                                `2. Brief description of the company:\n${p.companyDescription}\n\n` +
                                `3. The issue you would like to evaluate:\n${p.issueToEvaluate}\n\n` +
                                `4. Is it forward looking or backward looking:\n${p.direction}\n\n` +
                                `5. Why do you want to evaluate the above issue:\n${p.evaluationReason}\n\n` +
                                `6. Which concept is involved in the analysis of your issue?\n${p.conceptInvolved}\n\n` +
                                `7. What are the conclusions/inferences:\n${p.conclusionsInferences}\n\n` +
                                `8. What BM tools will be used:\n${p.bmTools.map((t, idx) => `${idx + 1}. ${t.name}\n   ${t.explanation}`).join('\n\n')}\n\n` +
                                `9. Suggested Secondary Data Sources:\n${p.secondaryDataSuggestions}`;
                              navigator.clipboard.writeText(text);
                              setCopiedStructure(true);
                              setTimeout(() => setCopiedStructure(false), 2000);
                            }
                          }}
                          className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1.5"
                        >
                          {copiedStructure ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedStructure ? "Structure Copied!" : "Copy Structure Data"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm mt-4">
                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">1. Name of Company</p>
                          <p className="font-bold text-gray-800 mt-1">{selectedTopic.proposal.companyName}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium">2. Brief description of the company</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.proposal.companyDescription}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">3. The issue you would like to evaluate</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.proposal.issueToEvaluate}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">4. Is it forward looking or backward looking</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.proposal.direction}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">5. Why do you want to evaluate the above issue</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.proposal.evaluationReason}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">6. Which concept is involved in the analysis?</p>
                          <p className="text-gray-600 mt-1 font-semibold text-brand-accent">{selectedTopic.proposal.conceptInvolved}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">7. What are the conclusions / inferences</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.proposal.conclusionsInferences}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium mb-2 font-bold">8. What BM tools will be used</p>
                          <div className="space-y-3 mt-1">
                            {selectedTopic.proposal.bmTools.map((tool, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 hover:shadow-xs transition-shadow">
                                <p className="font-bold text-xs text-brand-primary">{tool.name}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tool.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-medium font-bold">9. Suggested Secondary Data Sources</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.proposal.secondaryDataSuggestions}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: HD Level Academic Background/Inference writing */}
                    <div className="pl-0 lg:pl-8 pt-8 lg:pt-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">HD Academic Commentary & Abstract</h3>
                        {isGeneratingAbstract ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-brand-accent" size={36} />
                            <p className="text-gray-500 font-medium text-xs animate-pulse">
                              Synthesizing academic discourse...
                            </p>
                          </div>
                        ) : abstract ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-sm prose-gray max-w-none"
                          >
                            <p className="text-sm md:text-base leading-relaxed text-gray-700 italic border-l-2 border-brand-accent pl-4 font-light">
                              {abstract}
                            </p>
                          </motion.div>
                        ) : (
                          <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                            <p className="text-sm mb-4">No academic abstract generated yet.</p>
                            <button
                              onClick={() => handleGenerateAbstract(selectedTopic)}
                              className="px-4 py-2 bg-brand-primary hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Generate High-Quality Abstract
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedTopic.mathProposal ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                    
                    {/* Left Column: Structured Math Proposal */}
                    <div className="pr-0 lg:pr-8 pb-8 lg:pb-0 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400">Math IA Design Blueprint</h3>
                        <button
                          onClick={() => {
                            if (selectedTopic && selectedTopic.mathProposal) {
                              const p = selectedTopic.mathProposal;
                              const text = `Research Question:\n${p.researchQuestion}\n\n` +
                                `1. Title of Exploration:\n${p.title}\n\n` +
                                `2. Syllabus Course & Level:\n${p.suitableCourse} (${p.level} Level)\n\n` +
                                `3. Core Mathematical Area:\n${p.mathematicalArea}\n\n` +
                                `4. Specific Mathematical Tools:\n${p.mathematicalTools}\n\n` +
                                `5. Real-world Context:\n${p.realWorldContext}\n\n` +
                                `6. Data Strategy:\n${p.dataNeeded}\n\n` +
                                `7. Possible Technology:\n${p.possibleTechnology}\n\n` +
                                `8. Why this is a strong IA topic:\n${p.whyStrongTopic}\n\n` +
                                `9. Personal Engagement Hook:\n${p.possiblePersonalEngagement}\n\n` +
                                `10. Mathematical Limitations & Rationale:\n${p.possibleLimitations}\n\n` +
                                `11. Overall Difficulty:\n${p.difficultyLevel}`;
                              navigator.clipboard.writeText(text);
                              setCopiedStructure(true);
                              setTimeout(() => setCopiedStructure(false), 2000);
                            }
                          }}
                          className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1.5"
                        >
                          {copiedStructure ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          {copiedStructure ? "Structure Copied!" : "Copy Structure Data"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm mt-4">
                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">1. Title of Exploration</p>
                          <p className="font-bold text-gray-800 mt-1">{selectedTopic.mathProposal.title}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">2. Research Question</p>
                          <p className="text-brand-accent font-semibold mt-1 italic">"{selectedTopic.mathProposal.researchQuestion}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                            <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">3. Course & Level</p>
                            <p className="text-gray-800 font-semibold mt-1">{selectedTopic.mathProposal.suitableCourse} ({selectedTopic.mathProposal.level})</p>
                          </div>
                          <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                            <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">4. Difficulty Level</p>
                            <span className="inline-block bg-orange-50 text-brand-accent px-2.5 py-0.5 rounded-full text-xs font-bold mt-1">
                              {selectedTopic.mathProposal.difficultyLevel}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">5. Mathematical Area</p>
                          <p className="text-gray-700 mt-1 font-semibold">{selectedTopic.mathProposal.mathematicalArea}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">6. Specific Mathematical Tools</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.mathProposal.mathematicalTools}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">7. Real-world Context</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.mathProposal.realWorldContext}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">8. Data Needed & Collection Method</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.mathProposal.dataNeeded}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">9. Possible Technology</p>
                          <p className="text-gray-600 mt-1">{selectedTopic.mathProposal.possibleTechnology}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">10. Why this is a strong IA Topic</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.mathProposal.whyStrongTopic}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">11. Personal Engagement suggestion</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.mathProposal.possiblePersonalEngagement}</p>
                        </div>

                        <div className="p-3 bg-brand-bg rounded-xl border border-gray-100">
                          <p className="font-mono text-[10px] uppercase text-gray-400 font-bold">12. Possible Limitations & Assumptions</p>
                          <p className="text-gray-600 mt-1 leading-relaxed">{selectedTopic.mathProposal.possibleLimitations}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Mathematical exploration / rationale & Abstract status */}
                    <div className="pl-0 lg:pl-8 pt-8 lg:pt-0 flex flex-col justify-between overflow-y-auto">
                      <div>
                        <h3 className="text-sm font-mono uppercase tracking-wider text-gray-400 mb-4">Grade 7 mathematical strategy commentary</h3>
                        {isGeneratingAbstract ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-brand-accent" size={36} />
                            <p className="text-gray-500 font-medium text-xs animate-pulse">
                              Synthesizing academic discourse...
                            </p>
                          </div>
                        ) : abstract ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-sm prose-gray max-w-none"
                          >
                            <p className="text-sm md:text-base leading-relaxed text-gray-700 italic border-l-2 border-brand-accent pl-4 font-light">
                              {abstract}
                            </p>
                          </motion.div>
                        ) : (
                          <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                            <p className="text-sm mb-4">No academic math rationale commentary generated yet.</p>
                            <button
                              onClick={() => handleGenerateAbstract(selectedTopic)}
                              className="px-4 py-2 bg-brand-primary hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Generate High-Quality Abstract
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // General abstract layout
                  <div className="max-w-3xl mx-auto py-4">
                    {isGeneratingAbstract ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-brand-accent" size={48} />
                        <p className="text-gray-500 font-medium animate-pulse">
                          Synthesizing academic discourse...
                        </p>
                      </div>
                    ) : abstract ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-gray max-w-none"
                      >
                        <p className="text-lg md:text-xl leading-relaxed text-gray-700 font-light first-letter:text-5xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:text-brand-accent">
                          {abstract}
                        </p>
                      </motion.div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-gray-400">
                    STATUS: {isGeneratingAbstract ? "PROCESSING" : "COMPLETED"}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
                    QUALITY: {selectedTopic.proposal 
                      ? "IB BM GRADE 7 PROPOSAL ARCHITECTURE" 
                      : selectedTopic.mathProposal 
                        ? "IB MATH GRADE 7 MATHEMATICAL PATHWAY" 
                        : "HIGH-FIDELITY ACADEMIC"}
                  </div>
                </div>
                <div className="flex gap-3">
                  {abstract && (
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-brand-accent rounded-xl text-sm font-bold transition-all"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      {copied ? "Copied" : "Copy Academic Text"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrendingUpIndicator() {
  return (
    <div className="flex items-baseline gap-1 h-4">
      {[4, 7, 2, 8, 5, 9, 4].map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: [h + "px", (h + 4) + "px", h + "px"] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="w-0.5 bg-brand-accent"
        />
      ))}
    </div>
  );
}

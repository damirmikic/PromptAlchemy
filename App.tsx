import React, { useState } from 'react';
import { PROMPT_CATEGORIES } from './constants';
import { OptionButton } from './components/OptionButton';
import { ResultCard } from './components/ResultCard';
import { generatePerfectPrompt, suggestAttributes } from './services/geminiService';
import { GeneratedResult, GenerationStatus } from './types';

function App() {
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'loading'>('idle');
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleDetail = (value: string) => {
    const newSet = new Set(selectedDetails);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedDetails(newSet);
  };

  const handleMagicSuggest = async () => {
    if (!basePrompt.trim()) return;
    
    setSuggestionStatus('loading');
    try {
      // Flatten categories to pass to service
      const flatOptions = PROMPT_CATEGORIES.flatMap(cat => 
        cat.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          description: cat.title + " - " + opt.value 
        }))
      );

      const suggestedIds = await suggestAttributes(basePrompt, flatOptions);
      
      if (suggestedIds.length > 0) {
        const newSet = new Set(selectedDetails);
        // Find values corresponding to IDs
        PROMPT_CATEGORIES.forEach(cat => {
          cat.options.forEach(opt => {
            if (suggestedIds.includes(opt.id)) {
              newSet.add(opt.value);
            }
          });
        });
        setSelectedDetails(newSet);
      }
    } catch (err) {
      console.error("Suggestion failed", err);
    } finally {
      setSuggestionStatus('idle');
    }
  };

  const handleGenerate = async () => {
    if (!basePrompt.trim()) return;

    setStatus('generating');
    setErrorMsg(null);
    setResult(null);

    try {
      const generatedData = await generatePerfectPrompt(
        basePrompt,
        Array.from(selectedDetails)
      );
      setResult(generatedData);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg("Failed to generate prompt. Please check your API Key and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 selection:bg-brand-500/30">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-dark-900 to-dark-900 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        
        {/* Header */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-full mb-4 ring-1 ring-brand-500/30">
            <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-brand-500 tracking-tight">
            PromptAlchemy
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform simple ideas into professional-grade generative AI prompts. 
            Select your elements, input your concept, and let Gemini weave the magic.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column: Input & Controls */}
          <div className="xl:col-span-7 space-y-10">
            
            {/* Input Section */}
            <section className="space-y-3">
              <label htmlFor="base-prompt" className="flex items-center justify-between text-sm font-medium text-brand-400 uppercase tracking-wider">
                <span>1. The Concept</span>
                <button 
                  onClick={handleMagicSuggest}
                  disabled={!basePrompt.trim() || suggestionStatus === 'loading'}
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all
                    ${!basePrompt.trim() 
                      ? 'text-gray-600 bg-dark-800 cursor-not-allowed' 
                      : 'text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30'
                    }
                  `}
                >
                  {suggestionStatus === 'loading' ? (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  Magic Auto-Select
                </button>
              </label>
              <div className="relative group">
                <textarea
                  id="base-prompt"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder="e.g. A futuristic samurai walking through a rainy city..."
                  className="w-full h-32 bg-dark-800 border border-dark-700 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-lg resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {basePrompt.length} chars
                </div>
              </div>
            </section>

            {/* Options Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-brand-400 uppercase tracking-wider">
                  2. The Ingredients
                </label>
                <div className="flex items-center gap-4">
                   {selectedDetails.size > 0 && (
                    <button 
                      onClick={() => setSelectedDetails(new Set())}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                   )}
                  <span className="text-xs text-gray-500">
                    {selectedDetails.size} selected
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                {PROMPT_CATEGORIES.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      {category.title}
                      <span className="text-xs font-normal text-gray-600 hidden sm:inline-block">- {category.description}</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {category.options.map((option) => (
                        <OptionButton
                          key={option.id}
                          option={option}
                          isSelected={selectedDetails.has(option.value)}
                          onClick={() => toggleDetail(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Action & Results */}
          <div className="xl:col-span-5 relative">
            <div className="sticky top-8 space-y-6">
              
              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={status === 'generating' || !basePrompt.trim()}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all duration-300
                  ${status === 'generating' || !basePrompt.trim()
                    ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 hover:shadow-brand-500/25 hover:-translate-y-1'
                  }
                `}
              >
                {status === 'generating' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Transmute Prompt
                  </>
                )}
              </button>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                  {errorMsg}
                </div>
              )}

              {/* Results */}
              {result && status === 'success' && (
                <ResultCard result={result} />
              )}
              
              {!result && status === 'idle' && (
                <div className="hidden xl:flex items-center justify-center h-64 border-2 border-dashed border-dark-700 rounded-2xl text-gray-600 text-sm p-8 text-center">
                  Your generated prompts will appear here after the alchemy is complete.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
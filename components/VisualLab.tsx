import React, { useState, useRef, useEffect } from 'react';
import { generateImage, ComicTextStyle } from '../services/geminiService';
import { PROMPT_CATEGORIES, VISUAL_TEMPLATES } from '../constants';
import { OptionButton } from './OptionButton';

interface ComicPage {
  id: string;
  image: string;
  prompt: string;
  type: 'page' | 'cover';
}

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const VisualLab = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image' | 'comic_page' | 'comic_cover' | 'character_design'>('image');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [textStyle, setTextStyle] = useState<ComicTextStyle>('with_text');
  const [loading, setLoading] = useState(false);
  const [magnifying, setMagnifying] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Set<string>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [worldContext, setWorldContext] = useState('');
  const [charContext, setCharContext] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isHighRes, setIsHighRes] = useState(false);
  
  // Issue Management
  const [issuePages, setIssuePages] = useState<ComicPage[]>([]);
  
  // Character Roster
  const [roster, setRoster] = useState<Character[]>([]);
  const [showSaveCharModal, setShowSaveCharModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');

  // Autocomplete State
  const [activeCharQuery, setActiveCharQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleDetail = (value: string) => {
    const newSet = new Set(selectedDetails);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedDetails(newSet);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPrompt(val);
    
    // Check for @ trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([\w]*)$/);

    if (match) {
      setActiveCharQuery(match[1]); // Content after @
    } else {
      setActiveCharQuery(null);
    }
  };

  const insertCharacterAutocomplete = (charName: string) => {
    if (activeCharQuery === null) return;
    
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = prompt.slice(0, cursorPos);
    const textAfterCursor = prompt.slice(cursorPos);
    
    // Replace the @query part with @CharName + space
    const newTextBefore = textBeforeCursor.replace(/@([\w]*)$/, `@${charName} `);
    
    setPrompt(newTextBefore + textAfterCursor);
    setActiveCharQuery(null);
    
    // Reset focus and set cursor position (approx)
    setTimeout(() => {
        textareaRef.current?.focus();
        // Just focus end for simplicity in this constrained env, ideally calculated
    }, 50);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setMagnifying(false);
    setError(null);
    setGeneratedImage(null);
    setIsHighRes(false);

    try {
      // Inline Reference Expansion: Find @Name and replace with Name + Visual Description
      let enhancedPrompt = prompt;
      let activeCharRefs = "";

      roster.forEach(char => {
        const mentionRegex = new RegExp(`@${char.name}\\b`, 'gi');
        if (mentionRegex.test(prompt)) {
          // Replace @Name with Name (Visual Description...)
          enhancedPrompt = enhancedPrompt.replace(mentionRegex, `${char.name} (VISUAL: ${char.description})`);
          activeCharRefs += `[Active Character Reference] ${char.name}: ${char.description}\n`;
        }
      });

      // Prepend specific character refs to charContext for this generation
      const finalCharContext = (activeCharRefs + "\n" + charContext).trim();

      const base64Data = await generateImage(
        enhancedPrompt, 
        aspectRatio, 
        mode,
        Array.from(selectedDetails),
        baseImage || undefined,
        '1K',
        worldContext.trim() || undefined,
        finalCharContext || undefined,
        textStyle
      );
      const fullUrl = `data:image/png;base64,${base64Data}`;
      setGeneratedImage(fullUrl);
      
      // If we were editing, clear the base image after success
      if (baseImage) {
        setBaseImage(null);
        setPrompt(''); 
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMagnify = async () => {
    if (!generatedImage || !prompt.trim()) {
      if(!prompt.trim()) {
        setError("Please ensure the prompt is still present to guide the magnification.");
        return;
      }
    }
    
    setMagnifying(true);
    setError(null);

    try {
       // Inline Reference Expansion for Magnify as well
      let enhancedPrompt = prompt;
      let activeCharRefs = "";
      roster.forEach(char => {
        const mentionRegex = new RegExp(`@${char.name}\\b`, 'gi');
        if (mentionRegex.test(prompt)) {
          enhancedPrompt = enhancedPrompt.replace(mentionRegex, `${char.name} (VISUAL: ${char.description})`);
          activeCharRefs += `[Active Character Reference] ${char.name}: ${char.description}\n`;
        }
      });
      const finalCharContext = (activeCharRefs + "\n" + charContext).trim();

      const base64Data = await generateImage(
        enhancedPrompt, 
        aspectRatio, 
        mode,
        Array.from(selectedDetails),
        generatedImage, 
        '2K', 
        worldContext.trim() || undefined,
        finalCharContext || undefined,
        textStyle
      );
      const fullUrl = `data:image/png;base64,${base64Data}`;
      setGeneratedImage(fullUrl);
      setIsHighRes(true);
    } catch (err) {
      setError("Failed to magnify image. Please check API Limits or try again.");
      console.error(err);
    } finally {
      setMagnifying(false);
    }
  };

  const startRefinement = () => {
    if (!generatedImage) return;
    setBaseImage(generatedImage);
    setGeneratedImage(null); 
    setPrompt(''); 
    setIsHighRes(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelRefinement = () => {
    setBaseImage(null);
  };

  const addToIssue = () => {
    if (!generatedImage) return;
    const newPage: ComicPage = {
      id: Date.now().toString(),
      image: generatedImage,
      prompt: prompt,
      type: mode === 'comic_cover' ? 'cover' : 'page'
    };
    setIssuePages([...issuePages, newPage]);
    setGeneratedImage(null); 
    setPrompt('');
  };

  const removeFromIssue = (id: string) => {
    setIssuePages(issuePages.filter(p => p.id !== id));
  };

  const saveToRoster = () => {
    if (!generatedImage) return;
    setShowSaveCharModal(true);
  };

  const confirmSaveCharacter = () => {
    if (!newCharName.trim() || !generatedImage) return;
    
    const newChar: Character = {
      id: Date.now().toString(),
      name: newCharName.trim().replace(/\s+/g, ''), // Remove whitespace for tag usage
      description: prompt, // Use the prompt used to generate it as the "Source of Truth"
      image: generatedImage
    };
    
    setRoster([...roster, newChar]);
    setShowSaveCharModal(false);
    setNewCharName('');
    setGeneratedImage(null);
    setPrompt('');
  };

  const autoSummarizeIssue = () => {
    if (issuePages.length === 0) return;
    const summary = issuePages.map((p, index) => `Page ${index + 1}: ${p.prompt}`).join('\n\n');
    setPrompt(`Create a cover for a comic issue containing the following scenes:\n\n${summary}`);
  };

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  const downloadImage = (url: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const injectCharacter = (char: Character) => {
    const addition = `${char.name}: ${char.description}\n`;
    setCharContext(prev => prev + (prev ? '\n' : '') + addition);
    setShowContext(true);
  };

  // Filter for autocomplete
  const filteredRoster = activeCharQuery !== null
    ? roster.filter(c => c.name.toLowerCase().startsWith(activeCharQuery.toLowerCase()))
    : [];

  return (
    <div className="animate-fade-in-up space-y-8 max-w-5xl mx-auto">
      
      {/* Lightbox Modal */}
      {lightboxOpen && generatedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <img 
            src={generatedImage} 
            alt="Full Screen" 
            className="max-w-full max-h-full object-contain rounded shadow-2xl animate-fade-in"
          />
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Save Character Modal */}
      {showSaveCharModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-dark-800 border border-brand-500/30 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-brand-300">Save to Character Roster</h3>
            <p className="text-sm text-gray-400">Give your character a unique name (no spaces preferred for tagging). Their description will be saved for future consistency.</p>
            <input 
              type="text" 
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="Character Name (e.g. CaptainNova)"
              className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white focus:ring-brand-500 outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowSaveCharModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSaveCharacter}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium"
              >
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Header */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {baseImage && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 animate-pulse"></div>
        )}

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap bg-dark-900 rounded-lg p-1 border border-dark-700 w-fit">
              <button
                onClick={() => { setMode('character_design'); setAspectRatio('1:1'); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'character_design' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                Character Workshop
              </button>
              <button
                onClick={() => { setMode('image'); setAspectRatio('1:1'); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'image' 
                    ? 'bg-brand-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                Standard Image
              </button>
              <button
                onClick={() => { setMode('comic_page'); setAspectRatio('3:4'); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'comic_page' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                Comic Page
              </button>
              <button
                onClick={() => { setMode('comic_cover'); setAspectRatio('3:4'); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'comic_cover' 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                Comic Cover
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Aspect Ratio:</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="bg-dark-900 border border-dark-700 text-gray-200 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 outline-none"
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="3:4">3:4 (Portrait)</option>
              <option value="4:3">4:3 (Landscape)</option>
              <option value="9:16">9:16 (Tall)</option>
              <option value="16:9">16:9 (Wide)</option>
            </select>
          </div>
        </div>

        {/* Comic Specific Text Controls */}
        {mode === 'comic_page' && (
          <div className="mb-6 p-4 bg-purple-900/10 border border-purple-500/30 rounded-xl flex flex-wrap items-center gap-4 animate-fade-in-down">
            <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Comic Text Style:</span>
            <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-700">
               <button
                  onClick={() => setTextStyle('with_text')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    textStyle === 'with_text'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
               >
                 With Text (Full Dialogue)
               </button>
               <button
                  onClick={() => setTextStyle('empty_bubbles')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    textStyle === 'empty_bubbles'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
               >
                 Empty Bubbles
               </button>
               <button
                  onClick={() => setTextStyle('no_text')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    textStyle === 'no_text'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
               >
                 No Text/Bubbles
               </button>
            </div>
          </div>
        )}

        {/* Refinement UI */}
        {baseImage && (
           <div className="mb-6 p-4 bg-brand-900/10 border border-brand-500/30 rounded-xl flex items-center gap-4 animate-fade-in-down">
             <div className="relative w-20 h-20 flex-shrink-0">
               <img src={baseImage} alt="Refining" className="w-full h-full object-cover rounded-lg border border-brand-500/50" />
               <div className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">Input</div>
             </div>
             <div className="flex-grow">
               <h4 className="text-brand-300 font-semibold text-sm">Refinement Mode Active</h4>
               <p className="text-gray-400 text-xs mt-1">
                 Describe how you want to change or improve this image. (e.g., "Add a red hat", "Make it sunset").
               </p>
             </div>
             <button 
               onClick={cancelRefinement}
               className="text-gray-400 hover:text-white hover:bg-dark-700 p-2 rounded-full transition-colors"
               title="Cancel Refinement"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
        )}

        {/* Templates */}
        {!baseImage && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Quick Start:</p>
              <div className="flex flex-wrap gap-2">
                {VISUAL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.prompt)}
                    className="px-3 py-1.5 bg-dark-900 hover:bg-dark-700 border border-dark-700 hover:border-brand-500/50 rounded-full text-xs text-gray-300 transition-all"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Auto-Summarize for Cover */}
            {mode === 'comic_cover' && issuePages.length > 0 && (
               <button 
                 onClick={autoSummarizeIssue}
                 className="px-3 py-1.5 bg-orange-900/20 hover:bg-orange-900/40 border border-orange-500/30 rounded-full text-xs text-orange-200 transition-all flex items-center gap-2"
               >
                 Draft Cover Prompt from Issue
               </button>
            )}
          </div>
        )}

        <div className="space-y-4 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            placeholder={
              baseImage 
                ? "What should be improved or changed? (e.g., 'Make the sky purple', 'Add a cat')"
                : mode === 'character_design'
                  ? "Describe your character in detail (e.g. 'A futuristic paladin with neon blue armor and a glowing halo')..."
                  : mode === 'comic_page' 
                    ? "Script example: \n\nPanel 1: @Hero stands on a rooftop...\nPanel 2: @Hero says: \"Not on my watch!\"..." 
                    : mode === 'comic_cover'
                      ? "Describe the cover art (or click 'Draft Cover Prompt' to use issue story)..."
                      : "Describe the image you want to generate..."
            }
            className={`
              w-full h-40 bg-dark-900 border rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none font-mono text-sm
              ${baseImage ? 'border-brand-500/30 focus:ring-brand-500' : 'border-dark-600 focus:ring-brand-500'}
            `}
          />

          {/* Autocomplete Dropdown */}
          {activeCharQuery !== null && filteredRoster.length > 0 && (
             <div className="absolute bottom-4 left-4 z-50 bg-dark-800 border border-dark-600 rounded-lg shadow-2xl w-64 max-h-48 overflow-y-auto animate-fade-in">
               <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-dark-700 mb-1">
                 Suggest Character
               </div>
               {filteredRoster.map(char => (
                 <button
                   key={char.id}
                   onClick={() => insertCharacterAutocomplete(char.name)}
                   className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-dark-700 transition-colors"
                 >
                   <img src={char.image} alt={char.name} className="w-6 h-6 rounded object-cover bg-black" />
                   <span className="text-sm text-gray-200 font-medium">@{char.name}</span>
                 </button>
               ))}
             </div>
          )}
          
          {/* Character Mentions Tip */}
          {roster.length > 0 && mode.includes('comic') && (
            <div className="flex items-center gap-2 text-xs text-gray-500 px-2">
              <span className="text-brand-400 font-bold">Tip:</span>
              Type <span className="text-gray-300 bg-dark-700 px-1 rounded">@</span> to instantly inject saved characters.
            </div>
          )}
          
          {/* Consistency Context Toggle */}
          <div className="border-t border-dark-700 pt-4">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 text-indigo-400 font-medium text-sm hover:text-indigo-300 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showContext ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Story & World Context (Consistency)</span>
              {(worldContext || charContext) && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>

            {showContext && (
               <div className="mt-4 space-y-4 animate-fade-in-down bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                  
                  {/* Saved Roster Selection */}
                  {roster.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-dark-700">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Saved Character Roster (Click to Inject)</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {roster.map(char => (
                          <button
                            key={char.id}
                            onClick={() => injectCharacter(char)}
                            className="flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-lg p-1.5 pr-3 hover:border-indigo-500 transition-all flex-shrink-0 group"
                            title="Click to add character description to context"
                          >
                            <img src={char.image} alt={char.name} className="w-8 h-8 rounded object-cover bg-black" />
                            <div className="text-left">
                              <div className="text-xs font-bold text-gray-200 group-hover:text-indigo-300">{char.name}</div>
                              <div className="text-[10px] text-gray-500">Inject Look</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">World Building</label>
                      <textarea 
                        value={worldContext}
                        onChange={(e) => setWorldContext(e.target.value)}
                        placeholder="Define the era, location, physics, and atmosphere that applies to ALL images..."
                        className="w-full h-32 bg-dark-800 border border-dark-600 rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Character Roster Context</label>
                      <textarea 
                        value={charContext}
                        onChange={(e) => setCharContext(e.target.value)}
                        placeholder="Describe recurring characters here (Tip: Use the Roster above to auto-fill)..."
                        className="w-full h-32 bg-dark-800 border border-dark-600 rounded-lg p-3 text-sm text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder-gray-600"
                      />
                    </div>
                  </div>
               </div>
            )}
          </div>

          {/* Artistic Direction Toggle */}
          <div className="border-t border-dark-700 pt-4">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-brand-400 font-medium text-sm hover:text-brand-300 transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Artistic Direction (Style, Lighting, Mood)</span>
              {selectedDetails.size > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-full text-xs">
                  {selectedDetails.size} selected
                </span>
              )}
            </button>

            {/* Options Grid */}
            {showOptions && (
              <div className="mt-4 space-y-6 bg-dark-900/50 p-4 rounded-xl border border-dark-700 animate-fade-in-down max-h-[400px] overflow-y-auto scrollbar-thin">
                 {selectedDetails.size > 0 && (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setSelectedDetails(new Set())}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Clear All Selection
                    </button>
                  </div>
                 )}
                 {PROMPT_CATEGORIES.map((category) => (
                    <div key={category.id} className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {category.title}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {category.options.map((option) => (
                          <div key={option.id} className="h-20"> 
                            <OptionButton
                              option={option}
                              isSelected={selectedDetails.has(option.value)}
                              onClick={() => toggleDetail(option.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || magnifying || !prompt.trim()}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
              ${loading || magnifying || !prompt.trim()
                ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                : baseImage 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                  : mode === 'comic_page'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                    : mode === 'comic_cover'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-orange-500/25 hover:from-orange-500 hover:to-orange-400'
                      : mode === 'character_design'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400'
                        : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-brand-500/25 hover:from-brand-500 hover:to-brand-400'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {baseImage ? 'Refining Image...' : (mode.includes('comic') ? 'Creating Comic Art...' : mode === 'character_design' ? 'Designing Character...' : 'Generating Image...')}
              </>
            ) : (
              <>
                {baseImage ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
                {baseImage ? 'Apply Changes' : (mode === 'comic_page' ? 'Create Comic Page' : mode === 'comic_cover' ? 'Generate Cover Art' : mode === 'character_design' ? 'Generate Character Look' : 'Generate Image')}
              </>
            )}
          </button>
          
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>
          )}
        </div>
      </div>

      {/* Output Area */}
      {(generatedImage || loading || magnifying) && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 shadow-2xl flex flex-col items-center min-h-[400px] justify-center relative overflow-hidden animate-fade-in-up">
          {generatedImage && !loading && !magnifying ? (
            <div className="relative group w-full flex flex-col items-center">
              <div 
                className="relative cursor-zoom-in group-hover:shadow-[0_0_40px_rgba(20,184,166,0.15)] transition-all rounded-lg overflow-hidden"
                onClick={() => setLightboxOpen(true)}
              >
                <img 
                  src={generatedImage} 
                  alt="Generated Art" 
                  className="rounded-lg shadow-2xl max-h-[80vh] object-contain border border-dark-600 bg-dark-900"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                   <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                     Click to Zoom
                   </div>
                </div>
                {isHighRes && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-white/20">
                    2K ULTRA HD
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                
                {/* Save to Roster Button (Only in Character Mode) */}
                {mode === 'character_design' && (
                  <button
                    onClick={saveToRoster}
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Save to Roster
                  </button>
                )}

                <button
                  onClick={handleMagnify}
                  disabled={isHighRes}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium shadow-lg transition-all flex items-center gap-2
                    ${isHighRes 
                      ? 'bg-dark-700 text-gray-500 cursor-not-allowed border border-dark-600' 
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 hover:shadow-orange-500/25'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  {isHighRes ? 'Enhanced to 2K' : 'Magnify (Upscale to 2K)'}
                </button>

                {/* Add to Issue Button */}
                {mode.includes('comic') && (
                  <button
                    onClick={addToIssue}
                    className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add to Issue
                  </button>
                )}

                <button
                  onClick={startRefinement}
                  className="px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Request Improvement
                </button>
                <button
                  onClick={() => downloadImage(generatedImage!, mode === 'comic_cover' ? 'cover' : 'comic-page')}
                  className="px-5 py-2 rounded-full bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium shadow-lg transition-all flex items-center gap-2"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download
                </button>
              </div>
              <p className="mt-4 text-gray-500 text-xs font-mono">
                {isHighRes 
                  ? 'Gemini 3 Pro Image Preview - 2K Resolution' 
                  : (mode.includes('comic') ? 'Gemini 2.5 Flash Image - Comic Mode' : 'Gemini 2.5 Flash Image - Nano Banana')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 animate-pulse">
              <div className={`w-16 h-16 border-4 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(20,184,166,0.2)] ${magnifying ? 'border-amber-500/30 border-t-amber-500' : 'border-brand-500/30 border-t-brand-500'}`}></div>
              <p className="text-sm font-medium">
                {magnifying 
                  ? 'Upscaling detail with Gemini Pro...' 
                  : baseImage 
                    ? 'Refining visuals...' 
                    : 'Synthesizing visual data...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Issue Organizer / Strip */}
      {issuePages.length > 0 && (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-xl animate-fade-in-up">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
               <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               Current Issue ({issuePages.length} Pages)
             </h3>
             <span className="text-xs text-gray-500 bg-dark-800 px-2 py-1 rounded">
               Last added: {new Date(parseInt(issuePages[issuePages.length-1].id)).toLocaleTimeString()}
             </span>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900">
             {issuePages.map((page, index) => (
               <div key={page.id} className="relative group flex-shrink-0 w-48 bg-dark-800 rounded-lg border border-dark-700 p-2 transition-all hover:border-brand-500/50">
                  <div className="aspect-[3/4] rounded overflow-hidden bg-black mb-2 relative">
                    <img src={page.image} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                    {page.type === 'cover' && (
                      <div className="absolute top-1 left-1 bg-orange-600 text-white text-[10px] font-bold px-1.5 rounded shadow">
                        COVER
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      {page.type === 'cover' ? 'Issue Cover' : `Page ${index + 1}`}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => downloadImage(page.image, `issue-pg-${index+1}`)}
                        className="p-1 hover:bg-dark-700 rounded text-gray-500 hover:text-white transition-colors"
                        title="Download"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button 
                        onClick={() => removeFromIssue(page.id)}
                        className="p-1 hover:bg-dark-700 rounded text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
               </div>
             ))}
             
             {/* Add New Placeholder */}
             <div 
               onClick={() => { setMode('comic_page'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
               className="flex-shrink-0 w-48 bg-dark-800/50 rounded-lg border-2 border-dashed border-dark-700 flex flex-col items-center justify-center gap-2 text-gray-500 cursor-pointer hover:border-brand-500/50 hover:text-brand-400 transition-all"
             >
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-xs font-medium">Create Next Page</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
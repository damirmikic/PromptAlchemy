import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { PROMPT_CATEGORIES, VISUAL_TEMPLATES } from '../constants';
import { OptionButton } from './OptionButton';

export const VisualLab = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image' | 'comic'>('image');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [loading, setLoading] = useState(false);
  const [magnifying, setMagnifying] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<Set<string>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isHighRes, setIsHighRes] = useState(false);

  const toggleDetail = (value: string) => {
    const newSet = new Set(selectedDetails);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setSelectedDetails(newSet);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setMagnifying(false);
    setError(null);
    setGeneratedImage(null);
    setIsHighRes(false);

    try {
      const base64Data = await generateImage(
        prompt, 
        aspectRatio, 
        mode === 'comic',
        Array.from(selectedDetails),
        baseImage || undefined,
        '1K'
      );
      const fullUrl = `data:image/png;base64,${base64Data}`;
      setGeneratedImage(fullUrl);
      
      // If we were editing, clear the base image after success to allow fresh start or further edits from result
      if (baseImage) {
        setBaseImage(null);
        setPrompt(''); // Clear prompt after edit
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
      // If prompt is empty (e.g. after edit cleared it), try to reuse generic if needed, 
      // but ideally we keep prompt in state. 
      // For now, if prompt is empty, we might fail, so let's warn.
      if(!prompt.trim()) {
        setError("Please ensure the prompt is still present to guide the magnification.");
        return;
      }
    }
    
    setMagnifying(true);
    setError(null);

    try {
      // Use current image as input for stability
      const base64Data = await generateImage(
        prompt, 
        aspectRatio, 
        mode === 'comic',
        Array.from(selectedDetails),
        generatedImage, // Pass current image to maintain composition
        '2K' // Request High Res
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
    setGeneratedImage(null); // Clear result view to focus on editing
    setPrompt(''); // Clear prompt for new instruction
    setIsHighRes(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelRefinement = () => {
    setBaseImage(null);
  };

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `prompt-alchemy-${mode}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* Controls Header */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {baseImage && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 animate-pulse"></div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-700 w-fit">
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
              onClick={() => { setMode('comic'); setAspectRatio('3:4'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'comic' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              Comic Page Creator
            </button>
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
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Quick Start Templates:</p>
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
        )}

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              baseImage 
                ? "What should be improved or changed? (e.g., 'Make the sky purple', 'Add a cat')"
                : mode === 'comic' 
                  ? "Describe your comic page script: \n\nPanel 1: Hero stands on a rooftop...\nPanel 2: Close up of hero's face, determined expression..." 
                  : "Describe the image you want to generate..."
            }
            className={`
              w-full h-40 bg-dark-900 border rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none font-mono text-sm
              ${baseImage ? 'border-brand-500/30 focus:ring-brand-500' : 'border-dark-600 focus:ring-brand-500'}
            `}
          />
          
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
                  : mode === 'comic'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-purple-500/25 hover:from-purple-500 hover:to-purple-400'
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-brand-500/25 hover:from-brand-500 hover:to-brand-400'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {baseImage ? 'Refining Image...' : (mode === 'comic' ? 'Drawing Comic Page...' : 'Generating Image...')}
              </>
            ) : (
              <>
                {baseImage ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
                {baseImage ? 'Apply Changes' : (mode === 'comic' ? 'Create Comic Page' : 'Generate Image')}
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

                <button
                  onClick={startRefinement}
                  className="px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Request Improvement
                </button>
                <button
                  onClick={downloadImage}
                  className="px-5 py-2 rounded-full bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium shadow-lg transition-all flex items-center gap-2"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download
                </button>
              </div>
              <p className="mt-4 text-gray-500 text-xs font-mono">
                {isHighRes 
                  ? 'Gemini 3 Pro Image Preview - 2K Resolution' 
                  : (mode === 'comic' ? 'Gemini 2.5 Flash Image - Comic Mode' : 'Gemini 2.5 Flash Image - Nano Banana')}
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
    </div>
  );
};
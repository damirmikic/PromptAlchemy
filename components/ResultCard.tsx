import React, { useState } from 'react';
import { GeneratedResult } from '../types';

interface ResultCardProps {
  result: GeneratedResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [copiedType, setCopiedType] = useState<'image' | 'video' | null>(null);

  const handleCopy = (text: string, type: 'image' | 'video') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="w-full animate-fade-in-up space-y-6">
      <div className="bg-dark-800 border border-brand-500/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-dark-700 bg-dark-900/50 flex items-center justify-between">
          <h3 className="text-brand-300 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generated Image Prompt
          </h3>
          <button 
            onClick={() => handleCopy(result.imagePrompt, 'image')}
            className="text-xs px-3 py-1 rounded-full bg-dark-700 hover:bg-brand-600 text-white transition-colors"
          >
            {copiedType === 'image' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-6 bg-gradient-to-b from-dark-800 to-dark-900">
          <p className="text-gray-100 leading-relaxed font-mono text-sm whitespace-pre-wrap">
            {result.imagePrompt}
          </p>
        </div>
      </div>

      <div className="bg-dark-800 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-dark-700 bg-dark-900/50 flex items-center justify-between">
          <h3 className="text-purple-300 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Generated Video Prompt
          </h3>
          <button 
            onClick={() => handleCopy(result.videoPrompt, 'video')}
            className="text-xs px-3 py-1 rounded-full bg-dark-700 hover:bg-purple-600 text-white transition-colors"
          >
            {copiedType === 'video' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-6 bg-gradient-to-b from-dark-800 to-dark-900">
          <p className="text-gray-100 leading-relaxed font-mono text-sm whitespace-pre-wrap">
            {result.videoPrompt}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-500 italic text-center px-4">
        AI Insight: {result.explanation}
      </div>
    </div>
  );
};
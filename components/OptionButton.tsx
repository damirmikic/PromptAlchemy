import React from 'react';
import { PromptDetail } from '../types';

interface OptionButtonProps {
  option: PromptDetail;
  isSelected: boolean;
  onClick: () => void;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ option, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ease-in-out w-full h-full
        ${isSelected 
          ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
          : 'bg-dark-800 border-dark-700 text-gray-400 hover:border-gray-500 hover:bg-dark-700'
        }
      `}
    >
      <div className={`mb-2 ${isSelected ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {option.icon}
      </div>
      <span className="text-xs font-medium text-center leading-tight">
        {option.label}
      </span>
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};
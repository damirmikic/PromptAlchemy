import React from 'react';

export interface PromptDetail {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface PromptCategory {
  id: string;
  title: string;
  description: string;
  options: PromptDetail[];
}

export interface GeneratedResult {
  imagePrompt: string;
  videoPrompt: string;
  explanation: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';
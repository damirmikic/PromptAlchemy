import React from 'react';
import { PromptCategory } from './types';

// Icons
const CameraIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PaletteIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const SunIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const FilmIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
const BookIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

export const VISUAL_TEMPLATES = [
  { 
    id: 'char_concept', 
    label: 'Character Concept', 
    prompt: 'Detailed character concept art of a [ROLE/CLASS], wearing [OUTFIT], standing in a [SETTING], [MOOD] expression, full body shot, neutral background, high fidelity.' 
  },
  { 
    id: 'env_fantasy', 
    label: 'Fantasy Environment', 
    prompt: 'A majestic [LANDSCAPE TYPE] with floating islands, cascading waterfalls, bioluminescent flora, golden hour lighting, epic scale, highly detailed matte painting.' 
  },
  { 
    id: 'cyber_city', 
    label: 'Cyberpunk City', 
    prompt: 'Futuristic cyberpunk city street level, neon signs reflecting in rain puddles, towering skyscrapers, holographic ads, bustling crowd, cinematic lighting, 8k.' 
  },
  { 
    id: 'logo_minimal', 
    label: 'Minimalist Logo', 
    prompt: 'A minimalist vector logo of a [ANIMAL/OBJECT], flat design, geometric shapes, orange and white color palette, white background, professional branding.' 
  },
  { 
    id: 'comic_page', 
    label: 'Comic Page Script', 
    prompt: 'Panel 1: Wide shot of a detective standing in a rainy alleyway, looking at a clue.\nPanel 2: Close up on the clue, a mysterious glowing amulet.\nPanel 3: The detective looks up, surprised, as a shadow looms over them.' 
  },
  { 
    id: 'isometric', 
    label: 'Isometric Room', 
    prompt: 'Isometric view of a cozy gamer bedroom, detailed computer setup, rgb lighting, messy bed, posters on wall, 3d render style, blender cycles.' 
  },
];

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'style',
    title: 'Art Style & Medium',
    description: 'The overall aesthetic and artistic medium.',
    options: [
      { id: 'photorealistic', label: 'Photorealistic', value: 'Photorealistic, 8k, highly detailed, raw photo, Fujifilm XT3', icon: <CameraIcon /> },
      { id: 'cyberpunk', label: 'Cyberpunk', value: 'Cyberpunk, neon lights, high tech low life, futuristic, blade runner aesthetic', icon: <PaletteIcon /> },
      { id: 'anime', label: 'Anime / Manga', value: 'Anime style, Studio Ghibli inspired, cel shaded, vibrant colors, Makoto Shinkai style', icon: <PaletteIcon /> },
      { id: 'comic_modern', label: 'Modern Comic', value: 'Modern comic book style, detailed inking, vibrant digital coloring, Marvel/DC style, dynamic', icon: <BookIcon /> },
      { id: 'comic_noir', label: 'Noir Graphic Novel', value: 'Noir graphic novel style, Frank Miller aesthetic, high contrast black and white, splashes of red, gritty', icon: <BookIcon /> },
      { id: 'comic_vintage', label: 'Vintage Comic', value: 'Golden Age comic style, halftone dots, CMYK printing offset, retro 1950s aesthetic, yellowed paper texture', icon: <BookIcon /> },
      { id: 'comic_moebius', label: 'Moebius / Sci-Fi', value: 'Moebius style, Jean Giraud, intricate line work, surreal sci-fi landscapes, pastel flat colors', icon: <BookIcon /> },
      { id: 'comic_ligne_claire', label: 'Ligne Claire', value: 'Ligne Claire style, Hergé, clean uniform lines, flat colors, no hatching, precise perspective', icon: <BookIcon /> },
      { id: 'comic_manga_horror', label: 'Horror Manga', value: 'Junji Ito style, intricate horror manga, spiraling details, disturbing realism, black and white ink', icon: <BookIcon /> },
      { id: 'oil_painting', label: 'Oil Painting', value: 'Oil painting, thick brushstrokes, impasto, classical art style', icon: <PaletteIcon /> },
      { id: '3d_render', label: '3D Render', value: '3D render, Unreal Engine 5, Octane Render, ray tracing, isometric', icon: <PaletteIcon /> },
      { id: 'watercolor', label: 'Watercolor', value: 'Watercolor, soft edges, pastel colors, wet-on-wet technique, artistic', icon: <PaletteIcon /> },
      { id: 'vintage', label: 'Vintage Film', value: 'Vintage 35mm film, grain, polaroid style, faded colors, nostalgic', icon: <CameraIcon /> },
      { id: 'cartoon', label: 'Cartoon', value: 'Cartoon style, flat shading, bold lines, vibrant colors, 2D animation style', icon: <PaletteIcon /> },
      { id: 'impressionist', label: 'Impressionist', value: 'Impressionist style, Claude Monet inspired, dappled light, loose brushwork', icon: <PaletteIcon /> },
      { id: 'surrealism', label: 'Surrealism', value: 'Surrealism, Salvador Dali style, melting objects, dreamlike, bizarre', icon: <PaletteIcon /> },
      { id: 'pop_art', label: 'Pop Art', value: 'Pop Art, Andy Warhol style, halftone dots, bold contrasting colors', icon: <PaletteIcon /> },
      { id: 'pixel_art', label: 'Pixel Art', value: 'Pixel art, 16-bit, retro game aesthetic, sprite based, isometric', icon: <PaletteIcon /> },
      { id: 'charcoal', label: 'Charcoal Sketch', value: 'Charcoal sketch, rough texture, monochrome, heavy shadows, artistic smudge', icon: <PaletteIcon /> },
      { id: 'stained_glass', label: 'Stained Glass', value: 'Stained glass art, intricate lead lines, translucent vibrant colors, divine lighting', icon: <PaletteIcon /> },
      { id: 'claymation', label: 'Claymation', value: 'Claymation style, Aardman animation, plasticine texture, stop-motion look', icon: <FilmIcon /> },
      { id: 'ukiyo_e', label: 'Ukiyo-e', value: 'Ukiyo-e, traditional Japanese woodblock print, Hokusai style, flat perspective', icon: <PaletteIcon /> },
    ]
  },
  {
    id: 'lighting',
    title: 'Lighting',
    description: 'How the scene is illuminated.',
    options: [
      { id: 'golden_hour', label: 'Golden Hour', value: 'Golden hour, warm lighting, sunset, soft shadows, volumetric light', icon: <SunIcon /> },
      { id: 'cinematic', label: 'Cinematic', value: 'Cinematic lighting, dramatic shadows, rim lighting, studio setup', icon: <FilmIcon /> },
      { id: 'dramatic', label: 'Dramatic', value: 'Dramatic lighting, high contrast, chiaroscuro, deep shadows, intense atmosphere', icon: <SunIcon /> },
      { id: 'volumetric', label: 'God Rays', value: 'Volumetric lighting, god rays, shafts of light through fog/dust, tyndall effect', icon: <SunIcon /> },
      { id: 'soft', label: 'Soft / Diffused', value: 'Soft lighting, diffused light, gentle gradients, cloud diffusion, flattering', icon: <SunIcon /> },
      { id: 'neon', label: 'Neon / Night', value: 'Neon lighting, blue and pink hues, dark atmosphere, glowing elements', icon: <SunIcon /> },
      { id: 'rembrandt', label: 'Rembrandt', value: 'Rembrandt lighting, classical portrait lighting, triangle of light on cheek', icon: <CameraIcon /> },
      { id: 'natural', label: 'Natural', value: 'Natural light, realistic illumination, environmental lighting', icon: <SunIcon /> },
      { id: 'silhouette', label: 'Silhouette', value: 'Silhouette, strong backlight, dark subject, bright background, contour', icon: <SunIcon /> },
      { id: 'studio', label: 'Studio', value: 'Studio lighting, three-point lighting, professional photography, clean look', icon: <CameraIcon /> },
      { id: 'biolum', label: 'Bioluminescent', value: 'Bioluminescent glow, magical atmosphere, ethereal light sources, dark background', icon: <SunIcon /> },
    ]
  },
  {
    id: 'camera',
    title: 'Camera & Angle',
    description: 'Perspective and lens choice.',
    options: [
      { id: 'wide', label: 'Wide Angle', value: 'Wide angle lens, 16mm, expansive view, distortion', icon: <CameraIcon /> },
      { id: 'telephoto', label: 'Telephoto', value: 'Telephoto lens, 200mm, compressed background, flattened perspective', icon: <CameraIcon /> },
      { id: 'macro', label: 'Macro', value: 'Macro photography, extreme close-up, high detail, shallow depth of field', icon: <CameraIcon /> },
      { id: 'drone', label: 'Drone View', value: 'Drone shot, aerial view, bird\'s eye view, high altitude', icon: <CameraIcon /> },
      { id: 'overhead', label: 'Overhead', value: 'Overhead shot, top-down view, flat lay composition, direct vertical angle', icon: <CameraIcon /> },
      { id: 'low_angle', label: 'Low Angle', value: 'Low angle shot, worm\'s eye view, looking up at subject, imposing perspective', icon: <CameraIcon /> },
      { id: 'dutch_angle', label: 'Dutch Angle', value: 'Dutch angle, tilted horizon, dynamic tension, disorienting', icon: <CameraIcon /> },
      { id: 'bokeh', label: 'Bokeh / Portrait', value: '85mm lens, f/1.8, bokeh background, sharp focus on subject, portrait photography', icon: <CameraIcon /> },
      { id: 'fisheye', label: 'Fisheye', value: 'Fisheye lens, distorted, spherical view, skate video style', icon: <CameraIcon /> },
      { id: 'gopro', label: 'Action/GoPro', value: 'GoPro footage, POV shot, wide FOV, action camera aesthetic', icon: <CameraIcon /> },
    ]
  },
  {
    id: 'mood',
    title: 'Mood & Atmosphere',
    description: 'The feeling of the image.',
    options: [
      { id: 'ethereal', label: 'Ethereal', value: 'Ethereal, dreamy, fantasy, mystical, fog', icon: <PaletteIcon /> },
      { id: 'dark', label: 'Dark / Gritty', value: 'Dark, gritty, moody, mysterious, ominous, horror vibes', icon: <FilmIcon /> },
      { id: 'cheerful', label: 'Cheerful', value: 'Cheerful, vibrant, happy, bright, energetic, summer vibes', icon: <SunIcon /> },
      { id: 'minimalist', label: 'Minimalist', value: 'Minimalist, clean, zen, negative space, simple', icon: <PaletteIcon /> },
      { id: 'chaos', label: 'Chaotic', value: 'Chaotic, explosive, dynamic, action-packed, intense', icon: <FilmIcon /> },
      { id: 'nostalgic', label: 'Nostalgic', value: 'Nostalgic, sentimental, warm memories, sepia tones, retro', icon: <PaletteIcon /> },
      { id: 'whimsical', label: 'Whimsical', value: 'Whimsical, playful, quirky, magical realism, storybook', icon: <PaletteIcon /> },
      { id: 'suspenseful', label: 'Suspenseful', value: 'Suspenseful, tension, thriller atmosphere, lurking shadows', icon: <FilmIcon /> },
      { id: 'romantic', label: 'Romantic', value: 'Romantic, passionate, soft focus, rose hues, intimate', icon: <PaletteIcon /> },
    ]
  }
];
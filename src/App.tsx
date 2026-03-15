/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, Wand2, RefreshCcw, Download, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateStylizedImage, removeBackground } from './services/geminiService';

export default function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [influence, setInfluence] = useState(50);
  const [description, setDescription] = useState('');
  const [scene, setScene] = useState('');
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [imageCount, setImageCount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Please upload a JPG or PNG image.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setSourceMimeType(file.type);
        setGeneratedImages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Please upload a JPG or PNG image.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        setSourceMimeType(file.type);
        setGeneratedImages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage || !sourceMimeType) {
      setError('Please upload an image first.');
      return;
    }

    if (quality === 'high') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGenerating(true);
    setError(null);
    try {
      const results: string[] = [];
      for (let i = 0; i < imageCount; i++) {
        const result = await generateStylizedImage(sourceImage, sourceMimeType, influence, description, scene, quality);
        results.push(result);
      }
      setGeneratedImages(results);
    } catch (err) {
      setError('Failed to generate image. This might be due to content safety filters or a connection issue.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!sourceImage || !sourceMimeType) return;

    setIsRemovingBackground(true);
    setError(null);
    try {
      const result = await removeBackground(sourceImage, sourceMimeType);
      setSourceImage(result);
      setSourceMimeType('image/png'); // Gemini returns PNG for background removal
      setGeneratedImages([]);
    } catch (err) {
      setError('Failed to remove background. Please try again.');
      console.error(err);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const reset = () => {
    setSourceImage(null);
    setSourceMimeType(null);
    setGeneratedImages([]);
    setInfluence(50);
    setDescription('');
    setScene('');
    setQuality('standard');
    setImageCount(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Wand2 className="text-white w-5 h-5" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Stylizer AI</h1>
          </div>
          {sourceImage && (
            <button
              onClick={reset}
              className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input Stack */}
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Input & Configuration</h2>
                
                {!sourceImage ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="relative group cursor-pointer"
                  >
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/png, image/jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-neutral-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 group-hover:border-emerald-500 transition-colors bg-neutral-50/50">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-neutral-400 group-hover:text-emerald-500 transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Click or drag to upload</p>
                        <p className="text-sm text-neutral-500">JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-neutral-100 aspect-video max-h-[300px]">
                    <img
                      src={sourceImage}
                      alt="Source"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setSourceImage(null)}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              {/* Background Removal */}
              <button
                onClick={handleRemoveBackground}
                disabled={!sourceImage || isRemovingBackground || isGenerating}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border ${
                  !sourceImage || isRemovingBackground || isGenerating
                    ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-emerald-500 hover:text-emerald-600 active:scale-[0.98]'
                }`}
              >
                {isRemovingBackground ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scissors className="w-4 h-4" />
                )}
                {isRemovingBackground ? 'Processing...' : 'Remove Background'}
              </button>

              {/* Influence Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-neutral-700">Reference Influence</label>
                  <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-600">{influence}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={influence}
                  onChange={(e) => setInfluence(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
                  <span>Creative</span>
                  <span>Faithful</span>
                </div>
              </div>

              {/* Character Description */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">Character Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., a young warrior with red hair and silver armor..."
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm min-h-[80px] resize-none"
                />
              </div>

              {/* Scene & Action */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">Scene & Action</label>
                <textarea
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  placeholder="e.g., standing in a forest, fighting a dragon..."
                  className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm min-h-[80px] resize-none"
                />
              </div>

              {/* Quality & Count */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700">Output Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as 'standard' | 'high')}
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
                  >
                    <option value="standard">Standard (720p)</option>
                    <option value="high">High (2K-4K)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700">Number of Images</label>
                  <select
                    value={imageCount}
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    className="w-full p-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} Image{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {quality === 'high' && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  High quality requires a paid Gemini API key.
                </p>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!sourceImage || isGenerating || isRemovingBackground}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !sourceImage || isGenerating || isRemovingBackground
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] hover:shadow-emerald-500/20'
                }`}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                {isGenerating ? 'Generating Masterpiece...' : 'Stylize Now'}
              </button>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <h3 className="font-semibold text-emerald-900 mb-2">Vintage Aesthetic</h3>
              <p className="text-sm text-emerald-800/80 leading-relaxed">
                Our AI creates an "old-style" look with sepia tones, film grain, and authentic vintage textures. Perfect for creating timeless character portraits.
              </p>
            </div>
          </section>

          {/* Right Column: Output Grid */}
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 min-h-[600px] flex flex-col">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-4">Generated Results</h2>
              
              <div className="flex-1 bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-10"
                    >
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-emerald-400/20 animate-pulse rounded-full" />
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-900 font-semibold">Developing your photos...</p>
                        <p className="text-sm text-neutral-500">This may take a few moments for high quality</p>
                      </div>
                    </motion.div>
                  ) : null}

                  {generatedImages.length > 0 ? (
                    <motion.div
                      key="results-grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 h-full overflow-y-auto"
                    >
                      {generatedImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative group bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden aspect-square"
                        >
                          <img
                            src={img}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a
                              href={img}
                              download={`stylized-image-${idx + 1}.png`}
                              className="bg-white text-neutral-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium hover:bg-neutral-50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : !isGenerating && (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-neutral-300"
                    >
                      <ImageIcon className="w-16 h-16" />
                      <p className="text-sm font-medium">Your vintage portraits will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-neutral-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-neutral-400">
            <Wand2 className="w-4 h-4" />
            <span className="text-sm">Powered by Gemini AI</span>
          </div>
          <p className="text-sm text-neutral-400">
            No images are stored permanently. Your privacy is our priority.
          </p>
        </div>
      </footer>
    </div>
  );
}

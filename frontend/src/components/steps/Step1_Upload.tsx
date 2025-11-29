'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle, Film, Database, Bug, Zap } from 'lucide-react';
import { useDebug } from '@/lib/debugContext';

interface Step1Props {
  onNext: () => void;
}

export default function Step1_Upload({ onNext }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { debugMode, useCachedRun, setUseCachedRun } = useDebug();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleLoadCachedRun = () => {
    // Create a mock file to represent the cached run
    const mockFile = new File(['cached'], 'EcoBottle_Demo_Footage.mp4', { type: 'video/mp4' });
    setFile(mockFile);
    setUseCachedRun(true);
  };

  const canProceed = file !== null;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-zinc-100 mb-3 tracking-tight">Upload Source Material</h2>
        <p className="text-zinc-500 text-sm">Start by uploading a raw video, walkthrough, or gameplay footage.</p>
      </div>

      {/* Debug Mode: Cached Run Panel */}
      {debugMode && (
        <div className="w-full mb-6 animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bug size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Debug: Quick Load</span>
            </div>
            <button
              onClick={handleLoadCachedRun}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all
                ${useCachedRun 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5'}
              `}
            >
              <Database size={18} />
              {useCachedRun ? 'Demo Data Loaded ✓' : 'Load Cached Demo Run'}
              {!useCachedRun && <Zap size={14} className="text-amber-400" />}
            </button>
            <p className="text-[10px] text-amber-400/50 mt-2 text-center">
              Loads pre-generated data from /public/runs/first/
            </p>
          </div>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden
          ${isDragging ? 'border-primary bg-primary/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'}
          ${file ? 'border-primary/50 bg-primary/5' : ''}
          ${useCachedRun ? 'border-amber-500/50 bg-amber-500/5' : ''}
        `}
      >
        <input 
          type="file" 
          className="hidden" 
          id="file-upload" 
          accept="video/*"
          onChange={handleFileChange}
        />
        
        {file ? (
          <div className="text-center z-10 animate-in fade-in zoom-in duration-300">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${useCachedRun ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'}`}>
               <CheckCircle size={32} />
            </div>
            <p className="text-lg font-medium text-zinc-200">{file.name}</p>
            <p className={`text-xs mt-1 font-mono ${useCachedRun ? 'text-amber-400' : 'text-primary'}`}>
              {useCachedRun ? 'DEMO DATA READY' : 'READY FOR ANALYSIS'}
            </p>
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-10">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-zinc-400 group-hover:text-primary transition-colors" size={28} />
            </div>
            <p className="text-lg font-medium text-zinc-300 group-hover:text-zinc-100">Drag & drop video source</p>
            <p className="text-xs text-zinc-500 mt-2">MP4, MOV, AVI (Max 500MB)</p>
          </label>
        )}
      </div>

      <div className="mt-8 w-full flex justify-center">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-full font-medium text-sm transition-all w-full max-w-xs
            ${canProceed 
              ? useCachedRun
                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                : 'bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(138,206,0,0.3)] hover:shadow-[0_0_30px_rgba(138,206,0,0.5)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
          `}
        >
          {canProceed 
            ? useCachedRun 
              ? 'Continue with Demo Data →' 
              : 'Analyze & Extract Metadata' 
            : 'Upload to Continue'}
        </button>
      </div>

      {/* Secret trigger: Triple-click on upload area text toggles debug in emergency */}
      {!debugMode && (
        <p 
          className="text-[10px] text-zinc-700 mt-4 select-none cursor-default"
          onDoubleClick={(e) => {
            // Hint text that appears on hover when debug mode is off
            (e.target as HTMLElement).innerText = 'Hint: Ctrl+Shift+D or double-click logo';
          }}
        >
          Having issues? Try Ctrl+Shift+D
        </p>
      )}
    </div>
  );
}

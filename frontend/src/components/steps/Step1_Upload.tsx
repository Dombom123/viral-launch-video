import React, { useState } from 'react';
import { Upload, CheckCircle, Film } from 'lucide-react';

interface Step1Props {
  onNext: () => void;
}

export default function Step1_Upload({ onNext }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-zinc-100 mb-3 tracking-tight">Upload Source Material</h2>
        <p className="text-zinc-500 text-sm">Start by uploading a raw video, walkthrough, or gameplay footage.</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group relative overflow-hidden
          ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'}
          ${file ? 'border-green-500/50 bg-green-500/5' : ''}
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
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-4">
               <CheckCircle size={32} />
            </div>
            <p className="text-lg font-medium text-zinc-200">{file.name}</p>
            <p className="text-xs text-green-500 mt-1 font-mono">READY FOR ANALYSIS</p>
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-10">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-zinc-400 group-hover:text-orange-500 transition-colors" size={28} />
            </div>
            <p className="text-lg font-medium text-zinc-300 group-hover:text-zinc-100">Drag & drop video source</p>
            <p className="text-xs text-zinc-500 mt-2">MP4, MOV, AVI (Max 500MB)</p>
          </label>
        )}
      </div>

      <div className="mt-8 w-full flex justify-center">
        <button
          onClick={onNext}
          disabled={!file}
          className={`px-8 py-3 rounded-full font-medium text-sm transition-all w-full max-w-xs
            ${file 
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
          `}
        >
          {file ? 'Analyze & Extract Metadata' : 'Upload to Continue'}
        </button>
      </div>
    </div>
  );
}

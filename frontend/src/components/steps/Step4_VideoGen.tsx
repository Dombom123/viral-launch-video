import React, { useState, useEffect } from 'react';
import { Play, Download, RefreshCw, ArrowRight, Cpu } from 'lucide-react';

interface Step4Props {
  onNext: () => void;
}

export default function Step4_VideoGen({ onNext }: Step4Props) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Automatically proceed to Editor when complete
          onNext(); 
          return 100;
        }
        return prev + 1; 
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onNext]);

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 text-center">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
             <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
             <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
             <span className="text-2xl font-bold text-zinc-200 font-mono">{progress}%</span>
          </div>
          
          <h3 className="text-xl font-medium text-zinc-200 mb-2">Rendering Neural Frames</h3>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">Synthesizing video from storyboard references. Redirecting to editor...</p>
          
          <div className="flex gap-1">
             {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-8 rounded-sm transition-colors duration-300
                    ${i < (progress / 5) ? 'bg-primary shadow-[0_0_10px_rgba(138,206,0,0.5)]' : 'bg-zinc-800'}
                  `}
                ></div>
             ))}
          </div>
      </div>
    </div>
  );
}

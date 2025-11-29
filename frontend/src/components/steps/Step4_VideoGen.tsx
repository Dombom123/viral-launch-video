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
          setCompleted(true);
          return 100;
        }
        return prev + 1; 
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 text-center">

      {!completed ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
             <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
             <div className="absolute inset-0 rounded-full border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
             <span className="text-2xl font-bold text-zinc-200 font-mono">{progress}%</span>
          </div>
          
          <h3 className="text-xl font-medium text-zinc-200 mb-2">Rendering Neural Frames</h3>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">The Swarm is synthesizing video from the approved storyboard references. High-fidelity upscaling in progress.</p>
          
          <div className="flex gap-1">
             {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-8 rounded-sm transition-colors duration-300
                    ${i < (progress / 5) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}
                  `}
                ></div>
             ))}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <Cpu size={18} className="text-green-500" /> Render Complete
              </h2>
              <div className="flex gap-2">
                 <button className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium rounded hover:text-white hover:border-zinc-600 flex items-center gap-1.5">
                   <RefreshCw size={12} /> Regenerate All
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             {[1, 2].map((id) => (
               <div key={id} className="bg-black rounded-xl overflow-hidden border border-zinc-800 relative aspect-video group">
                 <img src={`https://placehold.co/600x340/18181b/FFF?text=Generated+Clip+${id}`} alt={`Video ${id}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform">
                     <Play size={24} fill="currentColor" className="ml-1" />
                   </button>
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                    <p className="text-zinc-300 text-xs font-medium">Scene {id}</p>
                    <button className="text-zinc-500 hover:text-white"><Download size={14} /></button>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="flex justify-center">
              <button
                onClick={onNext}
                className="bg-zinc-100 hover:bg-white text-zinc-900 px-8 py-3 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2"
              >
                Proceed to Editor <ArrowRight size={16} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

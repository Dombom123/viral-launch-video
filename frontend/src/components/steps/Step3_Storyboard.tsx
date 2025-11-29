import React, { useState } from 'react';
import { RefreshCw, Image as ImageIcon, ArrowRight, Wand2, Film } from 'lucide-react';
import { storyboardData } from '@/lib/mockData';

interface Step3Props {
  onNext: () => void;
}

export default function Step3_Storyboard({ onNext }: Step3Props) {
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = (id: string) => {
    setRegenerating(id);
    setTimeout(() => setRegenerating(null), 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Characters */}
        <div className="lg:col-span-1 space-y-6">
           <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Wand2 size={14} className="text-orange-500" /> Cast Generation
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {storyboardData.characters.map((char) => (
                  <div key={char.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <img src={char.src} alt={char.label} className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                       <span className="text-xs font-medium text-zinc-200 block truncate">{char.label}</span>
                    </div>
                    <button 
                      onClick={() => handleRegenerate(char.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw size={12} className={regenerating === char.id ? 'animate-spin text-orange-500' : ''} />
                    </button>
                  </div>
                ))}
              </div>
           </div>

           <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <ImageIcon size={14} /> Environments
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {storyboardData.locations.map((loc) => (
                  <div key={loc.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <img src={loc.src} alt={loc.label} className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                       <span className="text-xs font-medium text-zinc-200 block truncate">{loc.label}</span>
                    </div>
                    <button 
                       onClick={() => handleRegenerate(loc.id)}
                       className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw size={12} className={regenerating === loc.id ? 'animate-spin text-orange-500' : ''} />
                    </button>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Storyboard Grid */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Film size={14} /> Visual Sequence
          </h3>
          <div className="grid grid-cols-2 gap-4">
             {storyboardData.frames.map((frame) => (
               <div key={frame.id} className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all">
                  <div className="aspect-video relative overflow-hidden">
                     <img src={frame.img} alt={frame.description} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-300 border border-white/10">
                        SCENE {frame.id}
                     </div>
                  </div>
                  <div className="p-3">
                     <p className="text-xs text-zinc-400 leading-relaxed">{frame.description}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="text-center pt-6 border-t border-zinc-800">
        <button
          onClick={onNext}
          className="bg-zinc-100 hover:bg-white text-zinc-900 px-8 py-3 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 mx-auto transition-transform hover:-translate-y-0.5"
        >
          Lock Storyboard & Render <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

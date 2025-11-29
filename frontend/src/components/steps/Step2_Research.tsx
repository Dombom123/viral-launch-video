import React, { useState, useEffect } from 'react';
import { Loader2, Check, FileText, Sparkles, TrendingUp, Target } from 'lucide-react';
import { researchData } from '@/lib/mockData';

interface Step2Props {
  onNext: () => void;
}

export default function Step2_Research({ onNext }: Step2Props) {
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
           <Loader2 className="w-12 h-12 text-orange-500 animate-spin relative z-10" />
        </div>
        <h3 className="text-xl font-medium text-zinc-200">Analyzing Market Vectors</h3>
        <p className="text-zinc-500 mt-2 text-sm">Scanning viral trends, competitor ads, and audience signals...</p>
        
        <div className="mt-8 w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
           <div className="h-full bg-orange-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Target size={14} /> Product Analysis
          </h3>
          <div className="space-y-3">
             <div>
               <p className="text-xs text-zinc-500 mb-1">Product Name</p>
               <p className="text-sm text-zinc-200 font-medium">{researchData.productInfo.name}</p>
             </div>
             <div>
               <p className="text-xs text-zinc-500 mb-1">Core Value Prop</p>
               <p className="text-sm text-zinc-300">{researchData.productInfo.description}</p>
             </div>
             <div className="flex flex-wrap gap-2 mt-2">
               {researchData.productInfo.competitors.map(c => (
                 <span key={c} className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px] border border-zinc-700">{c}</span>
               ))}
             </div>
          </div>
        </div>
        
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
             <TrendingUp size={14} /> Market Signal
          </h3>
          <div className="h-full flex flex-col justify-center">
            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-2">
              <p className="text-xs text-blue-400 font-medium mb-1">Dominant Trend</p>
              <p className="text-sm text-zinc-200">{researchData.marketAnalysis.trend}</p>
            </div>
            <p className="text-xs text-zinc-500 italic">"{researchData.marketAnalysis.insight}"</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-orange-500" /> Generated Concepts
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {researchData.scripts.map((script) => (
          <div 
            key={script.id}
            onClick={() => setSelectedScript(script.id)}
            className={`relative cursor-pointer transition-all duration-200 rounded-xl p-5 border 
              ${selectedScript === script.id 
                ? 'border-orange-500 bg-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.02] z-10' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'}
            `}
          >
            {selectedScript === script.id && (
              <div className="absolute -top-2 -right-2 bg-orange-500 text-black p-1 rounded-full shadow-lg">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedScript === script.id ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 text-zinc-500'}`}>
                 <FileText size={16} />
              </div>
              <h3 className="font-medium text-zinc-200 text-sm">{script.title}</h3>
            </div>
            
            <div className="space-y-3">
               <div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">The Hook</p>
                 <p className="text-sm text-zinc-300 italic">"{script.hook}"</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Visual Arc</p>
                 <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">{script.body}</p>
               </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-zinc-800/50">
               <p className="text-[10px] text-zinc-500 text-center">CTA: <span className="text-zinc-300">{script.callToAction}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onNext}
          disabled={!selectedScript}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all
            ${selectedScript 
              ? 'bg-zinc-100 text-zinc-900 hover:bg-white shadow-lg' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}
          `}
        >
          Approve Concept & Generate Assets
        </button>
      </div>
    </div>
  );
}

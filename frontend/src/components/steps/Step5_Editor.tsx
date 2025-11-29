import React, { useState } from 'react';
import { Play, Pause, Volume2, Scissors, Layers, CheckCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Step5_Editor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setFinished(true);
    }, 3000);
  };

  if (finished) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Trailer Ready</h2>
        <p className="text-zinc-500 mb-8 text-sm">Your viral video has been compiled, color graded, and exported.</p>
        <div className="flex flex-col sm:flex-row gap-3">
           <button className="px-6 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg font-medium text-sm hover:bg-white shadow-lg flex items-center gap-2 justify-center">
             <Download size={16} /> Download MP4 (1080p)
           </button>
           <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg font-medium text-sm hover:bg-zinc-800 hover:text-white transition-colors">
             Create New Project
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      
      {/* Top Toolbar */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-zinc-100 font-medium text-sm">Master Sequence</span>
          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase border border-green-500/20">Auto-Edit</span>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-1.5 rounded text-xs font-bold shadow flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Rendering...' : 'Export Trailer'}
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex gap-4 min-h-0">
         {/* Left: Preview */}
         <div className="flex-[2] bg-black rounded-xl border border-zinc-800 relative overflow-hidden group flex flex-col">
            {/* Video Display */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h3 className="text-zinc-700 text-4xl font-bold uppercase tracking-widest opacity-20">Preview</h3>
                </div>
                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="flex justify-between items-start">
                      <span className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">REC.709</span>
                   </div>
                </div>
            </div>
            
            {/* Player Controls */}
            <div className="h-12 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4 text-zinc-400">
                   <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white transition-colors">
                     {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                   </button>
                   <div className="text-[10px] font-mono">00:00:12 / 00:00:30</div>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                   <Volume2 size={16} />
                </div>
            </div>
         </div>

         {/* Right: Asset/Tools Panel (Placeholder for "Editor Tools") */}
         <div className="flex-1 bg-zinc-900 rounded-xl border border-zinc-800 p-3 overflow-y-auto hidden lg:block">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Scene Bin</h4>
            <div className="grid grid-cols-2 gap-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-video bg-zinc-950 rounded border border-zinc-800 relative opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing">
                    <div className="absolute bottom-1 right-1 text-[8px] bg-black/80 text-white px-1 rounded">00:04</div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800 mt-4 p-3 shrink-0 flex flex-col">
         <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
           <div className="flex gap-3 text-zinc-500 text-xs">
              <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors"><Scissors size={12} /> Split</button>
              <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors"><Layers size={12} /> Tracks</button>
           </div>
           <div className="text-[10px] text-zinc-600 font-mono">TIMECODE: 01:00:00:00</div>
         </div>
         
         <div className="flex-1 relative overflow-x-auto overflow-y-hidden">
            {/* Ruler */}
            <div className="h-4 flex items-end mb-1 border-b border-zinc-800/50 w-[200%]">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="flex-1 border-r border-zinc-800 h-2 text-[8px] text-zinc-600 pl-1">00:0{i}</div>
               ))}
            </div>

            {/* Tracks */}
            <div className="space-y-1 w-[200%]">
               {/* Video Track */}
               <div className="h-8 bg-zinc-950 rounded border border-zinc-800 flex relative overflow-hidden">
                  <div className="w-[15%] bg-blue-900/40 border-r border-blue-500/20 flex items-center justify-center text-[9px] text-blue-200 font-medium truncate">S1</div>
                  <div className="w-[25%] bg-blue-900/40 border-r border-blue-500/20 flex items-center justify-center text-[9px] text-blue-200 font-medium truncate">S2</div>
                  <div className="w-[20%] bg-blue-900/40 border-r border-blue-500/20 flex items-center justify-center text-[9px] text-blue-200 font-medium truncate">S3</div>
                  <div className="w-[40%] bg-blue-900/40 border-r border-blue-500/20 flex items-center justify-center text-[9px] text-blue-200 font-medium truncate">S4</div>
               </div>
               {/* Audio Track */}
               <div className="h-6 bg-zinc-950 rounded border border-zinc-800 relative flex items-center px-1">
                   <div className="w-full h-3 bg-green-900/20 rounded flex items-center overflow-hidden">
                      <svg className="w-full h-full text-green-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                         <path d="M0 5 Q 2 0, 5 5 T 10 5 T 15 5 T 20 5 T 100 5" stroke="currentColor" strokeWidth="1" fill="none" />
                      </svg>
                   </div>
               </div>
            </div>

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 left-[30%] w-px bg-red-500 z-10 shadow-[0_0_5px_rgba(239,68,68,0.5)]">
               <div className="w-2 h-2 bg-red-500 -ml-1 rotate-45 -mt-1"></div>
            </div>
         </div>
      </div>
    </div>
  );
}

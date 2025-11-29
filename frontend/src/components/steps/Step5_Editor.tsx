import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Scissors, Layers, CheckCircle } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Video Exported Successfully!</h2>
        <p className="text-gray-600 mb-8">Your viral video is ready to launch.</p>
        <div className="flex justify-center gap-4">
           <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg">
             Download MP4
           </button>
           <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">
             Create Another
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Video Editor</h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Auto-Edit Active</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase">Music Synced</span>
        </div>
      </div>

      {/* Preview Player */}
      <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video relative mb-6">
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h3 className="text-white/20 text-4xl font-bold uppercase tracking-widest">Final Preview</h3>
         </div>
         
         {/* Mock Controls Overlay */}
         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-white">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-blue-400 transition-colors">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <div className="text-xs font-mono text-gray-300">00:12 / 00:30</div>
               </div>
               <div className="flex items-center gap-4 text-white">
                  <Volume2 size={20} />
               </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden cursor-pointer hover:h-2 transition-all">
              <div className="bg-blue-500 h-full w-1/3 relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
         </div>
      </div>

      {/* Timeline Interface */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-lg">
         <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
           <div className="flex gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-1 hover:text-white cursor-pointer"><Scissors size={14} /> Split</div>
              <div className="flex items-center gap-1 hover:text-white cursor-pointer"><Layers size={14} /> Tracks</div>
           </div>
           <div className="text-xs text-gray-500 font-mono">00:00:00:00</div>
         </div>
         
         <div className="space-y-2">
            {/* Video Track */}
            <div className="h-16 bg-gray-800 rounded border border-gray-700 relative overflow-hidden flex">
              <div className="bg-blue-600/80 h-full border-r border-blue-800 w-1/4 flex items-center justify-center text-xs text-white/90 font-medium truncate px-2">Scene 1</div>
              <div className="bg-blue-600/80 h-full border-r border-blue-800 w-1/4 flex items-center justify-center text-xs text-white/90 font-medium truncate px-2">Scene 2</div>
              <div className="bg-blue-600/80 h-full border-r border-blue-800 w-1/4 flex items-center justify-center text-xs text-white/90 font-medium truncate px-2">Scene 3</div>
              <div className="bg-blue-600/80 h-full border-r border-blue-800 w-1/4 flex items-center justify-center text-xs text-white/90 font-medium truncate px-2">Scene 4</div>
            </div>
            {/* Audio Track */}
            <div className="h-10 bg-gray-800 rounded border border-gray-700 relative overflow-hidden flex items-center">
               <div className="w-full h-6 mx-2 bg-green-900/50 rounded flex items-center">
                  <svg className="w-full h-full text-green-500" viewBox="0 0 100 10" preserveAspectRatio="none">
                     <path d="M0 5 Q 10 0, 20 5 T 40 5 T 60 5 T 80 5 T 100 5" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all"
        >
          {isExporting ? (
            <>Processing...</>
          ) : (
            <>Export Final Video</>
          )}
        </button>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Play, Download, RefreshCw, ArrowRight } from 'lucide-react';

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
        return prev + 2; // Simulate progress
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">Video Generation</h2>

      {!completed ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200">
          <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-8"></div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Rendering Scenes...</h3>
          <p className="text-gray-500 mb-6">AI is animating your storyboard. This may take a moment.</p>
          
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}% Complete</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-black rounded-xl overflow-hidden shadow-lg relative aspect-video group">
             <img src="https://placehold.co/600x340/000000/FFF?text=Generated+Clip+1" alt="Video 1" className="w-full h-full object-cover opacity-80" />
             <div className="absolute inset-0 flex items-center justify-center">
               <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                 <Play size={32} fill="white" />
               </button>
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-medium">Scene 1: The Reveal</p>
             </div>
           </div>

           <div className="bg-black rounded-xl overflow-hidden shadow-lg relative aspect-video group">
             <img src="https://placehold.co/600x340/000000/FFF?text=Generated+Clip+2" alt="Video 2" className="w-full h-full object-cover opacity-80" />
             <div className="absolute inset-0 flex items-center justify-center">
               <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                 <Play size={32} fill="white" />
               </button>
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-medium">Scene 2: In Action</p>
             </div>
           </div>
           
           {/* Controls */}
           <div className="md:col-span-2 flex justify-center gap-4 mt-4">
             <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-2">
               <RefreshCw size={18} /> Regenerate Clips
             </button>
             <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 flex items-center gap-2">
               <Download size={18} /> Download Raws
             </button>
           </div>

           <div className="md:col-span-2 mt-8">
              <button
                onClick={onNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg font-bold shadow-lg text-lg flex items-center gap-2 mx-auto"
              >
                Go to AI Editor <ArrowRight size={24} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
}


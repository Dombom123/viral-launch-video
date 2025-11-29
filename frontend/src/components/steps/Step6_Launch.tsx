import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Share2, Copy, Youtube, Twitter, Instagram } from 'lucide-react';

interface Step6Props {
    onBack?: () => void;
    projectId: string | null;
}

export default function Step6_Launch({ projectId }: Step6Props) {
  const [copied, setCopied] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    // Check video status to get URL
    fetch(`http://localhost:8000/api/project/${projectId}/video-status`)
        .then(res => res.json())
        .then(data => {
            if (data.videoUrl) {
                setVideoUrl(data.videoUrl);
            }
        })
        .catch(e => console.error(e));
  }, [projectId]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700 py-8">
      
      <div className="mb-6 relative shrink-0">
         <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
         <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center border-4 border-black shadow-2xl relative z-10">
            <CheckCircle className="w-8 h-8 text-black" strokeWidth={3} />
         </div>
      </div>

      <h2 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight shrink-0">Campaign Ready for Launch</h2>
      <p className="text-zinc-400 mb-8 text-base max-w-xl shrink-0">Your viral video has been rendered in 4K, metadata optimized, and is ready for distribution.</p>

      {/* Final Video Preview */}
      <div className="w-full max-w-xl aspect-video bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl mb-8 relative group shrink-0">
         {videoUrl ? (
            <video src={videoUrl} className="w-full h-full object-cover" controls />
         ) : (
             <img src="https://placehold.co/1280x720/000000/FFF?text=FINAL+CUT" className="w-full h-full object-cover" />
         )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md shrink-0">
         <button className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
            <Download size={18} /> Download Master
         </button>
         <button className="flex-1 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2">
            <Share2 size={18} /> Smart Publish
         </button>
      </div>

      {/* Social Links */}
      <div className="mt-8 flex items-center gap-4 text-zinc-500 shrink-0">
         <span className="text-xs font-medium uppercase tracking-widest">Direct Share</span>
         <div className="h-px w-8 bg-zinc-800"></div>
         <button className="hover:text-red-500 transition-colors"><Youtube size={20} /></button>
         <button className="hover:text-blue-400 transition-colors"><Twitter size={20} /></button>
         <button className="hover:text-pink-500 transition-colors"><Instagram size={20} /></button>
      </div>

    </div>
  );
}


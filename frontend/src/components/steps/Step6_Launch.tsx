import React, { useState } from 'react';
import { CheckCircle, Download, Share2, Copy, Youtube, Twitter, Instagram } from 'lucide-react';

export default function Step6_Launch() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
      
      <div className="mb-8 relative">
         <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
         <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 border-4 border-black shadow-2xl relative z-10">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
         </div>
      </div>

      <h2 className="text-4xl font-bold text-zinc-100 mb-2 tracking-tight">Campaign Ready for Launch</h2>
      <p className="text-zinc-400 mb-12 text-lg max-w-xl">Your viral video has been rendered in 4K, metadata optimized, and is ready for distribution.</p>

      {/* Final Video Preview */}
      <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl mb-10 relative group">
         <img src="https://placehold.co/1280x720/000000/FFF?text=FINAL+CUT" className="w-full h-full object-cover" />
         <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer">
               <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
         <button className="flex-1 px-6 py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
            <Download size={18} /> Download Master
         </button>
         <button className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2">
            <Share2 size={18} /> Smart Publish
         </button>
      </div>

      {/* Social Links */}
      <div className="mt-12 flex items-center gap-4 text-zinc-500">
         <span className="text-xs font-medium uppercase tracking-widest">Direct Share</span>
         <div className="h-px w-8 bg-zinc-800"></div>
         <button className="hover:text-red-500 transition-colors"><Youtube size={20} /></button>
         <button className="hover:text-blue-400 transition-colors"><Twitter size={20} /></button>
         <button className="hover:text-pink-500 transition-colors"><Instagram size={20} /></button>
      </div>

    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Share2, Copy, Youtube, Twitter, Instagram, Linkedin, Music2, Check } from 'lucide-react';
import { useDebug } from '@/lib/debugContext';

const RUN_ID = 'first';

interface LaunchData {
  final_video_url: string;
  thumbnail_url: string;
  metadata: {
    duration: number;
    format: string;
    resolution: string;
  };
  script?: {
    title: string;
    hook: string;
  };
  social_posts: {
    twitter: string;
    instagram: string;
    linkedin: string;
    tiktok?: string;
  };
}

export default function Step6_Launch() {
  const { useCachedRun } = useDebug();
  const [copied, setCopied] = useState<string | null>(null);
  const [launchData, setLaunchData] = useState<LaunchData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const path = useCachedRun 
          ? `/runs/${RUN_ID}/example_6_launch.json`
          : `/runs/${RUN_ID}/example_6_launch.json`;
        const response = await fetch(path);
        const data = await response.json();
        setLaunchData(data);
      } catch (err) {
        console.error('Failed to load launch data:', err);
      }
    };
    loadData();
  }, [useCachedRun]);

  const handleCopy = (platform: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col items-center text-center animate-in fade-in duration-700 py-8 overflow-y-auto">
      
      <div className="mb-6 relative shrink-0">
         <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
         <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-full flex items-center justify-center border-4 border-black shadow-2xl relative z-10">
            <CheckCircle className="w-8 h-8 text-black" strokeWidth={3} />
         </div>
      </div>

      <h2 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight shrink-0">
        {launchData?.script?.title || 'Campaign Ready for Launch'} 🎉
      </h2>
      <p className="text-zinc-400 mb-8 text-base max-w-xl shrink-0">
        {launchData?.script?.hook || 'Your viral video has been rendered and is ready for distribution.'}
      </p>

      {/* Final Video Preview */}
      <div className="w-full max-w-xl aspect-video bg-black rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl mb-8 relative group shrink-0">
         {launchData?.final_video_url ? (
           <video 
             src={launchData.final_video_url}
             poster={launchData.thumbnail_url}
             controls
             className="w-full h-full object-cover"
           />
         ) : (
           <>
             <img 
               src={launchData?.thumbnail_url || '/runs/first/frames/scene-2.png'} 
               className="w-full h-full object-cover" 
               alt="Final video thumbnail"
             />
             <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer">
                   <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                </div>
             </div>
           </>
         )}
      </div>

      {/* Video Metadata */}
      {launchData?.metadata && (
        <div className="flex gap-4 mb-8 text-xs text-zinc-500">
          <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            {launchData.metadata.duration}s
          </span>
          <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            {launchData.metadata.format.toUpperCase()}
          </span>
          <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            {launchData.metadata.resolution}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md shrink-0 mb-10">
         <button className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
            <Download size={18} /> Download Master
         </button>
         <button className="flex-1 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-2">
            <Share2 size={18} /> Smart Publish
         </button>
      </div>

      {/* Social Posts */}
      {launchData?.social_posts && (
        <div className="w-full max-w-2xl text-left">
          <h3 className="text-sm font-medium text-zinc-400 mb-4 text-center">Generated Social Posts</h3>
          <div className="grid gap-4">
            {/* Twitter */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Twitter size={16} className="text-blue-400" />
                  <span className="text-xs font-medium text-zinc-400">Twitter / X</span>
                </div>
                <button 
                  onClick={() => handleCopy('twitter', launchData.social_posts.twitter)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied === 'twitter' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{launchData.social_posts.twitter}</p>
            </div>

            {/* Instagram */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Instagram size={16} className="text-pink-400" />
                  <span className="text-xs font-medium text-zinc-400">Instagram</span>
                </div>
                <button 
                  onClick={() => handleCopy('instagram', launchData.social_posts.instagram)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied === 'instagram' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{launchData.social_posts.instagram}</p>
            </div>

            {/* LinkedIn */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Linkedin size={16} className="text-blue-500" />
                  <span className="text-xs font-medium text-zinc-400">LinkedIn</span>
                </div>
                <button 
                  onClick={() => handleCopy('linkedin', launchData.social_posts.linkedin)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {copied === 'linkedin' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{launchData.social_posts.linkedin}</p>
            </div>

            {/* TikTok */}
            {launchData.social_posts.tiktok && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music2 size={16} className="text-cyan-400" />
                    <span className="text-xs font-medium text-zinc-400">TikTok</span>
                  </div>
                  <button 
                    onClick={() => handleCopy('tiktok', launchData.social_posts.tiktok!)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    {copied === 'tiktok' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{launchData.social_posts.tiktok}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Links */}
      <div className="mt-10 flex items-center gap-4 text-zinc-500 shrink-0">
         <span className="text-xs font-medium uppercase tracking-widest">Direct Share</span>
         <div className="h-px w-8 bg-zinc-800"></div>
         <button className="hover:text-red-500 transition-colors"><Youtube size={20} /></button>
         <button className="hover:text-blue-400 transition-colors"><Twitter size={20} /></button>
         <button className="hover:text-pink-500 transition-colors"><Instagram size={20} /></button>
      </div>

    </div>
  );
}

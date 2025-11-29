import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, CheckCircle, Download, Send, Bot, User, Loader2, Sparkles, Film, Music, Rocket } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'video_render';
  videoUrl?: string;
  timestamp: string;
}

interface Step5Props {
  onNext: () => void;
}

export default function Step5_Editor({ onNext }: Step5Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "I've assembled the first cut based on your storyboard. The pacing is set to 'Viral/Fast'. How does it look?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setChatInput("");

    // Simulate AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Understood. I'm regenerating the transition between scene 2 and 3 to be smoother.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const handleRender = () => {
    setIsRendering(true);
    
    // Simulate Render Process
    setTimeout(() => {
      setIsRendering(false);
      const renderMsg: Message = {
        id: Date.now(),
        role: 'assistant',
        content: "Render complete! I've analyzed the output: brightness levels are consistent, and audio levels are normalized. Ready for review.",
        type: 'video_render',
        videoUrl: "https://placehold.co/600x340/000000/FFF?text=Final+Render+v2",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, renderMsg]);
    }, 2500);
  };

  return (
    <div className="w-full h-full flex gap-6 max-h-[calc(100vh-140px)]">
      
      {/* LEFT: Canvas / Preview */}
      <div className="flex-[2] flex flex-col min-w-0 gap-4">
         {/* Main Player */}
         <div className="flex-1 bg-black rounded-2xl border border-zinc-800 overflow-hidden relative flex flex-col shadow-2xl">
             <div className="flex-1 relative group">
                 <img 
                    src="https://placehold.co/1920x1080/18181b/FFF?text=Main+Preview" 
                    className="w-full h-full object-contain opacity-80" 
                    alt="Preview" 
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     {!isPlaying && <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"><Play fill="white" className="text-white ml-1" /></div>}
                 </div>
                 
                 {/* Overlay Controls */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                       <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-primary transition-colors">
                          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                       </button>
                       <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-primary"></div>
                       </div>
                       <span className="text-xs font-mono text-zinc-300">00:05 / 00:15</span>
                       <Volume2 size={18} className="text-zinc-400" />
                    </div>
                 </div>
             </div>
         </div>

         {/* Asset Bin (Mini) */}
         <div className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800 p-3 flex gap-3 overflow-x-auto">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="aspect-video h-full bg-zinc-950 rounded-lg border border-zinc-800 relative shrink-0 overflow-hidden group cursor-pointer hover:border-zinc-600 transition-colors">
                  <img src={`https://placehold.co/300x170/000000/FFF?text=Clip+${i}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                  <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white px-1 rounded">0:03</div>
               </div>
             ))}
             <div className="aspect-video h-full bg-zinc-800/50 rounded-lg border border-zinc-700 border-dashed flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 cursor-pointer transition-all shrink-0">
                <Film size={16} className="mb-1" />
                <span className="text-[10px]">Add Clip</span>
             </div>
         </div>
      </div>

      {/* RIGHT: Copilot / Chat */}
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden shadow-xl">
         <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-tr from-primary to-emerald-500 rounded-lg flex items-center justify-center text-black">
                  <Sparkles size={16} fill="currentColor" />
               </div>
               <div>
                  <h3 className="text-sm font-bold text-zinc-100">Editor Copilot</h3>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Online</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={handleRender}
                 disabled={isRendering}
                 className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-md border border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isRendering ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
                 {isRendering ? 'Rendering...' : 'Render Preview'}
               </button>
               <button 
                 onClick={onNext}
                 className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
               >
                 <Rocket size={12} fill="currentColor" />
                 Final Launch
               </button>
            </div>
         </div>

         {/* Messages */}
         <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/30">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-zinc-800 text-primary' : 'bg-zinc-700 text-zinc-300'}`}>
                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                 </div>
                 <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                       msg.role === 'user' 
                         ? 'bg-primary text-black rounded-tr-sm' 
                         : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700'
                    }`}>
                       {msg.content}
                    </div>
                    
                    {/* Rendered Video Attachment */}
                    {msg.type === 'video_render' && msg.videoUrl && (
                       <div className="mt-2 w-full bg-black rounded-xl border border-zinc-700 overflow-hidden relative group">
                          <img src={msg.videoUrl} className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                             </div>
                          </div>
                          <div className="absolute bottom-2 right-2 flex gap-2">
                             <button className="p-1.5 bg-black/60 text-white rounded-md hover:bg-black"><Download size={14} /></button>
                          </div>
                       </div>
                    )}

                    <span className="text-[10px] text-zinc-600 px-1">{msg.timestamp}</span>
                 </div>
              </div>
            ))}
            {isRendering && (
               <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-primary">
                     <Bot size={16} />
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-zinc-700 flex items-center gap-2">
                     <Loader2 size={14} className="animate-spin text-zinc-400" />
                     <span className="text-xs text-zinc-400">Processing render request...</span>
                  </div>
               </div>
            )}
         </div>

         {/* Input */}
         <div className="p-3 bg-zinc-900 border-t border-zinc-800">
            <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-600 transition-colors shadow-inner">
               <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Music size={18} />
               </button>
               <input 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Describe changes or ask for edits..." 
                 className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
               />
               <button 
                 onClick={handleSendMessage}
                 disabled={!chatInput.trim()}
                 className="p-1.5 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
               >
                  <Send size={16} />
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}

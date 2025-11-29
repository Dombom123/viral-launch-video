import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Image as ImageIcon, ArrowRight, Wand2, Film, Loader2, Sparkles } from 'lucide-react';

interface Step3Props {
  onNext: () => void;
  onBack?: () => void;
  projectId: string | null;
}

export default function Step3_Storyboard({ onNext, projectId }: Step3Props) {
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [phase, setPhase] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const startGeneration = async () => {
      try {
        // First check if storyboard exists
        const checkResponse = await fetch(`http://localhost:8000/api/project/${projectId}/storyboard`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.status === "completed" && checkResult.data) {
          // Already completed
          setData(checkResult.data);
          setStatus("completed");
          return;
        }
        
        if (checkResult.status !== "generating") {
          // Start generation
          await fetch(`http://localhost:8000/api/project/${projectId}/storyboard`, {
            method: 'POST'
          });
        }
        
        // Start polling for updates
        pollForUpdates();
        
      } catch (e) {
        console.error("Error starting storyboard generation", e);
        setStatus("error");
      }
    };
    
    const pollForUpdates = () => {
      pollingRef.current = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/project/${projectId}/storyboard`);
          const result = await response.json();
          
          if (result.data) {
            setData(result.data);
            setPhase(result.data.phase || "");
            setStatus(result.data.status || "generating");
            
            // Stop polling when completed
            if (result.data.status === "completed") {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1500); // Poll every 1.5 seconds
    };
    
    startGeneration();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [projectId]);

  const handleRegenerate = async (id: string, type: string) => {
    setRegenerating(id);
    // TODO: Implement single asset regeneration
    setTimeout(() => setRegenerating(null), 1500);
  };

  const isGenerating = status === "generating";
  const hasData = data && (data.characters || data.frames);

  // Loading state - no data yet
  if (!hasData && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium text-zinc-200">Generating Storyboard</h3>
        <p className="text-zinc-500 text-sm">Creating visual structure...</p>
      </div>
    );
  }

  if (!hasData && status === "error") {
    return <div className="text-center text-zinc-500">Failed to load storyboard.</div>;
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium text-zinc-200">Loading...</h3>
      </div>
    );
  }

  // Helper to check if an image is a placeholder or not yet generated
  const isPlaceholder = (src: string | undefined) => {
    if (!src) return true;
    return src === "placeholder" || src.includes("placehold.co");
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6">
      
      {/* Generation Status Banner */}
      {isGenerating && (
        <div className="mb-6 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium text-zinc-200">
              Generating images... {phase === "assets" ? "Creating assets" : phase === "scenes" ? "Creating scenes" : ""}
            </p>
            <p className="text-xs text-zinc-400">Images will appear as they're generated</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Characters & Assets */}
        <div className="lg:col-span-1 space-y-6">
           <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Wand2 size={14} className="text-primary" /> Cast Generation
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(data.characters || []).map((char: any) => (
                  <div key={char.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    {isPlaceholder(char.src) ? (
                      <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                      </div>
                    ) : (
                      <img 
                        src={`http://localhost:8000${char.src}`} 
                        alt={char.label} 
                        className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 animate-in fade-in" 
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                       <span className="text-xs font-medium text-zinc-200 block truncate">{char.label}</span>
                    </div>
                    <button 
                      onClick={() => handleRegenerate(char.id, 'char')}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw size={12} className={regenerating === char.id ? 'animate-spin text-primary' : ''} />
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
                {(data.locations || []).map((loc: any) => (
                  <div key={loc.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    {isPlaceholder(loc.src) ? (
                      <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                      </div>
                    ) : (
                      <img 
                        src={`http://localhost:8000${loc.src}`} 
                        alt={loc.label} 
                        className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 animate-in fade-in" 
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                       <span className="text-xs font-medium text-zinc-200 block truncate">{loc.label}</span>
                    </div>
                    <button 
                       onClick={() => handleRegenerate(loc.id, 'loc')}
                       className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw size={12} className={regenerating === loc.id ? 'animate-spin text-primary' : ''} />
                    </button>
                  </div>
                ))}
              </div>
           </div>
           
           {/* Objects */}
           {data.objects && data.objects.length > 0 && (
             <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <ImageIcon size={14} /> Props & Objects
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {data.objects.map((obj: any) => (
                    <div key={obj.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                      {isPlaceholder(obj.src) ? (
                        <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                        </div>
                      ) : (
                        <img 
                          src={`http://localhost:8000${obj.src}`} 
                          alt={obj.label} 
                          className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 animate-in fade-in" 
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                         <span className="text-xs font-medium text-zinc-200 block truncate">{obj.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>

        {/* Storyboard Grid */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Film size={14} /> Visual Sequence
          </h3>
          <div className="grid grid-cols-2 gap-4">
             {(data.frames || []).map((frame: any) => (
               <div key={frame.id} className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all">
                  <div className="aspect-video relative overflow-hidden">
                     {isPlaceholder(frame.img) ? (
                       <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                         <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                       </div>
                     ) : (
                       <img 
                         src={`http://localhost:8000${frame.img}`} 
                         alt={frame.description} 
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 animate-in fade-in" 
                       />
                     )}
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
          disabled={isGenerating}
          className={`px-8 py-3 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 mx-auto transition-transform ${
            isGenerating 
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-100 hover:bg-white text-zinc-900 hover:-translate-y-0.5'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              Lock Storyboard & Render <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

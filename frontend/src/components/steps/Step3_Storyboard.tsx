import React, { useState, useEffect } from 'react';
import { RefreshCw, Image as ImageIcon, ArrowRight, Wand2, Film, Loader2, AlertCircle, Package } from 'lucide-react';
import { useDebug } from '@/lib/debugContext';

interface Step3Props {
  onNext: () => void;
}

interface StoryboardAsset {
  id: string;
  name: string;
  image_url: string;
  status: string;
}

interface StoryboardFrame {
  frame_id: number;
  scene_id: number;
  description: string;
  image_url: string;
  audio_prompt: string;
}

interface StoryboardData {
  script_id: string;
  assets: {
    characters: StoryboardAsset[];
    objects: StoryboardAsset[];
    environments: StoryboardAsset[];
  };
  storyboard_frames: StoryboardFrame[];
}

interface StatusResponse {
  run_id: string;
  status: string;
  message?: string;
}

const RUN_ID = 'first';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function Step3_Storyboard({ onNext }: Step3Props) {
  const { useCachedRun } = useDebug();
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const loadCachedStoryboard = async () => {
      try {
        const response = await fetch(`/runs/${RUN_ID}/example_3_storyboard.json`);
        if (!response.ok) throw new Error('Failed to load cached storyboard');
        const data = await response.json();
        if (isMounted) {
          setStoryboard(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load cached data');
          setLoading(false);
        }
      }
    };

    const pollStatus = async (): Promise<StatusResponse> => {
      const response = await fetch(`${BACKEND_URL}/runs/${RUN_ID}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    };

    const fetchStoryboard = async (): Promise<StoryboardData> => {
      const response = await fetch(`${BACKEND_URL}/runs/${RUN_ID}/storyboard`);
      if (!response.ok) throw new Error('Failed to fetch storyboard');
      return response.json();
    };

    const generateStoryboard = async () => {
      try {
        setStatusMessage('Starting storyboard generation...');
        
        // Trigger generation
        const generateResponse = await fetch(`${BACKEND_URL}/runs/${RUN_ID}/storyboard`, {
          method: 'POST',
        });
        
        if (!generateResponse.ok) {
          const errorData = await generateResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to generate storyboard');
        }

        // Generation completed successfully
        const data = await generateResponse.json();
        if (isMounted) {
          setStoryboard(data);
          setStatusMessage('Storyboard ready!');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          // Try to fetch existing storyboard as fallback
          try {
            const existingStoryboard = await fetchStoryboard();
            setStoryboard(existingStoryboard);
            setStatusMessage('Loaded existing storyboard');
            setLoading(false);
          } catch {
            setError(err instanceof Error ? err.message : 'Failed to generate storyboard');
            setLoading(false);
          }
        }
      }
    };

    if (useCachedRun) {
      loadCachedStoryboard();
    } else {
      generateStoryboard();
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [useCachedRun]);

  const handleRegenerate = async (assetType: 'character' | 'environment' | 'object', assetId: string) => {
    setRegenerating(assetId);
    // TODO: Implement asset regeneration via backend
    // For now, just simulate with a timeout
    setTimeout(() => setRegenerating(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <h3 className="text-xl font-medium text-zinc-200">Generating Visual Assets</h3>
        <p className="text-zinc-500 mt-2 text-sm">{statusMessage}</p>
        
        <div className="mt-8 w-64 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
          <AlertCircle className="w-12 h-12 text-red-400 relative z-10" />
        </div>
        <h3 className="text-xl font-medium text-zinc-200">Generation Failed</h3>
        <p className="text-zinc-500 mt-2 text-sm max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!storyboard) {
    return null;
  }

  const { assets, storyboard_frames } = storyboard;

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Characters & Environments */}
        <div className="lg:col-span-1 space-y-6">
          {/* Characters */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Wand2 size={14} className="text-primary" /> Cast Generation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {assets.characters.map((char) => (
                <div key={char.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <img 
                    src={char.image_url} 
                    alt={char.name} 
                    className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                    <span className="text-xs font-medium text-zinc-200 block truncate">{char.name}</span>
                  </div>
                  <button 
                    onClick={() => handleRegenerate('character', char.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCw size={12} className={regenerating === char.id ? 'animate-spin text-primary' : ''} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Environments */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <ImageIcon size={14} /> Environments
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {assets.environments.map((env) => (
                <div key={env.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  <img 
                    src={env.image_url} 
                    alt={env.name} 
                    className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                    <span className="text-xs font-medium text-zinc-200 block truncate">{env.name}</span>
                  </div>
                  <button 
                    onClick={() => handleRegenerate('environment', env.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <RefreshCw size={12} className={regenerating === env.id ? 'animate-spin text-primary' : ''} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Objects */}
          {assets.objects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Package size={14} /> Props & Objects
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {assets.objects.map((obj) => (
                  <div key={obj.id} className="group relative bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <img 
                      src={obj.image_url} 
                      alt={obj.name} 
                      className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                      <span className="text-xs font-medium text-zinc-200 block truncate">{obj.name}</span>
                    </div>
                    <button 
                      onClick={() => handleRegenerate('object', obj.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black backdrop-blur-sm rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <RefreshCw size={12} className={regenerating === obj.id ? 'animate-spin text-primary' : ''} />
                    </button>
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
            {storyboard_frames.map((frame) => (
              <div key={frame.frame_id} className="group bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={frame.image_url} 
                    alt={frame.description} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-300 border border-white/10">
                    SCENE {frame.scene_id}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-zinc-400 leading-relaxed">{frame.description}</p>
                  {frame.audio_prompt && (
                    <p className="text-[10px] text-zinc-500 italic border-t border-zinc-800 pt-2">
                      🎙️ "{frame.audio_prompt}"
                    </p>
                  )}
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

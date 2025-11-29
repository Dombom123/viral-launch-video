import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, CheckCircle, AlertCircle, Film, RefreshCw, Play } from 'lucide-react';

interface ClipStatus {
  id: string | number;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}

interface Step4Props {
  onNext: () => void;
  onBack?: () => void;
  projectId: string | null;
}

export default function Step4_VideoGen({ onNext, projectId }: Step4Props) {
  const [overallStatus, setOverallStatus] = useState("idle");
  const [clips, setClips] = useState<ClipStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!projectId || startedRef.current) return;
    startedRef.current = true;
    
    // First get storyboard to know how many clips we're generating
    const initClips = async () => {
      try {
        const sbResponse = await fetch(`http://localhost:8000/api/project/${projectId}/storyboard`);
        const sbData = await sbResponse.json();
        
        if (sbData.data?.frames) {
          const initialClips: ClipStatus[] = sbData.data.frames.map((frame: any, idx: number) => ({
            id: frame.id || idx,
            prompt: frame.visual_prompt || frame.description || `Scene ${idx + 1}`,
            status: 'pending',
            progress: 0,
          }));
          setClips(initialClips);
        }
      } catch (e) {
        console.error("Error loading storyboard", e);
      }
    };
    
    initClips();
    
    // Start generation
    fetch(`http://localhost:8000/api/project/${projectId}/video-gen`, { method: 'POST' })
        .catch(err => console.error("Error starting video gen", err));

    // Poll for status
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/project/${projectId}/video-status`);
        const data = await response.json();
        
        setOverallStatus(data.status || "idle");
        
        if (data.error) {
          setError(data.error);
        }
        
        // Update clip statuses from the response
        if (data.clips_status && Array.isArray(data.clips_status)) {
          setClips(prev => {
            return prev.map(clip => {
              const serverClip = data.clips_status.find((c: any) => c.id === clip.id);
              if (serverClip) {
                return { ...clip, ...serverClip };
              }
              return clip;
            });
          });
        } else if (data.completed_clips !== undefined && data.total_clips) {
          // Fallback: update based on completed count
          setClips(prev => {
            return prev.map((clip, idx) => {
              if (idx < data.completed_clips) {
                return { 
                  ...clip, 
                  status: 'completed', 
                  progress: 100,
                  videoUrl: data.playlist?.[idx] || `/uploads/${projectId}_clip_${clip.id}.mp4`
                };
              } else if (idx === data.completed_clips && data.status === 'processing') {
                return { ...clip, status: 'processing', progress: 50 };
              }
              return clip;
            });
          });
        }

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          
          // Mark remaining clips based on final status
          if (data.status === "completed" && data.playlist) {
            setClips(prev => prev.map((clip, idx) => ({
              ...clip,
              status: 'completed',
              progress: 100,
              videoUrl: data.playlist[idx]
            })));
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleRetryClip = async (clipId: string | number) => {
    if (!projectId) return;
    
    // Update UI to show retrying
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, status: 'processing', progress: 0, error: undefined } : clip
    ));
    
    try {
      await fetch(`http://localhost:8000/api/project/${projectId}/retry-clip/${clipId}`, { 
        method: 'POST' 
      });
    } catch (e) {
      console.error("Error retrying clip", e);
      setClips(prev => prev.map(clip => 
        clip.id === clipId ? { ...clip, status: 'failed', error: 'Retry failed' } : clip
      ));
    }
  };

  const handleRetryAll = async () => {
    if (!projectId) return;
    startedRef.current = false;
    
    // Reset all clips to pending
    setClips(prev => prev.map(clip => ({ ...clip, status: 'pending', progress: 0, error: undefined })));
    setOverallStatus('processing');
    setError(null);
    
    // Restart generation
    fetch(`http://localhost:8000/api/project/${projectId}/video-gen`, { method: 'POST' })
        .catch(err => console.error("Error restarting video gen", err));
  };

  const isComplete = overallStatus === "completed";
  const isFailed = overallStatus === "failed" || clips.some(c => c.status === 'failed');
  const isProcessing = overallStatus === "processing";
  const completedCount = clips.filter(c => c.status === 'completed').length;
  const failedCount = clips.filter(c => c.status === 'failed').length;

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 mb-4">
          <Film size={16} className="text-primary" />
          <span className="text-sm font-medium text-zinc-300">Veo 3.1 Video Generation</span>
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          {isComplete ? "All Clips Generated!" : 
           isFailed ? "Some Clips Failed" : 
           "Generating Video Clips"}
        </h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          {isComplete ? `Successfully generated ${completedCount} video clips.` :
           isFailed ? `${failedCount} clip(s) failed. You can retry them individually.` :
           "Creating cinematic clips from your storyboard in parallel..."}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Overall Progress</span>
          <span className="text-sm font-mono text-zinc-300">{completedCount} / {clips.length} clips</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isFailed ? 'bg-orange-500' : 'bg-primary'}`}
            style={{ width: `${clips.length > 0 ? (completedCount / clips.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {clips.map((clip, idx) => (
          <div 
            key={clip.id}
            className={`relative bg-zinc-900 rounded-xl border overflow-hidden transition-all ${
              clip.status === 'completed' ? 'border-primary/50' :
              clip.status === 'failed' ? 'border-red-500/50' :
              clip.status === 'processing' ? 'border-zinc-700' :
              'border-zinc-800'
            }`}
          >
            {/* Video Preview / Placeholder */}
            <div className="aspect-video bg-zinc-800 relative overflow-hidden">
              {clip.status === 'completed' && clip.videoUrl ? (
                <video 
                  src={`http://localhost:8000${clip.videoUrl}`}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {clip.status === 'processing' ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <span className="text-xs text-zinc-500">Generating...</span>
                    </div>
                  ) : clip.status === 'failed' ? (
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                      <span className="text-xs text-red-400">Failed</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Film className="w-8 h-8 text-zinc-600 mb-2" />
                      <span className="text-xs text-zinc-500">Pending</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Scene Badge */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-zinc-300">
                SCENE {idx + 1}
              </div>
              
              {/* Status Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${
                clip.status === 'completed' ? 'bg-primary/20 text-primary' :
                clip.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                clip.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                'bg-zinc-700/50 text-zinc-400'
              }`}>
                {clip.status === 'completed' && <CheckCircle size={10} className="inline mr-1" />}
                {clip.status.toUpperCase()}
              </div>
            </div>
            
            {/* Clip Info */}
            <div className="p-3">
              <p className="text-xs text-zinc-400 line-clamp-2 mb-2" title={clip.prompt}>
                {clip.prompt.substring(0, 80)}...
              </p>
              
              {/* Progress Bar for Processing */}
              {clip.status === 'processing' && (
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-primary animate-pulse"
                    style={{ width: '60%' }}
                  />
                </div>
              )}
              
              {/* Error Message */}
              {clip.status === 'failed' && clip.error && (
                <p className="text-[10px] text-red-400 mb-2 truncate" title={clip.error}>
                  {clip.error}
                </p>
              )}
              
              {/* Retry Button */}
              {clip.status === 'failed' && (
                <button
                  onClick={() => handleRetryClip(clip.id)}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              )}
              
              {/* Play Button */}
              {clip.status === 'completed' && clip.videoUrl && (
                <button
                  onClick={() => window.open(`http://localhost:8000${clip.videoUrl}`, '_blank')}
                  className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded text-xs text-primary transition-colors"
                >
                  <Play size={12} /> Preview
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        {(isFailed || failedCount > 0) && (
          <button
            onClick={handleRetryAll}
            className="px-6 py-3 rounded-lg font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} /> Retry All Failed
          </button>
        )}
        
        <button
          onClick={onNext}
          disabled={isProcessing && completedCount === 0}
          className={`px-8 py-3 rounded-lg font-medium text-sm shadow-lg flex items-center gap-2 transition-all ${
            isProcessing && completedCount === 0
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : isComplete
                ? 'bg-primary text-black hover:bg-primary/90'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {isProcessing && completedCount === 0 ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating...
            </>
          ) : isComplete ? (
            <>
              Continue to Editor <ArrowRight size={16} />
            </>
          ) : (
            <>
              Continue with {completedCount} clips <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

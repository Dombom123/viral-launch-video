"use client";

import {
  Bot,
  Download,
  Film,
  Loader2,
  Music,
  Pause,
  Play,
  Send,
  Sparkles,
  User,
  Volume2,
} from "lucide-react";
import * as PIXI from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { OverlayGenerator } from "./OverlayGenerator";
import { PixiEditor } from "./PixiEditor";
import sampleInput from "./sample_input.json";
import { useEditorStore } from "./state";
import type { Timeline } from "./types";
import { VideoExporter } from "./VideoExporter";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "video_render";
  videoUrl?: string;
  timestamp: string;
}

export default function Editor(props: { runId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const pixiEditorRef = useRef<PixiEditor | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "I've assembled the first cut based on your storyboard. The pacing is set to 'Viral/Fast'. How does it look?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const {
    timeline,
    setTimeline,
    currentTime,
    isPlaying,
    play,
    pause,
    seek,
    duration,
  } = useEditorStore();

  // Initialize state
  useEffect(() => {
    (async () => {
      const response = await fetch(
        `/runs/${props.runId}/video_generation.json`,
      );
      const data = await response.json();
      console.log("data", data);
      let startTime = 0;
      // Filter out clips without a valid video_url (e.g., pending clips)
      const videos = data.generated_clips
        .filter((clip: any) => clip.video_url)
        .map((clip: any) => {
          const s = startTime;
          startTime += clip.duration;
          // Handle both /public/... paths and direct paths like /sample-inputs/...
          const videoSrc = clip.video_url.includes('/public') 
            ? clip.video_url.split('/public')[1] 
            : clip.video_url;
          return {
            type: "video",
            src: videoSrc,
            duration: clip.duration,
            startTime: s,
          };
        });
      setTimeline({ items: videos });
    })();
  }, [setTimeline, props.runId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Pixi
  useEffect(() => {
    if (!containerRef.current) return;

    const initPixi = async () => {
      // Prevent double init if called rapidly
      if (pixiAppRef.current || !containerRef.current) return;

      const app = new PIXI.Application();
      if (!canvasRef.current) return;
      await app.init({
        width: 1280,
        height: 720,
        backgroundColor: 0x000000,
        preference: "webgl",
        resizeTo: containerRef.current,
        canvas: canvasRef.current,
      });

      pixiAppRef.current = app;

      // Initialize our Editor Controller
      const currentTimeline =
        useEditorStore.getState().timeline ||
        (sampleInput as unknown as Timeline);
      pixiEditorRef.current = new PixiEditor(app, currentTimeline);

      // Main render loop
      app.ticker.add(() => {
        const state = useEditorStore.getState();

        // 1. Update Time State
        if (state.isPlaying) {
          let newTime = state.currentTime + app.ticker.deltaMS / 1000;

          if (pixiEditorRef.current) {
            const videoTime = pixiEditorRef.current.getCurrentTime();
            if (videoTime !== null) {
              newTime = videoTime;
            }
          }

          if (newTime >= state.duration) {
            state.pause();
            state.setTime(state.duration);
          } else {
            state.setTimeSmooth(newTime);
          }
        }

        // 2. Update Visuals via PixiEditor
        if (pixiEditorRef.current) {
          pixiEditorRef.current.update(
            state.currentTime,
            state.isPlaying,
            state.wasSeeked,
          );
        }
      });
    };

    initPixi();

    return () => {
      if (pixiEditorRef.current) {
        pixiEditorRef.current.destroy();
        pixiEditorRef.current = null;
      }

      const app = pixiAppRef.current;
      if (app) {
        app.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, []);

  // Handle timeline updates
  useEffect(() => {
    if (pixiEditorRef.current && timeline) {
      pixiEditorRef.current.updateTimeline(timeline);
    }
  }, [timeline]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatInput("");

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // If no API key, fallback to simulation
    if (!apiKey || !pixiEditorRef.current) {
      setTimeout(() => {
        const aiMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: apiKey
            ? "Editor not ready."
            : "Please set NEXT_PUBLIC_GEMINI_API_KEY to enable AI edits.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 1000);
      return;
    }

    // AI Refinement Flow
    setIsRendering(true);
    const loadingMsgId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      // {
      //   id: loadingMsgId,
      //   role: "assistant",
      //   content: "Processing your request...",
      //   timestamp: new Date().toLocaleTimeString([], {
      //     hour: "2-digit",
      //     minute: "2-digit",
      //   }),
      // },
    ]);

    try {
      const currentOverlays = timeline?.items.filter(
        (i) => i.type === "overlay",
        // biome-ignore lint/suspicious/noExplicitAny: type compatibility
      ) as any[];

      const newOverlays = await OverlayGenerator.generate(
        pixiEditorRef.current,
        apiKey,
        {
          userPrompt: newMessage.content,
          currentOverlays: currentOverlays,
        },
      );

      // Update timeline with new overlays
      const currentItems = timeline?.items || [];
      const videoItems = currentItems.filter((i) => i.type === "video");
      const updatedTimeline = {
        items: [...videoItems, ...newOverlays],
      };

      setTimeline(updatedTimeline);

      // Replace loading message with success
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
              ...msg,
              content: `I've updated the overlays based on your feedback: "${newMessage.content}"`,
            }
            : msg,
        ),
      );
    } catch (error) {
      console.error("AI Edit failed", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
              ...msg,
              content:
                "Sorry, I couldn't apply those changes. Please try again.",
            }
            : msg,
        ),
      );
    } finally {
      setIsRendering(false);
    }
  };

  const handleGenerateOverlays = async () => {
    if (!pixiEditorRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      const msg: Message = {
        id: Date.now(),
        role: "assistant",
        content:
          "Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env file to generate overlays.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, msg]);
      return;
    }

    setIsRendering(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Analyzing audio and generating overlays... This may take a moment.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    try {
      const newOverlays = await OverlayGenerator.generate(
        pixiEditorRef.current,
        apiKey,
      );

      if (newOverlays.length === 0) {
        throw new Error("No overlays were generated.");
      }

      // Merge with existing timeline (keeping videos, removing old overlays if we want to replace, or just appending)
      // For now, let's remove existing overlays to avoid duplicates if run multiple times
      const currentItems = timeline?.items || [];
      const videoItems = currentItems.filter((i) => i.type === "video");
      const updatedTimeline = {
        items: [...videoItems, ...newOverlays],
      };
      console.log("updatedTimeline", updatedTimeline);

      setTimeline(updatedTimeline);

      const msg: Message = {
        id: Date.now(),
        role: "assistant",
        content: `Generated ${newOverlays.length} overlays based on the audio!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, msg]);
    } catch (error) {
      console.error("Overlay generation failed", error);
      const msg: Message = {
        id: Date.now(),
        role: "assistant",
        content: "Failed to generate overlays. Please try again.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, msg]);
    } finally {
      setIsRendering(false);
    }
  };

  const handleRender = async () => {
    if (!pixiEditorRef.current) return;
    setIsRendering(true);

    try {
      // Video Export
      const mp4Buffer = await VideoExporter.export(pixiEditorRef.current, {
        fps: 30,
        duration: duration, // Preview first 5 seconds
        onProgress: (p) => {
          console.log(`Rendering Video: ${(p * 100).toFixed(0)}%`);
        },
      });

      const videoBlob = new Blob([mp4Buffer as unknown as BlobPart], {
        type: "video/mp4",
      });
      const videoUrl = URL.createObjectURL(videoBlob);

      // download the video
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `viral_${Date.now()}.mp4`;
      a.click();
      a.remove();

      setIsRendering(false);
      const renderMsg: Message = {
        id: Date.now(),
        role: "assistant",
        content: "Render complete! Here is a 5-second preview of your video.",
        type: "video_render",
        videoUrl: videoUrl,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, renderMsg]);
    } catch (error) {
      console.error("Render failed", error);
      setIsRendering(false);
      const errorMsg: Message = {
        id: Date.now(),
        role: "assistant",
        content: "Sorry, something went wrong during rendering.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full min-h-[600px] flex gap-6 max-h-[calc(100vh-140px)]">
      {/* LEFT: Canvas / Preview / Timeline */}
      <div className="flex-2 flex flex-col min-w-0 gap-4">
        {/* Main Player */}
        <div className="flex-1 bg-black rounded-2xl border border-zinc-800 overflow-hidden relative flex flex-col shadow-2xl">
          <div className="flex-1 relative group h-full">
            <div ref={containerRef} className="w-full h-full bg-black">
              <canvas ref={canvasRef} className="w-full h-full " />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {!isPlaying && (
                <div onClick={() => play()} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Play fill="white" className="text-white ml-1" />
                </div>
              )}
            </div>

            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => (isPlaying ? pause() : play())}
                  className="text-white hover:text-primary transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </button>
                {/* Seek Bar - Using a button for accessibility or proper range input would be better */}
                <button
                  type="button"
                  className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden relative cursor-pointer appearance-none border-none p-0"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = x / rect.width;
                    seek(pct * duration);
                  }}
                  aria-label="Seek video"
                >
                  <div
                    className="h-full bg-primary absolute top-0 left-0"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </button>
                <span className="text-xs font-mono text-zinc-300 w-24 text-right">
                  {formatTime(currentTime)}
                </span>
                <Volume2 size={18} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Simple Timeline Track */}
        <div className="h-32 bg-zinc-900/50 rounded-xl border border-zinc-800 p-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-full pointer-events-none p-2">
            {/* Timeline Cursor */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />

            {/* Track Item */}
            <div className="relative w-full h-full">
              {timeline?.items.map((item, idx) => {
                const startPct = (item.startTime / duration) * 100;
                const widthPct = (item.duration / duration) * 100;

                return (
                  <div
                    key={`${item.type}-${item.startTime}-${idx}`}
                    className={`absolute h-12 rounded border border-white/10 overflow-hidden text-xs p-2 whitespace-nowrap ${item.type === "video"
                      ? "bg-blue-900/40 top-0"
                      : "bg-purple-900/40 top-14"
                      }`}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    <div className="font-medium text-white/90 mb-1">
                      {item.type === "video" ? "Video Clip" : "Overlay"}
                    </div>
                    <div className="text-[10px] text-white/50 truncate">
                      {item.type === "video"
                        ? item.src.split("/").pop()
                        : "Text Overlay"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Click to seek overlay */}
          <button
            type="button"
            className="absolute inset-0 z-10 w-full h-full cursor-pointer bg-transparent appearance-none border-none p-0 m-0"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const pct = x / rect.width;
              seek(pct * duration);
            }}
            aria-label="Timeline seek"
          />
        </div>
      </div>

      {/* RIGHT: Copilot / Chat */}
      <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden shadow-xl min-w-[350px]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-tr from-primary to-emerald-500 rounded-lg flex items-center justify-center text-black">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Editor Copilot
              </h3>
              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerateOverlays}
              disabled={isRendering}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5 border border-zinc-700"
            >
              <Sparkles
                size={12}
                className={isRendering ? "animate-pulse" : ""}
              />
              Generate Overlays
            </button>
            <button
              type="button"
              onClick={handleRender}
              disabled={isRendering}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isRendering ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Film size={12} />
              )}
              {isRendering ? "Rendering..." : "Download Video"}
            </button>
            {/* <button
              type="button"
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Rocket size={12} fill="currentColor" />
              Final Launch
            </button> */}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/30"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-zinc-800 text-primary" : "bg-zinc-700 text-zinc-300"}`}
              >
                {msg.role === "assistant" ? (
                  <Bot size={16} />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div
                className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-primary text-black rounded-tr-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700"
                    }`}
                >
                  {msg.content}
                </div>

                {/* Rendered Video Attachment */}
                {msg.type === "video_render" && msg.videoUrl && (
                  <div className="mt-2 w-full bg-black rounded-xl border border-zinc-700 overflow-hidden relative group">
                    <video
                      src={msg.videoUrl}
                      width={300}
                      height={170}
                      className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                        <Play
                          size={18}
                          fill="currentColor"
                          className="ml-0.5"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button
                        type="button"
                        className="p-1.5 bg-black/60 text-white rounded-md hover:bg-black"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-zinc-600 px-1">
                  {msg.timestamp}
                </span>
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
                <span className="text-xs text-zinc-400">
                  Processing render request...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800">
          <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-600 transition-colors shadow-inner">
            <button
              type="button"
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Music size={18} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Describe changes or ask for edits..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
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

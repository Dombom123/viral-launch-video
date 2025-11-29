import {
  Bot,
  CheckCircle,
  Download,
  Film,
  Loader2,
  Music,
  Pause,
  Play,
  Rocket,
  Send,
  Sparkles,
  User,
  Volume2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Editor from "../editor/Editor";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "video_render";
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
      role: "assistant",
      content:
        "I've assembled the first cut based on your storyboard. The pacing is set to 'Viral/Fast'. How does it look?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
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
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setChatInput("");

    // Simulate AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Understood. I'm regenerating the transition between scene 2 and 3 to be smoother.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const handleRender = () => {
    setIsRendering(true);

    // Simulate Render Process
    setTimeout(() => {
      setIsRendering(false);
      const renderMsg: Message = {
        id: Date.now(),
        role: "assistant",
        content:
          "Render complete! I've analyzed the output: brightness levels are consistent, and audio levels are normalized. Ready for review.",
        type: "video_render",
        videoUrl:
          "https://placehold.co/600x340/000000/FFF?text=Final+Render+v2",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, renderMsg]);
    }, 2500);
  };

  return (
    <div className="w-full h-full flex gap-6">
      {/* LEFT: Canvas / Preview */}
      <Editor runId={'first'} />
      {/* RIGHT: Copilot / Chat */}
      <div className="hidden flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-emerald-500 rounded-lg flex items-center justify-center text-black">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Editor Copilot
              </h3>
              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>{" "}
                Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRender}
              disabled={isRendering}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-md border border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRendering ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Film size={12} />
              )}
              {isRendering ? "Rendering..." : "Render Preview"}
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

        {/* Input */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800">
          <div className="relative flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-600 transition-colors shadow-inner">
            <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
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

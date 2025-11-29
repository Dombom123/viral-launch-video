"use client";

import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import { PixiEditor } from "./PixiEditor";
import sampleInput from "./sample_input.json";
import { useEditorStore } from "./state";
import type { Timeline } from "./types";

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const pixiEditorRef = useRef<PixiEditor | null>(null);

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
    // Parse the sample input to ensure it matches our schema (optional validation step)
    setTimeline(sampleInput as unknown as Timeline);
  }, [setTimeline]);

  // Initialize Pixi
  useEffect(() => {
    if (!containerRef.current) return;

    const initPixi = async () => {
      // Prevent double init if called rapidly
      if (pixiAppRef.current || !containerRef.current) return;

      const app = new PIXI.Application();
      await app.init({
        width: 1280,
        height: 720,
        backgroundColor: 0x000000,
        preference: "webgl",
        resizeTo: containerRef.current,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      pixiAppRef.current = app;

      // Initialize our Editor Controller
      // We need the timeline to be available, if it's not yet, we might need to wait or default
      const currentTimeline =
        useEditorStore.getState().timeline ||
        (sampleInput as unknown as Timeline);
      pixiEditorRef.current = new PixiEditor(app, currentTimeline);

      // Main render loop
      app.ticker.add(() => {
        const state = useEditorStore.getState();

        // 1. Update Time State
        if (state.isPlaying) {
          console.log("playing", state.currentTime);
          const newTime = state.currentTime + app.ticker.deltaMS / 1000;
          if (newTime >= state.duration) {
            state.pause();
            state.setTime(state.duration);
          } else {
            state.setTimeSmooth(newTime);
          }
        }

        // 2. Update Visuals via PixiEditor
        if (pixiEditorRef.current) {
          pixiEditorRef.current.update(state.currentTime, state.isPlaying, state.wasSeeked);
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
  }, []); // Run once on mount

  // Handle timeline updates
  useEffect(() => {
    if (pixiEditorRef.current && timeline) {
      pixiEditorRef.current.updateTimeline(timeline);
    }
  }, [timeline]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto p-4">
      <div
        ref={containerRef}
        className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-xl"
      />

      {/* Controls */}
      <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg text-white">
        <button
          type="button"
          onClick={() => (isPlaying ? pause() : play())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="font-mono text-xl" style={{ fontFamily: "Roboto" }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Simple Timeline */}
      <div className="relative w-full h-32 bg-slate-900 rounded-lg overflow-hidden mt-4">
        {/* Cursor */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Click to seek */}
        <button
          type="button"
          className="absolute inset-0 z-10 w-full h-full cursor-pointer bg-transparent appearance-none border-none p-0 m-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            seek(pct * duration);
          }}
          aria-label="Timeline seek bar"
        />

        {/* Tracks */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
          {timeline?.items.map((item, idx) => {
            const startPct = (item.startTime / duration) * 100;
            const widthPct = (item.duration / duration) * 100;

            return (
              <div
                key={`${item.type}-${item.startTime}-${idx}`}
                className={`absolute h-8 rounded border border-slate-700 overflow-hidden text-xs p-1 whitespace-nowrap ${item.type === "video"
                  ? "bg-blue-900/50 top-2"
                  : "bg-purple-900/50 top-12"
                  }`}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                }}
              >
                {item.type === "video"
                  ? `Video: ${item.src.split("/").pop()}`
                  : "Overlay"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

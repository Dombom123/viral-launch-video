"use client";

import {
  Activity,
  Bug,
  ChevronRight,
  RefreshCw,
  Rocket,
  Settings,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDebug } from "@/lib/debugContext";
import Step1_Upload from "./steps/Step1_Upload";
import Step2_Research from "./steps/Step2_Research";
import Step3_Storyboard from "./steps/Step3_Storyboard";
import Step4_VideoGen from "./steps/Step4_VideoGen";
import Step5_Editor from "./steps/Step5_Editor";
import Step6_Launch from "./steps/Step6_Launch";

const STEPS = [
  { id: 1, label: "Brief" },
  { id: 2, label: "Research" },
  { id: 3, label: "Storyboard" },
  { id: 4, label: "Preparation" },
  { id: 5, label: "Editing" },
  { id: 6, label: "Launch" },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [runId, setRunId] = useState('');
  useEffect(() => {
    const location = window.location.hash;

    const runIdHash = location.split('#')[1];
    if (runIdHash) {
      setCurrentStep(5);
      setRunId(runIdHash);
    }
  }, []);
  const { debugMode, toggleDebugMode, useCachedRun } = useDebug();

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    if (
      confirm("Are you sure you want to start over? All progress will be lost.")
    ) {
      setCurrentStep(1);
    }
  };

  const handleSettings = () => {
    alert("Settings panel is under construction.");
  };

  const handleJumpToStep = (stepId: number) => {
    if (debugMode) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-200 flex flex-col overflow-hidden font-sans">
      {/* Debug Mode Banner */}
      {debugMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Bug size={16} />
            <span className="font-medium">Debug Mode Active</span>
            <span className="text-amber-500/70">
              — Click any step to jump • Ctrl+Shift+D to toggle
            </span>
          </div>
          <button
            onClick={toggleDebugMode}
            className="text-amber-400 hover:text-amber-300 text-xs font-medium px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          >
            Exit Debug
          </button>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-[#09090b]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 text-zinc-100 font-bold text-lg tracking-tight cursor-pointer"
            onDoubleClick={() => {
              // Secret: double-click logo also toggles debug mode
              toggleDebugMode();
            }}
            title={debugMode ? "Double-click to exit debug mode" : ""}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-black shadow-lg transition-all ${debugMode ? "bg-amber-400 shadow-amber-400/20" : "bg-primary shadow-primary/20"}`}
            >
              <Rocket size={18} fill="currentColor" className="text-black" />
            </div>
            <span>
              ViralLaunch<span className="text-zinc-600">.ai</span>
            </span>
          </div>
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider font-bold rounded-full">
            Prototype
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-zinc-400 font-medium">
          {debugMode && (
            <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <Zap size={12} />
              <span>Cached Run: {useCachedRun ? "ON" : "OFF"}</span>
            </div>
          )}
          <button
            onClick={handleReset}
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Reset Project
          </button>
          <button
            onClick={handleSettings}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            {/* Context Card */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                Project Context
              </h3>
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 transition-colors hover:border-zinc-700">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-700/50 ${debugMode ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-primary"}`}
                  >
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200">
                      {useCachedRun ? "Demo Project" : "New Project"}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      ID: #8X29-A
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Brand Voice</span>
                    <span className="text-zinc-300 font-medium">
                      {useCachedRun ? "Loaded" : "Awaiting Input"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Target</span>
                    <span className="text-zinc-300 font-medium">
                      Viral Growth
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Timeline */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                Workflow
              </h3>
              <div className="relative pl-4 border-l border-zinc-800 space-y-6">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`relative ${debugMode ? "cursor-pointer group" : ""}`}
                    onClick={() => handleJumpToStep(step.id)}
                  >
                    <div
                      className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                           ${currentStep > step.id ||
                          (
                            currentStep === step.id &&
                            step.id === STEPS.length
                          )
                          ? "bg-primary border-primary"
                          : currentStep === step.id
                            ? "bg-primary border-primary shadow-[0_0_10px_rgba(138,206,0,0.4)]"
                            : "bg-zinc-900 border-zinc-700"
                        }
                           ${debugMode ? "group-hover:border-amber-400 group-hover:bg-amber-400/50" : ""}
                        `}
                    ></div>
                    <div
                      className={`text-sm font-medium transition-colors duration-300 flex items-center gap-2
                          ${currentStep === step.id ? "text-white" : "text-zinc-500"}
                          ${debugMode ? "group-hover:text-amber-400" : ""}
                        `}
                    >
                      {step.label}
                      {debugMode && (
                        <ChevronRight
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400"
                        />
                      )}
                    </div>
                    {currentStep === step.id && (
                      <div
                        className={`text-[10px] mt-1 font-medium ${step.id === STEPS.length ? "text-primary" : "text-primary animate-pulse"}`}
                      >
                        {step.id === STEPS.length
                          ? "Complete"
                          : "In Progress..."}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Debug Quick Actions */}
            {debugMode && (
              <div className="animate-in fade-in slide-in-from-bottom duration-300">
                <h3 className="text-xs font-bold text-amber-400/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bug size={12} />
                  Debug Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    → Go to Start
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    → Jump to Editor
                  </button>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    → Jump to Launch
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Area */}
        <main className="flex-1 relative bg-[#09090b] flex flex-col">
          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-10 flex items-center justify-center">
            <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentStep === 1 && <Step1_Upload onNext={handleNext} />}
              {currentStep === 2 && <Step2_Research onNext={handleNext} />}
              {currentStep === 3 && <Step3_Storyboard onNext={handleNext} />}
              {currentStep === 4 && (
                <Step4_VideoGen onNext={() => setCurrentStep(5)} />
              )}
              {currentStep === 5 && <Step5_Editor onNext={handleNext} runId={runId} />}
              {currentStep === 6 && <Step6_Launch />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

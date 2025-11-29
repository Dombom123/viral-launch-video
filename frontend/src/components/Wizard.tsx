import React, { useState } from 'react';
import { Settings, RefreshCw, Rocket, Activity, CheckCircle, Zap } from 'lucide-react';
import Step1_Upload from './steps/Step1_Upload';
import Step2_Research from './steps/Step2_Research';
import Step3_Storyboard from './steps/Step3_Storyboard';
import Step4_VideoGen from './steps/Step4_VideoGen';
import Step5_Editor from './steps/Step5_Editor';

const STEPS = [
  { id: 1, label: "Brief" },
  { id: 2, label: "Research" },
  { id: 3, label: "Storyboard" },
  { id: 4, label: "Render" },
  { id: 5, label: "Launch" },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-200 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-[#09090b]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
               <Rocket size={18} fill="currentColor" className="text-white" />
            </div>
            <span>ViralLaunch<span className="text-zinc-600">.ai</span></span>
          </div>
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider font-bold rounded-full">Beta</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-zinc-400 font-medium">
           <button className="hover:text-white transition-colors flex items-center gap-2">
             <RefreshCw size={16} /> Reset Project
           </button>
           <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors">
             <Settings size={16} />
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
          <div className="p-6 space-y-8">
            
            {/* Context Card */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Project Context</h3>
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 transition-colors hover:border-zinc-700">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-orange-500 border border-zinc-700/50">
                       <Activity size={20} />
                    </div>
                    <div>
                       <div className="text-sm font-bold text-zinc-200">New Project</div>
                       <div className="text-[10px] text-zinc-500 font-mono">ID: #8X29-A</div>
                    </div>
                 </div>
                 <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-zinc-500">Brand Voice</span>
                       <span className="text-zinc-300 font-medium">Awaiting Input</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                       <span className="text-zinc-500">Target</span>
                       <span className="text-zinc-300 font-medium">Viral Growth</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Progress Timeline */}
            <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Workflow</h3>
               <div className="relative pl-4 border-l border-zinc-800 space-y-6">
                  {STEPS.map((step, index) => (
                     <div key={step.id} className="relative">
                        <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                           ${currentStep > step.id ? 'bg-green-500 border-green-500' : 
                             currentStep === step.id ? 'bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-zinc-900 border-zinc-700'}
                        `}></div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${currentStep === step.id ? 'text-white' : 'text-zinc-500'}`}>
                           {step.label}
                        </div>
                        {currentStep === step.id && (
                           <div className="text-[10px] text-orange-500 mt-1 font-medium animate-pulse">In Progress...</div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

          </div>

          {/* Bottom Status */}
          <div className="mt-auto p-6 border-t border-zinc-800 bg-zinc-900/20">
             <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                <Zap size={14} className="text-yellow-500" />
                <span>System Ready</span>
             </div>
             <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-full opacity-20"></div>
             </div>
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
                {currentStep === 4 && <Step4_VideoGen onNext={handleNext} />}
                {currentStep === 5 && <Step5_Editor />}
             </div>
          </div>

        </main>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import Step1_Upload from './steps/Step1_Upload';
import Step2_Research from './steps/Step2_Research';
import Step3_Storyboard from './steps/Step3_Storyboard';
import Step4_VideoGen from './steps/Step4_VideoGen';
import Step5_Editor from './steps/Step5_Editor';

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Research & Script" },
  { id: 3, label: "Storyboard" },
  { id: 4, label: "Generation" },
  { id: 5, label: "Editing" },
];

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
             <span className="text-xl font-bold text-gray-900 tracking-tight">ViralGen<span className="text-blue-600">.ai</span></span>
           </div>

           <div className="flex items-center gap-4">
             {STEPS.map((step, idx) => (
               <div key={step.id} className="flex items-center">
                 <div className={`flex items-center gap-2 
                   ${currentStep === step.id ? 'text-blue-600 font-bold' : 
                     currentStep > step.id ? 'text-green-600 font-medium' : 'text-gray-400'}
                 `}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border 
                     ${currentStep === step.id ? 'border-blue-600 bg-blue-50' : 
                       currentStep > step.id ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'}
                   `}>
                     {currentStep > step.id ? <Check size={14} /> : step.id}
                   </div>
                   <span className="hidden sm:block text-sm">{step.label}</span>
                 </div>
                 {idx < STEPS.length - 1 && (
                   <div className="w-8 h-px bg-gray-300 mx-2 hidden sm:block"></div>
                 )}
               </div>
             ))}
           </div>
           
           <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 1 && <Step1_Upload onNext={handleNext} />}
        {currentStep === 2 && <Step2_Research onNext={handleNext} />}
        {currentStep === 3 && <Step3_Storyboard onNext={handleNext} />}
        {currentStep === 4 && <Step4_VideoGen onNext={handleNext} />}
        {currentStep === 5 && <Step5_Editor />}
      </main>
    </div>
  );
}


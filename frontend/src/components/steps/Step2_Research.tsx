import React, { useState, useEffect } from 'react';
import { Loader2, Check, FileText } from 'lucide-react';
import { researchData } from '@/lib/mockData';

interface Step2Props {
  onNext: () => void;
}

export default function Step2_Research({ onNext }: Step2Props) {
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800">Analyzing Market Data...</h3>
        <p className="text-gray-500 mt-2">Scraping viral trends, competitor ads, and audience insights.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Product Analysis</h3>
          <p className="text-sm text-gray-600"><span className="font-semibold">Product:</span> {researchData.productInfo.name}</p>
          <p className="text-sm text-gray-600 mt-1">{researchData.productInfo.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {researchData.productInfo.competitors.map(c => (
              <span key={c} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{c}</span>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Market Insights</h3>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">Trend: {researchData.marketAnalysis.trend}</p>
            <p className="text-xs text-blue-600 mt-1">{researchData.marketAnalysis.insight}</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Select a Viral Script Concept</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {researchData.scripts.map((script) => (
          <div 
            key={script.id}
            onClick={() => setSelectedScript(script.id)}
            className={`relative cursor-pointer transition-all rounded-xl p-6 border-2 
              ${selectedScript === script.id 
                ? 'border-blue-600 bg-blue-50 shadow-lg scale-105 z-10' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}
            `}
          >
            {selectedScript === script.id && (
              <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full">
                <Check size={16} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <FileText className="text-blue-500" size={20} />
              <h3 className="font-bold text-gray-800">{script.title}</h3>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hook</p>
            <p className="text-sm text-gray-800 italic mb-4">"{script.hook}"</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Concept</p>
            <p className="text-sm text-gray-600 mb-4 line-clamp-4">{script.body}</p>
            <div className="mt-auto bg-gray-100 p-2 rounded text-xs text-center font-medium text-gray-600">
              CTA: {script.callToAction}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={onNext}
          disabled={!selectedScript}
          className={`px-8 py-3 rounded-lg font-bold text-white transition-all
            ${selectedScript 
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg transform hover:-translate-y-1' 
              : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          Generate Storyboard & Assets
        </button>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { RefreshCw, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { storyboardData } from '@/lib/mockData';

interface Step3Props {
  onNext: () => void;
}

export default function Step3_Storyboard({ onNext }: Step3Props) {
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const handleRegenerate = (id: string) => {
    setRegenerating(id);
    setTimeout(() => setRegenerating(null), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Asset Generation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Characters */}
          <div>
            <h3 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <ImageIcon size={18} /> Characters
            </h3>
            <div className="space-y-4">
              {storyboardData.characters.map((char) => (
                <div key={char.id} className="group relative bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <img src={char.src} alt={char.label} className="w-full h-48 object-cover rounded-md" />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{char.label}</span>
                    <button 
                      onClick={() => handleRegenerate(char.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw size={16} className={regenerating === char.id ? 'animate-spin text-blue-500' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <ImageIcon size={18} /> Locations
            </h3>
            <div className="space-y-4">
              {storyboardData.locations.map((loc) => (
                <div key={loc.id} className="group relative bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <img src={loc.src} alt={loc.label} className="w-full h-48 object-cover rounded-md" />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{loc.label}</span>
                    <button 
                       onClick={() => handleRegenerate(loc.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                      <RefreshCw size={16} className={regenerating === loc.id ? 'animate-spin text-blue-500' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Objects */}
          <div>
            <h3 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <ImageIcon size={18} /> Objects
            </h3>
             <div className="space-y-4">
              {storyboardData.objects.map((obj) => (
                <div key={obj.id} className="group relative bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <img src={obj.src} alt={obj.label} className="w-full h-48 object-cover rounded-md" />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{obj.label}</span>
                    <button 
                       onClick={() => handleRegenerate(obj.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                       <RefreshCw size={16} className={regenerating === obj.id ? 'animate-spin text-blue-500' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold mb-6">Storyboard Preview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {storyboardData.frames.map((frame) => (
            <div key={frame.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-md">
              <img src={frame.img} alt={frame.description} className="w-full h-40 object-cover opacity-90" />
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-blue-400">SCENE {frame.id}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{frame.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transform hover:-translate-y-1 transition-all flex items-center gap-2 mx-auto"
        >
          Approve & Generate Video <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}


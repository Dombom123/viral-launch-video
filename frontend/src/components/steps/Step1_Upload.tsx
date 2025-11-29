import React, { useState } from 'react';
import { Upload, FileVideo, CheckCircle } from 'lucide-react';

interface Step1Props {
  onNext: () => void;
}

export default function Step1_Upload({ onNext }: Step1Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-4">Upload Your Walkthrough</h2>
      <p className="text-gray-500 mb-8">Start by uploading a raw video walkthrough of your product.</p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-4 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${file ? 'bg-green-50 border-green-500' : ''}
        `}
      >
        <input 
          type="file" 
          className="hidden" 
          id="file-upload" 
          accept="video/*"
          onChange={handleFileChange}
        />
        
        {file ? (
          <div className="text-green-600">
            <CheckCircle className="w-16 h-16 mb-4 mx-auto" />
            <p className="text-xl font-semibold">{file.name}</p>
            <p className="text-sm mt-2 text-green-500">Upload Complete</p>
          </div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
            <Upload className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-700">Drag & drop or click to upload</p>
            <p className="text-sm text-gray-500 mt-2">MP4, MOV, AVI (Max 500MB)</p>
          </label>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onNext}
          disabled={!file}
          className={`px-8 py-3 rounded-lg font-bold text-white transition-all
            ${file 
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg transform hover:-translate-y-1' 
              : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          Analyze Video & Start Research
        </button>
      </div>
    </div>
  );
}


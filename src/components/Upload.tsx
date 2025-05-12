import React, { useState } from 'react';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => setIsProcessing(false), 2000);
  };

  return (
    <div className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Upload your notes
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Drag and drop your PDF files to get started
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
            } transition-all cursor-pointer`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <p className="mt-4 text-sm font-semibold text-gray-900">Processing your notes...</p>
              </div>
            ) : (
              <>
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs leading-5 text-gray-600 mt-2">PDF up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
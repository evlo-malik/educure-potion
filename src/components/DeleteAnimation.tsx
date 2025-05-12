import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {/* Trash can */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center trash-target">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
      </div>
    </div>
  );
}
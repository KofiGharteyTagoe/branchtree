import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function GraphControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-50 rounded-xl p-1 border border-surface-200/60">
      <button
        onClick={onZoomOut}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs text-gray-500 font-medium w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-surface-200 mx-0.5" />
      <button
        onClick={onReset}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
        title="Reset zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}

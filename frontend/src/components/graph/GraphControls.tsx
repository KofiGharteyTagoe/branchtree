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
    <div className="flex items-center gap-2">
      <button
        onClick={onZoomOut}
        className="btn-secondary px-2 py-1 text-sm"
        title="Zoom out"
      >
        -
      </button>
      <span className="text-xs text-gray-500 w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="btn-secondary px-2 py-1 text-sm"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={onReset}
        className="btn-secondary px-2 py-1 text-sm"
        title="Reset zoom"
      >
        Reset
      </button>
    </div>
  );
}

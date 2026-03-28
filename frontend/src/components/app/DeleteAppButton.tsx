import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useDeleteApp } from '../../hooks/useApps';

interface DeleteAppButtonProps {
  appId: string;
  onDeleted: () => void;
}

export default function DeleteAppButton({ appId, onDeleted }: DeleteAppButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const deleteApp = useDeleteApp();

  const handleDelete = async () => {
    try {
      await deleteApp.mutateAsync(appId);
      onDeleted();
    } catch {
      // Error handled by mutation
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 animate-scale-in">
        <span className="text-xs text-gray-500">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={deleteApp.isPending}
          className="flex items-center gap-1 bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors border border-red-200/50 disabled:opacity-50"
        >
          {deleteApp.isPending ? 'Deleting...' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200"
      title="Delete this app"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

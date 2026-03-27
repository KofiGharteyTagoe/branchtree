import { useState } from 'react';
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
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300">Delete this app?</span>
        <button
          onClick={handleDelete}
          disabled={deleteApp.isPending}
          className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleteApp.isPending ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-gray-400 hover:text-white px-2 py-1 rounded text-xs"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-gray-400 hover:text-red-400 px-2 py-1 rounded text-xs transition-colors"
      title="Delete this app"
    >
      Delete App
    </button>
  );
}

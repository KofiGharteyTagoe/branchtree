import AppSelector from '../app/AppSelector';
import SyncButton from '../app/SyncButton';

interface HeaderProps {
  selectedAppId: string | null;
  onAppChange: (appId: string | null) => void;
}

export default function Header({ selectedAppId, onAppChange }: HeaderProps) {
  return (
    <header className="bg-mendix-dark text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-mendix-blue">Mendix</span> Branch Visualizer
        </h1>
        <div className="w-px h-8 bg-gray-600" />
        <AppSelector selectedAppId={selectedAppId} onAppChange={onAppChange} />
      </div>
      <div className="flex items-center gap-3">
        {selectedAppId && <SyncButton appId={selectedAppId} />}
      </div>
    </header>
  );
}

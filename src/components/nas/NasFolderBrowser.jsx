import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Folder, FolderOpen, File, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

export default function NasFolderBrowser({ nasConfig, onSelectPath, selectedPath }) {
  const [currentPath, setCurrentPath] = useState(nasConfig?.basePath || '/Backoffice');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const loadFolder = async (path) => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('nasListFolder', {
      nasUrl: nasConfig.nasUrl,
      nasUsername: nasConfig.nasUsername,
      nasPassword: nasConfig.nasPassword,
      path,
    });
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setItems(res.data?.items || []);
    }
    setCurrentPath(path);
    setLoading(false);
  };

  useEffect(() => {
    if (nasConfig?.nasUrl) loadFolder(nasConfig.basePath || '/Backoffice');
  }, [nasConfig]);

  const navigateTo = (path) => {
    setHistory(h => [...h, currentPath]);
    loadFolder(path);
  };

  const navigateBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory(h => h.slice(0, -1));
      loadFolder(prev);
    }
  };

  const folders = items.filter(i => i.type === 'folder');
  const files = items.filter(i => i.type === 'file');

  return (
    <div className="bg-secondary/20 border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
        {history.length > 0 && (
          <button onClick={navigateBack} className="p-1 hover:bg-secondary rounded-lg">
            <ChevronRight size={14} className="text-muted-foreground rotate-180" />
          </button>
        )}
        <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{currentPath}</span>
        <button onClick={() => loadFolder(currentPath)} className="p-1 hover:bg-secondary rounded-lg">
          <RefreshCw size={12} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-52 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-xs text-red-400 p-3">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">Ordner ist leer</div>
        ) : (
          <div>
            {folders.map(item => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/40 transition-colors text-left"
              >
                <Folder size={13} className="text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-foreground truncate">{item.name}</span>
                <ChevronRight size={12} className="text-muted-foreground ml-auto flex-shrink-0" />
              </button>
            ))}
            {files.map(item => (
              <button
                key={item.path}
                onClick={() => onSelectPath?.(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/40 transition-colors text-left ${selectedPath === item.path ? 'bg-primary/10' : ''}`}
              >
                <File size={13} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-foreground truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Select current folder */}
      {onSelectPath && (
        <div className="border-t border-border p-2">
          <button
            onClick={() => onSelectPath(currentPath)}
            className={`w-full py-2 text-xs rounded-xl font-medium transition-colors ${
              selectedPath === currentPath
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            {selectedPath === currentPath ? '✓ Dieser Ordner gewählt' : 'Diesen Ordner wählen'}
          </button>
        </div>
      )}
    </div>
  );
}
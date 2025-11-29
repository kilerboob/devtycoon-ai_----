import React, { useEffect, useState } from 'react';

interface UndoSnackbarProps {
    snapshot: { entries: any[]; expiresAt: number };
    onUndo: () => void;
}

const formatSeconds = (msLeft: number) => {
    const s = Math.ceil(msLeft / 1000);
    return s;
};

const UndoSnackbar: React.FC<UndoSnackbarProps> = ({ snapshot, onUndo }) => {
    const [remaining, setRemaining] = useState<number>(Math.max(0, snapshot.expiresAt - Date.now()));

    useEffect(() => {
        setRemaining(Math.max(0, snapshot.expiresAt - Date.now()));
        const t = setInterval(() => {
            const r = Math.max(0, snapshot.expiresAt - Date.now());
            setRemaining(r);
        }, 300);
        return () => clearInterval(t);
    }, [snapshot.expiresAt]);

    return (
        <div className="fixed bottom-6 left-6 z-60 bg-gradient-to-r from-slate-900/90 to-slate-800/90 text-slate-100 px-4 py-3 rounded shadow-lg flex items-center gap-4 border border-slate-700">
            <div className="flex flex-col">
                <div className="font-medium">Удалено {snapshot.entries.length} {snapshot.entries.length === 1 ? 'элемент' : 'элементов'}</div>
                <div className="text-xs text-slate-400">Отмена доступна ещё: {formatSeconds(remaining)} с</div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onUndo} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded">Отменить</button>
            </div>
        </div>
    );
};

export default UndoSnackbar;

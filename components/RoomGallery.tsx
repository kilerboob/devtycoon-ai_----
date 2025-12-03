import React, { useState, useEffect } from 'react';

interface Room {
  id: number;
  owner_id: string;
  name: string;
  theme: string;
  layout: any;
  privacy: string;
  created_at: string;
  updated_at: string;
}

interface RoomGalleryProps {
  onClose: () => void;
  onVisit: (roomId: number) => void;
}

export const RoomGallery: React.FC<RoomGalleryProps> = ({ onClose, onVisit }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/rooms/public?limit=20');
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error('Failed to fetch public rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🌐 Public Rooms Gallery
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white text-xl">
          Loading public rooms...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500 transition-all overflow-hidden group cursor-pointer"
                onClick={() => onVisit(room.id)}
              >
                <div className="h-48 bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
                  <div className="text-6xl opacity-50 group-hover:scale-110 transition-transform">
                    🏠
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                    {room.theme}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{room.name}</h3>
                  <div className="text-xs text-slate-400 mb-2">Owner: {room.owner_id}</div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Updated: {new Date(room.updated_at).toLocaleDateString()}</span>
                    <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-xs font-bold">
                      Visit →
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {rooms.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-12">
                No public rooms available yet. Be the first to create one!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

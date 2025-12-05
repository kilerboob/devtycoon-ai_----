import React, { useState, useEffect } from 'react';

interface RaidLeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  raidsCompleted: number;
  successRate: number;
  totalLoot: number;
  fastestTime: number;
  highestDifficulty: string;
  lastRaidTime: number;
}

type SortBy = 'raidsCompleted' | 'successRate' | 'totalLoot' | 'fastestTime';

export default function RaidLeaderboardApp() {
  const [entries, setEntries] = useState<RaidLeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('totalLoot');
  const [season, setSeason] = useState<string>('current');
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/raids/leaderboard?season=${season}`);
        if (response.ok) {
          const data = await response.json();
          setEntries(data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [season]);

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortBy === 'fastestTime') {
      return (aVal as number) - (bVal as number);
    }
    return (bVal as number) - (aVal as number);
  });

  // Get medal emoji
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400';
      case 'normal':
        return 'text-yellow-400';
      case 'hard':
        return 'text-orange-400';
      case 'legendary':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black text-white overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">🏆 RAID LEADERBOARD</h1>
          <p className="text-slate-300">Top raid players ranked by loot value and performance</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Season Filter */}
          <div className="bg-slate-800 border border-cyan-500 rounded-lg p-4">
            <label className="block text-cyan-400 font-bold mb-2 text-sm">📅 SEASON</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white font-bold"
            >
              <option value="current">Current</option>
              <option value="s1">Season 1</option>
              <option value="s2">Season 2</option>
              <option value="alltime">All Time</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="bg-slate-800 border border-cyan-500 rounded-lg p-4">
            <label className="block text-cyan-400 font-bold mb-2 text-sm">📊 SORT BY</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white font-bold"
            >
              <option value="totalLoot">Total Loot</option>
              <option value="raidsCompleted">Raids Completed</option>
              <option value="successRate">Success Rate</option>
              <option value="fastestTime">Fastest Time</option>
            </select>
          </div>

          {/* Stats Summary */}
          <div className="bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg p-4">
            <div className="text-sm text-cyan-100 mb-1">Total Players</div>
            <div className="text-3xl font-bold">{entries.length}</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-slate-800 border border-cyan-500 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-cyan-400">⏳ Loading leaderboard...</div>
          ) : sortedEntries.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No raid data available yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-cyan-500">
                  <tr className="text-cyan-400 font-bold">
                    <th className="px-4 py-3 text-left">RANK</th>
                    <th className="px-4 py-3 text-left">PLAYER</th>
                    <th className="px-4 py-3 text-center">RAIDS</th>
                    <th className="px-4 py-3 text-center">SUCCESS</th>
                    <th className="px-4 py-3 text-right">TOTAL LOOT</th>
                    <th className="px-4 py-3 text-center">BEST TIME</th>
                    <th className="px-4 py-3 text-center">TOP DIFF</th>
                    <th className="px-4 py-3 text-center">LAST RAID</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry, index) => {
                    const daysAgo = Math.floor((Date.now() - entry.lastRaidTime) / (1000 * 60 * 60 * 24));
                    return (
                      <tr
                        key={entry.playerId}
                        className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                          index < 3 ? 'bg-slate-750/50' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-4 py-3 font-bold text-lg">
                          {getMedalEmoji(index + 1)}
                        </td>

                        {/* Player Name */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{entry.playerName}</div>
                          <div className="text-xs text-slate-500">{entry.playerId}</div>
                        </td>

                        {/* Raids Completed */}
                        <td className="px-4 py-3 text-center text-green-400 font-bold">
                          {entry.raidsCompleted}
                        </td>

                        {/* Success Rate */}
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-700 px-2 py-1 rounded text-blue-400 font-bold">
                            {(entry.successRate * 100).toFixed(0)}%
                          </span>
                        </td>

                        {/* Total Loot */}
                        <td className="px-4 py-3 text-right text-yellow-400 font-bold">
                          ${(entry.totalLoot / 1000).toFixed(1)}k
                        </td>

                        {/* Fastest Time */}
                        <td className="px-4 py-3 text-center text-purple-400">
                          {entry.fastestTime ? `${entry.fastestTime}s` : '-'}
                        </td>

                        {/* Top Difficulty */}
                        <td className={`px-4 py-3 text-center font-bold ${getDifficultyColor(entry.highestDifficulty)}`}>
                          {entry.highestDifficulty.substring(0, 3).toUpperCase()}
                        </td>

                        {/* Last Raid */}
                        <td className="px-4 py-3 text-center text-slate-400 text-xs">
                          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yest' : `${daysAgo}d`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Legend */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">🏆 TOP 3</div>
            <div className="text-cyan-400 font-bold">{Math.min(3, sortedEntries.length)} Players</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">💰 AVG LOOT</div>
            <div className="text-yellow-400 font-bold">
              ${(entries.length > 0 ? entries.reduce((sum, e) => sum + e.totalLoot, 0) / entries.length / 1000 : 0).toFixed(0)}k
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">📈 AVG SUCCESS</div>
            <div className="text-green-400 font-bold">
              {(entries.length > 0 ? entries.reduce((sum, e) => sum + e.successRate, 0) / entries.length * 100 : 0).toFixed(0)}%
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-xs mb-1">⚡ BEST TIME</div>
            <div className="text-purple-400 font-bold">
              {sortedEntries.length > 0 ? Math.min(...sortedEntries.map(e => e.fastestTime || 999)) : 0}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

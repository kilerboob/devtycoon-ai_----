import React from 'react';
import { GameState } from '../types';

interface StatsPanelProps {
  state: GameState;
}

const StatItem: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-white' }) => (
  <div className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
    <span className="text-slate-400 text-sm font-bold uppercase">{label}</span>
    <span className={`text-xl font-mono ${color}`}>{value}</span>
  </div>
);

export const StatsPanel: React.FC<StatsPanelProps> = ({ state }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <StatItem label="Баланс" value={`$${state.money.toLocaleString()}`} color="text-green-400" />
      <StatItem label="Репутация" value={state.reputation} color="text-yellow-400" />
      <StatItem label="Строк Кода (LOC)" value={Math.floor(state.linesOfCode).toLocaleString()} color="text-blue-400" />
      <StatItem label="Баги" value={state.bugs} color="text-red-400" />
      <div className="col-span-2 bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
         <span className="text-slate-400 text-sm font-bold uppercase">Уровень</span>
         <span className="text-lg font-mono text-purple-400">{state.level}</span>
      </div>
       <div className="col-span-2 text-xs text-slate-500 flex justify-between px-1">
          <span>LOC/click: {state.clickPower}</span>
          <span>Auto LOC/s: {state.autoCodePerSecond}</span>
       </div>
    </div>
  );
};
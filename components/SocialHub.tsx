/**
 * SocialHub - P2P Contracts & Guilds
 * LAYER 10-12: Social Features
 */

import React, { useState, useMemo } from 'react';
import { SkillLevel } from '../types';
import { p2pContractService, P2PContract, Guild, ContractType } from '../services/p2pContractService';

// Convert SkillLevel to number
const skillLevelToNumber = (level: SkillLevel): number => {
  const levels: Record<SkillLevel, number> = {
    [SkillLevel.INTERN]: 1,
    [SkillLevel.JUNIOR]: 2,
    [SkillLevel.MIDDLE]: 3,
    [SkillLevel.SENIOR]: 4,
    [SkillLevel.LEAD]: 5,
    [SkillLevel.ARCHITECT]: 6,
    [SkillLevel.CTO]: 7,
  };
  return levels[level] || 1;
};

interface SocialHubProps {
  onClose: () => void;
  playerId: string;
  playerName: string;
  playerLevel: SkillLevel;
  playerReputation: number;
  playerMoney: number;
  currentGuildId?: string;
  onAcceptContract?: (contract: P2PContract) => void;
  onJoinGuild?: (guild: Guild) => void;
  onLeaveGuild?: () => void;
}

type TabType = 'contracts' | 'guilds' | 'my-activity';

export const SocialHub: React.FC<SocialHubProps> = ({
  onClose,
  playerId,
  playerName,
  playerLevel,
  playerReputation,
  playerMoney,
  currentGuildId,
  onAcceptContract,
  onJoinGuild,
  onLeaveGuild,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('contracts');
  const [selectedContract, setSelectedContract] = useState<P2PContract | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [contractFilter, setContractFilter] = useState<ContractType | 'all'>('all');
  const [showCreateContract, setShowCreateContract] = useState(false);

  // Data
  const openContracts = useMemo(() => p2pContractService.getOpenContracts(), []);
  const myContracts = useMemo(() => p2pContractService.getUserContracts(playerId), [playerId]);
  const guilds = useMemo(() => p2pContractService.getGuilds(), []);
  const currentGuild = currentGuildId ? guilds.find(g => g.id === currentGuildId) : null;

  const filteredContracts = contractFilter === 'all' 
    ? openContracts 
    : openContracts.filter(c => c.type === contractFilter);

  const contractTypes = p2pContractService.getAllContractTypes();

  const handleAcceptContract = (contract: P2PContract) => {
    if (onAcceptContract) {
      onAcceptContract(contract);
    }
    setSelectedContract(null);
  };

  const handleJoinGuild = (guild: Guild) => {
    if (onJoinGuild) {
      onJoinGuild(guild);
    }
    setSelectedGuild(null);
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}д ${hours % 24}ч`;
    return `${hours}ч`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white font-sans">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30 bg-black/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌐</span>
          <div>
            <h2 className="text-lg font-bold text-purple-300">Social Hub</h2>
            <p className="text-xs text-slate-400">P2P контракты • Гильдии • Сообщество</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <div className="text-slate-400">Репутация</div>
            <div className="text-yellow-400 font-bold">{playerReputation} ⭐</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-500/20 bg-black/20">
        {[
          { id: 'contracts' as TabType, label: '📝 Контракты', count: openContracts.length },
          { id: 'guilds' as TabType, label: '⚔️ Гильдии', count: guilds.length },
          { id: 'my-activity' as TabType, label: '📊 Моя активность', count: myContracts.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-purple-600 rounded text-[10px]">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <>
            {/* Contract List */}
            <div className="w-1/2 border-r border-purple-500/20 flex flex-col">
              {/* Filter */}
              <div className="p-2 border-b border-purple-500/10 flex gap-2 flex-wrap bg-black/20">
                <button
                  onClick={() => setContractFilter('all')}
                  className={`px-2 py-1 rounded text-[10px] ${contractFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Все
                </button>
                {contractTypes.map(type => {
                  const info = p2pContractService.getContractTypeInfo(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setContractFilter(type)}
                      className={`px-2 py-1 rounded text-[10px] ${contractFilter === type ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {info.icon} {info.name}
                    </button>
                  );
                })}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredContracts.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <div className="text-4xl mb-2">📭</div>
                    <p>Нет открытых контрактов</p>
                  </div>
                ) : (
                  filteredContracts.map(contract => {
                    const typeInfo = p2pContractService.getContractTypeInfo(contract.type);
                    return (
                      <div
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedContract?.id === contract.id
                            ? 'border-purple-500 bg-purple-900/30'
                            : 'border-purple-500/20 hover:border-purple-500/50 bg-black/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{typeInfo.icon}</span>
                            <div>
                              <div className="font-bold text-white text-sm">{contract.title}</div>
                              <div className="text-[10px] text-slate-400">
                                by {contract.creatorName} • {typeInfo.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-sm">
                              ${contract.reward.money}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {contract.requirements.estimatedHours}ч
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create Button */}
              <div className="p-2 border-t border-purple-500/20">
                <button
                  onClick={() => setShowCreateContract(true)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-sm"
                >
                  ➕ Создать контракт
                </button>
              </div>
            </div>

            {/* Contract Details */}
            <div className="w-1/2 p-4 overflow-y-auto">
              {selectedContract ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl">{p2pContractService.getContractTypeInfo(selectedContract.type).icon}</span>
                    <h3 className="text-xl font-bold text-purple-300 mt-2">{selectedContract.title}</h3>
                    <div className="text-sm text-slate-400">{p2pContractService.getContractTypeInfo(selectedContract.type).name}</div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20">
                    <div className="text-xs text-slate-400 mb-1">Описание</div>
                    <p className="text-sm text-white">{selectedContract.description}</p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20">
                    <div className="text-xs text-slate-400 mb-2">Требования</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedContract.requirements.language && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Язык:</span>
                          <span className="text-cyan-400 uppercase">{selectedContract.requirements.language}</span>
                        </div>
                      )}
                      {selectedContract.requirements.minLevel && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Уровень:</span>
                          <span className={skillLevelToNumber(playerLevel) >= selectedContract.requirements.minLevel ? 'text-green-400' : 'text-red-400'}>
                            {selectedContract.requirements.minLevel}+
                          </span>
                        </div>
                      )}
                      {selectedContract.requirements.minReputation && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Репутация:</span>
                          <span className={playerReputation >= selectedContract.requirements.minReputation ? 'text-green-400' : 'text-red-400'}>
                            {selectedContract.requirements.minReputation}+
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Время:</span>
                        <span className="text-blue-400">{selectedContract.requirements.estimatedHours}ч</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-xs text-green-400 mb-2">Награда</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Деньги:</span>
                        <span className="text-green-400 font-bold">${selectedContract.reward.money}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">XP:</span>
                        <span className="text-blue-400">+{selectedContract.reward.xp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Репутация:</span>
                        <span className="text-yellow-400">+{selectedContract.reward.reputation}</span>
                      </div>
                      {selectedContract.reward.shadowCredits && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Shadow:</span>
                          <span className="text-purple-400">+{selectedContract.reward.shadowCredits}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptContract(selectedContract)}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg"
                  >
                    ✅ Принять контракт
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👈</div>
                    <p>Выберите контракт</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Guilds Tab */}
        {activeTab === 'guilds' && (
          <>
            {/* Guild List */}
            <div className="w-1/2 border-r border-purple-500/20 overflow-y-auto p-2 space-y-2">
              {guilds.map(guild => {
                const canJoin = p2pContractService.canJoinGuild(guild, skillLevelToNumber(playerLevel), playerReputation);
                return (
                  <div
                    key={guild.id}
                    onClick={() => setSelectedGuild(guild)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedGuild?.id === guild.id
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-purple-500/20 hover:border-purple-500/50 bg-black/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl">
                          {guild.icon}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span className="text-xs text-purple-400">[{guild.tag}]</span>
                            {guild.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {guild.memberIds.length}/{guild.maxMembers} участников • Lvl {guild.level}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 text-sm">{guild.reputation} ⭐</div>
                        {guild.isRecruiting ? (
                          <span className="text-[10px] text-green-400">Набор открыт</span>
                        ) : (
                          <span className="text-[10px] text-red-400">Закрыто</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guild Details */}
            <div className="w-1/2 p-4 overflow-y-auto">
              {selectedGuild ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl mb-2">
                      {selectedGuild.icon}
                    </div>
                    <div className="text-xs text-purple-400">[{selectedGuild.tag}]</div>
                    <h3 className="text-xl font-bold text-white">{selectedGuild.name}</h3>
                    <div className="text-sm text-slate-400">Level {selectedGuild.level}</div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-sm text-slate-300">{selectedGuild.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">{selectedGuild.memberIds.length}</div>
                      <div className="text-[10px] text-slate-400">Участников</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{selectedGuild.reputation}</div>
                      <div className="text-[10px] text-slate-400">Репутация</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">{selectedGuild.totalContracts}</div>
                      <div className="text-[10px] text-slate-400">Контрактов</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">${selectedGuild.treasury}</div>
                      <div className="text-[10px] text-slate-400">Казна</div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                    <div className="text-xs text-green-400 mb-2">Бонусы гильдии</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">XP множитель:</span>
                        <span className="text-green-400">x{selectedGuild.bonuses.xpMultiplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Репутация:</span>
                        <span className="text-green-400">x{selectedGuild.bonuses.reputationMultiplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Бонус к контрактам:</span>
                        <span className="text-green-400">+${selectedGuild.bonuses.contractBonus}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const check = p2pContractService.canJoinGuild(selectedGuild, skillLevelToNumber(playerLevel), playerReputation);
                    if (currentGuildId === selectedGuild.id) {
                      return (
                        <button
                          onClick={onLeaveGuild}
                          className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
                        >
                          🚪 Покинуть гильдию
                        </button>
                      );
                    }
                    if (currentGuildId) {
                      return (
                        <div className="text-center text-yellow-400 text-sm">
                          Вы уже состоите в гильдии
                        </div>
                      );
                    }
                    return (
                      <>
                        <button
                          onClick={() => check.canJoin && handleJoinGuild(selectedGuild)}
                          disabled={!check.canJoin}
                          className={`w-full py-3 rounded-lg font-bold ${
                            check.canJoin
                              ? 'bg-green-600 hover:bg-green-500'
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {check.canJoin ? '✅ Вступить в гильдию' : '🔒 Недоступно'}
                        </button>
                        {!check.canJoin && (
                          <div className="text-center text-red-400 text-xs">
                            ⚠️ {check.reason}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👈</div>
                    <p>Выберите гильдию</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* My Activity Tab */}
        {activeTab === 'my-activity' && (
          <div className="flex-1 p-4 overflow-y-auto">
            {currentGuild && (
              <div className="mb-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl">
                    {currentGuild.icon}
                  </div>
                  <div>
                    <div className="text-xs text-purple-400">[{currentGuild.tag}]</div>
                    <div className="font-bold text-lg">{currentGuild.name}</div>
                    <div className="text-xs text-slate-400">Level {currentGuild.level} • {currentGuild.memberIds.length} участников</div>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-lg font-bold mb-4">📋 Мои контракты</h3>
            {myContracts.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <div className="text-4xl mb-2">📭</div>
                <p>У вас пока нет контрактов</p>
                <p className="text-xs mt-1">Примите контракт или создайте свой</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myContracts.map(contract => {
                  const typeInfo = p2pContractService.getContractTypeInfo(contract.type);
                  const isCreator = contract.creatorId === playerId;
                  return (
                    <div
                      key={contract.id}
                      className="p-4 bg-black/30 rounded-lg border border-purple-500/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{typeInfo.icon}</span>
                            <span className="font-bold">{contract.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              contract.status === 'completed' ? 'bg-green-600' :
                              contract.status === 'in_progress' ? 'bg-blue-600' :
                              contract.status === 'open' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}>
                              {contract.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {isCreator ? 'Вы создали' : 'Вы выполняете'} • ${contract.reward.money}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialHub;

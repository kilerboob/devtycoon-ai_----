
import React, { useState } from 'react';
import { GameState, Bill, BankTransaction } from '../types';

interface BankAppProps {
    state: GameState;
    onClose: () => void;
    onPayBill: (id: string) => void;
    onTakeLoan: (amount: number) => void;
    onRepayLoan: (amount: number) => void;
}

export const BankApp: React.FC<BankAppProps> = ({ state, onClose, onPayBill, onTakeLoan, onRepayLoan }) => {
    const [tab, setTab] = useState<'overview' | 'bills' | 'loans'>('overview');
    const [loanAmount, setLoanAmount] = useState(1000);

    const totalDebt = state.loanDebt;
    const unpaidBills = state.bills.filter(b => !b.isPaid);
    const unpaidTotal = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-100 rounded-lg shadow-2xl flex overflow-hidden font-sans animate-in zoom-in border border-slate-300">
            {/* Sidebar */}
            <div className="w-60 bg-blue-900 text-white flex flex-col">
                <div className="p-6 border-b border-blue-800">
                    <div className="text-2xl font-bold flex items-center gap-2">
                        <span>🏦</span> NeoBank
                    </div>
                    <div className="text-xs text-blue-200 mt-1">Secure Financial Corp.</div>
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setTab('overview')}
                        className={`w-full text-left px-4 py-3 rounded transition-colors ${tab === 'overview' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800 text-blue-100'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setTab('bills')}
                        className={`w-full text-left px-4 py-3 rounded transition-colors flex justify-between items-center ${tab === 'bills' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800 text-blue-100'}`}
                    >
                        <span>Bills</span>
                        {unpaidBills.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unpaidBills.length}</span>}
                    </button>
                    <button 
                        onClick={() => setTab('loans')}
                        className={`w-full text-left px-4 py-3 rounded transition-colors ${tab === 'loans' ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800 text-blue-100'}`}
                    >
                        Loans & Credit
                    </button>
                </div>

                <div className="p-4 border-t border-blue-800">
                    <div className="text-xs text-blue-300 mb-1">Credit Score</div>
                    <div className="text-xl font-bold text-white flex items-center gap-2">
                        {state.creditScore} 
                        <span className={`text-xs px-2 py-0.5 rounded ${state.creditScore > 700 ? 'bg-green-500' : state.creditScore > 500 ? 'bg-yellow-500 text-black' : 'bg-red-500'}`}>
                            {state.creditScore > 700 ? 'EXCELLENT' : state.creditScore > 500 ? 'FAIR' : 'POOR'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col bg-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>

                {tab === 'overview' && (
                    <div className="p-8 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Financial Overview</h2>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <div className="text-sm text-blue-500 uppercase font-bold mb-1">Total Balance</div>
                                <div className="text-4xl font-bold text-slate-800">${Math.floor(state.money).toLocaleString()}</div>
                            </div>
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <div className="text-sm text-red-500 uppercase font-bold mb-1">Total Debt</div>
                                <div className="text-4xl font-bold text-red-600">${totalDebt.toLocaleString()}</div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-700 mb-4">Recent Transactions</h3>
                        <div className="space-y-3">
                            {state.transactions.slice().reverse().slice(0, 10).map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${t.type === 'income' ? 'bg-green-500' : 'bg-slate-400'}`}>
                                            {t.type === 'income' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{t.category}</div>
                                            <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {state.transactions.length === 0 && <div className="text-slate-400 italic">No transactions yet.</div>}
                        </div>
                    </div>
                )}

                {tab === 'bills' && (
                    <div className="p-8 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Bills & Utilities</h2>
                        <p className="text-slate-500 mb-6">Pay your bills on time to maintain your credit score and avoid service interruption.</p>

                        {unpaidTotal > 0 && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex justify-between items-center animate-pulse">
                                <div className="text-red-600 font-bold flex items-center gap-2">
                                    <span>⚠</span> Outstanding Balance
                                </div>
                                <div className="text-xl font-bold text-red-700">${unpaidTotal.toLocaleString()}</div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {state.bills.filter(b => !b.isPaid).map(bill => (
                                <div key={bill.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-xl">
                                            {bill.type === 'electricity' ? '⚡' : bill.type === 'internet' ? '🌐' : '📄'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{bill.title}</div>
                                            <div className="text-xs text-slate-500">Due Day: {bill.dueDate}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-lg font-bold text-slate-800">${bill.amount}</div>
                                        <button 
                                            onClick={() => onPayBill(bill.id)}
                                            disabled={state.money < bill.amount}
                                            className={`px-4 py-2 rounded text-sm font-bold text-white ${state.money >= bill.amount ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                                        >
                                            Pay Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {state.bills.filter(b => !b.isPaid).length === 0 && (
                                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
                                    You're all caught up! No unpaid bills.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'loans' && (
                    <div className="p-8 overflow-y-auto">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Loans & Credit</h2>
                        
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg mb-8">
                            <div className="flex justify-between mb-4">
                                <div>
                                    <div className="text-sm text-slate-500 uppercase font-bold">Current Debt</div>
                                    <div className="text-3xl font-bold text-slate-800">${totalDebt.toLocaleString()}</div>
                                </div>
                                {totalDebt > 0 && (
                                    <button 
                                        onClick={() => onRepayLoan(totalDebt)}
                                        disabled={state.money < totalDebt}
                                        className={`px-4 py-2 rounded h-10 text-sm font-bold text-white ${state.money >= totalDebt ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-300'}`}
                                    >
                                        Repay Full Amount
                                    </button>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-700 mb-4">Take a Loan</h3>
                        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-600 mb-2">Amount: ${loanAmount.toLocaleString()}</label>
                                <input 
                                    type="range" 
                                    min="500" 
                                    max="50000" 
                                    step="500" 
                                    value={loanAmount}
                                    onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>$500</span>
                                    <span>$50,000</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded mb-6">
                                <div>
                                    <div className="text-sm font-bold text-slate-700">Interest Rate</div>
                                    <div className="text-xs text-slate-500">Fixed daily rate</div>
                                </div>
                                <div className="text-xl font-bold text-red-500">5%</div>
                            </div>

                            <button 
                                onClick={() => onTakeLoan(loanAmount)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg transition-transform hover:scale-[1.01]"
                            >
                                Borrow ${loanAmount.toLocaleString()}
                            </button>
                            <div className="text-center text-xs text-slate-400 mt-2">
                                Warning: Failure to repay may result in asset seizure.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

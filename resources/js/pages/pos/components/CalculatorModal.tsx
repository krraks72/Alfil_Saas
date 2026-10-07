import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface HistoryEntry {
    expression: string;
    result: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CalculatorModal({ isOpen, onClose }: Props) {
    const { t } = useTranslation();
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [resultExpression, setResultExpression] = useState('');
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        try { return JSON.parse(localStorage.getItem('pos_calc_history') || '[]'); } catch { return []; }
    });

    const inputDigit = useCallback((digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(prev => prev === '0' ? digit : prev + digit);
        }
    }, [waitingForOperand]);

    const inputDecimal = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) setDisplay(prev => prev + '.');
    }, [waitingForOperand, display]);

    const inputOperator = useCallback((op: string) => {
        setResultExpression('');
        if (waitingForOperand && expression) {
            // Operator already pressed — just replace the last operator, don't append display again
            setExpression(prev => prev.replace(/[+\-×÷]$/, op));
        } else {
            const current = parseFloat(display);
            const newExpr = expression
                ? `${expression} ${display} ${op}`
                : `${current} ${op}`;
            setExpression(newExpr);
        }
        setWaitingForOperand(true);
    }, [display, expression, waitingForOperand]);

    const calculate = useCallback(() => {
        if (!expression) return;
        try {
            const fullExpr = `${expression} ${display}`;
            const sanitized = fullExpr.replace(/÷/g, '/').replace(/×/g, '*');
            // eslint-disable-next-line no-new-func
            const result = Function(`"use strict"; return (${sanitized})`)();
            const resultStr = parseFloat(result.toFixed(10)).toString();
            const newHistory = [{ expression: fullExpr, result: resultStr }, ...history.slice(0, 19)];
            setHistory(newHistory);
            localStorage.setItem('pos_calc_history', JSON.stringify(newHistory));
            setDisplay(resultStr);
            setResultExpression(`${fullExpr} =`);
            setExpression('');
            setWaitingForOperand(true);
        } catch {
            setDisplay('Error');
            setResultExpression('');
            setExpression('');
            setWaitingForOperand(true);
        }
    }, [display, expression]);

    const clear = useCallback(() => {
        setDisplay('0');
        setExpression('');
        setResultExpression('');
        setWaitingForOperand(false);
    }, []);

    const clearEntry = useCallback(() => {
        setDisplay('0');
        setResultExpression('');
        setWaitingForOperand(false);
    }, []);

    // Keyboard support
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') { e.stopPropagation(); inputDigit(e.key); }
            else if (e.key === '.') { e.stopPropagation(); inputDecimal(); }
            else if (e.key === '+') { e.stopPropagation(); inputOperator('+'); }
            else if (e.key === '-') { e.stopPropagation(); inputOperator('-'); }
            else if (e.key === '*') { e.stopPropagation(); inputOperator('×'); }
            else if (e.key === '/') { e.preventDefault(); e.stopPropagation(); inputOperator('÷'); }
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); e.stopPropagation(); calculate(); }
            else if (e.key === 'Backspace') { e.stopPropagation(); setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0'); }
            else if (e.key === 'Escape') { e.stopPropagation(); clear(); }
        };
        window.addEventListener('keydown', onKey, { capture: true });
        return () => window.removeEventListener('keydown', onKey, { capture: true });
    }, [isOpen, inputDigit, inputDecimal, inputOperator, calculate, clear]);

    const btnBase = 'flex items-center justify-center rounded-lg text-sm font-semibold h-11 cursor-pointer select-none transition-all duration-100 active:scale-95';
    const btnGray = `${btnBase} bg-gray-100 hover:bg-gray-200 text-gray-800`;
    const btnPrimary = `${btnBase} bg-primary text-xl h-25 hover:bg-primary/90 text-white`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xs p-0 overflow-hidden">
                <DialogHeader className="px-5 pt-4 pb-2">
                    <DialogTitle>{t('Calculator')}</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Display */}
                    <div className="rounded-lg border bg-gray-50 px-4 py-3 text-right min-h-[72px] flex flex-col justify-end">
                        <p className="text-[11px] text-gray-400 truncate mb-0.5 min-h-[16px]">
                            {resultExpression || expression || ''}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 truncate">{display}</p>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {/* Row 1 */}
                        <button className={btnGray} onClick={clear}>C</button>
                        <button className={btnGray} onClick={clearEntry}>CE</button>
                        <button className={btnGray} onClick={() => inputOperator('÷')}>÷</button>
                        <button className={btnGray} onClick={() => inputOperator('×')}>×</button>
                        {/* Row 2 */}
                        <button className={btnGray} onClick={() => inputDigit('7')}>7</button>
                        <button className={btnGray} onClick={() => inputDigit('8')}>8</button>
                        <button className={btnGray} onClick={() => inputDigit('9')}>9</button>
                        <button className={btnGray} onClick={() => inputOperator('-')}>−</button>
                        {/* Row 3 */}
                        <button className={btnGray} onClick={() => inputDigit('4')}>4</button>
                        <button className={btnGray} onClick={() => inputDigit('5')}>5</button>
                        <button className={btnGray} onClick={() => inputDigit('6')}>6</button>
                        <button className={btnGray} onClick={() => inputOperator('+')}>+</button>
                        {/* Row 4 */}
                        <button className={btnGray} onClick={() => inputDigit('1')}>1</button>
                        <button className={btnGray} onClick={() => inputDigit('2')}>2</button>
                        <button className={btnGray} onClick={() => inputDigit('3')}>3</button>
                        {/* = spans 2 rows */}
                        <button className={`${btnPrimary} row-span-2`} onClick={calculate}>=</button>
                        {/* Row 5 */}
                        <button className={`${btnGray} col-span-2`} onClick={() => inputDigit('0')}>0</button>
                        <button className={btnGray} onClick={inputDecimal}>.</button>
                    </div>

                    {/* History */}
                    <div className="border-t pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[13px] font-semibold text-gray-400 tracking-wide">{t('History')}</p>
                            {history.length > 0 && (
                                <button
                                    onClick={() => { setHistory([]); localStorage.removeItem('pos_calc_history'); }}
                                    className="text-[13px] text-red-400 hover:text-red-600 font-medium transition-colors cursor-pointer"
                                >
                                    {t('Clear')}
                                </button>
                            )}
                        </div>
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-3">{t('No calculations yet')}</p>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                {history.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setDisplay(h.result); setResultExpression(`${h.expression} =`); setExpression(''); setWaitingForOperand(true); }}
                                        className="flex items-center text-xs px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <span className="text-gray-500 truncate max-w-[140px]">{h.expression} =</span>
                                        <span className="font-semibold text-gray-800 ml-2 shrink-0">{h.result}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMarketStore } from '../../../stores/useMarketStore';

const TICKER_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'AAPL',
  'NVDA',
  'TSLA',
  'MSFT',
  'META',
  'AMZN',
  'XAUUSD',
  'EURUSD',
];

export const DualMarketTicker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const stocks = useMarketStore(state => state.stocks);
  const tickers = useMarketStore(state => state.tickers);

  const tickerItems = useMemo(() => {
    return TICKER_SYMBOLS.map(sym => {
      const t = tickers[sym];
      const s = stocks.find(item => item.symbol.toUpperCase() === sym.toUpperCase());
      const price = t?.price ?? s?.price ?? 0;
      const changePercent = t?.percent ?? s?.percent ?? 0;
      return {
        symbol: sym,
        price,
        changePercent,
      };
    }).filter(item => item.price > 0);
  }, [tickers, stocks]);

  // Repeat items for seamless infinite marquee loop
  const tickerList = useMemo(() => {
    return [...tickerItems, ...tickerItems, ...tickerItems];
  }, [tickerItems]);

  return (
    <section className="relative w-full py-4 bg-[#05080E] border-b border-[#1E293B] overflow-hidden select-none">
      {/* ------------------------------------------------------------- */}
      {/* LAYER 1: Background subtle ticker (Opposite direction, 12% op)*/}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center overflow-hidden opacity-15 pointer-events-none">
        <motion.div
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap gap-12 font-mono text-sm tracking-wider text-slate-500 font-semibold"
        >
          {tickerList.map((item, idx) => (
            <div key={'bg-' + idx} className="flex items-center gap-2">
              <span>{item.symbol}</span>
              <span>${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>{item.changePercent >= 0 ? '+' : ''}{item.changePercent}%</span>
              <span className="text-slate-700 mx-2">/</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LAYER 2: Foreground crisp ticker (Normal direction, pauses)    */}
      {/* ------------------------------------------------------------- */}
      <div
        className="relative z-10 flex items-center overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          animate={{ x: isPaused ? undefined : ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap gap-8 font-mono text-xs cursor-pointer"
        >
          {tickerList.map((item, idx) => {
            const isUp = item.changePercent >= 0;
            return (
              <div
                key={'fg-' + idx}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-[#0A101C]/80 border border-[#1E293B]/80 hover:border-blue-500/50 hover:bg-[#0F1729] transition-colors"
              >
                <span className="font-bold text-slate-200">{item.symbol}</span>
                <span className="text-slate-100 font-medium">
                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

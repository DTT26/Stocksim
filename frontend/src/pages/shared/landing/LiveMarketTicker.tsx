import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MARKET_QUOTES, type MarketQuote } from './mockData';
import { ArrowUpRight, ArrowDownRight, Search, Activity, Globe, DollarSign } from 'lucide-react';

export const LiveMarketTicker: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'EQUITIES' | 'CRYPTO' | 'COMMODITIES' | 'FOREX'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredQuotes = MARKET_QUOTES.filter(q => {
    const matchesCategory = activeCategory === 'ALL' || q.category === activeCategory;
    const matchesSearch =
      q.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatUsd = (val: number, isForex = false) => {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: isForex ? 4 : 2,
      maximumFractionDigits: isForex ? 4 : 2,
    });
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(2)}B USD`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(2)}M USD`;
    return `$${vol.toLocaleString()} USD`;
  };

  return (
    <section className="w-full py-10 bg-[#060911] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>CROSS-ASSET MARKET DEPTH</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">USD QUOTES ONLY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Live Market Ticker & Multi-Asset Liquidity
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time prices from US equity exchanges, global commodities, major FX pairs, and cryptocurrency perpetual futures.
            </p>
          </div>

          {/* Filter Pills and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="bg-[#0A101C] border border-[#212D42] rounded px-2.5 py-1.5 pl-8 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center bg-[#090F1C] border border-[#212D42] rounded p-0.5 text-xs font-mono">
              {(['ALL', 'EQUITIES', 'CRYPTO', 'COMMODITIES', 'FOREX'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'EQUITIES' ? 'US STOCKS' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dense Financial Table */}
        <div className="rounded-lg border border-[#212D42] bg-[#0A0F1A] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0D1525] border-b border-[#212D42] text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">INSTRUMENT</th>
                  <th className="py-2.5 px-3">ASSET CLASS</th>
                  <th className="py-2.5 px-3 text-right">LAST PRICE ($ USD)</th>
                  <th className="py-2.5 px-3 text-right">24H CHANGE ($)</th>
                  <th className="py-2.5 px-3 text-right">24H CHANGE (%)</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">24H HIGH / LOW RANGE</th>
                  <th className="py-2.5 px-3 text-right hidden md:table-cell">24H VOLUME</th>
                  <th className="py-2.5 px-3 text-center">TRADE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182338]">
                {filteredQuotes.map(quote => {
                  const isUp = quote.changePercent >= 0;
                  const isForex = quote.category === 'FOREX';
                  const rangePercent = Math.min(
                    100,
                    Math.max(0, ((quote.price - quote.low24h) / (quote.high24h - quote.low24h || 1)) * 100)
                  );

                  return (
                    <tr
                      key={quote.symbol}
                      className="hover:bg-[#10192A] transition-colors group cursor-pointer"
                    >
                      {/* Instrument Symbol & Full Name */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-[#131D30] border border-[#24334E] flex items-center justify-center font-bold text-[11px] text-slate-200">
                            {quote.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{quote.symbol}</span>
                              {quote.leverageMax && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-[#16243A] text-slate-400 border border-[#243652]">
                                  {quote.leverageMax}x
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans">{quote.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#111B2C] text-slate-300 border border-[#21304A]">
                          {quote.category === 'EQUITIES'
                            ? 'US EQUITY'
                            : quote.category}
                        </span>
                      </td>

                      {/* Last Price */}
                      <td className="py-2.5 px-3 text-right font-bold text-white text-sm">
                        ${formatUsd(quote.price, isForex)}
                      </td>

                      {/* 24h Change USD */}
                      <td
                        className={`py-2.5 px-3 text-right font-semibold ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        ${formatUsd(quote.change, isForex)}
                      </td>

                      {/* 24h Change % */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                            isUp
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {isUp ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isUp ? '+' : ''}
                          {quote.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* 24h Range Bar */}
                      <td className="py-2.5 px-3 text-right hidden sm:table-cell">
                        <div className="w-32 ml-auto">
                          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                            <span>${formatUsd(quote.low24h, isForex)}</span>
                            <span>${formatUsd(quote.high24h, isForex)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#182338] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${rangePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-2.5 px-3 text-right text-slate-300 hidden md:table-cell">
                        {formatVolume(quote.volume24hUsd)}
                      </td>

                      {/* Trade Button */}
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          to={`/trade/${quote.symbol.toLowerCase()}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#131E33] hover:bg-blue-600 text-slate-300 hover:text-white border border-[#243553] text-[11px] font-semibold transition-colors"
                        >
                          <span>TRADE</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Status */}
          <div className="bg-[#0D1525] border-t border-[#212D42] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>MARKET FEED: REAL-TIME TICK-BY-TICK STREAMING</span>
            </div>
            <span>TOTAL SHOWN: {filteredQuotes.length} ASSETS (ALL IN USD)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

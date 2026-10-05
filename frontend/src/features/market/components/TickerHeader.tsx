import { useState, useEffect, useRef } from 'react';
import { Search, BarChart2, Play, Pause, Square, ChevronRight, ChevronDown, CandlestickChart, RefreshCcw, Undo2, Redo2, Scissors } from 'lucide-react';
import { TIMEFRAMES, getPricePrecision, type Stock } from '../data';
import { AssetAvatar, ExchangeBadge } from './AssetAvatar';
import { useI18n } from '../../../contexts/I18nContext';
import { useMarketStore } from '../../../stores/useMarketStore';

const PRIMARY_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', 'D'];
const EXTRA_TIMEFRAMES = ['30m', 'W', 'M'];

interface TickerHeaderProps {
  stock: Stock;
  activeTab: 'chart' | 'coin_info' | 'info';
  onTabChange: (tab: 'chart' | 'coin_info' | 'info') => void;
  activeTimeframe: string;
  onTimeframeChange: (t: string) => void;
  isReplaying: boolean;
  isSelectingReplayStart: boolean;
  replayTime?: number | null;
  totalBars?: number;
  isChallengeActive?: boolean;
  onStartReplay: () => void;
  onCancelReplay: () => void;
  onReplayNext: () => void;
  onStopReplay: () => void;
  onGoToRealtime: () => void;
  onOpenSearch: () => void;
  onOpenIndicator: () => void;
  activeIndicatorCount: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const TickerHeader = ({
  stock, activeTab, onTabChange, activeTimeframe, onTimeframeChange, isReplaying, isSelectingReplayStart, replayTime, totalBars = 1000,
  isChallengeActive = false,
  onStartReplay, onCancelReplay, onReplayNext, onStopReplay, onGoToRealtime, onOpenSearch, onOpenIndicator, activeIndicatorCount,
  canUndo = false, canRedo = false, onUndo, onRedo
}: TickerHeaderProps) => {
  const { t } = useI18n();
  const [autoPlay, setAutoPlay] = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [tfDropdownOpen, setTfDropdownOpen] = useState(false);
  const tfDropdownRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLDivElement>(null);

  const isExtraActive = EXTRA_TIMEFRAMES.includes(activeTimeframe);
  const visibleTimeframes = isExtraActive
    ? [...PRIMARY_TIMEFRAMES, activeTimeframe]
    : PRIMARY_TIMEFRAMES;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tfDropdownRef.current && !tfDropdownRef.current.contains(e.target as Node)) {
        setTfDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isReplaying && replayRef.current) {
      replayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [isReplaying]);

  const getIntervalMs = (speed: number) => {
    switch (speed) {
      case 0.25: return 2400;
      case 0.5: return 1200;
      case 1: return 600;
      case 2: return 300;
      case 3: return 200;
      case 5: return 120;
      case 10: return 60;
      default: return Math.round(600 / speed);
    }
  };

  const startAutoPlay = () => {
    setAutoPlay(true);
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => onReplayNext(), getIntervalMs(replaySpeed));
    setIntervalId(id);
  };

  const stopAutoPlay = () => {
    setAutoPlay(false);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
  };

  const handleSelectSpeed = (speed: number) => {
    setReplaySpeed(speed);
    if (autoPlay) {
      if (intervalId) clearInterval(intervalId);
      const id = setInterval(() => onReplayNext(), getIntervalMs(speed));
      setIntervalId(id);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const handleStopReplay = () => {
    stopAutoPlay();
    onStopReplay();
  };

  const reachedEnd = replayTime ? replayTime >= Date.now() - 60000 : false;

  const formatReplayTime = (timestamp?: number | null) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const ticker = useMarketStore(state => state.tickers[stock.symbol]);
  const currentPrice = stock.price || ticker?.price || 0;
  const precision = getPricePrecision(currentPrice);
  const markPrice = (currentPrice * 1.0002).toFixed(precision);
  const indexPrice = (currentPrice * 1.0001).toFixed(precision);

  const high24h = ticker?.high24h || currentPrice * 1.022;
  const low24h = ticker?.low24h || currentPrice * 0.978;
  const vol24h = ticker?.volume24h
    ? (ticker.volume24h >= 1000 ? ticker.volume24h / 1000 : ticker.volume24h)
    : (currentPrice > 1000 ? 158.49 : 15849.2);
  const volUSDT = ticker?.quoteVolume24h
    ? (ticker.quoteVolume24h >= 1_000_000 ? ticker.quoteVolume24h / 1_000_000 : ticker.quoteVolume24h)
    : (currentPrice > 1000 ? 396.55 : 39.65);

  let displayChange = stock.change;
  let displayPercent = stock.percent;
  let isUp = stock.type === 'up';

  if (ticker) {
    if (ticker.openPrice && ticker.openPrice > 0 && currentPrice > 0) {
      displayChange = currentPrice - ticker.openPrice;
      displayPercent = (displayChange / ticker.openPrice) * 100;
      isUp = displayChange >= 0;
    } else if (ticker.change !== undefined && ticker.percent !== undefined) {
      displayChange = ticker.change;
      displayPercent = ticker.percent;
      isUp = ticker.type === 'up';
    }
  }

  return (
    <div className="flex flex-col bg-white dark:bg-[#131722] border-b border-[#e6e8ea] dark:border-[#2a2e39] text-xs shrink-0 w-full transition-colors">

      {/* ─── Row 1: Ticker Info ─── */}
      <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 overflow-x-auto hide-scrollbar">
        <div
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-4 pr-3 sm:pr-6 border-r border-[#e6e8ea] dark:border-[#2a2e39] shrink-0 cursor-pointer hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50 rounded p-1 -ml-1 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <AssetAvatar stock={stock} size="md" showExchangeBadge={true} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-bold text-[#1e2329] dark:text-[#d1d4dc] group-hover:text-blue-500 dark:group-hover:text-blue-400">{stock.symbol}</span>
                <ExchangeBadge exchange={stock.exchange} size="sm" />
              </div>
              <span className="text-[#787b86] text-[10px] sm:text-[11px] truncate max-w-[80px] sm:max-w-none">
                {stock.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end pl-2 sm:pl-4">
            <span className={`text-base sm:text-lg font-bold font-mono leading-tight ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {currentPrice.toLocaleString('vi-VN', { minimumFractionDigits: Math.min(2, precision), maximumFractionDigits: precision })}
            </span>
            <span className={`font-mono text-[10px] sm:text-[11px] ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {displayChange > 0 ? '+' : ''}{displayChange.toFixed(precision)} ({displayPercent > 0 ? '+' : ''}{displayPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 xl:gap-6 pl-3 xl:pl-6 shrink-0 whitespace-nowrap">
          {stock.market === 'Tiền điện tử (Crypto)' && (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.markPrice', 'Giá đánh dấu')}</span>
                <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{markPrice}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.indexPrice', 'Giá chỉ số')}</span>
                <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{indexPrice}</span>
              </div>
              {stock.isFutures && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.funding', 'Tài trợ (8h)')}</span>
                  <span className="text-[#f6a111] font-mono font-semibold text-xs sm:text-sm">0.0100%</span>
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.24hHigh', 'Cao nhất 24 giờ')}</span>
            <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{high24h.toLocaleString('vi-VN', { minimumFractionDigits: Math.min(2, precision), maximumFractionDigits: precision })}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.24hLow', 'Thấp nhất 24 giờ')}</span>
            <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{low24h.toLocaleString('vi-VN', { minimumFractionDigits: Math.min(2, precision), maximumFractionDigits: precision })}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.24hVol', 'KL 24h')} ({stock.symbol.replace('USDT', '').replace('.P', '')})</span>
            <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{vol24h.toFixed(2)}K</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#787b86] text-[10px] sm:text-xs">{t('header.24hVol', 'KL 24h')} (USDT)</span>
            <span className="text-[#1e2329] dark:text-[#d1d4dc] font-mono font-semibold text-xs sm:text-sm">{volUSDT.toFixed(2)}M</span>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Tabs & Tools ─── */}
      <div className="flex items-center px-2 sm:px-3 justify-between border-t border-b border-[#e6e8ea] dark:border-[#2a2e39] bg-[#f8f9fa] dark:bg-[#1e222d] overflow-x-auto no-scrollbar gap-2 sm:gap-3">

        {/* Left Side: Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-[13px] font-medium text-[#787b86] pt-1.5 shrink-0 whitespace-nowrap">
          <button
            onClick={() => onTabChange('chart')}
            className={`pb-1.5 border-b-2 ${activeTab === 'chart' ? 'text-[#1e2329] dark:text-[#d1d4dc] border-blue-500 font-semibold' : 'border-transparent hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
          >
            {t('tab.chart', 'Biểu đồ')}
          </button>
          <button
            onClick={() => onTabChange('coin_info')}
            className={`pb-1.5 border-b-2 ${activeTab === 'coin_info' ? 'text-[#1e2329] dark:text-[#d1d4dc] border-blue-500 font-semibold' : 'border-transparent hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
          >
            {stock.market === 'Tiền điện tử (Crypto)'
              ? t('tab.coinInfo', 'Thông Tin Coin')
              : stock.market === 'Cổ phiếu'
                ? t('tab.stockInfo', 'Thông Tin Cổ phiếu')
                : stock.market === 'Hàng hóa'
                  ? t('tab.commodityInfo', 'Thông Tin Hàng Hóa')
                  : stock.market === 'Ngoại hối (Forex)'
                    ? t('tab.forexInfo', 'Thông Tin Ngoại Hối')
                    : stock.market === 'Chỉ số'
                      ? t('tab.indexInfo', 'Thông Tin Chỉ Số')
                      : t('tab.assetInfo', 'Thông Tin Cơ Bản')}
          </button>
          <button
            onClick={() => onTabChange('info')}
            className={`pb-1.5 border-b-2 ${activeTab === 'info' ? 'text-[#1e2329] dark:text-[#d1d4dc] border-blue-500 font-semibold' : 'border-transparent hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
          >
            {t('tab.info', 'Thông tin')}
          </button>
        </div>

        {/* Right Side: Tools */}
        <div className="flex items-center gap-1 sm:gap-2 text-[#787b86] text-xs py-1 shrink-0 whitespace-nowrap">
          {/* Timeframes */}
          <div className="flex items-center gap-0.5">
            {visibleTimeframes.map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-1.5 py-0.5 rounded text-xs transition-colors whitespace-nowrap ${activeTimeframe === tf ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20' : 'hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39]'
                  }`}
              >
                {tf}
              </button>
            ))}
            {/* Dropdown for other timeframes */}
            <div ref={tfDropdownRef} className="relative">
              <button
                onClick={() => setTfDropdownOpen(v => !v)}
                title="Khung thời gian khác"
                className="p-1 rounded text-xs hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] text-[#787b86] flex items-center transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              {tfDropdownOpen && (
                <div
                  className="absolute top-full right-0 sm:left-0 mt-1 z-50 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded shadow-lg py-1 flex flex-col min-w-[70px]"
                >
                  {EXTRA_TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => {
                        onTimeframeChange(tf);
                        setTfDropdownOpen(false);
                      }}
                      className={`px-3 py-1 text-left text-xs hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors ${activeTimeframe === tf ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/10' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-0.5" />

          {/* Replay Controller (Prominently placed, never covered) */}
          {isSelectingReplayStart ? (
            <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700/60 rounded px-2 py-0.5 shrink-0">
              <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                Nhấp nến để chọn điểm bắt đầu
              </span>
              <button
                onClick={onCancelReplay}
                className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : isChallengeActive ? (
            <button
              disabled
              title="Bài thi cấp vốn yêu cầu 100% dữ liệu thời gian thực (Real-time) để đảm bảo tính minh bạch, không được dùng Replay."
              className="flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 opacity-40 cursor-not-allowed border border-dashed border-slate-600/40"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Replay (Khóa khi thi)</span>
            </button>
          ) : !isReplaying ? (
            <button
              onClick={onStartReplay}
              className="flex items-center gap-1 hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] px-2 py-0.5 rounded transition-colors text-orange-600 dark:text-orange-400 font-medium"
              title="Chế độ phát lại nến (Replay)"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
          ) : (
            <div
              ref={replayRef}
              className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700/60 rounded px-1.5 py-0.5 shrink-0 shadow-sm"
            >
              <span className="text-orange-700 dark:text-orange-300 text-xs font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                <span className="hidden md:inline">{reachedEnd ? '✅ Đến hiện tại' : 'Replay'}</span>
                {replayTime && (
                  <span className="font-mono text-[10px] sm:text-[11px] bg-orange-200 dark:bg-orange-800/70 text-orange-900 dark:text-orange-200 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                    {formatReplayTime(replayTime)}
                  </span>
                )}
              </span>
              {!reachedEnd && !autoPlay && (
                <button
                  onClick={onReplayNext}
                  title="Nến tiếp theo (Bước tiếp)"
                  className="p-1 text-orange-600 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700/40 rounded transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {!reachedEnd && (
                <button 
                  onClick={onStartReplay} 
                  title="Chuyển đến... (Chọn lại điểm bắt đầu)" 
                  className="p-1 text-orange-600 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700/40 rounded transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
              )}
              {!reachedEnd && (
                <button
                  onClick={autoPlay ? stopAutoPlay : startAutoPlay}
                  title={autoPlay ? "Tạm dừng" : "Phát tự động"}
                  className="p-1 text-orange-600 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700/40 rounded transition-colors"
                >
                  {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Tốc độ Replay */}
              {!reachedEnd && (
                <div className="relative inline-flex items-center">
                  <select
                    value={replaySpeed}
                    onChange={(e) => handleSelectSpeed(parseFloat(e.target.value))}
                    title="Chọn tốc độ phát nến"
                    className="appearance-none cursor-pointer pl-1.5 pr-3.5 py-0.5 text-[11px] font-mono font-bold rounded text-orange-800 dark:text-orange-200 bg-orange-200/80 dark:bg-orange-800/70 hover:bg-orange-300 dark:hover:bg-orange-700 transition-colors border border-orange-300 dark:border-orange-600/50 outline-none select-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value={0.25} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">0.25x</option>
                    <option value={0.5} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">0.5x</option>
                    <option value={1} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">1x</option>
                    <option value={2} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">2x</option>
                    <option value={3} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">3x</option>
                    <option value={5} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">5x</option>
                    <option value={10} className="bg-white dark:bg-[#1e222d] text-slate-800 dark:text-slate-200 font-sans">10x</option>
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 opacity-70 text-orange-800 dark:text-orange-200 pointer-events-none absolute right-0.5" />
                </div>
              )}

              <button
                onClick={handleStopReplay}
                title="Thoát chế độ Replay"
                className="p-1 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors ml-0.5"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="w-px h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-0.5" />

          {/* Chart Types & Indicators */}
          <button className="hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] p-1 rounded transition-colors text-blue-600 dark:text-blue-500" title="Biểu đồ nến">
            <CandlestickChart className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenIndicator}
            className="flex items-center gap-1 hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] px-1.5 py-1 rounded transition-colors relative"
            title="Chỉ báo"
          >
            <BarChart2 className="w-4 h-4" />
            {activeIndicatorCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                {activeIndicatorCount}
              </span>
            )}
          </button>

          <div className="w-px h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-0.5 hidden sm:block" />

          {/* Undo & Redo (Quay lại & Làm lại) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Hoàn tác (Ctrl+Z)"
              className="p-1 rounded transition-colors text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Làm lại (Ctrl+Y)"
              className="p-1 rounded transition-colors text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-0.5 hidden sm:block" />

          <button
            onClick={onGoToRealtime}
            title="Đến biểu đồ thời gian thực"
            className="hover:bg-[#e6e8ea] dark:hover:bg-[#2a2e39] p-1 rounded transition-colors hidden sm:block"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

import { useState } from 'react';
import { useSimulatorStore } from '../engine/useSimulatorStore';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getContractMultiplier, getAssetUnit } from '../data';
import { TradeReviewModal } from '../../ai/TradeReviewModal';

interface PositionsManagerProps {
  currentPrice: number;
}

export const PositionsManager = ({ currentPrice }: PositionsManagerProps) => {
  const store = useSimulatorStore();
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [isExpanded, setIsExpanded] = useState(true);
  const [reviewTradeData, setReviewTradeData] = useState<any | null>(null);

  if (!store.isActive || !store.session) return null;

  const { positions, orders, history } = store;

  const tabs = [
    { id: 'positions', label: `Vị thế (${positions.length})` },
    { id: 'orders', label: `Lệnh chờ (${orders.length})` },
    { id: 'history', label: `Lịch sử giao dịch (${history.length})` }
  ];

  const calculatePositionPnL = (p: any) => {
    const markPrice = store.currentPrice > 0 ? store.currentPrice : currentPrice;
    const currentExecPrice = p.side === 'LONG' 
      ? (store.currentBid > 0 ? store.currentBid : markPrice) 
      : (store.currentAsk > 0 ? store.currentAsk : (markPrice + (store.session?.config.spread || 0.2)));
    const actualQty = p.lot * getContractMultiplier(p.symbol);
    const rawPnL = p.side === 'LONG' 
      ? (currentExecPrice - p.entryPrice) * actualQty
      : (p.entryPrice - currentExecPrice) * actualQty;
    const netPnl = rawPnL - (p.commission || 0) + (p.accumulatedSwap || 0);
    const roe = p.margin > 0 ? (netPnl / p.margin) * 100 : 0;
    return { netPnl, roe, markPrice, actualQty };
  };

  return (
    <div data-tour="positions-manager" className={`border-t border-[#e6e8ea] dark:border-[#2a2e39] bg-white dark:bg-[#0b0e11] flex flex-col shrink-0 overflow-hidden text-xs text-[#787b86] transition-all duration-300 ${isExpanded ? 'h-64' : 'h-10'}`}>
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-[#e6e8ea] dark:border-[#2a2e39] px-2 h-10 shrink-0 bg-[#f8f9fa] dark:bg-[#131722] gap-2">
        <div className="flex items-center gap-3 sm:gap-6 h-full overflow-x-auto no-scrollbar shrink-0 min-w-0 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab === tab.id) {
                  setIsExpanded(!isExpanded);
                } else {
                  setActiveTab(tab.id as any);
                  setIsExpanded(true);
                }
              }}
              className={`h-full relative font-medium transition-colors px-1 whitespace-nowrap shrink-0 ${
                activeTab === tab.id && isExpanded
                  ? 'text-[#1e2329] dark:text-white font-semibold' 
                  : 'hover:text-[#1e2329] dark:hover:text-white text-[#787b86]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#089981]" />
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:text-[#1e2329] dark:hover:text-white transition-colors border-l border-[#e6e8ea] dark:border-[#2a2e39] pl-2 sm:pl-4 py-1"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {activeTab === 'positions' && (
          positions.length > 0 ? (
            <table data-tour="positions-table" className="w-full min-w-[760px] text-left text-xs text-[#1e2329] dark:text-[#d1d4dc]">
              <thead className="sticky top-0 bg-[#f8f9fa] dark:bg-[#0b0e11] text-[#787b86] font-normal text-[11px] border-b border-[#e6e8ea] dark:border-transparent z-10">
                <tr>
                  <th data-tour="pos-header-symbol" className="px-4 py-2">Symbol</th>
                  <th data-tour="pos-header-size" className="px-4 py-2">Size</th>
                  <th data-tour="pos-header-entry" className="px-4 py-2">Entry Price</th>
                  <th data-tour="pos-header-mark" className="px-4 py-2">Mark Price</th>
                  <th data-tour="pos-header-margin" className="px-4 py-2">Margin</th>
                  <th data-tour="pos-header-side" className="px-4 py-2">Side</th>
                  <th data-tour="pos-header-pnl" className="px-4 py-2 text-right">PNL (ROE%)</th>
                  <th data-tour="pos-header-tpsl" className="px-4 py-2 text-center">TP / SL</th>
                  <th className="px-4 py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e8ea] dark:divide-[#2a2e39]/50">
                {positions.map((p, idx) => {
                  const pnlInfo = calculatePositionPnL(p);
                  const pnlColor = pnlInfo.netPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]';
                  const isFirst = idx === 0;
                  return (
                    <tr key={p.id} data-tour={isFirst ? "position-row" : undefined} className="hover:bg-[#f5f5f5] dark:hover:bg-[#1e222d] transition-colors">
                      <td data-tour={isFirst ? "pos-symbol" : undefined} className="px-4 py-2 font-bold">{p.symbol}</td>
                      <td data-tour={isFirst ? "pos-size" : undefined} className="px-4 py-2 font-mono">
                        {pnlInfo.actualQty < 1 ? Number(pnlInfo.actualQty.toFixed(6)).toString() : pnlInfo.actualQty.toLocaleString('vi-VN')} {getAssetUnit(p.symbol)}
                        <span className="text-[10px] text-[#787b86] ml-1">({p.lot} Lot)</span>
                      </td>
                      <td data-tour={isFirst ? "pos-entry" : undefined} className="px-4 py-2">{p.entryPrice.toLocaleString('vi-VN')}</td>
                      <td data-tour={isFirst ? "pos-mark" : undefined} className="px-4 py-2">{pnlInfo.markPrice.toLocaleString('vi-VN')}</td>
                      <td data-tour={isFirst ? "pos-margin" : undefined} className="px-4 py-2 font-mono">${p.margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td data-tour={isFirst ? "pos-side" : undefined} className={`px-4 py-2 font-bold ${p.side === 'LONG' ? 'text-[#089981]' : 'text-[#f23645]'}`}>{p.side} x{store.session!.config.leverage}</td>
                      <td data-tour={isFirst ? "pos-pnl" : undefined} className={`px-4 py-2 text-right font-mono font-bold ${pnlColor}`}>
                        {pnlInfo.netPnl >= 0 ? '+' : '-'}${Math.abs(pnlInfo.netPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                        <span className="text-[10px] ml-1">({pnlInfo.netPnl >= 0 ? '+' : ''}{pnlInfo.roe.toFixed(2)}%)</span>
                      </td>
                      <td data-tour={isFirst ? "pos-tpsl" : undefined} className="px-4 py-2 text-center text-[#787b86]">
                        {p.tp ? p.tp.toLocaleString('vi-VN') : '-'} / {p.sl ? p.sl.toLocaleString('vi-VN') : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setReviewTradeData({
                                symbol: p.symbol || 'BTCUSDT',
                                side: p.side === 'LONG' ? 'BUY' : 'SELL',
                                entryPrice: p.entryPrice,
                                currentPrice: pnlInfo.markPrice,
                                stopLoss: p.sl,
                                takeProfit: p.tp,
                                quantity: pnlInfo.actualQty,
                                accountBalance: store.session?.balance || 100000,
                                realPnL: pnlInfo.netPnl,
                                isOpen: true,
                                timeframe: store.session?.timeframe || '15m',
                                strategy: 'Phiên Giao Dịch Giả Lập (Simulation)',
                                setupName: p.sl ? 'Vị thế Giả Lập có SL' : 'Vị thế Giả Lập chưa có SL/TP',
                                reason: 'Giao dịch theo nến Replay / Backtest phiên giả lập'
                              });
                            }}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Đánh giá lệnh bằng AI"
                          >
                            <Sparkles className="w-3 h-3" /> AI
                          </button>
                          <button 
                            data-tour={isFirst ? "close-position-btn" : undefined}
                            onClick={() => store.closePosition(p.id)}
                            className="bg-[#f0f3fa] hover:bg-[#e0e5f2] text-[#4b5563] hover:text-[#1e2329] dark:bg-[#2a2e39] dark:hover:bg-[#363a45] dark:text-[#d1d4dc] dark:hover:text-white px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Đóng lệnh
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState />
          )
        )}

        {activeTab === 'orders' && (
          <table className="w-full min-w-[500px] text-left text-xs text-[#1e2329] dark:text-[#d1d4dc]">
            <thead className="sticky top-0 bg-[#f8f9fa] dark:bg-[#0b0e11] text-[#787b86] font-normal text-[11px] border-b border-[#e6e8ea] dark:border-transparent z-10">
              <tr>
                <th className="px-4 py-2 font-medium">Mã</th>
                <th className="px-4 py-2 font-medium">Loại lệnh</th>
                <th className="px-4 py-2 font-medium">Giá đặt</th>
                <th className="px-4 py-2 font-medium">Khối lượng</th>
                <th className="px-4 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/50">
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#787b86]">Không có lệnh chờ</td></tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#1e222d] transition-colors">
                    <td className="px-4 py-2 font-bold text-white">{order.symbol}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold mr-1 ${order.side === 'LONG' ? 'text-[#089981]' : 'text-[#f23645]'}`}>{order.side}</span>
                      {order.type} {store.session!.config.leverage}x
                    </td>
                    <td className="px-4 py-2 font-mono">{order.limitPrice.toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2 font-mono">
                      {(order.lot * getContractMultiplier(order.symbol)) < 1 ? Number((order.lot * getContractMultiplier(order.symbol)).toFixed(6)).toString() : (order.lot * getContractMultiplier(order.symbol)).toLocaleString('vi-VN')} {getAssetUnit(order.symbol)}
                      <span className="text-[10px] text-[#787b86] ml-1">({order.lot} Lot)</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => store.cancelOrder(order.id)} className="text-[#f23645] hover:text-red-400 font-bold px-3 py-1">Hủy</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'history' && (
          <table className="w-full min-w-[750px] text-left text-xs text-[#1e2329] dark:text-[#d1d4dc]">
            <thead className="sticky top-0 bg-[#f8f9fa] dark:bg-[#0b0e11] text-[#787b86] font-normal text-[11px] border-b border-[#e6e8ea] dark:border-transparent z-10">
              <tr>
                <th className="px-4 py-2 font-medium">Thời gian mở</th>
                <th className="px-4 py-2 font-medium">Thời gian đóng</th>
                <th className="px-4 py-2 font-medium">Loại</th>
                <th className="px-4 py-2 font-medium">Giá mở/đóng</th>
                <th className="px-4 py-2 font-medium text-right">Lợi nhuận</th>
                <th className="px-4 py-2 font-medium">Lý do đóng</th>
                <th className="px-4 py-2 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e8ea] dark:divide-[#2a2e39]/50">
              {history.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#787b86]">Chưa có lịch sử giao dịch</td></tr>
              ) : (
                history.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[#f5f5f5] dark:hover:bg-[#1e222d] transition-colors">
                    <td className="px-4 py-2 text-[#787b86]">{new Date(tx.openTime).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2 text-[#787b86]">{new Date(tx.closeTime).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.side === 'LONG' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'}`}>
                        {tx.side}
                      </span> {tx.symbol}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {tx.entryPrice.toLocaleString('vi-VN')} / {tx.exitPrice.toLocaleString('vi-VN')}
                    </td>
                    <td className={`px-4 py-2 text-right font-mono font-bold ${tx.netPnL >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                      {tx.netPnL >= 0 ? '+' : '-'}${Math.abs(tx.netPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-[#787b86]">{tx.closeReason}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          const mult = getContractMultiplier(tx.symbol);
                          const qty = tx.lot * mult;
                          setReviewTradeData({
                            symbol: tx.symbol || 'BTCUSDT',
                            side: tx.side === 'LONG' ? 'BUY' : 'SELL',
                            entryPrice: tx.entryPrice,
                            exitPrice: tx.exitPrice,
                            quantity: qty,
                            accountBalance: store.session?.balance || 100000,
                            realPnL: tx.netPnL,
                            isOpen: false,
                            timeframe: store.session?.timeframe || '15m',
                            strategy: 'Phiên Giao Dịch Giả Lập (Simulation)',
                            setupName: 'Lệnh Đã Đóng trong Phiên',
                            reason: tx.closeReason || 'Giao dịch trong phiên backtest / replay giả lập',
                            entryTime: tx.openTime ? new Date(tx.openTime).toLocaleString('vi-VN') : undefined,
                            exitTime: tx.closeTime ? new Date(tx.closeTime).toLocaleString('vi-VN') : undefined,
                            duration: (tx.openTime && tx.closeTime) ? `${Math.max(1, Math.round((new Date(tx.closeTime).getTime() - new Date(tx.openTime).getTime()) / 60000))} phút` : undefined
                          });
                        }}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Đánh giá lệnh bằng AI"
                      >
                        <Sparkles className="w-2.5 h-2.5" /> AI Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {reviewTradeData && (
        <TradeReviewModal
          isOpen={true}
          onClose={() => setReviewTradeData(null)}
          tradeData={reviewTradeData}
        />
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
    <div className="relative w-24 h-24 mb-4">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
        <path d="M20 50 L50 65 L80 50 L80 80 L50 95 L20 80 Z" className="fill-[#f8f9fa] dark:fill-[#1e222d] stroke-[#e6e8ea] dark:stroke-[#2a2e39]" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M20 50 L50 35 L80 50 L50 65 Z" className="fill-[#f0f3fa] dark:fill-[#2a2e39] stroke-[#e6e8ea] dark:stroke-[#363a45]" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    </div>
    <div className="text-[#1e2329] dark:text-[#d1d4dc] font-semibold text-sm mb-1">Chưa có vị thế giả lập nào mở</div>
    <div className="text-[#787b86] text-[11px] mb-6">Hãy đặt lệnh thông qua bảng điều khiển bên phải</div>
  </div>
);

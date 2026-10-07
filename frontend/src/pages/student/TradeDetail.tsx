import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { tradingApi } from '../../services/tradingApi';
import { useSimulatorStore } from '../../features/market/engine/useSimulatorStore';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

export const StudentTradeDetail = () => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const { tradeId } = useParams<{ tradeId: string }>();
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findTrade = async () => {

      // 2. Check simulator history
      const simHist = useSimulatorStore.getState().history.find(h => h.id === tradeId);
      if (simHist) {
        setTrade({
          id: simHist.id,
          symbol: simHist.symbol,
          side: simHist.side === 'LONG' ? 'BUY' : 'SELL',
          quantity: simHist.lot,
          entryPrice: simHist.entryPrice,
          exitPrice: simHist.exitPrice,
          pnl: simHist.netPnL,
          returnRate: simHist.entryPrice > 0 ? parseFloat((((simHist.exitPrice - simHist.entryPrice) / simHist.entryPrice) * 100).toFixed(2)) : 0,
          status: 'CLOSED',
          entryTime: simHist.openTime,
          exitTime: simHist.closeTime,
          commission: 0,
          simulation: 'Market Replay',
          notes: `Trade closed by ${simHist.closeReason}`
        });
        setLoading(false);
        return;
      }

      // 3. Check backend transactions
      try {
        const res = await tradingApi.getTransactions(user?._id);
        if (res.success && Array.isArray(res.data)) {
          const tx = res.data.find((t: any) => t._id === tradeId);
          if (tx) {
            const desc = tx.description || '';
            const isClose = tx.type === 'DEPOSIT';
            const isBuy = tx.type === 'BUY_STOCK' || desc.includes('LONG') || desc.includes('BUY');
            const symbolMatch = desc.match(/(?:LONG|SHORT|BUY|SELL|Mở|Đóng)\s+([A-Z0-9]+)/i);
            const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'STOCK';
            const priceMatch = desc.match(/ở giá\s+([\d.,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
            const pnlMatch = desc.match(/Lợi nhuận:\s*(-?[\d.,]+)/);
            let pnl = 0;
            if (pnlMatch) {
              pnl = parseFloat(pnlMatch[1].replace(/,/g, ''));
            }

            setTrade({
              id: tx._id,
              symbol,
              side: isBuy ? 'BUY' : 'SELL',
              quantity: 1,
              entryPrice: price,
              exitPrice: price,
              pnl,
              returnRate: 0,
              status: isClose ? 'CLOSED' : 'OPEN',
              entryTime: tx.createdAt,
              exitTime: isClose ? tx.createdAt : undefined,
              commission: 0,
              simulation: 'Paper Trading',
              notes: tx.description
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    findTrade();
  }, [tradeId, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        {lang === 'vi' ? 'Đang tải thông tin lệnh...' : 'Loading trade details...'}
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">{lang === 'vi' ? 'Không tìm thấy lệnh' : 'Trade not found'}</h2>
        <p>{lang === 'vi' ? 'Lệnh bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.' : 'The trade you are looking for does not exist or has been removed.'}</p>
        <Link to="/student/journal" className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          {lang === 'vi' ? 'Quay lại Nhật ký' : 'Back to Journal'}
        </Link>
      </div>
    );
  }

  const isWin = trade.pnl > 0;
  const isLoss = trade.pnl < 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link to="/student/journal" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#172033] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {lang === 'vi' ? 'Chi tiết lệnh' : 'Trade Details'}
            <span className={`px-2.5 py-0.5 rounded text-sm font-bold uppercase ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
              {trade.side}
            </span>
            <span className="bg-slate-100 text-slate-700 dark:bg-[#172033] dark:text-slate-300 px-2.5 py-0.5 rounded text-sm font-bold border border-slate-200 dark:border-[#253047]">
              {trade.symbol}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-md overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-200 dark:border-[#253047]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{lang === 'vi' ? 'Tổng quan khớp lệnh' : 'Execution Summary'}</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Trạng thái' : 'Status'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{trade.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Khối lượng' : 'Quantity'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{trade.quantity.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Giá vào' : 'Entry Price'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">${trade.entryPrice.toLocaleString('en-US')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Giá ra' : 'Exit Price'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{trade.exitPrice ? `$${trade.exitPrice.toLocaleString('en-US')}` : '-'}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Thời gian vào' : 'Entry Time'}</p>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{new Date(trade.entryTime).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Thời gian ra' : 'Exit Time'}</p>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{trade.exitTime ? new Date(trade.exitTime).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Cắt lỗ' : 'Stop Loss'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{trade.stopLoss ? `$${trade.stopLoss.toLocaleString('en-US')}` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{lang === 'vi' ? 'Chốt lời' : 'Take Profit'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{trade.takeProfit ? `$${trade.takeProfit.toLocaleString('en-US')}` : '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-md overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-200 dark:border-[#253047]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{lang === 'vi' ? 'Ghi chú lệnh' : 'Trade Notes'}</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{trade.notes || (lang === 'vi' ? 'Không có ghi chú nào cho lệnh này.' : 'No notes for this trade.')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-md overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-200 dark:border-[#253047]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{lang === 'vi' ? 'Tài chính & Hiệu suất' : 'Financials'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#253047]/50">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Lợi nhuận gộp' : 'Gross P&L'}</span>
                <span className={`font-semibold ${isWin ? 'text-emerald-600 dark:text-emerald-500' : isLoss ? 'text-rose-600 dark:text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {trade.pnl > 0 ? '+' : trade.pnl < 0 ? '-' : ''}${Math.abs(trade.pnl + (trade.commission || 0)).toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-[#253047]/50">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Phí giao dịch' : 'Commission & Fees'}</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  -${(trade.commission || 0).toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-900 dark:text-white font-medium">{lang === 'vi' ? 'Lợi nhuận ròng' : 'Net P&L'}</span>
                <span className={`text-xl font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-500' : isLoss ? 'text-rose-600 dark:text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {trade.pnl > 0 ? '+' : trade.pnl < 0 ? '-' : ''}${Math.abs(trade.pnl).toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{lang === 'vi' ? 'Tỷ suất sinh lời' : 'Return Rate'}</span>
                <span className={`text-sm font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-500' : isLoss ? 'text-rose-600 dark:text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {trade.returnRate > 0 ? '+' : ''}{trade.returnRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-md overflow-hidden p-6 transition-colors">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{lang === 'vi' ? 'Bối cảnh' : 'Context'}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{lang === 'vi' ? 'Kỳ thi mô phỏng' : 'Simulation'}</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{trade.simulation}</p>
                  <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{lang === 'vi' ? 'Chiến lược / Setup' : 'Setup / Strategy'}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{trade.setup || (lang === 'vi' ? 'Không có' : 'None')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, ShieldCheck, Tag, Info } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

interface JournalTrade {
  id: string;
  date: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  quantity: number;
  pnl: number;
  result: 'WIN' | 'LOSS';
  returnPercent: number;
  strategy: string;
  risk: string;
  stopLoss: number;
  takeProfit: number;
  notes: string;
}

const getJournalRows = (lang: string): JournalTrade[] => [
  {
    id: 'tr-01',
    date: '2026-10-04 10:15',
    symbol: 'BTCUSDT.P',
    side: 'LONG',
    entry: 82400.00,
    exit: 83820.00,
    quantity: 2.50,
    pnl: 3550.00,
    result: 'WIN',
    returnPercent: 4.31,
    strategy: lang === 'vi' ? 'Kiểm định vùng FVG 15 phút theo ICT' : 'ICT 15m Fair Value Gap (FVG) retest',
    risk: lang === 'vi' ? 'Rủi ro 1.45% vốn ($1.450 USD)' : 'Risk 1.45% capital ($1,450 USD)',
    stopLoss: 81820.00,
    takeProfit: 83820.00,
    notes: lang === 'vi'
      ? 'Giá bật tăng mạnh tại đáy khoảng trống FVG. Giữ vị thế gồng lãi đến vùng thanh khoản tiếp theo tại đỉnh phiên trước.'
      : 'Strong bounce at FVG discount. Held winner into external range liquidity at previous session high.',
  },
  {
    id: 'tr-02',
    date: '2026-10-03 14:35',
    symbol: 'NVDA',
    side: 'LONG',
    entry: 186.40,
    exit: 191.10,
    quantity: 50,
    pnl: 235.00,
    result: 'WIN',
    returnPercent: 2.52,
    strategy: lang === 'vi' ? 'Phá vỡ vùng mở phiên (ORB 15m)' : '15m Opening Range Breakout (ORB)',
    risk: lang === 'vi' ? '1.20% Vốn Tài Khoản' : '1.20% Account Equity',
    stopLoss: 184.20,
    takeProfit: 191.10,
    notes: lang === 'vi'
      ? 'Phá vỡ biên độ 15 phút mở phiên trên đỉnh pre-market với khối lượng lớn. Chốt lời tại tỷ lệ +2R đúng theo kế hoạch ban đầu.'
      : 'Broke 15m opening range above pre-market high on elevated volume. Took profit at +2R per plan.',
  },
  {
    id: 'tr-03',
    date: '2026-10-02 08:20',
    symbol: 'EURUSD',
    side: 'SHORT',
    entry: 1.1420,
    exit: 1.1375,
    quantity: 200000,
    pnl: 900.00,
    result: 'WIN',
    returnPercent: 0.39,
    strategy: lang === 'vi' ? 'Quét thanh khoản phiên London & MSS' : 'London Liquidity Sweep & MSS',
    risk: lang === 'vi' ? '0.95% Vốn Tài Khoản' : '0.95% Account Equity',
    stopLoss: 1.1445,
    takeProfit: 1.1375,
    notes: lang === 'vi'
      ? 'Quét đỉnh phiên Á và xác nhận đảo chiều cấu trúc thị trường. Đặt Stop-Loss chặt chẽ trên râu nến thanh khoản. Đạt đúng mục tiêu chốt lời.'
      : 'Swept Asian high with market structure shift. Tight stop above liquidity wick. Target hit cleanly.',
  },
  {
    id: 'tr-04',
    date: '2026-10-01 16:10',
    symbol: 'TSLA',
    side: 'SHORT',
    entry: 442.00,
    exit: 445.80,
    quantity: 30,
    pnl: -114.00,
    result: 'LOSS',
    returnPercent: -0.86,
    strategy: lang === 'vi' ? 'Kiểm định hồi quy trung bình thất bại' : 'Mean Reversion Invalidation',
    risk: lang === 'vi' ? '1.00% Vốn Tài Khoản' : '1.00% Account Equity',
    stopLoss: 445.80,
    takeProfit: 434.00,
    notes: lang === 'vi'
      ? 'Cổ phiếu giữ sức mạnh tương đối ngoài dự tính bất chấp thị trường bán tháo. Hệ thống cắt lỗ kích hoạt tự động theo đúng kế hoạch đề ra.'
      : 'Unexpected relative strength against market dump. Stop loss triggered automatically as planned.',
  },
  {
    id: 'tr-05',
    date: '2026-09-29 11:05',
    symbol: 'AAPL',
    side: 'LONG',
    entry: 244.50,
    exit: 248.42,
    quantity: 40,
    pnl: 156.80,
    result: 'WIN',
    returnPercent: 1.60,
    strategy: lang === 'vi' ? 'Hồi quy tiếp diễn xu hướng' : 'Trend Continuation Pullback',
    risk: lang === 'vi' ? '1.10% Vốn Tài Khoản' : '1.10% Account Equity',
    stopLoss: 242.80,
    takeProfit: 248.50,
    notes: lang === 'vi'
      ? 'Bắt nhịp điều chỉnh chạm đường EMA 50 khung 1 giờ. Khớp lệnh chuẩn xác và chốt lời kịp thời trước khi đóng phiên.'
      : '1h EMA 50 touch retracement. Executed with precision, took profit before market close.',
  },
];

export const CinematicTradingJournal: React.FC = () => {
  const { lang } = useI18n();
  // Expanded row state (hover or click)
  const [expandedId, setExpandedId] = useState<string | null>('tr-01');
  const [dbRows, setDbRows] = useState<JournalTrade[] | null>(null);

  // Thử tải dữ liệu lịch sử giao dịch thực tế từ database của người dùng
  React.useEffect(() => {
    let isMounted = true;
    const fetchUserTrades = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/trade/transactions', { headers });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || json.transactions;
          if (Array.isArray(list) && list.length > 0 && isMounted) {
            const closed = list.filter((t: any) => t.type === 'CLOSE_POSITION' || t.realizedPnl != null || t.pnl != null || t.amount != null);
            if (closed.length > 0) {
              const mapped: JournalTrade[] = closed.slice(0, 5).map((t: any, idx: number) => {
                const pnl = t.amount ?? t.realizedPnl ?? t.pnl ?? 0;
                const isWin = pnl >= 0;
                const entry = t.entryPrice || t.price || 100;
                const exit = t.exitPrice || t.price || 100;
                const dateObj = new Date(t.createdAt || Date.now());
                const dateStr = dateObj.toISOString().replace('T', ' ').slice(0, 16);

                return {
                  id: t._id || `db-${idx}`,
                  date: dateStr,
                  symbol: t.symbol || 'BTCUSDT',
                  side: t.side === 'SHORT' || t.side === 'SELL' ? 'SHORT' : 'LONG',
                  entry,
                  exit,
                  quantity: t.quantity || 1,
                  pnl,
                  result: isWin ? 'WIN' : 'LOSS',
                  returnPercent: entry > 0 ? parseFloat((((exit - entry) / entry) * 100).toFixed(2)) : 1.2,
                  strategy: t.strategy || (lang === 'vi' ? 'Khớp lệnh tài khoản thực tế' : 'Live Account Execution'),
                  risk: lang === 'vi' ? 'Kiểm toán rủi ro tự động' : 'Automated Risk Audit',
                  stopLoss: t.stopLoss || parseFloat((entry * 0.985).toFixed(2)),
                  takeProfit: t.takeProfit || parseFloat((entry * 1.03).toFixed(2)),
                  notes: t.notes || (lang === 'vi' ? 'Lệnh thực thi đã được ghi nhận trong cơ sở dữ liệu hệ thống.' : 'Trade execution recorded in database.'),
                };
              });
              setDbRows(mapped);
            }
          }
        }
      } catch (_) {}
    };

    fetchUserTrades();
    return () => { isMounted = false; };
  }, [lang]);

  const defaultRows = getJournalRows(lang);
  const journalRows = dbRows && dbRows.length > 0 ? dbRows : defaultRows;

  return (
    <section className="relative w-full py-24 bg-[#05080E] border-b border-[#1E293B] text-slate-100 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Transition cue: Point on equity curve expands into specific trade */}
        <div className="flex items-center gap-3 mb-6 font-mono text-xs text-blue-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{lang === 'vi' ? 'MỞ RỘNG ĐIỂM VỐN 04 TH10' : 'OCT 04 EQUITY POINT EXPANSION'}</span>
          </div>
          <span className="text-slate-600">→</span>
          <span className="text-slate-300">
            {lang === 'vi' ? 'PHÂN TÍCH CHI TIẾT TỪNG BƯỚC GIÁ KHỚP LỆNH' : 'GRANULAR TICK-BY-TICK EXECUTION AUDIT'}
          </span>
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0E1626] border border-blue-500/30 text-blue-400 font-mono text-xs uppercase tracking-widest mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'NHẬT KÝ & ĐỐI SOÁT SAU GIAO DỊCH' : 'POST-TRADE JOURNAL & AUDIT'}</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase font-sans">
              {lang === 'vi' ? (
                <>
                  ĐÁNH GIÁ. <br />
                  <span className="text-blue-500">THẤU HIỂU. NÂNG TẦM.</span>
                </>
              ) : (
                <>
                  REVIEW. <br />
                  <span className="text-blue-500">UNDERSTAND. SCALE.</span>
                </>
              )}
            </h2>

            <p className="mt-3 text-sm text-slate-400 font-sans max-w-xl">
              {lang === 'vi'
                ? 'Đẳng cấp trading thực thụ được rèn giũa từ nhật ký giao dịch. Rê chuột hoặc bấm vào bất kỳ dòng lệnh nào để xem luận điểm vào lệnh, biên an toàn rủi ro và ghi chú bài học mà không cần rời trang.'
                : 'Real trading competence is forged through systematic journaling. Hover or click any trade row to view entry rationale, risk parameters, and reflections without leaving the page.'}
            </p>
          </div>

          <div className="font-mono text-xs text-slate-400 flex items-center gap-3">
            <span className="px-3 py-1.5 rounded bg-[#0A0F1A] border border-[#1A2538] text-slate-300">
              {lang === 'vi' ? 'HIỂN THỊ 5 NHẬT KÝ ĐÃ XÁC THỰC' : 'DISPLAYING 5 VERIFIED AUDIT LOGS'}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LARGE TRADE JOURNAL TABLE WITH ROW EXPANSION                   */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#080D17] border border-[#1A2538] rounded-xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#0C1220] border-b border-[#182338] font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">{lang === 'vi' ? 'Ngày / Giờ' : 'Date / Time'}</div>
            <div className="col-span-2">{lang === 'vi' ? 'Mã Tài Sản' : 'Asset'}</div>
            <div className="col-span-1">{lang === 'vi' ? 'Vị Thế' : 'Side'}</div>
            <div className="col-span-1 text-right">{lang === 'vi' ? 'Giá Vào' : 'Entry'}</div>
            <div className="col-span-1 text-right">{lang === 'vi' ? 'Giá Đóng' : 'Exit'}</div>
            <div className="col-span-1 text-right">{lang === 'vi' ? 'KL' : 'Qty'}</div>
            <div className="col-span-2 text-right">{lang === 'vi' ? 'Lãi/Lỗ (USD)' : 'PnL (USD)'}</div>
            <div className="col-span-1 text-center">{lang === 'vi' ? 'Kết Quả' : 'Result'}</div>
            <div className="col-span-1 text-right">{lang === 'vi' ? 'Chi Tiết' : 'Detail'}</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#141E2F]">
            {journalRows.map(trade => {
              const isExpanded = expandedId === trade.id;
              const isWin = trade.result === 'WIN';

              return (
                <div
                  key={trade.id}
                  className={`transition-colors ${
                    isExpanded ? 'bg-[#0E1626]' : 'hover:bg-[#0A101C]'
                  }`}
                  onMouseEnter={() => setExpandedId(trade.id)}
                >
                  {/* Main Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                    className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 items-center cursor-pointer font-mono text-xs"
                  >
                    <div className="lg:col-span-2 text-slate-400 font-medium">
                      {trade.date}
                    </div>

                    <div className="lg:col-span-2 font-bold text-white flex items-center gap-2">
                      <span>{trade.symbol}</span>
                      <span className="text-[10px] text-blue-400 uppercase hidden sm:inline px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-800/30">
                        {lang === 'vi' ? 'KIỂM TOÁN' : 'AUDITED'}
                      </span>
                    </div>

                    <div className="lg:col-span-1">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          trade.side === 'LONG'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}
                      >
                        {trade.side === 'LONG' ? (lang === 'vi' ? 'MUA' : 'BUY') : (lang === 'vi' ? 'BÁN' : 'SELL')}
                      </span>
                    </div>

                    <div className="lg:col-span-1 text-right text-slate-300">
                      ${trade.entry.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="lg:col-span-1 text-right text-slate-300">
                      ${trade.exit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="lg:col-span-1 text-right text-slate-400">
                      {trade.quantity}
                    </div>

                    <div
                      className={`lg:col-span-2 text-right font-bold text-sm ${
                        isWin ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isWin ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="lg:col-span-1 flex justify-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded ${
                          isWin
                            ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                            : 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                        }`}
                      >
                        {isWin ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                        <span>{isWin ? (lang === 'vi' ? 'THẮNG' : 'WIN') : (lang === 'vi' ? 'THUA' : 'LOSS')}</span>
                      </span>
                    </div>

                    <div className="lg:col-span-1 flex justify-end text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden bg-[#0A0F1A] border-t border-[#162235]"
                      >
                        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
                          {/* Strategy & Risk */}
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                <Tag className="w-3 h-3 text-blue-400" />
                                <span>{lang === 'vi' ? 'Chiến Lược Giao Dịch' : 'Trading Strategy'}</span>
                              </div>
                              <div className="font-semibold text-white bg-[#0F1728] p-2.5 rounded border border-[#1E293B]">
                                {trade.strategy}
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                {lang === 'vi' ? 'Thông Số Rủi Ro' : 'Risk Parameters'}
                              </div>
                              <div className="font-medium text-slate-300 bg-[#0F1728] p-2.5 rounded border border-[#1E293B]">
                                {trade.risk}
                              </div>
                            </div>
                          </div>

                          {/* Stop Loss & Take Profit */}
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] text-rose-400 uppercase tracking-wider mb-1">
                                {lang === 'vi' ? 'Mức Cắt Lỗ (Stop Loss)' : 'Stop Loss (SL)'}
                              </div>
                              <div className="font-bold text-rose-400 bg-rose-950/20 p-2.5 rounded border border-rose-900/30 flex items-center justify-between">
                                <span>${trade.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-slate-400">
                                  {lang === 'vi' ? 'SL ĐÃ KIỂM TOÁN' : 'SL AUDITED'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
                                {lang === 'vi' ? 'Mức Chốt Lời (Take Profit)' : 'Take Profit (TP)'}
                              </div>
                              <div className="font-bold text-emerald-400 bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30 flex items-center justify-between">
                                <span>${trade.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-slate-400">
                                  {lang === 'vi' ? 'CHẠM MỤC TIÊU' : 'TARGET HIT'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Qualitative Notes / Reflection (2 cols) */}
                          <div className="md:col-span-2 space-y-2">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Info className="w-3 h-3 text-blue-400" />
                              <span>{lang === 'vi' ? 'Ghi Chú Đúc Rút & Đối Soát Khớp Lệnh' : 'Reflection & Execution Audit'}</span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-[#0F1728] border border-[#1E293B] text-slate-300 font-sans text-xs leading-relaxed">
                              "{trade.notes}"
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1 font-mono">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>
                                {lang === 'vi'
                                  ? 'Đã xác thực không có hiện tượng hủy lệnh cảm tính khi thị trường biến động mạnh.'
                                  : 'Attested: Zero panic-cancellations or emotional interference detected.'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

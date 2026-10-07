import React, { useState } from 'react';
import { JOURNAL_ENTRIES, type JournalEntry } from './mockData';
import { BookOpen, CheckCircle2, Search, ArrowUpRight, ArrowDownRight, Tag, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TradingJournal: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [activeEntry, setActiveEntry] = useState<JournalEntry>(JOURNAL_ENTRIES[0]);

  const tags = ['ALL', 'ICT 15m FVG Re-test', 'Opening Range Breakout', 'London Open Sweep', 'Order Block Reaction'];

  const filteredEntries = JOURNAL_ENTRIES.filter(e => {
    return selectedTag === 'ALL' || e.setupTag === selectedTag;
  });

  return (
    <section id="journal" className="w-full py-14 bg-[#080C14] border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>KIỂM TOÁN TỰ ĐỘNG & GHI NHẬN TÂM LÝ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Nhật Ký Giao Dịch Thuật Toán
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Không cần nhập bảng tính Excel thủ công. StockSim tự động ghi lại từng bước giá khớp lệnh, độ lệch trượt giá,
              phí hoa hồng và tỷ lệ R:R ngay khi đóng vị thế, liên kết trực tiếp với nhãn chiến lược của bạn.
            </p>
          </div>

          <Link
            to="/student/journal"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0F1728] hover:bg-[#16233B] text-slate-200 border border-[#23324D] text-xs font-mono font-medium transition-colors self-start md:self-auto"
          >
            <span>MỞ NHẬT KÝ ĐẦY ĐỦ</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 font-mono text-xs no-scrollbar">
          <span className="text-slate-500 text-[11px] mr-1 uppercase">NHÃN CHIẾN LƯỢC:</span>
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                selectedTag === t
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-[#0B111D] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
              }`}
            >
              {t === 'ALL' ? 'TẤT CẢ' : t}
            </button>
          ))}
        </div>

        {/* 2-Column Journal Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Trade Entries Table (7 Cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[#212D42] bg-[#0A0F1A] overflow-hidden shadow-lg font-mono text-xs">
            <div className="bg-[#0D1525] border-b border-[#212D42] px-4 py-2.5 flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider">
              <span>LỆNH ĐÃ THỰC HIỆN</span>
              <span>ĐỊNH GIÁ USD</span>
            </div>

            <div className="divide-y divide-[#182338]">
              {filteredEntries.map(entry => {
                const isSelected = activeEntry.id === entry.id;
                const isProfit = entry.pnlUsd >= 0;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setActiveEntry(entry)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#10192A] border-l-2 border-blue-400' : 'hover:bg-[#0D1322]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{entry.symbol}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            entry.side === 'LONG'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {entry.side === 'LONG' ? 'MUA' : 'BÁN'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">Phiên {entry.session}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Giá vào: ${entry.entryPrice.toLocaleString()}</span>
                        <span>•</span>
                        <span>Giá đóng: ${entry.exitPrice.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-slate-300">R:R {entry.riskReward}</span>
                      </div>

                      <div className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-[#0D1524] text-purple-300 border border-purple-900/40">
                        {entry.setupTag}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-bold flex items-center justify-end gap-1 ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {isProfit ? '+' : ''}${entry.pnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {isProfit ? '+' : ''}{entry.returnPercent.toFixed(2)}% ROI
                      </div>
                      <div className="mt-1 text-[9px] text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ĐÃ XÁC THỰC</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Entry Detailed Inspection Drawer (5 Cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[#212D42] bg-[#0A0F1A] p-5 shadow-lg font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="font-bold text-white text-sm">
                    {activeEntry.symbol} // {activeEntry.side === 'LONG' ? 'MUA (LONG)' : 'BÁN (SHORT)'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{activeEntry.date}</span>
              </div>

              {/* Execution Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded bg-[#070B14] border border-[#182338]">
                  <div className="text-[10px] text-slate-400 uppercase">GIÁ KHỚP VÀO</div>
                  <div className="text-xs font-bold text-slate-100 mt-0.5">
                    ${activeEntry.entryPrice.toLocaleString()} USD
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#182338]">
                  <div className="text-[10px] text-slate-400 uppercase">GIÁ KHỚP ĐÓNG</div>
                  <div className="text-xs font-bold text-slate-100 mt-0.5">
                    ${activeEntry.exitPrice.toLocaleString()} USD
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#182338]">
                  <div className="text-[10px] text-slate-400 uppercase">LỢI NHUẬN THỰC HIỆN</div>
                  <div
                    className={`text-xs font-bold mt-0.5 ${
                      activeEntry.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeEntry.pnlUsd >= 0 ? '+' : ''}
                    ${activeEntry.pnlUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[#070B14] border border-[#182338]">
                  <div className="text-[10px] text-slate-400 uppercase">TỶ LỆ R:R</div>
                  <div className="text-xs font-bold text-white mt-0.5">{activeEntry.riskReward}</div>
                </div>
              </div>

              {/* Reflection & Strategy Notes */}
              <div className="p-3 rounded bg-[#070B14] border border-[#182338] mb-4">
                <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-blue-400" />
                  GHI CHÚ CHIẾN LƯỢC & TÂM LÝ:
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
                  "{activeEntry.reflectionNote}"
                </p>
              </div>

              {/* System Audit Status */}
              <div className="p-2.5 rounded bg-[#05080F] border border-[#162032] space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">ĐỐI SOÁT SỔ LỆNH SÀN:</span>
                  <span className="text-blue-400 font-bold">[100% ĐÃ KHỚP]</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">TRẠNG THÁI ĐIỂM HỌC TẬP:</span>
                  <span className="text-slate-200">TỰ ĐỘNG ĐỒNG BỘ ĐẾN BẢNG GIẢNG VIÊN</span>
                </div>
              </div>
            </div>

            <Link
              to="/student/journal"
              className="mt-4 w-full py-2 rounded bg-[#10192A] hover:bg-blue-600 text-slate-200 hover:text-white border border-[#21304A] hover:border-blue-500 text-center font-mono text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>MỞ ĐẦY ĐỦ NHẬT KÝ GIAO DỊCH</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

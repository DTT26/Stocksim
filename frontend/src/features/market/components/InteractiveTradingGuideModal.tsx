import React, { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, Play, 
  ArrowUpRight, ArrowDownRight, BookOpen, Layers, Target, 
  Sparkles, Shield, Trophy, Activity, Sliders, Check, 
  ExternalLink, Eye, RefreshCw, BarChart2, DollarSign
} from 'lucide-react';

interface InteractiveTradingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToJournal?: () => void;
}

export const InteractiveTradingGuideModal: React.FC<InteractiveTradingGuideModalProps> = ({
  isOpen,
  onClose,
  onGoToJournal
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Interactive mock states for user to click and try inside the tutorial!
  const [simTradeSide, setSimTradeSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [simOrderType, setSimOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [simRisk, setSimRisk] = useState<number>(1);
  const [simLot, setSimLot] = useState<number>(0.01);
  const [simLeverage, setSimLeverage] = useState<number>(10);
  const [simEnableTPSL, setSimEnableTPSL] = useState<boolean>(true);
  const [simOrderStatus, setSimOrderStatus] = useState<'idle' | 'opened' | 'closed'>('idle');
  const [simJournalTab, setSimJournalTab] = useState<'overview' | 'charts' | 'breakdown' | 'trades'>('overview');

  if (!isOpen) return null;

  const steps = [
    {
      id: 0,
      badge: 'BƯỚC 1: KHỞI ĐẦU',
      title: 'Đăng Ký, Đăng Nhập & Chọn Mã Giao Dịch',
      subtitle: 'Bắt đầu hành trình mô phỏng giao dịch chuẩn chuyên nghiệp',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Để bắt đầu, hãy đăng ký tài khoản hoặc đăng nhập vào hệ thống <strong className="text-white">StockSim</strong>. Sau đó bấm vào <strong className="text-cyan-400">Mở Terminal</strong> trên menu chính.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">1</span>
                Tìm & Chọn Mã
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Bấm vào ô mã ở góc trái màn hình (ví dụ: <span className="text-amber-400 font-mono">BTCUSDT</span>, <span className="text-amber-400 font-mono">AAPL</span>, <span className="text-amber-400 font-mono">NVDA</span>, <span className="text-amber-400 font-mono">FPT</span>).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">2</span>
                Chọn Khung Thời Gian
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Lựa chọn khung nến phù hợp: <span className="text-white font-mono">1m, 5m, 15m, 1H, 4H, D</span> để phân tích hành động giá (Price Action).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">3</span>
                Chuẩn Bị Sẵn Sàng
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Màn hình biểu đồ kỹ thuật TradingView tích hợp sẽ cập nhật toàn bộ dữ liệu lịch sử chuẩn xác từng giây.
              </p>
            </div>
          </div>
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-lg flex items-center gap-3 text-cyan-300 text-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Mẹo: Bạn có thể sử dụng phím tắt hoặc thanh công cụ bên trái để vẽ đường xu hướng, Fib, và đặt chỉ báo kỹ thuật trước khi vào lệnh.</span>
          </div>
        </div>
      )
    },
    {
      id: 1,
      badge: 'BƯỚC 2: BAR REPLAY',
      title: 'Bật Bar Replay & Khởi Tạo Phiên Mới (Hình 2)',
      subtitle: 'Tua lại thị trường và kiểm thử chiến lược như thời gian thực',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Để luyện tập trong môi trường không biết trước tương lai, tính năng <strong className="text-amber-400">Bar Replay</strong> cho phép bạn tua ngược thời gian về bất kỳ cây nến nào trong quá khứ.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Quy trình bắt đầu phiên nến lịch sử:</h4>
            <ol className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Bấm nút biểu tượng <strong className="text-emerald-400">Bar Replay (Tua Nến)</strong> trên thanh điều khiển.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Di chuột vào biểu đồ và <strong>Click vào 1 cây nến bất kỳ</strong> để chọn mốc thời gian bắt đầu phiên. Toàn bộ nến tương lai sau đó sẽ bị ẩn đi.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                <span>Trên bảng <strong className="text-white">Mô phỏng Giao dịch</strong> ở thanh công cụ bên phải, nhấn nút xanh <strong className="text-emerald-400">(+) BẮT ĐẦU PHIÊN MỚI</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
                <span>Thiết lập số vốn ban đầu (ví dụ: <span className="text-emerald-400 font-mono font-bold">$100,000.00</span>) và đòn bẩy rồi nhấn nút <strong className="text-white">Bắt đầu</strong>.</span>
              </li>
            </ol>
          </div>
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Thẻ phiên hiển thị trạng thái: <strong className="text-emerald-400 uppercase">BTCUSDT - D • Đang mở</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">$100,000.00</span>
          </div>
        </div>
      )
    },
    {
      id: 2,
      badge: 'BƯỚC 3: FORM ĐẶT LỆNH',
      title: 'Cấu Hình Lệnh & Quản Trị Rủi Ro Chuyên Nghiệp (Hình 1)',
      subtitle: 'Thao tác trực tiếp và làm chủ từng thông số giao dịch',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Dưới đây là mô phỏng <strong className="text-cyan-400">Form Đặt Lệnh Thực Chiến (Hình 1)</strong>. Bạn có thể bấm thử trực tiếp các nút và điều chỉnh thông số ngay tại đây:
          </p>

          {/* Interactive Simulated Order Form */}
          <div className="p-4 rounded-xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl space-y-3.5 max-w-lg mx-auto">
            {/* Header Simulator */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                MÔ PHÒNG GIAO DỊCH (BTCUSDT)
              </span>
              <span className="text-emerald-400 font-mono font-bold">$100,000.00</span>
            </div>

            {/* Order Type Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['MARKET', 'LIMIT', 'STOP'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSimOrderType(type)}
                  className={`py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    simOrderType === type 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type === 'MARKET' ? 'THỊ TRƯỜNG' : type}
                </button>
              ))}
            </div>

            {/* Side Buttons (Long / Short) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSimTradeSide('LONG')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  simTradeSide === 'LONG'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                MUA (LONG)
              </button>
              <button
                onClick={() => setSimTradeSide('SHORT')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  simTradeSide === 'SHORT'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                BÁN (SHORT)
              </button>
            </div>

            {/* Price Row */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">GIÁ (THỊ TRƯỜNG):</span>
              <span className="font-mono font-bold text-white text-sm">65,043.98 USDT</span>
            </div>

            {/* Risk per trade & Volume */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>RISK PER TRADE:</span>
                  <span className="text-rose-400 font-bold">${(100000 * simRisk / 100).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[0.5, 1, 2, 3].map((r) => (
                    <button
                      key={r}
                      onClick={() => setSimRisk(r)}
                      className={`flex-1 py-0.5 rounded text-[10px] font-bold ${
                        simRisk === r ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>KHỐI LƯỢNG (LOTS):</span>
                  <span className="text-cyan-400 font-bold font-mono">{simLot} Lot</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSimLot(Math.max(0.01, +(simLot - 0.01).toFixed(2)))} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-bold">-</button>
                  <span className="flex-1 text-center font-mono font-bold text-white text-[11px]">{simLot}</span>
                  <button onClick={() => setSimLot(+(simLot + 0.01).toFixed(2))} className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-bold">+</button>
                </div>
              </div>
            </div>

            {/* Leverage Slider */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">ĐÒN BẨY:</span>
                <span className="font-bold font-mono text-amber-400">{simLeverage}X</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 10, 25, 50, 100, 125].map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setSimLeverage(lev)}
                    className={`flex-1 py-0.5 rounded text-[10px] font-mono font-bold ${
                      simLeverage === lev ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* TP / SL Toggle */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-[11px]">
                <input 
                  type="checkbox" 
                  checked={simEnableTPSL} 
                  onChange={(e) => setSimEnableTPSL(e.target.checked)} 
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Thiết lập Chốt lời / Cắt lỗ (TP / SL)</span>
              </label>

              {simEnableTPSL && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block">CHỐT LỜI (TP):</span>
                    <span className="font-mono text-white font-bold">71,148.72</span>
                  </div>
                  <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/30">
                    <span className="text-rose-400 font-bold block">CẮT LỖ (SL):</span>
                    <span className="font-mono text-white font-bold">59,526.98</span>
                  </div>
                </div>
              )}
            </div>

            {/* Execution Action Button */}
            {simOrderStatus === 'idle' ? (
              <button
                onClick={() => setSimOrderStatus('opened')}
                className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  simTradeSide === 'LONG'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                {simTradeSide === 'LONG' ? 'PLACE LONG MARKET • 65,044.18' : 'PLACE SHORT MARKET • 65,043.98'}
              </button>
            ) : (
              <div className="p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Đã Khớp Lệnh Thành Công!
                </span>
                <button 
                  onClick={() => setSimOrderStatus('idle')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 3,
      badge: 'BƯỚC 4: QUẢN LÝ & ĐÓNG LỆNH',
      title: 'Theo Dõi P&L & Đóng Vị Thế Giao Dịch',
      subtitle: 'Quan sát diễn biến nến tiếp theo và hiện thực hóa lợi nhuận',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Sau khi mở vị thế, bạn sử dụng các nút điều khiển của thanh Bar Replay để quan sát các cây nến tiếp theo:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Play className="w-4 h-4" /> Tự Động Chạy (Play)
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Bấm nút <strong className="text-white">Play</strong> để nến tự động xuất hiện theo tốc độ (1x, 2x, 5x, 10x). P&L của lệnh sẽ liên tục nhảy theo biến động giá.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <ChevronRight className="w-4 h-4" /> Bước Từng Nến (Step)
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Bấm nút <strong className="text-white">Step Forward (Phím tắt F)</strong> để xem từng cây nến một cách chậm rãi, rèn luyện tư duy phản xạ theo từng nến.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">VỊ THẾ ĐANG MỞ (POSITION):</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">+ $248.50 (+2.48%)</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-emerald-400 font-bold">LONG BTCUSDT</span>
                <span className="text-slate-400 ml-2 font-mono">0.01 Lot • 10X</span>
              </div>
              <button 
                onClick={() => setSimOrderStatus('closed')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Đóng Lệnh Ngay (Close)
              </button>
            </div>
            {simOrderStatus === 'closed' && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> Lệnh đã được đóng thành công và ghi nhận lợi nhuận vào số dư!
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 4,
      badge: 'BƯỚC 5: HOÀN THÀNH PHIÊN (HÌNH 2)',
      title: 'Chốt Sổ Phiên Giao Dịch Đang Mở',
      subtitle: 'Lưu lại toàn bộ lịch sử nến và hiệu suất để phân tích',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Khi bạn đã hoàn thành các kế hoạch giao dịch trong khoảng thời gian đã tua, hãy thực hiện chốt sổ phiên:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/90 space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">BTCUSDT - D</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Đang mở</span>
              </div>
              <span className="text-slate-400 text-[11px]">Gần nhất: 07:00 14/07/2026</span>
            </div>
            
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">SỐ DƯ HIỆN TẠI:</span>
              <span className="font-bold text-white">$100,000.00</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button className="py-2 rounded-lg bg-emerald-900/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                <Play className="w-3.5 h-3.5" /> Tiếp tục
              </button>
              <button 
                onClick={() => setCurrentStep(5)}
                className="py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/60 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> ✓ Hoàn thành
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
            <p className="text-slate-400 leading-normal">
              Khi nhấn nút đỏ <strong className="text-rose-400">✓ Hoàn thành</strong>: Hệ thống sẽ tự động tổng hợp tỷ lệ thắng (Winrate), tổng P&L, tính toán các chỉ số thống kê và đồng bộ ngay vào Nhật Ký Giao Dịch của bạn.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      badge: 'BƯỚC 6: NHẬT KÝ NHANH (HÌNH 3)',
      title: 'Mở Bảng Nhật Ký Giao Dịch Trong Terminal',
      subtitle: 'Xem tóm tắt hiệu suất phiên và truy cập phân tích chi tiết',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Ở thanh công cụ ngoài cùng bên phải, nhấp vào tab thứ 4 (biểu tượng cuốn sách <BookOpen className="w-4 h-4 inline text-blue-400" /> <strong className="text-white">Nhật ký giao dịch</strong>) để mở nhanh bảng tóm tắt:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 space-y-3.5 max-w-md mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Nhật ký Giao dịch</h4>
                  <p className="text-[10px] text-slate-400">Session Journal & Notes</p>
                </div>
              </div>
            </div>

            {/* Performance preview box */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 font-medium">Phiên hiện tại: <strong>BTCUSDT - D</strong></span>
                <div className="flex gap-4 mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">LỢI NHUẬN RÒNG</span>
                    <span className="text-xs font-bold text-slate-200">-$0.00</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">TỶ LỆ THẮNG</span>
                    <span className="text-xs font-bold text-slate-200">0.00%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent trades list */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>LỆNH GẦN ĐÂY (2):</span>
                <span className="text-cyan-400 cursor-pointer">Xem tất cả</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">LONG</span>
                  <span className="font-bold text-white">BTCUSDT 0.01 lot</span>
                </div>
                <span className="text-slate-400">65044.18 → 65043.98</span>
              </div>
            </div>

            {/* Big Blue Open Journal Button */}
            <button
              onClick={() => {
                if (onGoToJournal) onGoToJournal();
                setCurrentStep(6);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <span>Mở Nhật ký Giao dịch Đầy đủ</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    },
    {
      id: 6,
      badge: 'BƯỚC 7: TRANG NHẬT KÝ CHI TIẾT (HÌNH 4 & 5)',
      title: 'Phân Tích 4 Chỉ Số & 4 Tab Chuyên Sâu Của Phiên',
      subtitle: 'Học hỏi từ từng lệnh giao dịch và nâng cấp kỹ năng bền vững',
      content: (
        <div className="space-y-4 text-sm text-slate-300">
          <p className="leading-relaxed">
            Trên trang <strong className="text-white">Nhật Ký Giao Dịch Đầy Đủ</strong>, hệ thống cung cấp đầy đủ bức tranh hiệu suất của bạn:
          </p>

          {/* 4 Big Metric Cards (Image 4 & 5) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">TỔNG SỐ PHIÊN</span>
              <span className="text-lg font-bold text-white font-mono">38</span>
              <span className="text-[10px] text-slate-500 block">Phiên đã ghi nhận</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">TỔNG SỐ LỆNH</span>
              <span className="text-lg font-bold text-white font-mono">101</span>
              <span className="text-[10px] text-slate-500 block">Lệnh đã thực thi</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">TỶ LỆ THẮNG</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">20.80%</span>
              <span className="text-[10px] text-slate-500 block">Tỷ lệ lệnh có lãi</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">LỢI NHUẬN RÒNG (P&L)</span>
              <span className="text-lg font-bold text-rose-400 font-mono">-$113.3M</span>
              <span className="text-[10px] text-slate-500 block">Lũy kế thực tế</span>
            </div>
          </div>

          {/* Click to view the newest session instruction */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" /> Bấm nút "Xem →" ở phiên mới nhất để mở 4 Tab Chi Tiết:
            </h4>
            
            {/* Interactive Tab Selector */}
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {[
                { key: 'overview', label: '1. Tổng quan (Overview)' },
                { key: 'charts', label: '2. Biểu đồ (Charts)' },
                { key: 'breakdown', label: '3. Phân bổ (Breakdown)' },
                { key: 'trades', label: '4. Danh sách lệnh (Trades)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSimJournalTab(tab.key as any)}
                  className={`flex-1 py-1.5 px-2 rounded font-semibold transition-all cursor-pointer text-center text-[11px] ${
                    simJournalTab === tab.key 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Preview Content */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-2">
              {simJournalTab === 'overview' && (
                <div className="space-y-1 text-slate-300">
                  <p className="font-bold text-white text-xs">📊 Tab Tổng quan (Overview):</p>
                  <p className="text-slate-400">Xem hệ số Profit Factor, Tỷ lệ Lãi/Lỗ trung bình (Risk-Reward), Mức sụt giảm tối đa (Max Drawdown), và Đánh giá AI Mentor tổng thể cho phiên.</p>
                </div>
              )}
              {simJournalTab === 'charts' && (
                <div className="space-y-1 text-slate-300">
                  <p className="font-bold text-white text-xs">📈 Tab Biểu đồ (Charts):</p>
                  <p className="text-slate-400">Hiển thị đường cong tăng trưởng vốn (Equity Curve) qua từng lệnh và biểu đồ nến có đánh dấu chính xác mũi tên điểm Vào (Entry) và Thoát (Exit) lệnh.</p>
                </div>
              )}
              {simJournalTab === 'breakdown' && (
                <div className="space-y-1 text-slate-300">
                  <p className="font-bold text-white text-xs">🧩 Tab Phân bổ (Breakdown):</p>
                  <p className="text-slate-400">Thống kê lệnh Long vs Short, phân bổ theo khung giờ trong ngày, ngày trong tuần, và các loại setup vào lệnh mang lại tỷ lệ thắng cao nhất.</p>
                </div>
              )}
              {simJournalTab === 'trades' && (
                <div className="space-y-1 text-slate-300">
                  <p className="font-bold text-white text-xs">📝 Tab Danh sách lệnh (Trades):</p>
                  <p className="text-slate-400">Bảng kê chi tiết từng lệnh: Giá vào, Giá ra, Thời gian giữ lệnh, Khối lượng Lot, P&L ròng, và Ghi chú phân tích tâm lý cá nhân.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0f172a] text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Hướng Dẫn Thực Chiến Người Dùng Mới</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                  {steps[currentStep].badge}
                </span>
              </div>
              <p className="text-xs text-slate-400">Từng bước làm chủ Trading Terminal, Đặt lệnh & Nhật Ký Giao Dịch</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng hướng dẫn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Stepper Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto shrink-0 gap-1">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentStep === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : currentStep > idx
                  ? 'text-emerald-400 hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === idx 
                  ? 'bg-cyan-500 text-slate-950' 
                  : currentStep > idx 
                  ? 'bg-emerald-500/30 text-emerald-300' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > idx ? '✓' : idx + 1}
              </span>
              <span className="hidden sm:inline">Bước {idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-white">{steps[currentStep].title}</h2>
            <p className="text-xs text-slate-400">{steps[currentStep].subtitle}</p>
          </div>

          {steps[currentStep].content}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 shrink-0">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currentStep === 0 
                ? 'opacity-40 cursor-not-allowed text-slate-600 bg-slate-800/50' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>{currentStep + 1}</span>
            <span>/</span>
            <span>{steps.length}</span>
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <span>Bước tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Hoàn Thành & Bắt Đầu Giao Dịch</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

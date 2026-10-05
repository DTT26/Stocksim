import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#05080E] border-t border-[#1E293B] text-slate-400 font-mono text-xs">
      {/* Upper Navigation Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl text-white tracking-tight font-sans">
                Stock<span className="text-[#5975FF]">Sim</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-sm">
              Nền tảng mô phỏng giao dịch và xác thực năng lực chuẩn tổ chức. Đồng hành cùng các trường đại học, khối viện kinh tế và cộng đồng trader với sổ lệnh L2 thời gian thực cùng cơ chế kiểm toán mật mã minh bạch.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>HỆ THỐNG MÁY CHỦ: HOẠT ĐỘNG</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-semibold">ĐỘ TRỄ 18ms</span>
            </div>
          </div>

          {/* Column 1: Terminal & Markets */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              TERMINAL & THỊ TRƯỜNG
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/trade/btcusdt" className="hover:text-blue-400 transition-colors">
                  BTC/USDT Hợp đồng Vĩnh cửu
                </Link>
              </li>
              <li>
                <Link to="/trade/ethusdt" className="hover:text-blue-400 transition-colors">
                  ETH/USDT Hợp đồng Vĩnh cửu
                </Link>
              </li>
              <li>
                <Link to="/trade/nvda" className="hover:text-blue-400 transition-colors">
                  NVDA (Cổ phiếu Mỹ)
                </Link>
              </li>
              <li>
                <Link to="/trade/aapl" className="hover:text-blue-400 transition-colors">
                  AAPL (Cổ phiếu Mỹ)
                </Link>
              </li>
              <li>
                <Link to="/trade/xauusd" className="hover:text-blue-400 transition-colors">
                  XAU/USD (Vàng Giao Ngay)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Academic Simulations */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              ĐẤU TRƯỜNG MÔ PHỎNG
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/simulations" className="hover:text-blue-400 transition-colors">
                  Tất Cả Đấu Trường Đang Mở
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">
                  Bảng Xếp Hạng Toàn Cầu
                </Link>
              </li>
              <li>
                <a href="#evidence" className="hover:text-blue-400 transition-colors">
                  Bằng Chứng Giao Dịch Xác Thực
                </a>
              </li>
              <li>
                <Link to="/student/assignments" className="hover:text-blue-400 transition-colors">
                  Bài Tập & Phân Tích
                </Link>
              </li>
              <li>
                <Link to="/student/journal" className="hover:text-blue-400 transition-colors">
                  Nhật Ký Giao Dịch Tự Động
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Docs */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              KIẾN TRÚC & ĐỐI SOÁT
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <a href="#analytics" className="hover:text-blue-400 transition-colors">
                  Bộ Phân Tích Hiệu Suất
                </a>
              </li>
              <li>
                <span className="text-slate-400">Bộ Khớp Lệnh L2 Chuẩn Xác</span>
              </li>
              <li>
                <span className="text-slate-400">Băm Mật Mã Lệnh SHA-256</span>
              </li>
              <li>
                <span className="text-slate-400">Nhận Diện Khối PD-Array ICT</span>
              </li>
              <li>
                <span className="text-slate-400">API REST & WebSocket</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="mt-10 pt-6 border-t border-[#1A2538] text-[11px] text-slate-400 font-sans leading-relaxed">
          <p>
            <strong>THÔNG BÁO PHÁP LÝ & MIỄN TRỪ TRÁCH NHIỆM:</strong> StockSim là nền tảng mô phỏng phục vụ mục đích giáo dục, nghiên cứu thị trường và xác thực học thuật. Toàn bộ số dư, phân bổ vốn, lệnh đặt, kết quả khớp lệnh, lãi và lỗ hoàn toàn là tiền ảo mô phỏng và không có rủi ro tài chính thực tế. Dữ liệu giá và sổ lệnh được thu thập trực tiếp từ luồng sàn giao dịch công khai cho mục đích học tập. StockSim không tiếp nhận tiền gửi vốn đầu tư thực và không hoạt động như một công ty chứng khoán môi giới.
          </p>
        </div>
      </div>

      {/* Bottom Telemetry Status Bar */}
      <div className="bg-[#030509] border-t border-[#151D2C] px-4 sm:px-6 py-2.5 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span>BẢN QUYỀN © 2026 STOCKSIM EDU. BẢO LƯU MỌI QUYỀN.</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">PHIÊN BẢN ENGINE v2.8-CHÍNH THỨC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-400 font-semibold">LUỒNG DỮ LIỆU: BINGX / BINANCE L2 TRỰC TIẾP</span>
          <span className="text-slate-700">•</span>
          <span>GIỜ HỆ THỐNG: UTC 14:52:10</span>
        </div>
      </div>
    </footer>
  );
};

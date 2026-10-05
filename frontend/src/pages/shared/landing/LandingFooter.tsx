import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { useI18n } from '../../../contexts/I18nContext';

export const LandingFooter: React.FC = () => {
  const { lang } = useI18n();

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
              {lang === 'vi'
                ? 'Nền tảng mô phỏng giao dịch và xác thực năng lực chuẩn tổ chức. Đồng hành cùng các trường đại học, khối viện kinh tế và cộng đồng trader với sổ lệnh L2 thời gian thực cùng cơ chế kiểm toán mật mã minh bạch.'
                : 'Institutional-grade paper trading and performance attestation platform. Partnering with universities, finance academies, and proprietary trading desks with real-time L2 orderbooks and cryptographic audit trails.'}
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{lang === 'vi' ? 'HỆ THỐNG MÁY CHỦ: HOẠT ĐỘNG' : 'SERVER ENGINES: OPERATIONAL'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-semibold">{lang === 'vi' ? 'ĐỘ TRỄ 18ms' : '18ms LATENCY'}</span>
            </div>
          </div>

          {/* Column 1: Terminal & Markets */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              {lang === 'vi' ? 'TERMINAL & THỊ TRƯỜNG' : 'TERMINAL & MARKETS'}
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/trade/btcusdt" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'BTC/USDT Hợp đồng Vĩnh cửu' : 'BTC/USDT Perpetual'}
                </Link>
              </li>
              <li>
                <Link to="/trade/ethusdt" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'ETH/USDT Hợp đồng Vĩnh cửu' : 'ETH/USDT Perpetual'}
                </Link>
              </li>
              <li>
                <Link to="/trade/nvda" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'NVDA (Cổ phiếu Mỹ)' : 'NVDA (US Equities)'}
                </Link>
              </li>
              <li>
                <Link to="/trade/aapl" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'AAPL (Cổ phiếu Mỹ)' : 'AAPL (US Equities)'}
                </Link>
              </li>
              <li>
                <Link to="/trade/xauusd" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'XAU/USD (Vàng Giao Ngay)' : 'XAU/USD (Spot Gold)'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Academic Simulations */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              {lang === 'vi' ? 'ĐẤU TRƯỜNG MÔ PHỎNG' : 'SIMULATION ARENAS'}
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/simulations" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Tất Cả Đấu Trường Đang Mở' : 'All Active Simulations'}
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Bảng Xếp Hạng Toàn Cầu' : 'Global Leaderboard'}
                </Link>
              </li>
              <li>
                <a href="#evidence" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Bằng Chứng Giao Dịch Xác Thực' : 'Verified Trade Evidence'}
                </a>
              </li>
              <li>
                <Link to="/student/assignments" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Bài Tập & Phân Tích' : 'Assignments & Research'}
                </Link>
              </li>
              <li>
                <Link to="/student/journal" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Nhật Ký Giao Dịch Tự Động' : 'Automated Trade Journal'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Docs */}
          <div>
            <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
              {lang === 'vi' ? 'KIẾN TRÚC & ĐỐI SOÁT' : 'ARCHITECTURE & AUDITING'}
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <a href="#analytics" className="hover:text-blue-400 transition-colors">
                  {lang === 'vi' ? 'Bộ Phân Tích Hiệu Suất' : 'Performance Analytics Suite'}
                </a>
              </li>
              <li>
                <span className="text-slate-400">
                  {lang === 'vi' ? 'Bộ Khớp Lệnh L2 Chuẩn Xác' : 'Tick-Accurate L2 Matching Engine'}
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  {lang === 'vi' ? 'Băm Mật Mã Lệnh SHA-256' : 'SHA-256 Cryptographic Trade Hash'}
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  {lang === 'vi' ? 'Nhận Diện Khối PD-Array ICT' : 'ICT PD-Array Detection Engine'}
                </span>
              </li>
              <li>
                <span className="text-slate-400">REST & WebSocket API</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="mt-10 pt-6 border-t border-[#1A2538] text-[11px] text-slate-400 font-sans leading-relaxed">
          <p>
            {lang === 'vi' ? (
              <>
                <strong>THÔNG BÁO PHÁP LÝ & MIỄN TRỪ TRÁCH NHIỆM:</strong> StockSim là nền tảng mô phỏng phục vụ mục đích giáo dục, nghiên cứu thị trường và xác thực học thuật. Toàn bộ số dư, phân bổ vốn, lệnh đặt, kết quả khớp lệnh, lãi và lỗ hoàn toàn là tiền ảo mô phỏng và không có rủi ro tài chính thực tế. Dữ liệu giá và sổ lệnh được thu thập trực tiếp từ luồng sàn giao dịch công khai cho mục đích học tập. StockSim không tiếp nhận tiền gửi vốn đầu tư thực và không hoạt động như một công ty chứng khoán môi giới.
              </>
            ) : (
              <>
                <strong>LEGAL NOTICE & RISK DISCLAIMER:</strong> StockSim is a simulated educational and research platform designed for academic training and skill attestation. All balances, capital allocations, orders, fills, profits, and losses are entirely virtual and carry zero real-world financial risk. Real-time market data is streamed from public exchange endpoints solely for educational benchmarking. StockSim does not accept capital deposits and does not operate as a licensed brokerage or investment adviser.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bottom Telemetry Status Bar */}
      <div className="bg-[#030509] border-t border-[#151D2C] px-4 sm:px-6 py-2.5 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span>
            {lang === 'vi'
              ? 'BẢN QUYỀN © 2026 STOCKSIM EDU. BẢO LƯU MỌI QUYỀN.'
              : 'COPYRIGHT © 2026 STOCKSIM EDU. ALL RIGHTS RESERVED.'}
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            {lang === 'vi' ? 'PHIÊN BẢN ENGINE v2.8-CHÍNH THỨC' : 'ENGINE BUILD v2.8-OFFICIAL'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-400 font-semibold">
            {lang === 'vi' ? 'LUỒNG DỮ LIỆU: BINGX / BINANCE L2 TRỰC TIẾP' : 'DATA FEED: BINGX / BINANCE L2 LIVE'}
          </span>
          <span className="text-slate-700">•</span>
          <span>{lang === 'vi' ? 'GIỜ HỆ THỐNG: UTC 14:52:10' : 'SYSTEM TIME: UTC 14:52:10'}</span>
        </div>
      </div>
    </footer>
  );
};

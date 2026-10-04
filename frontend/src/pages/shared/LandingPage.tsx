import React, { useEffect } from 'react';
import { LandingNavbar } from './landing/LandingNavbar';
import { CinematicHero } from './landing/CinematicHero';
import { DualMarketTicker } from './landing/DualMarketTicker';
import { EnterTheTerminal } from './landing/EnterTheTerminal';
import { MarketTransition } from './landing/MarketTransition';
import { CinematicLiveMarket } from './landing/CinematicLiveMarket';
import { CinematicAiMentor } from './landing/CinematicAiMentor';
import { CinematicPropFirmChallenge } from './landing/CinematicPropFirmChallenge';
import { CinematicSimulations } from './landing/CinematicSimulations';
import { CinematicVerifiedTrading } from './landing/CinematicVerifiedTrading';
import { CinematicPerformance } from './landing/CinematicPerformance';
import { CinematicTradingJournal } from './landing/CinematicTradingJournal';
import { CinematicCTA } from './landing/CinematicCTA';
import { LandingFooter } from './landing/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'StockSim - Nền Tảng Mô Phỏng & Đào Tạo Trading Chuẩn Tổ Chức';
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#080C14] text-slate-200 font-sans selection:bg-blue-500/30 selection:text-white flex flex-col antialiased">
      {/* 00. Institutional Fixed Navbar with Quick Anchors */}
      <LandingNavbar />

      <main className="flex-1 w-full">
        {/* 01. Cinematic Hero with Animated Background & Continuous Scroll Transition */}
        <CinematicHero />

        {/* 02. Dual-Layer Infinite Market Marquee */}
        <DualMarketTicker />

        {/* 03. Enter The Terminal: 4-Stage Sticky Interactive Walkthrough */}
        <EnterTheTerminal />

        {/* 04. Market Transition: Candlestick Zoom & Editorial Headline */}
        <MarketTransition />

        {/* 05. Live Market Overview: Large Dynamic Chart + Interactive Watchlist */}
        <div id="markets">
          <CinematicLiveMarket />
        </div>

        {/* KEY PILLAR 1: Senior AI Trading Tutor & Real-time Prop Coach */}
        <CinematicAiMentor />

        {/* KEY PILLAR 2: Prop Firm Funded Challenge (6 Tiers $10k - $500k) */}
        <CinematicPropFirmChallenge />

        {/* 06. Structured Simulations & Animated Competitive Leaderboard */}
        <div id="simulations">
          <CinematicSimulations />
        </div>

        {/* 07. Verified Trading & Cryptographic Evidence Attestation */}
        <div id="evidence">
          <CinematicVerifiedTrading />
        </div>

        {/* 08. Cumulative Performance Analytics & Drawing Equity Curve */}
        <div id="analytics">
          <CinematicPerformance />
        </div>

        {/* 09. Trading Journal: Post-Trade Reflection & Expandable Audits */}
        <div id="journal">
          <CinematicTradingJournal />
        </div>

        {/* 10. Final Cinematic Full-Viewport Call to Action */}
        <CinematicCTA />
      </main>

      {/* 11. Institutional Engineering Footer */}
      <LandingFooter />
    </div>
  );
};

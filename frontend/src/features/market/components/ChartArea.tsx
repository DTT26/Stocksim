import React, { useState, useEffect, useRef } from 'react';
import { init, dispose, registerOverlay } from 'klinecharts';
import type { Chart, KLineData, DataLoaderGetBarsParams, DataLoaderSubscribeBarParams } from 'klinecharts';
import { Settings2, Trash2, Edit2, Type, Minus, MoreHorizontal, Lock, Unlock, GripVertical, LayoutGrid, Pencil, Plus, ChevronRight, Copy, Settings, X, Layers, RotateCcw, Clipboard, Edit3 } from 'lucide-react';
import { generateOHLCV, getPricePrecision, timeframeToMs, getContractMultiplier, type Stock } from '../data';
import { fetchBinanceKlines, mapTimeframeToBinance, subscribeBinanceKline } from '../../../services/binanceApi';
import { fetchUnifiedKlines, subscribeUnifiedBar } from '../../../services/marketDataService';
import type { TradeOrder } from '../TradingTerminal';
import type { ChartSettings } from '../chartSettings';
import { INDICATOR_LIST } from './IndicatorModal';
import { useTheme } from '../../../contexts/ThemeContext';
import { OverlaySettingsModal, type OverlaySettings } from './OverlaySettingsModal';
import { emojiMark } from './EmojiOverlay';
import { measureOverlay } from './MeasureOverlay';
import { zoomInOverlay } from './ZoomInOverlay';
import { FibonacciSettingsModal, DEFAULT_FIBONACCI_CONFIG, type FibonacciConfig } from './FibonacciSettingsModal';
import { useI18n } from '../../../contexts/I18nContext';
import { useAuth } from '../../../contexts/AuthContext';

const COLOR_PALETTE_GRID = [
  ['#ffffff', '#e0e0e0', '#d6d6d6', '#c2c2c2', '#a8a8a8', '#8f8f8f', '#666666', '#000000'],
  ['#f23645', '#ff9800', '#ffd700', '#089981', '#26a69a', '#2962ff', '#8e7cc3', '#e91e63'],
  ['#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4c6e7', '#b4a7d6', '#d5a6bd'],
  ['#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8ea2c6', '#8e7cc3', '#c27ba0'],
  ['#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#45818e', '#674ea7', '#a64d79'],
  ['#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#1155cc', '#3b23a7', '#881b4b'],
  ['#990000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130']
];
const hexToRgba = (hex: string, alpha: number = 1) => {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
// Global reference for overlays to access chart data
let globalChartInstance: any = null;
export const getChartInstance = () => globalChartInstance;
const getTr = (key: string, fallback: string) => {
  const lang = localStorage.getItem('app_lang') || 'vi';
  const dict: Record<string, Record<string, string>> = {
    vi: {
      'chart.target': 'Mục tiêu',
      'chart.stop': 'Dừng',
      'chart.rr': 'Tỷ lệ Rủi ro/Lợi nhuận',
      'chart.addText': 'Thêm văn bản',
      'chart.bars': 'Thanh',
    },
    en: {
      'chart.target': 'Target',
      'chart.stop': 'Stop',
      'chart.rr': 'Risk/Reward Ratio',
      'chart.addText': 'Add text',
      'chart.bars': 'Bars',
    }
  };
  return dict[lang]?.[key] || fallback;
};
export const isUserDrawingOverlay = (ov: any): boolean => {
  if (!ov) return false;
  const id = typeof ov.id === 'string' ? ov.id : '';
  const name = typeof ov.name === 'string' ? ov.name : '';
  // Filter out system/automated overlays
  if (
    id.startsWith('preview_') ||
    id.startsWith('active_') ||
    id.startsWith('pending_') ||
    id.startsWith('tpsl_') ||
    name === 'tpslZone' ||
    name === 'orderTpslLine' ||
    name === 'aiCorrectionZone' ||
    name === 'aiCorrectionBox' ||
    name === 'zoomInBox'
  ) {
    return false;
  }
  return true;
};
export interface UserChartDrawing {
  id?: string;
  name: string;
  label?: string;            // Display title: e.g. "Order Block (OB)" or user-defined text
  userLabel?: string;        // Raw text annotated on the chart
  tag?: string;              // Normalized SMC tag: 'OB' | 'FVG' | 'IFVG' | 'CISD' | 'BOS' | 'CHOCH' | 'LIQUIDITY' | 'BREAKER' | 'MITIGATION' | 'VI' | 'REJECTION' | 'SUPPLY_DEMAND' | ''
  detectedConcept?: string;  // Detailed SMC concept classification
  points: Array<{
    timestamp?: number;
    price?: number;
    dataIndex?: number;
  }>;
  priceHigh?: number;
  priceLow?: number;
  priceMid?: number;
  rangeAmount?: number;
  priceStart?: number;
  priceEnd?: number;
  timeStart?: number;
  timeEnd?: number;
}

export const extractOverlayText = (ov: any): string => {
  if (!ov) return '';
  if (typeof ov.extendData === 'string' && ov.extendData.trim()) {
    return ov.extendData.trim();
  }
  if (typeof ov.extendData === 'object' && ov.extendData !== null) {
    const txt = ov.extendData.textContent || ov.extendData.text || ov.extendData.label || ov.extendData.name || ov.extendData.note;
    if (typeof txt === 'string' && txt.trim()) return txt.trim();
  }
  if (typeof ov.text === 'string' && ov.text.trim()) {
    return ov.text.trim();
  }
  const styleTxt = (ov.styles as any)?.text?.content || (ov.styles as any)?.text;
  if (typeof styleTxt === 'string' && styleTxt.trim()) {
    return styleTxt.trim();
  }
  return '';
};

export const detectSmcConcept = (text: string, overlayName: string): { tag: string; detectedConcept: string; displayLabel: string } => {
  const clean = (text || '').trim();
  const lower = clean.toLowerCase();

  // 1. INVERSION FVG (MUST BE CHECKED BEFORE FVG)
  if (/(ifvg|inversion\s*fvg|inversion|fvg\s*đảo|khoảng\s*trống\s*đảo)/i.test(lower) || lower.includes('ifvg') || lower.includes('inversion')) {
    return {
      tag: 'IFVG',
      detectedConcept: 'Inversion FVG (IFVG)',
      displayLabel: clean ? `Inversion FVG (${clean})` : 'Inversion FVG (IFVG)'
    };
  }

  // 2. CISD (Change In State of Delivery) - DO NOT CONFUSE WITH FVG!
  if (/(cisd|change\s*in\s*state\s*of\s*delivery|state\s*of\s*delivery|đổi\s*trạng\s*thái)/i.test(lower) || lower.includes('cisd')) {
    return {
      tag: 'CISD',
      detectedConcept: 'Change In State of Delivery (CISD)',
      displayLabel: clean ? `CISD (${clean})` : 'Change In State of Delivery (CISD)'
    };
  }

  // 3. VOLUME IMBALANCE (VI)
  if (/(vi|volume\s*imbalance|hở\s*thân|gap\s*thân)/i.test(lower)) {
    return {
      tag: 'VI',
      detectedConcept: 'Volume Imbalance (VI)',
      displayLabel: clean ? `Volume Imbalance (${clean})` : 'Volume Imbalance (VI)'
    };
  }

  // 4. REJECTION BLOCK (RB)
  if (/(rb|rejection\s*block|rejection|râu\s*từ\s*chối)/i.test(lower)) {
    return {
      tag: 'REJECTION',
      detectedConcept: 'Rejection Block',
      displayLabel: clean ? `Rejection Block (${clean})` : 'Rejection Block'
    };
  }

  // 5. FAIR VALUE GAP (FVG)
  if (/(fvg|fair\s*value\s*gap|imbalance|khoảng\s*trống|mất\s*cân\s*bằng)/i.test(lower)) {
    return {
      tag: 'FVG',
      detectedConcept: 'Fair Value Gap (FVG)',
      displayLabel: clean ? `Fair Value Gap (${clean})` : 'Fair Value Gap (FVG)'
    };
  }

  // 6. ORDER BLOCK (OB)
  if (/(ob|order\s*block|orderblock|khối\s*lệnh|khe\s*lệnh)/i.test(lower)) {
    return {
      tag: 'OB',
      detectedConcept: 'Order Block (OB)',
      displayLabel: clean ? `Order Block (${clean})` : 'Order Block (OB)'
    };
  }

  // 7. BOS / MSS / CHOCH
  if (/(bos|break\s*of\s*structure|phá\s*vỡ\s*cấu\s*trúc)/i.test(lower)) {
    return {
      tag: 'BOS',
      detectedConcept: 'Break of Structure (BOS)',
      displayLabel: clean ? `Break of Structure (${clean})` : 'Break of Structure (BOS)'
    };
  }
  if (/(choch|ch|change\s*of\s*character|đổi\s*tính\s*chất|mss)/i.test(lower)) {
    return {
      tag: 'CHOCH',
      detectedConcept: 'Change of Character (CHoCH)',
      displayLabel: clean ? `Change of Character (${clean})` : 'Change of Character (CHoCH)'
    };
  }

  // 8. LIQUIDITY
  if (/(liq|liquidity|bsl|ssl|pool|thanh\s*khoản)/i.test(lower)) {
    return {
      tag: 'LIQUIDITY',
      detectedConcept: 'Liquidity Pool (Thanh khoản)',
      displayLabel: clean ? `Liquidity (${clean})` : 'Liquidity Pool (Thanh khoản)'
    };
  }

  // 9. BREAKER BLOCK
  if (/(bearish\s*breaker|breaker\s*giảm)/i.test(lower)) {
    return {
      tag: 'BREAKER',
      detectedConcept: 'Bearish Breaker Block',
      displayLabel: clean ? `Bearish Breaker (${clean})` : 'Bearish Breaker Block'
    };
  }
  if (/(bullish\s*breaker|breaker\s*tăng)/i.test(lower)) {
    return {
      tag: 'BREAKER',
      detectedConcept: 'Bullish Breaker Block',
      displayLabel: clean ? `Bullish Breaker (${clean})` : 'Bullish Breaker Block'
    };
  }
  if (/(bb|breaker|breaker\s*block)/i.test(lower)) {
    return {
      tag: 'BREAKER',
      detectedConcept: 'Breaker Block',
      displayLabel: clean ? `Breaker Block (${clean})` : 'Breaker Block'
    };
  }

  // 10. MITIGATION BLOCK
  if (/(mb|mitigation|mitigation\s*block)/i.test(lower)) {
    return {
      tag: 'MITIGATION',
      detectedConcept: 'Mitigation Block',
      displayLabel: clean ? `Mitigation Block (${clean})` : 'Mitigation Block'
    };
  }

  // 11. SUPPLY / DEMAND
  if (/(sd|supply|demand|cung|cầu)/i.test(lower)) {
    return {
      tag: 'SUPPLY_DEMAND',
      detectedConcept: 'Vùng Cung / Cầu (Supply / Demand)',
      displayLabel: clean ? `Supply/Demand (${clean})` : 'Vùng Cung / Cầu (Supply/Demand)'
    };
  }

  const nameMap: Record<string, string> = {
    rect: 'Hộp Vùng Giá (Rectangle)',
    segment: 'Đường Xu Hướng (Trendline)',
    straightLine: 'Đường Kẻ Dài (Straight Line)',
    rayLine: 'Tia Xu Hướng (Ray Line)',
    horizontalStraightLine: 'Mức Giá Ngang (Support/Resistance)',
    fibonacciLine: 'Mức Hồi Quy Fibonacci (Fibonacci)',
    priceChannelLine: 'Kênh Giá Song Song (Parallel Channel)',
    simpleAnnotation: 'Văn Bản Chú Thích (Annotation)',
  };

  const defaultName = nameMap[overlayName] || overlayName;
  return {
    tag: clean ? 'CUSTOM' : '',
    detectedConcept: clean || defaultName,
    displayLabel: clean ? `${defaultName}: "${clean}"` : defaultName
  };
};

export const getChartDrawingsData = (): { drawings: UserChartDrawing[]; klines: any[] } => {
  if (!globalChartInstance) return { drawings: [], klines: [] };
  try {
    const rawOverlays = typeof globalChartInstance.getOverlays === 'function'
      ? globalChartInstance.getOverlays()
      : [];
    const klines = typeof globalChartInstance.getDataList === 'function'
      ? (globalChartInstance.getDataList() || []).slice(-120)
      : [];

    const allUserOverlays = (Array.isArray(rawOverlays) ? rawOverlays : []).filter(isUserDrawingOverlay);
    const annotationOverlays = allUserOverlays.filter((ov: any) =>
      ['simpleAnnotation', 'comment', 'note', 'callout', 'priceNote', 'signpost'].includes(ov.name)
    );

    const drawings: UserChartDrawing[] = [];
    allUserOverlays.forEach((ov: any) => {
      const pts = (ov.points || []).map((p: any) => ({
        timestamp: p.timestamp,
        price: p.value !== undefined ? p.value : p.price,
        dataIndex: p.dataIndex
      }));
      if (pts.length > 0) {
        const prices = pts.map((p: any) => p.price).filter((v: any) => typeof v === 'number');
        const priceHigh = prices.length > 0 ? Math.max(...prices) : undefined;
        const priceLow = prices.length > 0 ? Math.min(...prices) : undefined;
        const priceMid = (priceHigh !== undefined && priceLow !== undefined) ? (priceHigh + priceLow) / 2 : undefined;
        const rangeAmount = (priceHigh !== undefined && priceLow !== undefined) ? Math.abs(priceHigh - priceLow) : undefined;

        // 1. Extract text from overlay's own extendData / text / style
        let rawText = extractOverlayText(ov);

        // 2. If no direct text, check if any annotation overlay sits near or inside this zone
        if (!rawText && priceHigh !== undefined && priceLow !== undefined) {
          const margin = rangeAmount ? rangeAmount * 0.35 : (priceHigh * 0.015);
          const nearbyAnn = annotationOverlays.find((ann: any) => {
            if (ann.id === ov.id) return false;
            const annPts = ann.points || [];
            const annPrice = annPts[0]?.value !== undefined ? annPts[0].value : annPts[0]?.price;
            if (typeof annPrice === 'number') {
              return annPrice >= (priceLow - margin) && annPrice <= (priceHigh + margin);
            }
            return false;
          });
          if (nearbyAnn) {
            rawText = extractOverlayText(nearbyAnn);
          }
        }

        const { tag, detectedConcept, displayLabel } = detectSmcConcept(rawText, ov.name);

        drawings.push({
          id: ov.id,
          name: ov.name,
          label: displayLabel,
          userLabel: rawText,
          tag,
          detectedConcept,
          points: pts,
          priceHigh,
          priceLow,
          priceMid,
          rangeAmount,
          priceStart: pts[0]?.price,
          priceEnd: pts[pts.length - 1]?.price,
          timeStart: pts[0]?.timestamp,
          timeEnd: pts[pts.length - 1]?.timestamp
        });
      }
    });

    return { drawings, klines };
  } catch (err) {
    console.error('Error getting chart drawings data:', err);
    return { drawings: [], klines: [] };
  }
};


registerOverlay({
  name: 'aiCorrectionZone',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    if (!coordinates || coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const isCisd = overlay?.extendData?.isLine === true ||
                   overlay?.extendData?.type?.toUpperCase().includes('CISD') || 
                   overlay?.extendData?.name?.toUpperCase().includes('CISD') ||
                   overlay?.extendData?.label?.toUpperCase().includes('CISD') ||
                   (overlay?.extendData?.priceHigh !== undefined && overlay?.extendData?.priceLow !== undefined && Math.abs(overlay.extendData.priceHigh - overlay.extendData.priceLow) < 0.001);

    const label = overlay?.extendData?.label || overlay?.extendData?.name || overlay?.text || (isCisd ? '🎯 AI: CISD' : '🎯 AI: Order Block (OB)');
    const priceText = overlay?.extendData?.priceText ? ` (${overlay.extendData.priceText})` : '';
    const badgeText = (label.includes('(') || label.includes('$')) ? label : `${label}${priceText}`;

    // If it's CISD: Render as 1 single horizontal reference line (NOT a box/zone)
    if (isCisd) {
      const lineY = (minY + maxY) / 2;
      const isBullish = overlay?.extendData?.type?.toUpperCase().includes('BULLISH');
      const lineColor = isBullish ? '#10b981' : '#ef4444';
      const badgeBg = isBullish ? '#059669' : '#dc2626';

      return [
        // 1. Single solid reference ray line
        {
          type: 'line',
          attrs: {
            coordinates: [
              { x: minX, y: lineY },
              { x: Math.max(maxX + 150, minX + 320), y: lineY }
            ]
          },
          styles: {
            style: 'solid',
            color: lineColor,
            size: 2.5
          }
        },
        // 2. Dashed forward extension
        {
          type: 'line',
          attrs: {
            coordinates: [
              { x: Math.max(maxX + 150, minX + 320), y: lineY },
              { x: Math.max(maxX + 500, minX + 650), y: lineY }
            ]
          },
          styles: {
            style: 'dashed',
            color: lineColor,
            size: 1.5,
            dashedValue: [6, 4]
          }
        },
        // 3. Anchor dot at starting trigger candle Open
        {
          type: 'circle',
          attrs: {
            x: minX,
            y: lineY,
            r: 4
          },
          styles: {
            style: 'fill',
            color: lineColor
          }
        },
        // 4. Badge label attached directly to the single CISD line
        {
          type: 'text',
          attrs: {
            x: minX + 8,
            y: lineY - 6,
            text: badgeText,
            align: 'left',
            baseline: 'bottom'
          },
          styles: {
            color: '#ffffff',
            backgroundColor: badgeBg,
            borderRadius: 4,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 2,
            paddingBottom: 2,
            size: 11,
            family: 'Inter, system-ui, sans-serif',
            weight: 'bold'
          }
        }
      ];
    }

    // Default: Shaded polygon box zone with dashed border
    const figures: any[] = [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY }
          ]
        },
        styles: {
          style: 'stroke_fill',
          color: 'rgba(245, 158, 11, 0.22)',
          borderColor: '#f59e0b',
          borderSize: 2,
          borderStyle: 'dashed'
        }
      },
      {
        type: 'text',
        attrs: {
          x: minX + 6,
          y: minY > 30 ? minY - 8 : minY + 14,
          text: badgeText,
          align: 'left',
          baseline: minY > 30 ? 'bottom' : 'top'
        },
        styles: {
          color: '#ffffff',
          backgroundColor: '#d97706',
          borderRadius: 4,
          paddingLeft: 7,
          paddingRight: 7,
          paddingTop: 3,
          paddingBottom: 3,
          size: 11,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold'
        }
      }
    ];
    return figures;
  }

});

let globalTriggerAutoSave: (() => void) | null = null;

export const removeChartDrawing = (overlayId: string) => {
  const chart = globalChartInstance || (typeof window !== 'undefined' ? (window as any).__STOCKSIM_CHART__ : null);
  if (!chart || !overlayId) return;
  try {
    chart.removeOverlay({ id: overlayId });
    if (globalTriggerAutoSave) {
      globalTriggerAutoSave();
    }
    window.dispatchEvent(new CustomEvent('stocksim-drawings-changed', { detail: { removedId: overlayId } }));
  } catch (err) {
    console.error('Error removing chart drawing:', err);
  }
};

export const clearAllChartDrawings = () => {
  const chart = globalChartInstance || (typeof window !== 'undefined' ? (window as any).__STOCKSIM_CHART__ : null);
  if (!chart) return;
  try {
    const raw = typeof chart.getOverlays === 'function' ? chart.getOverlays() : [];
    if (Array.isArray(raw)) {
      raw.forEach((ov: any) => {
        if (isUserDrawingOverlay(ov)) {
          chart.removeOverlay({ id: ov.id });
        }
      });
    }
    try {
      chart.removeOverlay({ name: 'aiCorrectionZone' });
    } catch (_) {}

    if (globalTriggerAutoSave) {
      globalTriggerAutoSave();
    }
    window.dispatchEvent(new CustomEvent('stocksim-drawings-changed', { detail: { cleared: true } }));
  } catch (err) {
    console.error('Error clearing all chart drawings:', err);
  }
};

export const clearAiCorrectionOverlay = () => {
  const chart = globalChartInstance || (typeof window !== 'undefined' ? (window as any).__STOCKSIM_CHART__ : null);
  if (!chart) return;
  try {
    chart.removeOverlay({ name: 'aiCorrectionZone' });
  } catch (err) {
    console.error('Error removing AI correction overlay:', err);
  }
};
export const drawAiCorrectionOverlay = (suggestedZone: {
  priceHigh: number;
  priceLow: number;
  price?: number;
  isLine?: boolean;
  startTimestamp?: number;
  endTimestamp?: number;
  userTimeStart?: number;
  userTimeEnd?: number;
  label?: string;
  type?: string;
  name?: string;
  explanation?: string;
}) => {
  const chart = globalChartInstance || (typeof window !== 'undefined' ? (window as any).__STOCKSIM_CHART__ : null);
  if (!chart) return null;
  try {
    // Clear any previous AI correction zone
    try {
      chart.removeOverlay({ name: 'aiCorrectionZone' });
    } catch (_) {}

    const klines: any[] = (chart.getDataList && chart.getDataList()) || [];
    const lastKline = klines[klines.length - 1];

    let t1 = suggestedZone.startTimestamp || suggestedZone.userTimeStart;
    let t2 = suggestedZone.endTimestamp || suggestedZone.userTimeEnd;

    const zHigh = suggestedZone.priceHigh;
    const zLow = suggestedZone.priceLow;
    const zType = String(suggestedZone.type || suggestedZone.name || '').toUpperCase();

    // Scan klines if t1 is missing: SCAN FROM NEWEST CANDLES BACKWARD (or near userTimeStart), NOT from August!
    const anchorTime = suggestedZone.userTimeStart;
    if (!t1 && klines.length >= 2) {
      // 1. If FVG, scan 3-candle sequence backwards
      if (zType.includes('FVG') || zType.includes('FAIR VALUE') || zType.includes('GAP') || zType.includes('IMBALANCE')) {
        let bestCandidateTs: number | undefined;
        let minTimeDiff = Infinity;
        for (let i = klines.length - 2; i >= 1; i--) {
          const c1 = klines[i - 1];
          const c3 = klines[i + 1];
          const h1 = c1.high;
          const l3 = c3.low;
          let matched = false;
          if (typeof h1 === 'number' && typeof l3 === 'number') {
            if (Math.abs(h1 - zLow) / Math.max(1, zLow) < 0.06 && Math.abs(l3 - zHigh) / Math.max(1, zHigh) < 0.06) {
              matched = true;
            }
          }
          const l1 = c1.low;
          const h3 = c3.high;
          if (typeof l1 === 'number' && typeof h3 === 'number') {
            if (Math.abs(l1 - zHigh) / Math.max(1, zHigh) < 0.06 && Math.abs(h3 - zLow) / Math.max(1, zLow) < 0.06) {
              matched = true;
            }
          }
          if (matched) {
            if (anchorTime) {
              const diff = Math.abs(c1.timestamp - anchorTime);
              if (diff < minTimeDiff) {
                minTimeDiff = diff;
                bestCandidateTs = c1.timestamp;
              }
            } else {
              bestCandidateTs = c1.timestamp;
              break;
            }
          }
        }
        if (bestCandidateTs) t1 = bestCandidateTs;
      }

      // 2. If Order Block, scan for the exact OB candle backwards
      if (!t1 && (zType.includes('ORDER BLOCK') || zType.includes('OB') || zType.includes('BLOCK'))) {
        let bestCandidateTs: number | undefined;
        let minTimeDiff = Infinity;
        for (let i = klines.length - 1; i >= 1; i--) {
          const c = klines[i - 1];
          if (typeof c.high === 'number' && typeof c.low === 'number') {
            const hMatch = Math.abs(c.high - zHigh) / Math.max(1, zHigh) < 0.06;
            const lMatch = Math.abs(c.low - zLow) / Math.max(1, zLow) < 0.06;
            if (hMatch || lMatch) {
              if (anchorTime) {
                const diff = Math.abs(c.timestamp - anchorTime);
                if (diff < minTimeDiff) {
                  minTimeDiff = diff;
                  bestCandidateTs = c.timestamp;
                }
              } else {
                bestCandidateTs = c.timestamp;
                break;
              }
            }
          }
        }
        if (bestCandidateTs) t1 = bestCandidateTs;
      }

      // 3. Fallback: match any swing candle backwards
      if (!t1) {
        for (let i = klines.length - 1; i >= 0; i--) {
          const c = klines[i];
          if (typeof c.high === 'number' && typeof c.low === 'number') {
            if (Math.abs(c.high - zHigh) / Math.max(1, zHigh) < 0.04 || Math.abs(c.low - zLow) / Math.max(1, zLow) < 0.04) {
              t1 = c.timestamp;
              break;
            }
          }
        }
      }
    }

    const finalT1: number = t1 || (klines[Math.max(0, klines.length - 15)]?.timestamp) || (Date.now() - 3600000 * 4);
    const finalT2: number = (!t2 || t2 <= finalT1)
      ? ((lastKline?.timestamp && lastKline.timestamp > finalT1) ? lastKline.timestamp : (finalT1 + 3600000 * 24 * 7))
      : t2;

    // Determine colors according to concept
    let fillColor = 'rgba(245, 158, 11, 0.22)';
    let borderColor = '#f59e0b';
    if (zType.includes('BULLISH') || zType.includes('TĂNG')) {
      fillColor = 'rgba(16, 185, 129, 0.22)'; // Emerald
      borderColor = '#10b981';
    } else if (zType.includes('BEARISH') || zType.includes('GIẢM')) {
      fillColor = 'rgba(239, 68, 68, 0.22)'; // Red
      borderColor = '#ef4444';
    } else if (zType.includes('LIQUIDITY') || zType.includes('BSL') || zType.includes('SSL')) {
      fillColor = 'rgba(59, 130, 246, 0.22)'; // Blue
      borderColor = '#3b82f6';
    }

    const isCisd = suggestedZone.isLine === true || 
                   zType.includes('CISD') || 
                   suggestedZone.name?.toUpperCase().includes('CISD') ||
                   (suggestedZone.priceHigh !== undefined && suggestedZone.priceLow !== undefined && Math.abs(suggestedZone.priceHigh - suggestedZone.priceLow) < 0.001);

    const cisdPrice = suggestedZone.price ?? suggestedZone.priceHigh ?? suggestedZone.priceLow;
    const finalHigh = isCisd ? cisdPrice : suggestedZone.priceHigh;
    const finalLow = isCisd ? cisdPrice : suggestedZone.priceLow;

    const zoneLabel = suggestedZone.label || (suggestedZone.type ? `🎯 AI: ${suggestedZone.type}` : (suggestedZone.name ? `🎯 AI: ${suggestedZone.name}` : (isCisd ? '🎯 AI: CISD' : '🎯 AI: Vùng Chuẩn')));
    const priceText = isCisd 
      ? `$${Number(cisdPrice).toLocaleString('en-US')}` 
      : `$${suggestedZone.priceLow?.toLocaleString('en-US')} - $${suggestedZone.priceHigh?.toLocaleString('en-US')}`;

    const newId = chart.createOverlay({
      name: 'aiCorrectionZone',
      points: [
        { timestamp: finalT1, value: finalHigh },
        { timestamp: finalT2, value: finalLow }
      ],
      extendData: {
        label: zoneLabel,
        name: suggestedZone.name,
        type: suggestedZone.type,
        priceText,
        priceHigh: suggestedZone.priceHigh,
        priceLow: suggestedZone.priceLow,
        explanation: suggestedZone.explanation
      },
      styles: {
        rect: {
          style: 'stroke_fill',
          color: fillColor,
          borderColor: borderColor,
          borderSize: 2,
          borderStyle: 'dashed'
        }
      },
      lock: false
    });
    return newId;
  } catch (err) {
    console.error('Error drawing AI correction overlay:', err);
    return null;
  }
};
// ÄÄƒng kĂ½ cĂ¡c cĂ´ng cá»¥ SĂ³ng Elliott
const createElliottOverlay = (name: string, step: number, labels: string[]) => ({
  name,
  totalStep: step,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }: any) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff', size: 2 } });
    }
    coordinates.forEach((coord: any, i: number) => {
      if (labels[i]) {
        figures.push({
          type: 'text',
          attrs: { x: coord.x, y: coord.y, text: labels[i] },
          styles: { color: '#fff', backgroundColor: '#2962ff', paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 4 }
        });
      }
    });
    return figures;
  }
});
registerOverlay(createElliottOverlay('elliottWave', 7, ['', '1', '2', '3', '4', '5']));
registerOverlay(createElliottOverlay('elliottCorrection', 5, ['', 'A', 'B', 'C']));
registerOverlay(createElliottOverlay('elliottTriangle', 7, ['', 'A', 'B', 'C', 'D', 'E']));
registerOverlay(createElliottOverlay('elliottDoubleCombo', 5, ['', 'W', 'X', 'Y']));
registerOverlay(createElliottOverlay('elliottTripleCombo', 7, ['', 'W', 'X', 'Y', 'X', 'Z']));
// Quáº£n lĂ½ tráº¡ng thĂ¡i kĂ©o co giĂ£n 4 cáº¡nh cá»§a HĂ¬nh chá»¯ nháº­t (rect)
export const handleOverlayPreventRightClickRemove = (event: any) => {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  return true;
};
const rectDragStateMap: Record<string, {
  handle: 'midTop' | 'midBottom' | 'midLeft' | 'midRight';
  orig0: { timestamp?: number; value?: number; dataIndex?: number };
  orig1: { timestamp?: number; value?: number; dataIndex?: number };
  isP0Top: boolean;
  isP0Left: boolean;
}> = {};
export const isOverlayInteracting = (overlay: any, chart?: any): boolean => {
  if (!overlay) return false;
  // 1. Being dragged/resized via handle
  if (rectDragStateMap && rectDragStateMap[overlay.id]) return true;
  // 2. Currently being drawn (step 1 or 2)
  if (typeof overlay.isDrawing === 'function' && overlay.isDrawing()) return true;
  if (typeof overlay.currentStep === 'number' && overlay.currentStep > 0 && typeof overlay.totalStep === 'number' && overlay.currentStep < overlay.totalStep) {
    return true;
  }
  // 3. Hovered or Clicked in KlineCharts chartStore
  const c = chart || globalChartInstance || (window as any).__currentKlineChart;
  if (c && typeof c.getChartStore === 'function') {
    try {
      const store = c.getChartStore();
      const clickInfo = store?.getClickOverlayInfo?.();
      if (clickInfo?.overlay?.id === overlay.id && clickInfo?.figureType !== 'none') {
        return true;
      }
      const hoverInfo = store?.getHoverOverlayInfo?.();
      if (hoverInfo?.overlay?.id === overlay.id && hoverInfo?.figureType !== 'none') {
        return true;
      }
    } catch (e) {}
  }
  // 4. Currently selected in floating toolbar
  if ((window as any).__selectedOverlayId === overlay.id) {
    return true;
  }
  return false;
};
export function handleRectPressedMoveStart(event: any) {
  const allowedNames = ['rect', 'gannBox', 'priceRange', 'timeRange', 'timePriceRange'];
  if (!event.overlay || !allowedNames.includes(event.overlay.name) || !event.overlay.points || event.overlay.points.length < 2) return;
  const chart = event.chart || (window as any).__currentKlineChart;
  if (!chart) return;
  const pts = event.overlay.points;
  const orig0 = { ...pts[0] };
  const orig1 = { ...pts[1] };
  const coords = chart.convertToPixel([orig0, orig1], { paneId: 'candle_pane' });
  if (!coords || coords.length < 2) return;
  const minX = Math.min(coords[0].x, coords[1].x);
  const maxX = Math.max(coords[0].x, coords[1].x);
  const minY = Math.min(coords[0].y, coords[1].y);
  const maxY = Math.max(coords[0].y, coords[1].y);
  const midTop = { x: (minX + maxX) / 2, y: minY };
  const midBottom = { x: (minX + maxX) / 2, y: maxY };
  const midLeft = { x: minX, y: (minY + maxY) / 2 };
  const midRight = { x: maxX, y: (minY + maxY) / 2 };
  const mouseX = event.x ?? event.clientX;
  const mouseY = event.y ?? event.clientY;
  if (typeof mouseX !== 'number' || typeof mouseY !== 'number') return;
  const distToCorners = [
    Math.hypot(mouseX - coords[0].x, mouseY - coords[0].y),
    Math.hypot(mouseX - coords[1].x, mouseY - coords[1].y),
    Math.hypot(mouseX - coords[0].x, mouseY - coords[1].y),
    Math.hypot(mouseX - coords[1].x, mouseY - coords[0].y)
  ];
  const minCornerDist = Math.min(...distToCorners);
  const dist = (p: { x: number; y: number }) => Math.hypot(mouseX - p.x, mouseY - p.y);
  const dTop = dist(midTop);
  const dBottom = dist(midBottom);
  const dLeft = dist(midLeft);
  const dRight = dist(midRight);
  const minDist = Math.min(dTop, dBottom, dLeft, dRight);
  const HIT_THRESHOLD = 25; // 25px vĂ¹ng cháº¡m quanh Ă´ vuĂ´ng
  if (minDist <= HIT_THRESHOLD && minDist < minCornerDist) {
    let handle: 'midTop' | 'midBottom' | 'midLeft' | 'midRight' = 'midTop';
    if (minDist === dTop) handle = 'midTop';
    else if (minDist === dBottom) handle = 'midBottom';
    else if (minDist === dLeft) handle = 'midLeft';
    else if (minDist === dRight) handle = 'midRight';
    rectDragStateMap[event.overlay.id] = {
      handle,
      orig0,
      orig1,
      isP0Top: (orig0.value ?? 0) >= (orig1.value ?? 0),
      isP0Left: (orig0.timestamp ?? 0) <= (orig1.timestamp ?? 0)
    };
  } else {
    delete rectDragStateMap[event.overlay.id];
  }
};
export function handleRectPressedMoving(event: any) {
  const allowedNames = ['rect', 'gannBox', 'priceRange', 'timeRange', 'timePriceRange'];
  if (!event.overlay || !allowedNames.includes(event.overlay.name)) return false;
  const state = rectDragStateMap[event.overlay.id];
  if (!state) return false;
  const chart = event.chart || (window as any).__currentKlineChart;
  if (!chart) return false;
  const { handle, orig0, orig1, isP0Top, isP0Left } = state;
  const mouseX = event.x;
  const mouseY = event.y;
  let mousePrice = event.value;
  let mouseTimestamp = event.timestamp;
  if (typeof mouseX === 'number' && typeof mouseY === 'number') {
    const converted = chart.convertFromPixel([{ x: mouseX, y: mouseY }], { paneId: 'candle_pane' });
    if (converted && converted[0]) {
      if (typeof converted[0].value === 'number') mousePrice = converted[0].value;
      if (typeof converted[0].timestamp === 'number') mouseTimestamp = converted[0].timestamp;
    }
  }
  if (typeof mousePrice !== 'number' || typeof mouseTimestamp !== 'number') return false;
  const p0 = { ...orig0 };
  const p1 = { ...orig1 };
  if (handle === 'midTop') {
    if (isP0Top) {
      p0.value = mousePrice;
      p1.value = orig1.value;
    } else {
      p1.value = mousePrice;
      p0.value = orig0.value;
    }
    p0.timestamp = orig0.timestamp;
    p1.timestamp = orig1.timestamp;
  } else if (handle === 'midBottom') {
    if (isP0Top) {
      p1.value = mousePrice;
      p0.value = orig0.value;
    } else {
      p0.value = mousePrice;
      p1.value = orig1.value;
    }
    p0.timestamp = orig0.timestamp;
    p1.timestamp = orig1.timestamp;
  } else if (handle === 'midLeft') {
    if (isP0Left) {
      p0.timestamp = mouseTimestamp;
      p1.timestamp = orig1.timestamp;
    } else {
      p1.timestamp = mouseTimestamp;
      p0.timestamp = orig0.timestamp;
    }
    p0.value = orig0.value;
    p1.value = orig1.value;
  } else if (handle === 'midRight') {
    if (isP0Left) {
      p1.timestamp = mouseTimestamp;
      p0.timestamp = orig0.timestamp;
    } else {
      p0.timestamp = mouseTimestamp;
      p1.timestamp = orig1.timestamp;
    }
    p0.value = orig0.value;
    p1.value = orig1.value;
  }
  event.overlay.points[0] = p0;
  event.overlay.points[1] = p1;
  chart.overrideOverlay({
    id: event.overlay.id,
    points: [p0, p1]
  });
  return true;
};
export function handleRectPressedMoveEnd(event: any) {
  if (event.overlay && rectDragStateMap[event.overlay.id]) {
    const chart = event.chart || (window as any).__currentKlineChart;
    if (chart && event.overlay.points) {
      chart.overrideOverlay({
        id: event.overlay.id,
        points: event.overlay.points
      });
    }
    delete rectDragStateMap[event.overlay.id];
  }
};

// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ Hình chữ nhật (rect)
registerOverlay({
  name: 'gannBox',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  onPressedMoveStart: handleRectPressedMoveStart,
  onPressedMoving: handleRectPressedMoving,
  onPressedMoveEnd: handleRectPressedMoveEnd,
  createPointFigures: ({ coordinates, overlay, chart }: any) => {
    if (coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const borderStyles = { color: '#2962ff', size: 1 };
    const figures: any[] = [
      { type: 'polygon', attrs: { coordinates: [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }] }, styles: { style: 'fill', color: 'rgba(41, 98, 255, 0.05)' } },
      { type: 'line', attrs: { coordinates: [{ x: minX, y: minY }, { x: maxX, y: minY }] }, styles: borderStyles },
      { type: 'line', attrs: { coordinates: [{ x: maxX, y: minY }, { x: maxX, y: maxY }] }, styles: borderStyles },
      { type: 'line', attrs: { coordinates: [{ x: maxX, y: maxY }, { x: minX, y: maxY }] }, styles: borderStyles },
      { type: 'line', attrs: { coordinates: [{ x: minX, y: maxY }, { x: minX, y: minY }] }, styles: borderStyles },
      // X cross lines
      { type: 'line', attrs: { coordinates: [{ x: minX, y: minY }, { x: maxX, y: maxY }] }, styles: { color: 'rgba(41, 98, 255, 0.5)' } },
      { type: 'line', attrs: { coordinates: [{ x: maxX, y: minY }, { x: minX, y: maxY }] }, styles: { color: 'rgba(41, 98, 255, 0.5)' } },
      // Middle cross lines
      { type: 'line', attrs: { coordinates: [{ x: (minX + maxX) / 2, y: minY }, { x: (minX + maxX) / 2, y: maxY }] }, styles: { color: 'rgba(41, 98, 255, 0.5)' } },
      { type: 'line', attrs: { coordinates: [{ x: minX, y: (minY + maxY) / 2 }, { x: maxX, y: (minY + maxY) / 2 }] }, styles: { color: 'rgba(41, 98, 255, 0.5)' } },
    ];
    const fractions = [0.25, 0.382, 0.618, 0.75];
    fractions.forEach(f => {
      const y = minY + (maxY - minY) * f;
      figures.push({ type: 'line', attrs: { coordinates: [{ x: minX, y }, { x: maxX, y }] }, styles: { color: 'rgba(41, 98, 255, 0.3)', style: 'dashed' } });
      const x = minX + (maxX - minX) * f;
      figures.push({ type: 'line', attrs: { coordinates: [{ x, y: minY }, { x, y: maxY }] }, styles: { color: 'rgba(41, 98, 255, 0.3)', style: 'dashed' } });
    });
    if (isOverlayInteracting(overlay, chart)) {
      const midTop = { x: (minX + maxX) / 2, y: minY };
      const midRight = { x: maxX, y: (minY + maxY) / 2 };
      const midBottom = { x: (minX + maxX) / 2, y: maxY };
      const midLeft = { x: minX, y: (minY + maxY) / 2 };
      [
        { p: midTop, key: 'midTop' },
        { p: midRight, key: 'midRight' },
        { p: midBottom, key: 'midBottom' },
        { p: midLeft, key: 'midLeft' }
      ].forEach(({ p, key }) => {
        figures.push({
          key,
          type: 'polygon',
          ignoreEvent: false,
          attrs: {
            isHandle: key,
            coordinates: [
              { x: p.x - 6, y: p.y - 6 },
              { x: p.x + 6, y: p.y - 6 },
              { x: p.x + 6, y: p.y + 6 },
              { x: p.x - 6, y: p.y + 6 }
            ]
          },
          styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
        });
      });
    }
    // Support text overlay if user types on the gannBox
    let textStr = '';
    if (typeof overlay?.extendData === 'string') textStr = overlay.extendData;
    else if (typeof overlay?.text === 'string') textStr = overlay.text;
    if (textStr) {
      figures.push({
        type: 'text',
        attrs: { x: (minX + maxX) / 2, y: minY - 10, text: textStr, align: 'center', baseline: 'bottom' },
        styles: { color: '#ffffff', size: 14, family: 'Inter', backgroundColor: '#2962ff', borderRadius: 4, paddingLeft: 4, paddingRight: 4 }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Khoáº£ng GiĂ¡ (priceRange)
registerOverlay({
  name: 'priceRange',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  onPressedMoveStart: handleRectPressedMoveStart,
  onPressedMoving: handleRectPressedMoving,
  onPressedMoveEnd: handleRectPressedMoveEnd,
  createPointFigures: ({ coordinates, yAxis, overlay, chart }: any) => {
    try {
      if (coordinates.length >= 2) {
        const p1 = coordinates[0];
        const p2 = coordinates[1];
        const leftX = Math.min(p1.x, p2.x);
        const rightX = Math.max(p1.x, p2.x);
        const topY = Math.min(p1.y, p2.y);
        const btmY = Math.max(p1.y, p2.y);
        let valDif = 0;
        let pctDif = 0;
        if (yAxis?.convertFromPixel) {
          const v1 = yAxis.convertFromPixel(p1.y);
          const v2 = yAxis.convertFromPixel(p2.y);
          valDif = v2 - v1;
          if (v1 !== 0) pctDif = (valDif / Math.abs(v1)) * 100;
        }
        const figures: any[] = [];
        const borderStyles = { color: '#2196f3', size: 1 };
        figures.push({
          type: 'polygon',
          attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }, { x: rightX, y: btmY }, { x: leftX, y: btmY }] },
          styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.2)' }
        });
        figures.push(
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: topY }, { x: rightX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: btmY }, { x: leftX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: btmY }, { x: leftX, y: topY }] }, styles: borderStyles }
        );
        figures.push({ type: 'line', attrs: { coordinates: [{ x: leftX, y: p1.y }, { x: rightX, y: p1.y }] }, styles: { color: '#2196f3', style: 'dashed' } });
        figures.push({ type: 'line', attrs: { coordinates: [{ x: leftX, y: p2.y }, { x: rightX, y: p2.y }] }, styles: { color: '#2196f3', style: 'dashed' } });
        const text = `${valDif > 0 ? '+' : ''}${valDif.toFixed(2)} (${valDif > 0 ? '+' : ''}${pctDif.toFixed(2)}%)`;
        figures.push({
          type: 'text',
          attrs: { x: (leftX + rightX) / 2, y: topY - 10, text, align: 'center', baseline: 'bottom' },
          styles: { color: '#ffffff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }
        });
        if (isOverlayInteracting(overlay, chart)) {
          const midTop = { x: (leftX + rightX) / 2, y: topY };
          const midRight = { x: rightX, y: (topY + btmY) / 2 };
          const midBottom = { x: (leftX + rightX) / 2, y: btmY };
          const midLeft = { x: leftX, y: (topY + btmY) / 2 };
          [
            { p: midTop, key: 'midTop' },
            { p: midRight, key: 'midRight' },
            { p: midBottom, key: 'midBottom' },
            { p: midLeft, key: 'midLeft' }
          ].forEach(({ p, key }) => {
            figures.push({
              key,
              type: 'polygon',
              ignoreEvent: false,
              attrs: {
                isHandle: key,
                coordinates: [
                  { x: p.x - 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y + 6 },
                  { x: p.x - 6, y: p.y + 6 }
                ]
              },
              styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2196f3', borderSize: 2 }
            });
          });
        }
        return figures;
      }
    } catch (e: any) {
      if (coordinates.length > 0) {
        return [{ type: 'text', attrs: { x: coordinates[0].x, y: coordinates[0].y, text: 'Lá»—i: ' + e.message } }];
      }
    }
    return [];
  }
});
// ÄÄƒng kĂ½ Khoáº£ng thá»i gian (timeRange)
registerOverlay({
  name: 'timeRange',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  onPressedMoveStart: handleRectPressedMoveStart,
  onPressedMoving: handleRectPressedMoving,
  onPressedMoveEnd: handleRectPressedMoveEnd,
  createPointFigures: ({ coordinates, xAxis, overlay, chart }: any) => {
    try {
      if (coordinates.length >= 2) {
        const p1 = coordinates[0];
        const p2 = coordinates[1];
        const leftX = Math.min(p1.x, p2.x);
        const rightX = Math.max(p1.x, p2.x);
        const topY = Math.min(p1.y, p2.y);
        const btmY = Math.max(p1.y, p2.y);
        let barCount = 0;
        if (xAxis?.convertFromPixel) {
          const d1 = xAxis.convertFromPixel(p1.x);
          const d2 = xAxis.convertFromPixel(p2.x);
          barCount = Math.abs(Math.round(d2) - Math.round(d1));
        } else {
          const points = overlay?.points || [];
          if (points.length >= 2 && points[0]?.dataIndex !== undefined && points[1]?.dataIndex !== undefined) {
            barCount = Math.abs(points[1].dataIndex - points[0].dataIndex);
          }
        }
        const figures: any[] = [];
        const borderStyles = { color: '#9c27b0', size: 1 };
        figures.push({
          type: 'polygon',
          attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }, { x: rightX, y: btmY }, { x: leftX, y: btmY }] },
          styles: { style: 'fill', color: 'rgba(156, 39, 176, 0.2)' }
        });
        figures.push(
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: topY }, { x: rightX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: btmY }, { x: leftX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: btmY }, { x: leftX, y: topY }] }, styles: borderStyles }
        );
        const text = `${barCount} Thanh`;
        figures.push({
          type: 'text',
          attrs: { x: (leftX + rightX) / 2, y: topY - 10, text, align: 'center', baseline: 'bottom' },
          styles: { color: '#ffffff', backgroundColor: '#9c27b0', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }
        });
        if (isOverlayInteracting(overlay, chart)) {
          const midTop = { x: (leftX + rightX) / 2, y: topY };
          const midRight = { x: rightX, y: (topY + btmY) / 2 };
          const midBottom = { x: (leftX + rightX) / 2, y: btmY };
          const midLeft = { x: leftX, y: (topY + btmY) / 2 };
          [
            { p: midTop, key: 'midTop' },
            { p: midRight, key: 'midRight' },
            { p: midBottom, key: 'midBottom' },
            { p: midLeft, key: 'midLeft' }
          ].forEach(({ p, key }) => {
            figures.push({
              key,
              type: 'polygon',
              ignoreEvent: false,
              attrs: {
                isHandle: key,
                coordinates: [
                  { x: p.x - 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y + 6 },
                  { x: p.x - 6, y: p.y + 6 }
                ]
              },
              styles: { style: 'stroke_fill', color: '#131722', borderColor: '#9c27b0', borderSize: 2 }
            });
          });
        }
        return figures;
      }
    } catch (e: any) {
      if (coordinates.length > 0) {
        return [{ type: 'text', attrs: { x: coordinates[0].x, y: coordinates[0].y, text: 'Lá»—i: ' + e.message } }];
      }
    }
    return [];
  }
});
// ÄÄƒng kĂ½ Khoáº£ng thá»i gian & GiĂ¡ (timePriceRange)
registerOverlay({
  name: 'timePriceRange',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  onPressedMoveStart: handleRectPressedMoveStart,
  onPressedMoving: handleRectPressedMoving,
  onPressedMoveEnd: handleRectPressedMoveEnd,
  createPointFigures: ({ coordinates, overlay, xAxis, yAxis, chart }: any) => {
    try {
      if (coordinates.length >= 2) {
        const p1 = coordinates[0];
        const p2 = coordinates[1];
        const leftX = Math.min(p1.x, p2.x);
        const rightX = Math.max(p1.x, p2.x);
        const topY = Math.min(p1.y, p2.y);
        const btmY = Math.max(p1.y, p2.y);
        let valDif = 0;
        let pctDif = 0;
        if (yAxis?.convertFromPixel) {
          const v1 = yAxis.convertFromPixel(p1.y);
          const v2 = yAxis.convertFromPixel(p2.y);
          valDif = v2 - v1;
          if (v1 !== 0) pctDif = (valDif / Math.abs(v1)) * 100;
        }
        let barCount = 0;
        if (xAxis?.convertFromPixel) {
          const d1 = xAxis.convertFromPixel(p1.x);
          const d2 = xAxis.convertFromPixel(p2.x);
          barCount = Math.abs(Math.round(d2) - Math.round(d1));
        } else {
          const pnts = overlay?.points || [];
          if (pnts.length >= 2 && pnts[0]?.dataIndex !== undefined && pnts[1]?.dataIndex !== undefined) {
            barCount = Math.abs(pnts[1].dataIndex - pnts[0].dataIndex);
          }
        }
        const figures: any[] = [];
        const borderStyles = { color: '#e91e63', size: 1 };
        figures.push({
          type: 'polygon',
          attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }, { x: rightX, y: btmY }, { x: leftX, y: btmY }] },
          styles: { style: 'fill', color: 'rgba(233, 30, 99, 0.2)' }
        });
        figures.push(
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: topY }, { x: rightX, y: topY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: topY }, { x: rightX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: rightX, y: btmY }, { x: leftX, y: btmY }] }, styles: borderStyles },
          { type: 'line', attrs: { coordinates: [{ x: leftX, y: btmY }, { x: leftX, y: topY }] }, styles: borderStyles }
        );
        const barsUnit = getTr('chart.bars', 'Thanh');
        const text = `${barCount} ${barsUnit} | ${valDif > 0 ? '+' : ''}${valDif.toFixed(2)} (${valDif > 0 ? '+' : ''}${pctDif.toFixed(2)}%)`;
        figures.push({
          type: 'text',
          attrs: { x: (leftX + rightX) / 2, y: topY - 10, text, align: 'center', baseline: 'bottom' },
          styles: { color: '#ffffff', backgroundColor: '#e91e63', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }
        });
        if (isOverlayInteracting(overlay, chart)) {
          const midTop = { x: (leftX + rightX) / 2, y: topY };
          const midRight = { x: rightX, y: (topY + btmY) / 2 };
          const midBottom = { x: (leftX + rightX) / 2, y: btmY };
          const midLeft = { x: leftX, y: (topY + btmY) / 2 };
          [
            { p: midTop, key: 'midTop' },
            { p: midRight, key: 'midRight' },
            { p: midBottom, key: 'midBottom' },
            { p: midLeft, key: 'midLeft' }
          ].forEach(({ p, key }) => {
            figures.push({
              key,
              type: 'polygon',
              ignoreEvent: false,
              attrs: {
                isHandle: key,
                coordinates: [
                  { x: p.x - 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y - 6 },
                  { x: p.x + 6, y: p.y + 6 },
                  { x: p.x - 6, y: p.y + 6 }
                ]
              },
              styles: { style: 'stroke_fill', color: '#131722', borderColor: '#e91e63', borderSize: 2 }
            });
          });
        }
        return figures;
      }
    } catch (e: any) {
      if (coordinates.length > 0) {
        return [{ type: 'text', attrs: { x: coordinates[0].x, y: coordinates[0].y, text: 'Lá»—i: ' + e.message } }];
      }
    }
    return [];
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ HĂ¬nh chá»¯ nháº­t (rect)
registerOverlay({
  name: 'rect',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  onPressedMoveStart: handleRectPressedMoveStart,
  onPressedMoving: handleRectPressedMoving,
  onPressedMoveEnd: handleRectPressedMoveEnd,
  createPointFigures: ({ coordinates, overlay, chart }: any) => {
    if (coordinates.length > 1) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = { x: p1.x, y: p0.y };
      const p3 = { x: p0.x, y: p1.y };
      const minX = Math.min(p0.x, p1.x);
      const maxX = Math.max(p0.x, p1.x);
      const minY = Math.min(p0.y, p1.y);
      const maxY = Math.max(p0.y, p1.y);
      const midTop = { x: (minX + maxX) / 2, y: minY };
      const midRight = { x: maxX, y: (minY + maxY) / 2 };
      const midBottom = { x: (minX + maxX) / 2, y: maxY };
      const midLeft = { x: minX, y: (minY + maxY) / 2 };
      const borderStyles = { color: overlay.styles?.polygon?.borderColor || '#9c27b0', size: overlay.styles?.polygon?.borderSize ?? 2 };
      const figures: any[] = [
        {
          type: 'polygon',
          attrs: { coordinates: [p0, p2, p1, p3] },
          styles: { style: 'fill', color: overlay.styles?.polygon?.color || 'rgba(156, 39, 176, 0.15)' }
        },
        { type: 'line', attrs: { coordinates: [p0, p2] }, styles: borderStyles },
        { type: 'line', attrs: { coordinates: [p2, p1] }, styles: borderStyles },
        { type: 'line', attrs: { coordinates: [p1, p3] }, styles: borderStyles },
        { type: 'line', attrs: { coordinates: [p3, p0] }, styles: borderStyles }
      ];
      if (isOverlayInteracting(overlay, chart)) {
        // Draw the other 2 corners (circles)
        [p2, p3].forEach(p => {
          figures.push({
            type: 'circle',
            ignoreEvent: true,
            attrs: { x: p.x, y: p.y, r: 5 },
            styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
          });
        });
        // Draw the 4 midpoints (squares)
        [
          { p: midTop, key: 'midTop' },
          { p: midRight, key: 'midRight' },
          { p: midBottom, key: 'midBottom' },
          { p: midLeft, key: 'midLeft' }
        ].forEach(({ p, key }) => {
          figures.push({
            key,
            type: 'polygon',
            ignoreEvent: false,
            attrs: {
              isHandle: key,
              coordinates: [
                { x: p.x - 6, y: p.y - 6 },
                { x: p.x + 6, y: p.y - 6 },
                { x: p.x + 6, y: p.y + 6 },
                { x: p.x - 6, y: p.y + 6 }
              ]
            },
            styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
          });
        });
      }
      if (overlay?.extendData) {
        const textContent = String(overlay.extendData);
        if (textContent.trim()) {
          const centerX = (coordinates[0].x + coordinates[1].x) / 2;
          const centerY = (coordinates[0].y + coordinates[1].y) / 2;
          figures.push({
            type: 'text',
            attrs: {
              x: centerX,
              y: centerY,
              text: textContent
            },
            styles: overlay.styles?.text || { color: '#ffffff', size: 14 }
          });
        }
      }
      return figures;
    }
    return [];
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ MĂ´ hĂ¬nh XABCD
registerOverlay({
  name: 'xabcd',
  totalStep: 6,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates } });
    }
    if (coordinates.length >= 3) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2]] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.2)' } });
      const pX = coordinates[0], pA = coordinates[1], pB = coordinates[2];
      const ratioXB = Math.abs((pA.y - pB.y) / (pX.y - pA.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pX, pB] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pX.x + pB.x) / 2, y: (pX.y + pB.y) / 2, text: ratioXB }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 4) {
      const pA = coordinates[1], pB = coordinates[2], pC = coordinates[3];
      const ratioAC = Math.abs((pB.y - pC.y) / (pA.y - pB.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pA, pC] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pA.x + pC.x) / 2, y: (pA.y + pC.y) / 2, text: ratioAC }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 5) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[2], coordinates[3], coordinates[4]] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.2)' } });
      const pX = coordinates[0], pA = coordinates[1], pB = coordinates[2], pC = coordinates[3], pD = coordinates[4];
      const ratioBD = Math.abs((pC.y - pD.y) / (pB.y - pC.y) || 1).toFixed(3);
      const ratioXD = Math.abs((pA.y - pD.y) / (pX.y - pA.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pB, pD] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pB.x + pD.x) / 2, y: (pB.y + pD.y) / 2, text: ratioBD }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [pX, pD] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pX.x + pD.x) / 2, y: (pX.y + pD.y) / 2, text: ratioXD }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    const labels = ['X', 'A', 'B', 'C', 'D'];
    coordinates.forEach((coord, i) => {
      if (i < 5) {
        figures.push({
          type: 'text',
          attrs: { x: coord.x, y: coord.y, text: labels[i] },
          styles: { color: '#fff', backgroundColor: '#2196f3', paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }
        });
      }
    });
    return figures;
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ ABCD
registerOverlay({
  name: 'abcd',
  totalStep: 5,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates } });
    }
    if (coordinates.length >= 3) {
      const pA = coordinates[0], pB = coordinates[1], pC = coordinates[2];
      const ratioBC = Math.abs((pB.y - pC.y) / (pA.y - pB.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pA, pC] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pA.x + pC.x) / 2, y: (pA.y + pC.y) / 2, text: ratioBC }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 4) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2], coordinates[3]] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.15)' } });
      const pB = coordinates[1], pC = coordinates[2], pD = coordinates[3];
      const ratioCD = Math.abs((pC.y - pD.y) / (pB.y - pC.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pB, pD] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pB.x + pD.x) / 2, y: (pB.y + pD.y) / 2, text: ratioCD }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    const labels = ['A', 'B', 'C', 'D'];
    coordinates.forEach((coord, i) => {
      if (i < 4) {
        figures.push({
          type: 'text',
          attrs: { x: coord.x, y: coord.y, text: labels[i] },
          styles: { color: '#fff', backgroundColor: '#2196f3', paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }
        });
      }
    });
    return figures;
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ MĂ´ hĂ¬nh Cypher
registerOverlay({
  name: 'cypher',
  totalStep: 6,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates } });
    }
    if (coordinates.length >= 3) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2]] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.2)' } });
      const pX = coordinates[0], pA = coordinates[1], pB = coordinates[2];
      const ratioXB = Math.abs((pA.y - pB.y) / (pX.y - pA.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pX, pB] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pX.x + pB.x) / 2, y: (pX.y + pB.y) / 2, text: ratioXB }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 4) {
      const pA = coordinates[1], pB = coordinates[2], pC = coordinates[3];
      const ratioAC = Math.abs((pB.y - pC.y) / (pA.y - pB.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pA, pC] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pA.x + pC.x) / 2, y: (pA.y + pC.y) / 2, text: ratioAC }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 5) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[2], coordinates[3], coordinates[4]] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.2)' } });
      const pX = coordinates[0], pA = coordinates[1], pB = coordinates[2], pC = coordinates[3], pD = coordinates[4];
      const ratioBD = Math.abs((pC.y - pD.y) / (pB.y - pC.y) || 1).toFixed(3);
      const ratioXD = Math.abs((pA.y - pD.y) / (pX.y - pA.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [pB, pD] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pB.x + pD.x) / 2, y: (pB.y + pD.y) / 2, text: ratioBD }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [pX, pD] }, styles: { style: 'dashed', color: '#2196f3' } });
      figures.push({ type: 'text', attrs: { x: (pX.x + pD.x) / 2, y: (pX.y + pD.y) / 2, text: ratioXD }, styles: { color: '#fff', backgroundColor: '#2196f3', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    const labels = ['X', 'A', 'B', 'C', 'D'];
    coordinates.forEach((coord, i) => {
      if (i < 5) {
        figures.push({
          type: 'text',
          attrs: { x: coord.x, y: coord.y, text: labels[i] },
          styles: { color: '#fff', backgroundColor: '#2196f3', paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 2 }
        });
      }
    });
    return figures;
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ MĂ´ hĂ¬nh Three Drives
registerOverlay({
  name: 'threeDrives',
  totalStep: 6,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#673ab7' } });
    }
    if (coordinates.length >= 3) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2]] }, styles: { style: 'fill', color: 'rgba(103, 58, 183, 0.2)' } });
      const p0 = coordinates[0], p1 = coordinates[1], p2 = coordinates[2];
      const ratio = Math.abs((p1.y - p2.y) / (p0.y - p1.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [p0, p2] }, styles: { style: 'dashed', color: '#673ab7' } });
      figures.push({ type: 'text', attrs: { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2, text: ratio }, styles: { color: '#fff', backgroundColor: '#673ab7', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    if (coordinates.length >= 5) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[2], coordinates[3], coordinates[4]] }, styles: { style: 'fill', color: 'rgba(103, 58, 183, 0.2)' } });
      const p2 = coordinates[2], p3 = coordinates[3], p4 = coordinates[4];
      const ratio = Math.abs((p3.y - p4.y) / (p2.y - p3.y) || 1).toFixed(3);
      figures.push({ type: 'line', attrs: { coordinates: [p2, p4] }, styles: { style: 'dashed', color: '#673ab7' } });
      figures.push({ type: 'text', attrs: { x: (p2.x + p4.x) / 2, y: (p2.y + p4.y) / 2, text: ratio }, styles: { color: '#fff', backgroundColor: '#673ab7', borderRadius: 4, paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ Vai Äáº§u Vai (Head and Shoulders)
registerOverlay({
  name: 'headAndShoulders',
  totalStep: 8,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#4caf50' } });
    }
    if (coordinates.length >= 3) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2]] }, styles: { style: 'fill', color: 'rgba(76, 175, 80, 0.2)' } });
    }
    if (coordinates.length >= 5) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[2], coordinates[3], coordinates[4]] }, styles: { style: 'fill', color: 'rgba(76, 175, 80, 0.2)' } });
    }
    if (coordinates.length >= 7) {
      figures.push({ type: 'polygon', attrs: { coordinates: [coordinates[4], coordinates[5], coordinates[6]] }, styles: { style: 'fill', color: 'rgba(76, 175, 80, 0.2)' } });
    }
    // ThĂªm Text Labels
    if (coordinates[0]) {
      figures.push({ type: 'text', attrs: { x: coordinates[0].x, y: coordinates[0].y - 30, text: 'Vai trĂ¡i' }, styles: { color: '#fff', backgroundColor: '#4caf50', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 } });
      figures.push({ type: 'line', attrs: { coordinates: [coordinates[0], { x: coordinates[0].x, y: coordinates[0].y - 20 }] }, styles: { color: '#4caf50' } });
    }
    if (coordinates[2]) {
      figures.push({ type: 'text', attrs: { x: coordinates[2].x, y: coordinates[2].y - 30, text: 'Äáº§u' }, styles: { color: '#fff', backgroundColor: '#4caf50', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 } });
      figures.push({ type: 'line', attrs: { coordinates: [coordinates[2], { x: coordinates[2].x, y: coordinates[2].y - 20 }] }, styles: { color: '#4caf50' } });
    }
    if (coordinates[4]) {
      figures.push({ type: 'text', attrs: { x: coordinates[4].x, y: coordinates[4].y - 30, text: 'Vai Pháº£i' }, styles: { color: '#fff', backgroundColor: '#4caf50', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 } });
      figures.push({ type: 'line', attrs: { coordinates: [coordinates[4], { x: coordinates[4].x, y: coordinates[4].y - 20 }] }, styles: { color: '#4caf50' } });
    }
    return figures;
  }
});
// ÄÆ°á»ng dáº«n (path)
registerOverlay({
  name: 'path',
  totalStep: 0,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    return [
      {
        type: 'line',
        attrs: { coordinates },
        styles: { color: '#2962ff', size: 2 }
      }
    ];
  }
});

// Hình chữ nhật xoay (rotatedRect)
registerOverlay({
  name: 'rotatedRect',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    if (coordinates.length === 2) {
      return [{ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff' } }];
    }
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const p3 = coordinates[2];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const proj = (p3.x - p1.x) * nx + (p3.y - p1.y) * ny;
    const hx = nx * proj;
    const hy = ny * proj;
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            p1,
            p2,
            { x: p2.x + hx, y: p2.y + hy },
            { x: p1.x + hx, y: p1.y + hy }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(41, 98, 255, 0.2)', borderColor: '#2962ff' }
      }
    ];
  }
});
// HĂ¬nh elip (ellipse)
registerOverlay({
  name: 'ellipse',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const rx = Math.abs(p2.x - p1.x) / 2;
    const ry = Math.abs(p2.y - p1.y) / 2;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const points = [];
    for (let i = 0; i <= 36; i++) {
      const angle = (i * 10 * Math.PI) / 180;
      points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
    return [
      {
        type: 'polygon',
        attrs: { coordinates: points },
        styles: { style: 'stroke_fill', color: 'rgba(244, 67, 54, 0.2)', borderColor: '#f44336' }
      }
    ];
  }
});

// Vòng tròn (circleMark)
registerOverlay({
  name: 'circleMark',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const r = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    return [
      {
        type: 'circle',
        attrs: { x: p1.x, y: p1.y, r },
        styles: { style: 'stroke_fill', color: 'rgba(255, 152, 0, 0.2)', borderColor: '#ff9800' }
      }
    ];
  }
});
// HĂ¬nh vĂ²ng cung (arc)
registerOverlay({
  name: 'arc',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    if (coordinates.length === 2) return [{ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff' } }];
    const p1 = coordinates[0];
    const p2 = coordinates[2];
    const p3 = coordinates[1];
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * p3.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * p3.y + t * t * p2.y;
      points.push({ x, y });
    }
    return [{ type: 'line', attrs: { coordinates: points }, styles: { color: '#2962ff', size: 2 } }];
  }
});
// ÄÆ°á»ng cong (curve) - Quadratic Bezier
registerOverlay({
  name: 'curve',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    if (coordinates.length === 2) return [{ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff' } }];
    const p1 = coordinates[0];
    const p2 = coordinates[2];
    const p3 = coordinates[1];
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * p3.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * p3.y + t * t * p2.y;
      points.push({ x, y });
    }
    return [{ type: 'line', attrs: { coordinates: points }, styles: { color: '#2962ff', size: 2 } }];
  }
});
// ÄÆ°á»ng cong Ä‘Ă´i (doubleCurve) - Cubic Bezier
registerOverlay({
  name: 'doubleCurve',
  totalStep: 5,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    if (coordinates.length < 4) return [{ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff' } }];
    const p1 = coordinates[0];
    const p2 = coordinates[3];
    const p3 = coordinates[1];
    const p4 = coordinates[2];
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const mt = 1 - t;
      const x = mt * mt * mt * p1.x + 3 * mt * mt * t * p3.x + 3 * mt * t * t * p4.x + t * t * t * p2.x;
      const y = mt * mt * mt * p1.y + 3 * mt * mt * t * p3.y + 3 * mt * t * t * p4.y + t * t * t * p2.y;
      points.push({ x, y });
    }
    return [{ type: 'line', attrs: { coordinates: points }, styles: { color: '#2962ff', size: 2 } }];
  }
});
// ÄÄƒng kĂ½ Tam giĂ¡c
registerOverlay({
  name: 'triangle',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length > 1) {
      figures.push({ type: 'line', attrs: { coordinates } });
    }
    if (coordinates.length >= 3) {
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [coordinates[0], coordinates[1], coordinates[2]] },
        styles: { style: 'stroke_fill', color: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196f3' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ CĂ¡c Ä‘Æ°á»ng chu ká»³ (cycleLines) - Screenshot 2
registerOverlay({
  name: 'cycleLines',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      // Connecting dashed line between p1 and p2
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2196f3', size: 1, style: 'dashed', dashedValue: [4, 4] }
      });
      const rawDx = Math.abs(p2.x - p1.x);
      const intervalX = Math.max(rawDx, 4); // Remove 25px restriction
      const startX = p1.x;
      const canvasHeight = 4000;
      const minX = startX - 4000;
      const maxX = startX + 4000;
      const startK = Math.floor((minX - startX) / intervalX);
      const endK = Math.ceil((maxX - startX) / intervalX);
      // Draw repeating vertical cyan lines dynamically spanning the screen
      for (let k = startK; k <= endK; k++) {
        const vx = startX + k * intervalX;
        figures.push({
          type: 'line',
          attrs: { coordinates: [{ x: vx, y: -2000 }, { x: vx, y: canvasHeight }] },
          styles: { color: '#2196f3', size: 2 }
        });
      }
      // Blue handle circles
      figures.push({ type: 'circle', attrs: { x: p1.x, y: p1.y, r: 5 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
      figures.push({ type: 'circle', attrs: { x: p2.x, y: p2.y, r: 5 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ VĂ²ng thá»i gian (timeCycles) - Screenshot 3
registerOverlay({
  name: 'timeCycles',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const rawDx = Math.abs(p2.x - p1.x);
      const intervalX = Math.max(rawDx, 4); // Remove 25px restriction
      const baselineY = Math.max(p1.y, p2.y) + 20;
      const startX = Math.min(p1.x, p2.x);
      const minX = startX - 4000;
      const maxX = startX + 4000;
      const startK = Math.floor((minX - startX) / intervalX);
      const endK = Math.ceil((maxX - startX) / intervalX);
      // Render repeating green semicircles dynamically spanning the screen
      for (let k = startK; k <= endK; k++) {
        const segStartX = startX + k * intervalX;
        const arcCoords: { x: number; y: number }[] = [];
        // Dynamically adjust steps to optimize performance for tiny circles
        const steps = intervalX < 10 ? 8 : (intervalX < 20 ? 12 : 24);
        for (let i = 0; i <= steps; i++) {
          const theta = Math.PI * (1 - i / steps);
          const x = segStartX + (intervalX / 2) * (1 - Math.cos(theta));
          const y = baselineY - (intervalX / 2) * Math.sin(theta);
          arcCoords.push({ x, y });
        }
        figures.push({
          type: 'polygon',
          attrs: { coordinates: arcCoords },
          styles: { style: 'stroke_fill', color: 'rgba(76, 175, 80, 0.25)', borderColor: '#4caf50', borderSize: 2 }
        });
      }
      // Blue handle circles
      figures.push({ type: 'circle', attrs: { x: p1.x, y: p1.y, r: 5 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
      figures.push({ type: 'circle', attrs: { x: p2.x, y: p2.y, r: 5 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ÄÆ°á»ng Sine (sineLine) - Screenshots 2 & 3
registerOverlay({
  name: 'sineLine',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      // Allow very tight periods by removing the 25px restriction
      const rawDx = Math.abs(p2.x - p1.x);
      const halfPeriod = Math.max(rawDx, 4); // Minimum 4px to prevent infinite frequency
      const amp = Math.abs(p2.y - p1.y) / 2 || 60;
      const midY = (p1.y + p2.y) / 2;
      const sineCoords: { x: number; y: number }[] = [];
      // Extend far enough to cover most screens (4000px in each direction)
      const startX = p1.x - 4000;
      const endX = p1.x + 4000;
      // Dynamic step to keep smooth curves even when period is very small
      const stepX = Math.max(1, Math.min(2, halfPeriod / 4));
      for (let x = startX; x <= endX; x += stepX) {
        // cosine wave so peak sits at p1.x, trough at p1.x + halfPeriod
        const phase = (Math.PI * (x - p1.x)) / halfPeriod;
        const y = midY - amp * Math.cos(phase);
        sineCoords.push({ x, y });
      }
      // Smooth green sine curve (TradingView style)
      figures.push({
        type: 'line',
        attrs: { coordinates: sineCoords },
        styles: { color: '#089981', size: 3 }
      });
      // Blue handle circles at peak p1 and trough p2
      figures.push({ type: 'circle', attrs: { x: p1.x, y: p1.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
      figures.push({ type: 'circle', attrs: { x: p2.x, y: p2.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
    }
    return figures;
  }
});





// ÄÄƒng kĂ½ Dự đoán (forecast) - Screenshot 3
registerOverlay({
  name: 'forecast',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, xAxis, yAxis, kLineDataList }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      // 1. Prediction Connecting Line (Blue)
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2962ff', size: 3 }
      });
      // Prices & Calculations
      const val1 = yAxis?.convertFromPixel ? yAxis.convertFromPixel(p1.y) : 0;
      const val2 = yAxis?.convertFromPixel ? yAxis.convertFromPixel(p2.y) : 0;
      const diff = val2 - val1;
      const pct = val1 !== 0 ? (diff / val1) * 100 : 0;
      // Time calculation
      const idx1 = xAxis?.convertFromPixel ? Math.round(xAxis.convertFromPixel(p1.x)) : 0;
      const idx2 = xAxis?.convertFromPixel ? Math.round(xAxis.convertFromPixel(p2.x)) : 0;
      let timeText = '0n 0g 0p';
      let date1Str = '';
      let date2Str = '';
      if (kLineDataList && kLineDataList[idx1]) {
        const d1 = new Date(kLineDataList[idx1].timestamp);
        date1Str = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')} ${String(d1.getHours()).padStart(2, '0')}:${String(d1.getMinutes()).padStart(2, '0')}`;
      }
      if (kLineDataList && kLineDataList[idx2]) {
        const d2 = new Date(kLineDataList[idx2].timestamp);
        date2Str = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')} ${String(d2.getHours()).padStart(2, '0')}:${String(d2.getMinutes()).padStart(2, '0')}`;
      }
      if (kLineDataList && kLineDataList[idx1] && kLineDataList[idx2]) {
        const diffMs = Math.abs(kLineDataList[idx2].timestamp - kLineDataList[idx1].timestamp);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeText = `${days}n ${hours}g ${mins}p`;
      } else {
        const barCount = Math.abs(idx2 - idx1) || 1;
        timeText = `${Math.floor(barCount / 96)}n ${Math.floor((barCount % 96) / 4)}g 0p`;
      }
      const diffStr = (diff >= 0 ? '+' : '') + diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
      // 2. Start Badge (Blue badge at p1)
      figures.push({
        type: 'text',
        attrs: {
          x: p1.x,
          y: p1.y - 10,
          text: `${val1.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n${date1Str}`,
          align: 'center',
          baseline: 'bottom'
        },
        styles: {
          color: '#ffffff',
          size: 12,
          weight: 'bold',
          backgroundColor: '#2962ff',
          paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
          borderRadius: 8
        }
      });
      // 3. End Info Badge (Blue box at p2)
      figures.push({
        type: 'text',
        attrs: {
          x: p2.x,
          y: p2.y + 10,
          text: `${diffStr} (${pctStr}) trong ${timeText}\n${val2.toLocaleString(undefined, { minimumFractionDigits: 2 })} đŸ•’ ${date2Str}`,
          align: 'center',
          baseline: 'top'
        },
        styles: {
          color: '#ffffff',
          size: 12,
          weight: 'bold',
          backgroundColor: '#2962ff',
          paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
          borderRadius: 8
        }
      });
      // 4. Status Badge (Red THáº¤T Báº I or Green THĂ€NH CĂ”NG - Screenshot 3)
      const latestPrice = kLineDataList?.[kLineDataList.length - 1]?.close ?? val2;
      const isSuccess = (diff >= 0 && latestPrice >= val1) || (diff < 0 && latestPrice <= val1);
      figures.push({
        type: 'text',
        attrs: {
          x: p2.x,
          y: p2.y + 58,
          text: isSuccess ? ':) THĂ€NH CĂ”NG' : ':( THáº¤T Báº I',
          align: 'center',
          baseline: 'top'
        },
        styles: {
          color: '#ffffff',
          size: 13,
          weight: 'bold',
          backgroundColor: isSuccess ? '#089981' : '#f23645',
          paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4,
          borderRadius: 6
        }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Máº«u hĂ¬nh thanh (barsPattern) - Screenshot 4
registerOverlay({
  name: 'barsPattern',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, kLineDataList }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const p3 = coordinates[2] || p1;
      const idx1 = points[0]?.dataIndex ?? 0;
      const idx2 = points[1]?.dataIndex ?? (idx1 + 10);
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);
      const pathCoords: { x: number; y: number }[] = [];
      const candleBars = kLineDataList ? kLineDataList.slice(minIdx, maxIdx + 1) : [];
      if (candleBars.length > 1) {
        const count = candleBars.length;
        const totalX = p2.x - p1.x;
        const startY = p3 ? p3.y : p1.y;
        const baseVal = candleBars[0]?.close || 1;
        candleBars.forEach((bar: any, index: number) => {
          const ratioX = index / (count - 1);
          const x = (p3 ? p3.x : p1.x) + ratioX * totalX;
          const ratioY = (bar.close - baseVal) / baseVal;
          const y = startY - ratioY * 300;
          pathCoords.push({ x, y });
        });
        // Pixelated / Thick Blue Line (Image 4)
        figures.push({
          type: 'line',
          attrs: { coordinates: pathCoords },
          styles: { color: '#2962ff', size: 4 }
        });
        pathCoords.forEach((pt, i) => {
          if (i === 0 || i === pathCoords.length - 1 || i % Math.max(1, Math.ceil(pathCoords.length / 5)) === 0) {
            figures.push({
              type: 'circle',
              attrs: { x: pt.x, y: pt.y, r: 4 },
              styles: { style: 'fill', color: '#2962ff' }
            });
          }
        });
      } else {
        figures.push({
          type: 'line',
          attrs: { coordinates: [p1, p2] },
          styles: { color: '#2962ff', size: 3 }
        });
      }
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ MĂ´ hĂ¬nh Ghost (ghostFeed) - Screenshot 5
registerOverlay({
  name: 'ghostFeed',
  totalStep: 6,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      // Connect points with dotted grey trendlines
      figures.push({
        type: 'line',
        attrs: { coordinates },
        styles: { color: '#787b86', size: 2, style: 'dashed', dashedValue: [4, 4] }
      });
      // Draw ghost mini candles / bars along each segment
      for (let i = 0; i < coordinates.length - 1; i++) {
        const pA = coordinates[i];
        const pB = coordinates[i + 1];
        const steps = 6;
        for (let s = 1; s < steps; s++) {
          const ratio = s / steps;
          const cx = pA.x + (pB.x - pA.x) * ratio;
          const cy = pA.y + (pB.y - pA.y) * ratio;
          const wickHeight = 12 + (s % 3) * 4;
          const isUp = s % 2 === 0;
          // Ghost Wick
          figures.push({
            type: 'line',
            attrs: { coordinates: [{ x: cx, y: cy - wickHeight }, { x: cx, y: cy + wickHeight }] },
            styles: { color: isUp ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)', size: 1 }
          });
          // Ghost Body
          const bodyH = 8 + (s % 2) * 6;
          figures.push({
            type: 'polygon',
            attrs: {
              coordinates: [
                { x: cx - 4, y: cy - bodyH / 2 },
                { x: cx + 4, y: cy - bodyH / 2 },
                { x: cx + 4, y: cy + bodyH / 2 },
                { x: cx - 4, y: cy + bodyH / 2 }
              ]
            },
            styles: {
              style: 'stroke_fill',
              color: isUp ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
              borderColor: isUp ? '#089981' : '#f23645'
            }
          });
        }
      }
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ Thế giá lên (Long Position) - PhĂ©p chiáº¿u
registerOverlay({
  name: 'longPosition',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, yAxis }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p0 = coordinates[0]; // Entry
      let p1 = { x: p0.x, y: p0.y }; // TP
      let p2 = { x: p0.x, y: p0.y }; // SL
      let minX = p0.x;
      let maxX = p0.x;
      for (let i = 1; i < coordinates.length; i++) {
        const pt = coordinates[i];
        if (!pt) continue;
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        if (pt.y < p0.y) {
          // TP is above entry (smaller Y)
          if (p1.y === p0.y || pt.y < p1.y) p1 = { ...pt };
        } else if (pt.y > p0.y) {
          // SL is below entry (larger Y)
          if (p2.y === p0.y || pt.y > p2.y) p2 = { ...pt };
        }
      }
      // Provide a default width if points are vertically aligned during initial draw
      if (maxX - minX < 20) {
        maxX = minX + 80;
      }
      // Profit Box (Green)
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: p0.y },
            { x: minX, y: p1.y },
            { x: maxX, y: p1.y },
            { x: maxX, y: p0.y }
          ]
        },
        styles: { style: 'fill', color: 'rgba(8, 153, 129, 0.25)' }
      });
      // Loss Box (Red)
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: p0.y },
            { x: maxX, y: p0.y },
            { x: maxX, y: p2.y },
            { x: minX, y: p2.y }
          ]
        },
        styles: { style: 'fill', color: 'rgba(242, 54, 69, 0.25)' }
      });
      // Middle Line (Entry)
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX, y: p0.y }, { x: maxX, y: p0.y }] },
        styles: { style: 'dashed', color: '#787b86', size: 1 }
      });
      // Calculate real values exactly like TradingView
      let entryPrice = 0, tpPrice = 0, slPrice = 0;
      if (yAxis && yAxis.convertFromPixel) {
        entryPrice = yAxis.convertFromPixel(p0.y) || 0;
        tpPrice = yAxis.convertFromPixel(p1.y) || 0;
        slPrice = yAxis.convertFromPixel(p2.y) || 0;
      }
      const profitValue = Math.abs(tpPrice - entryPrice);
      const profitPercent = entryPrice > 0 ? (profitValue / entryPrice * 100) : 0;
      const lossValue = Math.abs(entryPrice - slPrice);
      const lossPercent = entryPrice > 0 ? (lossValue / entryPrice * 100) : 0;
      const rr = lossValue > 0 ? (profitValue / lossValue) : 0;

      const targetText = `${getTr('chart.target', 'Mục tiêu')}: ${profitValue.toFixed(2)} (${profitPercent.toFixed(2)}%) ${tpPrice.toFixed(2)}`;
      const stopText = `${getTr('chart.stop', 'Dừng')}: ${lossValue.toFixed(2)} (${lossPercent.toFixed(2)}%) ${slPrice.toFixed(2)}`;
      const rrText = `${getTr('chart.rr', 'Tỷ lệ Rủi ro/Lợi nhuận')}: ${rr.toFixed(2)}`;

      const centerX = (minX + maxX) / 2;
      // Target Text Box
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: Math.min(p1.y, p0.y - 32), text: targetText, align: 'center', baseline: 'bottom' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#089981', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
      // Stop Text Box
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: Math.max(p2.y, p0.y + 32), text: stopText, align: 'center', baseline: 'top' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#f23645', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
      // Middle Text Box (Risk/Reward Ratio)
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: p0.y, text: rrText, align: 'center', baseline: 'middle' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#089981', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ cĂ´ng cá»¥ váº½ Thế giá xuống (Short Position) - PhĂ©p chiáº¿u
registerOverlay({
  name: 'shortPosition',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, yAxis }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p0 = coordinates[0]; // Entry
      let p1 = { x: p0.x, y: p0.y }; // TP
      let p2 = { x: p0.x, y: p0.y }; // SL
      let minX = p0.x;
      let maxX = p0.x;
      for (let i = 1; i < coordinates.length; i++) {
        const pt = coordinates[i];
        if (!pt) continue;
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        if (pt.y > p0.y) {
          // TP is below entry (larger Y)
          if (p1.y === p0.y || pt.y > p1.y) p1 = { ...pt };
        } else if (pt.y < p0.y) {
          // SL is above entry (smaller Y)
          if (p2.y === p0.y || pt.y < p2.y) p2 = { ...pt };
        }
      }
      // Provide a default width if points are vertically aligned during initial draw
      if (maxX - minX < 20) {
        maxX = minX + 80;
      }
      // Profit Box (Green)
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: p0.y },
            { x: maxX, y: p0.y },
            { x: maxX, y: p1.y },
            { x: minX, y: p1.y }
          ]
        },
        styles: { style: 'fill', color: 'rgba(8, 153, 129, 0.25)' }
      });
      // Loss Box (Red)
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: p0.y },
            { x: minX, y: p2.y },
            { x: maxX, y: p2.y },
            { x: maxX, y: p0.y }
          ]
        },
        styles: { style: 'fill', color: 'rgba(242, 54, 69, 0.25)' }
      });
      // Middle Line (Entry)
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX, y: p0.y }, { x: maxX, y: p0.y }] },
        styles: { style: 'dashed', color: '#787b86', size: 1 }
      });
      // Calculate real values exactly like TradingView
      let entryPrice = 0, tpPrice = 0, slPrice = 0;
      if (yAxis && yAxis.convertFromPixel) {
        entryPrice = yAxis.convertFromPixel(p0.y) || 0;
        tpPrice = yAxis.convertFromPixel(p1.y) || 0;
        slPrice = yAxis.convertFromPixel(p2.y) || 0;
      }
      // For short, profit is when tp < entry
      const profitValue = Math.abs(entryPrice - tpPrice);
      const profitPercent = entryPrice > 0 ? (profitValue / entryPrice * 100) : 0;
      const lossValue = Math.abs(slPrice - entryPrice);
      const lossPercent = entryPrice > 0 ? (lossValue / entryPrice * 100) : 0;
      const rr = lossValue > 0 ? (profitValue / lossValue) : 0;

      const targetText = `${getTr('chart.target', 'Mục tiêu')}: ${profitValue.toFixed(2)} (${profitPercent.toFixed(2)}%) ${tpPrice.toFixed(2)}`;
      const stopText = `${getTr('chart.stop', 'Dừng')}: ${lossValue.toFixed(2)} (${lossPercent.toFixed(2)}%) ${slPrice.toFixed(2)}`;
      const rrText = `${getTr('chart.rr', 'Tỷ lệ Rủi ro/Lợi nhuận')}: ${rr.toFixed(2)}`;

      const centerX = (minX + maxX) / 2;
      // Target Text Box (At bottom for Short)
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: Math.max(p1.y, p0.y + 32), text: targetText, align: 'center', baseline: 'top' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#089981', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
      // Stop Text Box (At top for Short)
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: Math.min(p2.y, p0.y - 32), text: stopText, align: 'center', baseline: 'bottom' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#f23645', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
      // Middle Text Box (Risk/Reward Ratio)
      figures.push({
        type: 'text',
        attrs: { x: centerX, y: p0.y, text: rrText, align: 'center', baseline: 'middle' },
        styles: { color: '#ffffff', size: 12, backgroundColor: '#089981', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }
      });
    }
    return figures;
  }
});
// 1. Anchored VWAP (Dá»±a trĂªn khá»‘i lÆ°á»£ng)
registerOverlay({
  name: 'anchoredVWAP',
  totalStep: 1,
  needDefaultPointFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (!coordinates.length) return [];
    const p = coordinates[0];
    const length = 200;
    const pts1 = [p, { x: p.x + 30, y: p.y - 15 }, { x: p.x + 60, y: p.y + 10 }, { x: p.x + 90, y: p.y - 5 }, { x: p.x + length, y: p.y - 20 }];
    const pts2 = [{ x: p.x, y: p.y - 30 }, { x: p.x + 30, y: p.y - 45 }, { x: p.x + 60, y: p.y - 20 }, { x: p.x + 90, y: p.y - 35 }, { x: p.x + length, y: p.y - 50 }];
    const pts3 = [{ x: p.x, y: p.y + 30 }, { x: p.x + 30, y: p.y + 15 }, { x: p.x + 60, y: p.y + 40 }, { x: p.x + 90, y: p.y + 25 }, { x: p.x + length, y: p.y + 10 }];
    const figures: any[] = [];
    for (let i = 0; i < pts1.length - 1; i++) figures.push({ type: 'line', attrs: { coordinates: [pts1[i], pts1[i + 1]] }, styles: { color: '#2962ff', size: 2 } });
    for (let i = 0; i < pts2.length - 1; i++) figures.push({ type: 'line', attrs: { coordinates: [pts2[i], pts2[i + 1]] }, styles: { color: '#4caf50', size: 1.5 } });
    for (let i = 0; i < pts3.length - 1; i++) figures.push({ type: 'line', attrs: { coordinates: [pts3[i], pts3[i + 1]] }, styles: { color: '#4caf50', size: 1.5 } });
    figures.push({ type: 'circle', attrs: { x: p.x, y: p.y, r: 6 }, styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 } });
    return figures;
  }
});
// 2. Khá»‘i lÆ°á»£ng Giao dá»‹ch Pháº¡m vi Cá»‘ Ä‘á»‹nh (fixedRangeVolumeProfile)
registerOverlay({
  name: 'fixedRangeVolumeProfile',
  totalStep: 3,
  needDefaultPointFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length === 0) return [];
    const p0 = coordinates[0];
    const figures: any[] = [
      { type: 'circle', attrs: { x: p0.x, y: p0.y, r: 4 }, styles: { style: 'fill', color: '#2962ff' } }
    ];
    if (coordinates.length >= 2) {
      const p1 = coordinates[1];
      figures.push(
        { type: 'polygon', attrs: { coordinates: [{ x: p0.x, y: p0.y }, { x: p1.x, y: p0.y }, { x: p1.x, y: p1.y }, { x: p0.x, y: p1.y }] }, styles: { style: 'fill', color: 'rgba(33, 150, 243, 0.1)' } },
        { type: 'line', attrs: { coordinates: [{ x: p0.x, y: p0.y + (p1.y - p0.y) * 0.3 }, { x: p0.x + (p1.x - p0.x) * 0.8, y: p0.y + (p1.y - p0.y) * 0.3 }] }, styles: { color: 'rgba(255, 152, 0, 0.6)', size: 8 } },
        { type: 'line', attrs: { coordinates: [{ x: p0.x, y: p0.y + (p1.y - p0.y) * 0.6 }, { x: p0.x + (p1.x - p0.x) * 0.5, y: p0.y + (p1.y - p0.y) * 0.6 }] }, styles: { color: 'rgba(33, 150, 243, 0.6)', size: 8 } },
        { type: 'line', attrs: { coordinates: [{ x: p0.x, y: p0.y + (p1.y - p0.y) * 0.8 }, { x: p0.x + (p1.x - p0.x) * 0.3, y: p0.y + (p1.y - p0.y) * 0.8 }] }, styles: { color: 'rgba(33, 150, 243, 0.6)', size: 8 } }
      );
    }
    return figures;
  }
});
// Removed duplicate priceRange, dateRange, dateAndPriceRange
// 8. PhĂ©p chiáº¿u (projection)
registerOverlay({
  name: 'projection',
  totalStep: 3,
  needDefaultPointFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length === 0) return [];
    const figures: any[] = [];
    coordinates.forEach((p: any) => {
      figures.push({ type: 'circle', attrs: { x: p.x, y: p.y, r: 5 }, styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 } });
    });
    if (coordinates.length >= 2) {
      figures.push({ type: 'line', attrs: { coordinates: [coordinates[0], coordinates[1]] }, styles: { color: '#9c27b0', size: 2 } });
    }
    if (coordinates.length >= 3) {
      const p0 = coordinates[0], p1 = coordinates[1], p2 = coordinates[2];
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [p0, p1, p2] },
        styles: { style: 'fill', color: 'rgba(156, 39, 176, 0.25)' }
      });
      figures.push({ type: 'line', attrs: { coordinates: [p0, p2] }, styles: { color: '#9c27b0', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#9c27b0', size: 2 } });
    }
    return figures;
  }
});
registerOverlay({
  name: 'tpslZone',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    if (coordinates && coordinates.length >= 2 && coordinates[0] && coordinates[1]) {
      const y1 = coordinates[0].y;
      const y2 = coordinates[1].y;
      if (typeof y1 === 'number' && typeof y2 === 'number') {
        const width = bounding?.width || 3000;
        return [
          {
            type: 'polygon',
            attrs: {
              coordinates: [
                { x: 0, y: y1 },
                { x: width, y: y1 },
                { x: width, y: y2 },
                { x: 0, y: y2 }
              ]
            },
            styles: {
              style: 'fill',
              color: overlay.styles?.polygon?.color || 'rgba(8, 153, 129, 0.16)'
            }
          }
        ];
      }
    }
    return [];
  }
});

// Helper tính toán text hiển thị trên Badge (ví dụ: "TP  +$199.64" hoặc "SL  -$99.82")
const computeOrderLineBadge = (
  type: 'TP' | 'SL' | 'ENTRY' | 'ORDER',
  targetPrice: number,
  entryPrice: number,
  side: 'LONG' | 'SHORT',
  quantity?: number
): string => {
  if (type === 'ENTRY') {
    return `${side === 'LONG' ? '▲ LONG' : '▼ SHORT'} @ $${targetPrice.toLocaleString('en-US')}`;
  }
  if (type === 'ORDER') {
    return `${side} @ $${targetPrice.toLocaleString('en-US')}`;
  }

  const isLong = side === 'LONG';
  let diff = targetPrice - entryPrice;
  if (!isLong) diff = -diff; // Với lệnh SHORT, giá giảm là lãi

  const pct = entryPrice > 0 ? (diff / entryPrice) * 100 : 0;

  if (quantity && quantity > 0) {
    const pnl = diff * quantity;
    const sign = pnl >= 0 ? '+' : '-';
    return `${type}  ${sign}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const sign = pct >= 0 ? '+' : '-';
  return `${type}  ${sign}${Math.abs(pct).toFixed(2)}%`;
};

// Đăng ký overlay TP / SL / Order Line theo chuẩn TradingView (Có Badge trên Chart và Tag Giá trên trục Y)
registerOverlay({
  name: 'orderTpslLine',
  totalStep: 2,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding, overlay, yAxis }) => {
    let y = coordinates?.[0]?.y;
    const price = overlay.points?.[0]?.value ?? (overlay.extendData as any)?.price;
    if (typeof y !== 'number' || isNaN(y)) {
      if (typeof price === 'number' && !isNaN(price) && yAxis && typeof yAxis.convertToPixel === 'function') {
        y = yAxis.convertToPixel(price);
      }
    }
    if (typeof y !== 'number' || isNaN(y)) return [];

    const width = bounding?.width || 3000;
    const color = (overlay.extendData as any)?.color || '#089981';
    const isDashed = (overlay.extendData as any)?.isDashed ?? true;
    const badgeText = (overlay.extendData as any)?.badgeText || '';

    const figures: any[] = [];

    // 1. Đường kẻ ngang chạy hết màn hình
    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: 0, y },
          { x: width, y }
        ]
      },
      styles: {
        color: color,
        size: 1.5,
        style: isDashed ? 'dashed' : 'solid',
        dashedValue: [5, 4]
      }
    });

    // 2. Khối Badge pill hiển thị TP / SL và PnL (e.g. "TP  +$199.64", "SL  -$99.82")
    if (badgeText) {
      const charWidth = 7.5;
      const badgeWidth = Math.max(90, Math.round(badgeText.length * charWidth + 24));
      const badgeHeight = 22;
      // Đặt badge ngay bên phải của các nến hiện tại (hoặc 40-50% màn hình), đẹp mắt như TradingView
      const lastCandleX = (coordinates[1] && typeof coordinates[1].x === 'number') ? coordinates[1].x : (width * 0.45);
      const badgeX = Math.max(60, Math.min(width - badgeWidth - 80, lastCandleX + 35));

      figures.push({
        type: 'rect',
        attrs: {
          x: badgeX,
          y: y - badgeHeight / 2,
          width: badgeWidth,
          height: badgeHeight
        },
        styles: {
          style: 'fill',
          color: color,
          borderRadius: 4
        }
      });

      figures.push({
        type: 'text',
        attrs: {
          x: badgeX + badgeWidth / 2,
          y: y,
          text: badgeText,
          align: 'center',
          baseline: 'middle'
        },
        styles: {
          color: '#ffffff',
          backgroundColor: 'transparent',
          size: 11,
          weight: 'bold',
          family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      });
    }

    return figures;
  },
  createYAxisFigures: ({ coordinates, bounding, overlay, yAxis }) => {
    let y = coordinates?.[0]?.y;
    const price = overlay.points?.[0]?.value ?? (overlay.extendData as any)?.price;
    if (typeof price !== 'number' || isNaN(price)) return [];
    if (typeof y !== 'number' || isNaN(y)) {
      if (yAxis && typeof yAxis.convertToPixel === 'function') {
        y = yAxis.convertToPixel(price);
      }
    }
    if (typeof y !== 'number' || isNaN(y)) return [];

    const color = (overlay.extendData as any)?.color || '#089981';
    const precision = (overlay.extendData as any)?.precision ?? 2;
    const formattedPrice = price.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    const yWidth = bounding?.width || 75;
    const boxHeight = 20;

    return [
      {
        type: 'rect',
        attrs: {
          x: 0,
          y: y - boxHeight / 2,
          width: yWidth,
          height: boxHeight
        },
        styles: {
          style: 'fill',
          color: color,
          borderRadius: 3
        },
        ignoreEvent: true
      },
      {
        type: 'text',
        attrs: {
          x: yWidth / 2,
          y: y,
          text: formattedPrice,
          align: 'center',
          baseline: 'middle'
        },
        styles: {
          color: '#ffffff',
          backgroundColor: 'transparent',
          size: 11,
          weight: 'bold',
          family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        ignoreEvent: true
      }
    ];
  }
});

// ÄÄƒng kĂ½ ÄÆ°á»ng thĂ´ng tin (infoLine)
registerOverlay({
  name: 'infoLine',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, kLineDataList }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#2962ff', size: 2 } });
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distPx = Math.round(Math.sqrt(dx * dx + dy * dy));
      const angleDeg = (-Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(2);
      let priceDiff = '0.00';
      let pctChange = '0.00%';
      let valDiff = '0';
      let barCount = 1;
      let timeText = '0g';
      if (points && points.length >= 2) {
        const val1 = points[0].value ?? 0;
        const val2 = points[1].value ?? 0;
        const diff = val2 - val1;
        const pct = val1 !== 0 ? (diff / val1) * 100 : 0;
        priceDiff = (diff >= 0 ? '+' : '') + diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        pctChange = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
        valDiff = (diff * 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const idx1 = points[0].dataIndex ?? 0;
        const idx2 = points[1].dataIndex ?? 0;
        barCount = Math.abs(idx2 - idx1);
        if (kLineDataList && kLineDataList[idx1] && kLineDataList[idx2]) {
          const t1 = kLineDataList[idx1].timestamp;
          const t2 = kLineDataList[idx2].timestamp;
          const diffMs = Math.abs(t2 - t1);
          const diffHours = Math.round(diffMs / (1000 * 60 * 60));
          timeText = diffHours >= 24 ? `${Math.round(diffHours / 24)}n` : `${diffHours}g`;
        } else {
          timeText = `${Math.round(barCount * 15 / 60)}g`;
        }
      }
      // Card position (centered near line mid point)
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      // Card Background Box - Subtle semi-transparent dark container
      const cardWidth = 250;
      const cardHeight = 74;
      const cardX = Math.max(10, midX - cardWidth / 2);
      const cardY = Math.max(10, midY - cardHeight / 2);
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: cardX, y: cardY },
            { x: cardX + cardWidth, y: cardY },
            { x: cardX + cardWidth, y: cardY + cardHeight },
            { x: cardX, y: cardY + cardHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(19, 23, 34, 0.75)', borderColor: '#363a45' }
      });
      // Line 1: Price difference
      figures.push({
        type: 'text',
        attrs: { x: cardX + 10, y: cardY + 10, text: `↕  ${priceDiff} (${pctChange}), ${valDiff}` },
        styles: { color: '#ffffff', size: 12, weight: 'bold', backgroundColor: 'transparent' }
      });
      // Line 2: Bar count & Time & Distance px
      figures.push({
        type: 'text',
        attrs: { x: cardX + 10, y: cardY + 32, text: `↔  ${barCount} thanh (${timeText}), khoảng cách: ${distPx} px` },
        styles: { color: '#d1d4dc', size: 11, backgroundColor: 'transparent' }
      });
      // Line 3: Angle
      figures.push({
        type: 'text',
        attrs: { x: cardX + 10, y: cardY + 52, text: `âˆ   ${angleDeg}Â°` },
        styles: { color: '#d1d4dc', size: 11, backgroundColor: 'transparent' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ GĂ³c xu hÆ°á»›ng (trendAngle)
registerOverlay({
  name: 'trendAngle',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      // Main Trend Line
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2962ff', size: 2 }
      });
      // Dotted horizontal baseline from p1
      const baseLen = Math.min(Math.abs(dx), 90) || 60;
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, { x: p1.x + (dx >= 0 ? baseLen : -baseLen), y: p1.y }] },
        styles: { style: 'dashed', color: '#2962ff', dashedValue: [2, 3] }
      });
      // Dotted Arc connecting horizontal to line
      const radius = 35;
      const angleRad = Math.atan2(-dy, dx);
      const angleDeg = (angleRad * (180 / Math.PI)).toFixed(2);
      const arcPoints: { x: number; y: number }[] = [];
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const a = (angleRad * i) / steps;
        arcPoints.push({
          x: p1.x + radius * Math.cos(a),
          y: p1.y - radius * Math.sin(a)
        });
      }
      figures.push({
        type: 'line',
        attrs: { coordinates: arcPoints },
        styles: { style: 'dashed', color: '#2962ff', dashedValue: [2, 2] }
      });
      // Angle degree label text with subtle dark background badge
      const midAngle = angleRad / 2;
      figures.push({
        type: 'text',
        attrs: {
          x: p1.x + (radius + 20) * Math.cos(midAngle),
          y: p1.y - (radius + 20) * Math.sin(midAngle),
          text: `${angleDeg}°`
        },
        styles: {
          color: '#2962ff',
          size: 13,
          weight: 'bold',
          backgroundColor: 'rgba(19, 23, 34, 0.75)',
          paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
          borderRadius: 4,
          borderSize: 1,
          borderColor: '#2962ff'
        }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ÄÆ°á»ng xu hÆ°á»›ng cĂ³ chá»¯ dá»c theo Ä‘Æ°á»ng (segment)
registerOverlay({
  name: 'segment',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const styles = overlay.styles || {};
      const lineStyle = styles.line || {};
      const textStyle = styles.text || {};
      const lineColor = lineStyle.color || '#2962ff';
      const lineSize = lineStyle.size || 2;
      const isDashed = lineStyle.style === 'dashed';
      const dashedVal = lineStyle.dashedValue || [6, 6];
      // Draw Main Line
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: {
          color: lineColor,
          size: lineSize,
          style: isDashed ? 'dashed' : 'solid',
          dashedValue: dashedVal
        }
      });
      // Custom Text along the trend line (e.g. "Ä‘ggg")
      const textContent = overlay.extendData || (textStyle as any)?.text;
      if (textContent && typeof textContent === 'string') {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const angleRad = Math.atan2(dy, dx);
        let angleDeg = angleRad * (180 / Math.PI);
        if (angleDeg > 90 || angleDeg < -90) {
          angleDeg += 180;
        }
        figures.push({
          type: 'text',
          attrs: {
            x: midX,
            y: midY - 6,
            text: textContent,
            align: 'center',
            baseline: 'bottom',
            rotation: angleDeg
          },
          styles: {
            color: textStyle.color || '#2962ff',
            size: textStyle.size || 14,
            weight: textStyle.weight || 'bold',
            backgroundColor: 'transparent',
            paddingLeft: 4, paddingRight: 4
          }
        });
      }
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Văn bản (simpleAnnotation) - Render text directly without vertical pin
registerOverlay({
  name: 'simpleAnnotation',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay }: any) => {
    if (coordinates.length < 1) return [];
    const p = coordinates[0];
    const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));
    const styles = overlay.styles || {};
    const textStyle = styles.text || {};
    return [
      {
        type: 'text',
        attrs: {
          x: p.x,
          y: p.y,
          text: textContent,
          align: 'left',
          baseline: 'bottom'
        },
        styles: {
          color: textStyle.color || '#2962ff',
          size: textStyle.size || 16,
          weight: textStyle.weight || 'normal',
          backgroundColor: textStyle.backgroundColor || 'transparent',
          paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2,
          borderRadius: 2
        }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Ghi chú Giá (priceNote) - Screenshot 1
registerOverlay({
  name: 'priceNote',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, overlay, kLineDataList }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      // 1. Connecting Line from p1 to p2
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2962ff', size: 2 }
      });
      // 2. Start handle at p1
      figures.push({
        type: 'circle',
        attrs: { x: p1.x, y: p1.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // 3. Target handle at p2
      figures.push({
        type: 'circle',
        attrs: { x: p2.x, y: p2.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // 4. Price Badge Pill at p2
      let priceVal = '';
      if (typeof overlay.extendData === 'string' && overlay.extendData && overlay.extendData !== '85,470.59' && overlay.extendData !== getTr('chart.addText', 'Thêm văn bản') && overlay.extendData !== '0.00') {
        priceVal = overlay.extendData;
      } else {
        const pt = (points && (points[1] || points[0])) || null;
        const numPrice = (pt && typeof pt.value === 'number' && pt.value !== 0)
          ? pt.value
          : (pt && typeof pt.dataIndex === 'number' && kLineDataList && kLineDataList[pt.dataIndex]
            ? kLineDataList[pt.dataIndex].close
            : (kLineDataList && kLineDataList.length > 0 ? kLineDataList[kLineDataList.length - 1].close : 85470.59));
        priceVal = Number(numPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      const pillWidth = Math.max(90, priceVal.length * 9 + 20);
      const pillHeight = 28;
      const pillX = p2.x - 4;
      const pillY = p2.y - pillHeight - 6;
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: pillX, y: pillY },
            { x: pillX + pillWidth, y: pillY },
            { x: pillX + pillWidth, y: pillY + pillHeight },
            { x: pillX, y: pillY + pillHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#2962ff', borderRadius: 6 }
      });
      figures.push({
        type: 'text',
        attrs: { x: pillX + 10, y: pillY + 5, text: priceVal },
        styles: { color: '#ffffff', size: 14, weight: 'bold' }
      });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Ghi chú (note) - Screenshot 2
registerOverlay({
  name: 'note',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      // Connecting line from p1 to p2
      figures.push({
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#e0e3eb', size: 1.5 }
      });
      // Handle at p1
      figures.push({
        type: 'circle',
        attrs: { x: p1.x, y: p1.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Handle at p2
      figures.push({
        type: 'circle',
        attrs: { x: p2.x, y: p2.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Text box container at p1
      const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));
      const boxWidth = Math.max(120, textContent.length * 8 + 24);
      const boxHeight = 34;
      const boxX = p1.x - boxWidth - 10;
      const boxY = p1.y - boxHeight / 2;
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(42, 46, 57, 0.95)', borderColor: '#434651', borderSize: 1, borderRadius: 6 }
      });
      figures.push({
        type: 'text',
        attrs: { x: boxX + 12, y: boxY + 8, text: textContent },
        styles: { color: '#d1d4dc', size: 13, weight: 'normal' }
      });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Mã Pin (pinMark) - Screenshot 3
registerOverlay({
  name: 'pinMark',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));

      // 1. Blue Map Drop Pin Shape at p
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y - 18, r: 12 },
        styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#2962ff' }
      });
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y - 18, r: 4 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#131722' }
      });
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x - 8, y: p.y - 14 },
            { x: p.x + 8, y: p.y - 14 },
            { x: p.x, y: p.y }
          ]
        },
        styles: { style: 'fill', color: '#2962ff' }
      });
      // 2. Text Box above Map Pin with pointer tail
      const boxWidth = Math.max(140, textContent.length * 8 + 24);
      const boxHeight = 36;
      const boxX = p.x - 40;
      const boxY = p.y - 70;
      // Pointer triangle from box to pin head
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x - 8, y: boxY + boxHeight },
            { x: p.x + 8, y: boxY + boxHeight },
            { x: p.x, y: boxY + boxHeight + 8 }
          ]
        },
        styles: { style: 'fill', color: 'rgba(42, 46, 57, 0.95)' }
      });
      // Box body
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(42, 46, 57, 0.95)', borderColor: '#434651', borderSize: 1, borderRadius: 6 }
      });
      figures.push({
        type: 'text',
        attrs: { x: boxX + 12, y: boxY + 9, text: textContent },
        styles: { color: '#d1d4dc', size: 13, weight: 'normal' }
      });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Bảng (tableMark) - Screenshot 4
registerOverlay({
  name: 'tableMark',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      const width = maxX - minX || 240;
      const height = maxY - minY || 120;
      // Outer box
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(30, 34, 45, 0.85)', borderColor: '#434651', borderSize: 1.5 }
      });
      // Rows
      const rowH = height / 3;
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX, y: minY + rowH }, { x: maxX, y: minY + rowH }] },
        styles: { color: '#434651', size: 1 }
      });
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX, y: minY + rowH * 2 }, { x: maxX, y: minY + rowH * 2 }] },
        styles: { color: '#434651', size: 1 }
      });
      // Columns
      const colW = width / 3;
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX + colW, y: minY }, { x: minX + colW, y: maxY }] },
        styles: { color: '#434651', size: 1 }
      });
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX + colW * 2, y: minY }, { x: minX + colW * 2, y: maxY }] },
        styles: { color: '#434651', size: 1 }
      });
      // Corner handles
      const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
      ];
      corners.forEach(c => {
        figures.push({
          type: 'circle',
          attrs: { x: c.x, y: c.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
        });
      });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Chú thích (callout) - Screenshot 5
registerOverlay({
  name: 'callout',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p1 = coordinates[0];
      const p2 = coordinates[1];
      const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));

      // 1. Target handle at p1
      figures.push({
        type: 'circle',
        attrs: { x: p1.x, y: p1.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // 2. Speech Bubble Container at p2
      const boxWidth = Math.max(130, textContent.length * 9 + 24);
      const boxHeight = 38;
      const boxX = p2.x;
      const boxY = p2.y - boxHeight / 2;
      // Triangle pointer tail connecting left edge of box to p1
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            p1,
            { x: boxX, y: boxY + 8 },
            { x: boxX, y: boxY + boxHeight - 8 }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(38, 166, 154, 0.25)', borderColor: '#26a69a', borderSize: 2 }
      });
      // Rounded rectangle body
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(38, 166, 154, 0.25)', borderColor: '#26a69a', borderSize: 2, borderRadius: 10 }
      });
      // Text inside callout bubble
      figures.push({
        type: 'text',
        attrs: { x: boxX + 14, y: boxY + 9, text: textContent },
        styles: { color: '#4db6ac', size: 15, weight: 'bold' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ BĂ¬nh luáº­n (comment) - Image 1
registerOverlay({
  name: 'comment',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));
      const boxWidth = Math.max(130, textContent.length * 9 + 28);
      const boxHeight = 36;
      const boxX = p.x + 8;
      const boxY = p.y - boxHeight / 2 - 10;
      // Handle at p
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Chat bubble body
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: '#446cf6', borderColor: '#446cf6', borderRadius: 16 }
      });
      // Text inside bubble
      figures.push({
        type: 'text',
        attrs: { x: boxX + 16, y: boxY + 8, text: textContent },
        styles: { color: '#ffffff', size: 14, weight: 'bold' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ NhĂ£n GiĂ¡ (priceLabel) - Image 2
registerOverlay({
  name: 'priceLabel',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, kLineDataList, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      let priceVal = '';
      if (typeof overlay.extendData === 'string' && overlay.extendData && overlay.extendData !== '83,218.92' && overlay.extendData !== getTr('chart.addText', 'Thêm văn bản') && overlay.extendData !== '0.00') {
        priceVal = overlay.extendData;
      } else {
        const pt = points && points[0];
        const numPrice = (pt && typeof pt.value === 'number' && pt.value !== 0)
          ? pt.value
          : (pt && typeof pt.dataIndex === 'number' && kLineDataList && kLineDataList[pt.dataIndex]
            ? kLineDataList[pt.dataIndex].close
            : (kLineDataList && kLineDataList.length > 0 ? kLineDataList[kLineDataList.length - 1].close : 83218.92));
        priceVal = Number(numPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      const boxWidth = Math.max(100, priceVal.length * 9 + 24);
      const boxHeight = 34;
      const boxX = p.x + 20;
      const boxY = p.y - 38;
      // Pointer tail connecting p to box
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            p,
            { x: boxX, y: boxY + boxHeight / 2 - 4 },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'fill', color: '#446cf6' }
      });
      // Target handle at p
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Blue Badge Box
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: '#446cf6', borderColor: '#446cf6', borderRadius: 8 }
      });
      // Price text
      figures.push({
        type: 'text',
        attrs: { x: boxX + 12, y: boxY + 7, text: priceVal },
        styles: { color: '#ffffff', size: 14, weight: 'bold' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Biá»ƒn chá»‰ dáº«n (signpost) - Image 3
registerOverlay({
  name: 'signpost',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      const textContent = String(overlay.extendData || getTr('chart.addText', 'Thêm văn bản'));

      const poleHeight = 110;
      const topY = p.y - poleHeight;
      // Vertical pole line
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: p.x, y: topY }, { x: p.x, y: p.y }] },
        styles: { color: '#a0a3b0', size: 1.5 }
      });
      // Handle at bottom p
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Text box at bottom
      const boxWidth = Math.max(120, textContent.length * 8 + 24);
      const boxHeight = 34;
      const boxX = p.x - boxWidth / 2;
      const boxY = p.y + 10;
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: boxX, y: boxY },
            { x: boxX + boxWidth, y: boxY },
            { x: boxX + boxWidth, y: boxY + boxHeight },
            { x: boxX, y: boxY + boxHeight }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(42, 46, 57, 0.95)', borderColor: '#434651', borderSize: 1, borderRadius: 6 }
      });
      figures.push({
        type: 'text',
        attrs: { x: boxX + 12, y: boxY + 8, text: textContent },
        styles: { color: '#d1d4dc', size: 13, weight: 'normal' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Cá» Ä‘Ă¡nh dáº¥u (flagMark) - Image 4
registerOverlay({
  name: 'flagMark',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      // Handle at p
      figures.push({
        type: 'circle',
        attrs: { x: p.x, y: p.y, r: 6 },
        styles: { style: 'stroke_fill', color: '#131722', borderColor: '#2962ff', borderSize: 2 }
      });
      // Flag pole
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: p.x, y: p.y }, { x: p.x, y: p.y - 32 }] },
        styles: { color: '#787b86', size: 3 }
      });
      // Waving flag polygon
      const topY = p.y - 32;
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x + 2, y: topY },
            { x: p.x + 28, y: topY + 4 },
            { x: p.x + 26, y: topY + 18 },
            { x: p.x + 2, y: topY + 14 }
          ]
        },
        styles: { style: 'stroke_fill', color: '#446cf6', borderColor: '#446cf6' }
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ÄÆ°á»ng giao nhau (crossLine)
registerOverlay({
  name: 'crossLine',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    const figures: any[] = [];
    if (coordinates.length >= 1) {
      const p = coordinates[0];
      figures.push({ type: 'line', attrs: { coordinates: [{ x: 0, y: p.y }, { x: bounding.width, y: p.y }] }, styles: { color: '#2196f3', style: 'dashed' } });
      figures.push({ type: 'line', attrs: { coordinates: [{ x: p.x, y: 0 }, { x: p.x, y: bounding.height }] }, styles: { color: '#2196f3', style: 'dashed' } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Mũi tên đánh dấu (arrowMarker) - 2-click thick pointer arrow
registerOverlay({
  name: 'arrowMarker',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 22;
    const stemWidth = 6;
    const p2Left = {
      x: p2.x - headLen * Math.cos(angle - Math.PI / 5),
      y: p2.y - headLen * Math.sin(angle - Math.PI / 5)
    };
    const p2Right = {
      x: p2.x - headLen * Math.cos(angle + Math.PI / 5),
      y: p2.y - headLen * Math.sin(angle + Math.PI / 5)
    };
    return [
      {
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2962ff', size: stemWidth }
      },
      {
        type: 'polygon',
        attrs: { coordinates: [p2, p2Left, p2Right] },
        styles: { style: 'fill', color: '#2962ff' }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Mũi tên (arrow) - Standard line arrow
registerOverlay({
  name: 'arrow',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return [];
    const p1 = coordinates[0];
    const p2 = coordinates[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 16;
    const p2Left = {
      x: p2.x - headLen * Math.cos(angle - Math.PI / 6),
      y: p2.y - headLen * Math.sin(angle - Math.PI / 6)
    };
    const p2Right = {
      x: p2.x - headLen * Math.cos(angle + Math.PI / 6),
      y: p2.y - headLen * Math.sin(angle + Math.PI / 6)
    };
    return [
      {
        type: 'line',
        attrs: { coordinates: [p1, p2] },
        styles: { color: '#2962ff', size: 2 }
      },
      {
        type: 'line',
        attrs: { coordinates: [p2Left, p2, p2Right] },
        styles: { color: '#2962ff', size: 2 }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Mũi tên chỉ lên (arrowUp)
registerOverlay({
  name: 'arrowUp',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 1) return [];
    const p = coordinates[0];
    const size = 18;
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x, y: p.y - size },
            { x: p.x - size / 1.3, y: p.y - size / 4 },
            { x: p.x - size / 3, y: p.y - size / 4 },
            { x: p.x - size / 3, y: p.y + size / 1.2 },
            { x: p.x + size / 3, y: p.y + size / 1.2 },
            { x: p.x + size / 3, y: p.y - size / 4 },
            { x: p.x + size / 1.3, y: p.y - size / 4 }
          ]
        },
        styles: { style: 'stroke_fill', color: '#089981', borderColor: '#089981' }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Mũi tên chỉ xuống (arrowDown)
registerOverlay({
  name: 'arrowDown',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 1) return [];
    const p = coordinates[0];
    const size = 18;
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x, y: p.y + size },
            { x: p.x - size / 1.3, y: p.y + size / 4 },
            { x: p.x - size / 3, y: p.y + size / 4 },
            { x: p.x - size / 3, y: p.y - size / 1.2 },
            { x: p.x + size / 3, y: p.y - size / 1.2 },
            { x: p.x + size / 3, y: p.y + size / 4 },
            { x: p.x + size / 1.3, y: p.y + size / 4 }
          ]
        },
        styles: { style: 'stroke_fill', color: '#f23645', borderColor: '#f23645' }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Mũi tên chỉ sang trái (arrowLeft)
registerOverlay({
  name: 'arrowLeft',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 1) return [];
    const p = coordinates[0];
    const size = 18;
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x - size, y: p.y },
            { x: p.x - size / 4, y: p.y - size / 1.3 },
            { x: p.x - size / 4, y: p.y - size / 3 },
            { x: p.x + size / 1.2, y: p.y - size / 3 },
            { x: p.x + size / 1.2, y: p.y + size / 3 },
            { x: p.x - size / 4, y: p.y + size / 3 },
            { x: p.x - size / 4, y: p.y + size / 1.3 }
          ]
        },
        styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#2962ff' }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Mũi tên chỉ sang phải (arrowRight)
registerOverlay({
  name: 'arrowRight',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 1) return [];
    const p = coordinates[0];
    const size = 18;
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: p.x + size, y: p.y },
            { x: p.x + size / 4, y: p.y - size / 1.3 },
            { x: p.x + size / 4, y: p.y - size / 3 },
            { x: p.x - size / 1.2, y: p.y - size / 3 },
            { x: p.x - size / 1.2, y: p.y + size / 3 },
            { x: p.x + size / 4, y: p.y + size / 3 },
            { x: p.x + size / 4, y: p.y + size / 1.3 }
          ]
        },
        styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#2962ff' }
      },
      {
        type: 'circle',
        attrs: { x: p.x - size / 1.2, y: p.y, r: 4 },
        styles: { style: 'stroke_fill', color: '#ffffff', borderColor: '#2962ff', borderSize: 2 }
      }
    ];
  }
});

// ÄÄƒng kĂ½ Hình Polyline (polyline & path) - Image 1
registerOverlay({
  name: 'polyline',
  totalStep: 10,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      figures.push({
        type: 'line',
        attrs: { coordinates },
        styles: { color: '#00bcd4', size: 3 }
      });
      coordinates.forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 5 },
          styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    }
    return figures;
  }
});
registerOverlay({
  name: 'path',
  totalStep: 10,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      figures.push({
        type: 'line',
        attrs: { coordinates },
        styles: { color: '#00bcd4', size: 3 }
      });
      coordinates.forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 5 },
          styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ÄÆ°á»ng cong (curve) - Image 2
registerOverlay({
  name: 'curve',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 3) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const curvePoints: { x: number; y: number }[] = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
        const y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
        curvePoints.push({ x, y });
      }
      figures.push({
        type: 'line',
        attrs: { coordinates: curvePoints },
        styles: { color: '#2962ff', size: 3.5 }
      });
      [p0, p1, p2].forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    } else if (coordinates.length === 2) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff', size: 3 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ÄÆ°á»ng cong Ä‘Ă´i (doubleCurve) - Image 3
registerOverlay({
  name: 'doubleCurve',
  totalStep: 5,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 4) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const p3 = coordinates[3];
      const curvePoints: { x: number; y: number }[] = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = Math.pow(oneMinusT, 3) * p0.x + 3 * Math.pow(oneMinusT, 2) * t * p1.x + 3 * oneMinusT * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
        const y = Math.pow(oneMinusT, 3) * p0.y + 3 * Math.pow(oneMinusT, 2) * t * p1.y + 3 * oneMinusT * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;
        curvePoints.push({ x, y });
      }
      figures.push({
        type: 'line',
        attrs: { coordinates: curvePoints },
        styles: { color: '#ab47bc', size: 4 }
      });
      [p0, p1, p2, p3].forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    } else if (coordinates.length === 3) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const curvePoints: { x: number; y: number }[] = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
        const y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
        curvePoints.push({ x, y });
      }
      figures.push({
        type: 'line',
        attrs: { coordinates: curvePoints },
        styles: { color: '#ab47bc', size: 3.5 }
      });
      [p0, p1, p2].forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    } else if (coordinates.length === 2) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#ab47bc', size: 3 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ HĂ¬nh vĂ²ng cung (arc) - Image 4
registerOverlay({
  name: 'arc',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 3) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const curvePoints: { x: number; y: number }[] = [];
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
        const y = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
        curvePoints.push({ x, y });
      }
      // Sector polygon: arc curve + line back to p0 (Image 4)
      const sectorPolygon = [...curvePoints, p0];
      figures.push({
        type: 'polygon',
        attrs: { coordinates: sectorPolygon },
        styles: { style: 'stroke_fill', color: 'rgba(233, 30, 99, 0.25)', borderColor: '#e91e63', borderSize: 2.5 }
      });
      [p0, p1, p2].forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    } else if (coordinates.length === 2) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#e91e63', size: 2.5 } });
    }
    return figures;
  }
});

// ÄÄƒng kĂ½ Kênh Song song (priceChannelLine) - Image 1
registerOverlay({
  name: 'priceChannelLine',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 3) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const offset = { x: p2.x - p0.x, y: p2.y - p0.y };
      const p3 = { x: p1.x + offset.x, y: p1.y + offset.y };
      const midP0 = { x: p0.x + offset.x / 2, y: p0.y + offset.y / 2 };
      const midP1 = { x: p1.x + offset.x / 2, y: p1.y + offset.y / 2 };
      // 1. Shaded Translucent Background Fill (Matching Image 1 & 3)
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [p0, p1, p3, p2] },
        styles: { style: 'stroke_fill', color: 'rgba(41, 98, 255, 0.18)', borderColor: 'transparent' }
      });
      // 2. Base Line (p0 -> p1)
      figures.push({ type: 'line', attrs: { coordinates: [p0, p1] }, styles: { color: '#2962ff', size: 2 } });
      // 3. Parallel Line (p2 -> p3)
      figures.push({ type: 'line', attrs: { coordinates: [p2, p3] }, styles: { color: '#2962ff', size: 2 } });
      // 4. Center Dashed Midline (midP0 -> midP1)
      figures.push({ type: 'line', attrs: { coordinates: [midP0, midP1] }, styles: { style: 'dashed', color: '#2962ff', size: 1.5, dashedValue: [4, 4] } });
      // 5. Handles
      [p0, p1, p2, p3].forEach(p => {
        figures.push({ type: 'circle', attrs: { x: p.x, y: p.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
      });
    } else if (coordinates.length === 2) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#2962ff', size: 2 } });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Xu hÆ°á»›ng há»“i quy (regressionTrend) - Image 2
registerOverlay({
  name: 'regressionTrend',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, kLineDataList }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      let channelHeight = Math.abs(p1.y - p0.y) * 0.4;
      if (channelHeight < 25) channelHeight = 35;
      let rSquaredText = 'R² = 0.984';
      let deltaText = '';
      if (points && points.length >= 2 && kLineDataList && kLineDataList.length > 0) {
        const idx0 = Math.min(points[0].dataIndex ?? 0, points[1].dataIndex ?? 0);
        const idx1 = Math.max(points[0].dataIndex ?? 0, points[1].dataIndex ?? 0);
        const sliced = kLineDataList.slice(idx0, idx1 + 1);
        if (sliced.length > 2) {
          const n = sliced.length;
          let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
          sliced.forEach((d: any, i: number) => {
            const y = d.close;
            sumX += i;
            sumY += y;
            sumXY += i * y;
            sumXX += i * i;
            sumYY += y * y;
          });
          const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
          let ssRes = 0, ssTot = 0;
          const meanY = sumY / n;
          sliced.forEach((d: any, i: number) => {
            const yPred = m * i + (sumY - m * sumX) / n;
            ssRes += Math.pow(d.close - yPred, 2);
            ssTot += Math.pow(d.close - meanY, 2);
          });
          const r2 = Math.max(0, 1 - (ssRes / (ssTot || 1)));
          rSquaredText = `${m >= 0 ? '+' : ''}${m.toFixed(4)} (${(r2).toFixed(4)})`;
          const pStart = sliced[0].close;
          const pEnd = sliced[sliced.length - 1].close;
          const pDiff = pEnd - pStart;
          const pPct = pStart !== 0 ? (pDiff / pStart) * 100 : 0;
          deltaText = `${pDiff >= 0 ? '+' : ''}${pDiff.toFixed(2)} (${pPct >= 0 ? '+' : ''}${pPct.toFixed(2)}%)`;
        }
      }
      const u0 = { x: p0.x, y: p0.y - channelHeight };
      const u1 = { x: p1.x, y: p1.y - channelHeight };
      const l0 = { x: p0.x, y: p0.y + channelHeight };
      const l1 = { x: p1.x, y: p1.y + channelHeight };
      // 1. Shaded Fills (Matching Image 2):
      // Upper Band: Blue Translucent Fill
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [u0, u1, p1, p0] },
        styles: { style: 'stroke_fill', color: 'rgba(41, 98, 255, 0.20)', borderColor: 'transparent' }
      });
      // Lower Band: Red Translucent Fill
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [p0, p1, l1, l0] },
        styles: { style: 'stroke_fill', color: 'rgba(242, 54, 69, 0.20)', borderColor: 'transparent' }
      });
      // 2. Channel Lines (Matching Image 2):
      figures.push({ type: 'line', attrs: { coordinates: [u0, u1] }, styles: { color: '#2962ff', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p0, p1] }, styles: { style: 'dashed', color: '#f23645', size: 1.5, dashedValue: [4, 4] } });
      figures.push({ type: 'line', attrs: { coordinates: [l0, l1] }, styles: { color: '#2962ff', size: 2 } });
      // 3. Data Text Displays (Matching Image 2):
      const midX = (p0.x + p1.x) / 2;
      figures.push({
        type: 'text',
        attrs: { x: u0.x + 10, y: u0.y - 18, text: deltaText || rSquaredText },
        styles: { color: '#2962ff', size: 13, weight: 'bold' }
      });
      if (deltaText) {
        figures.push({
          type: 'text',
          attrs: { x: midX - 40, y: l1.y + 10, text: rSquaredText },
          styles: { color: '#2962ff', size: 12, weight: 'bold' }
        });
      }
      // 4. Handles
      [p0, p1, u0, u1, l0, l1].forEach(p => {
        figures.push({ type: 'circle', attrs: { x: p.x, y: p.y, r: 5 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ Máº·t pháº³ng Ä‘á»‰nh/Ä‘Ă¡y (flatTopBottom) - Image 1 & 3
registerOverlay({
  name: 'flatTopBottom',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, points, bounding }: any) => {
    const figures: any[] = [];
    if (coordinates.length >= 2) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const minX = Math.min(p0.x, p1.x);
      const maxX = Math.max(p0.x, p1.x);
      const topY = Math.min(p0.y, p1.y);
      const botY = Math.max(p0.y, p1.y);
      const midY = (topY + botY) / 2;
      // 1. Semi-transparent Dark Blue Box Fill (Matching Image 1 & 3)
      figures.push({
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: minX, y: topY },
            { x: maxX, y: topY },
            { x: maxX, y: botY },
            { x: minX, y: botY }
          ]
        },
        styles: { style: 'stroke_fill', color: 'rgba(33, 40, 75, 0.45)', borderColor: '#2962ff', borderSize: 2 }
      });
      // 2. Center Dashed Horizontal Line (Matching Image 1)
      figures.push({
        type: 'line',
        attrs: { coordinates: [{ x: minX, y: midY }, { x: maxX, y: midY }] },
        styles: { style: 'dashed', color: '#2962ff', size: 1.5, dashedValue: [4, 4] }
      });
      // 3. Right Y-Axis Price Label Badges (Matching Image 3)
      let topPriceStr = '85,781.04';
      let midPriceStr = '85,757.18';
      let botPriceStr = '85,431.16';
      if (points && points.length >= 2) {
        const val0 = points[0].value ?? 0;
        const val1 = points[1].value ?? 0;
        const pMax = Math.max(val0, val1);
        const pMin = Math.min(val0, val1);
        const pMid = (pMax + pMin) / 2;
        if (pMax !== 0) {
          topPriceStr = Number(pMax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          midPriceStr = Number(pMid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          botPriceStr = Number(pMin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
      const badgeX = bounding ? bounding.width - 90 : maxX + 10;
      const pillW = 85;
      const pillH = 22;
      [
        { y: topY, text: topPriceStr },
        { y: midY, text: midPriceStr },
        { y: botY, text: botPriceStr }
      ].forEach(item => {
        figures.push({
          type: 'polygon',
          attrs: {
            coordinates: [
              { x: badgeX, y: item.y - pillH / 2 },
              { x: badgeX + pillW, y: item.y - pillH / 2 },
              { x: badgeX + pillW, y: item.y + pillH / 2 },
              { x: badgeX, y: item.y + pillH / 2 }
            ]
          },
          styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#2962ff', borderRadius: 4 }
        });
        figures.push({
          type: 'text',
          attrs: { x: badgeX + 6, y: item.y - 6, text: item.text },
          styles: { color: '#ffffff', size: 11, weight: 'bold' }
        });
      });
      // 4. Interactive Handles
      const handles = [
        { x: minX, y: topY },
        { x: (minX + maxX) / 2, y: topY },
        { x: maxX, y: topY },
        { x: minX, y: botY },
        { x: (minX + maxX) / 2, y: botY },
        { x: maxX, y: botY }
      ];
      handles.forEach(h => {
        figures.push({
          type: 'circle',
          attrs: { x: h.x, y: h.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ ThÆ°á»›c Ä‘o Fibonacci (fibonacciLine)
registerOverlay({
  name: 'fibonacciLine',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, yAxis }: any) => {
    const figures: any[] = [];
    const points = overlay?.points || [];
    if (coordinates.length >= 2) {
      const extendData = overlay?.extendData;
      let config: FibonacciConfig = DEFAULT_FIBONACCI_CONFIG;
      let textStr = '';
      // Protect against klinecharts overwriting extendData with typed text
      if (typeof extendData === 'string') {
        textStr = extendData;
      } else if (extendData && Array.isArray(extendData.levels)) {
        config = extendData;
      }
      if (typeof overlay?.text === 'string') textStr = overlay.text;
      const yDif = coordinates[0].y - coordinates[1].y;
      let valDif = 0;
      let price1 = 0;
      if (points.length >= 2 && typeof points[0]?.value === 'number' && typeof points[1]?.value === 'number') {
        valDif = points[0].value - points[1].value;
        price1 = points[1].value;
      } else if (yAxis?.convertFromPixel) {
        const val0 = yAxis.convertFromPixel(coordinates[0].y);
        const val1 = yAxis.convertFromPixel(coordinates[1].y);
        valDif = val0 - val1;
        price1 = val1;
      }
      const activeLevels = [...config.levels].filter(l => l.active).sort((a, b) => b.level - a.level);
      // Support Extend Lines Right (TradingView standard)
      const p0x = coordinates[0].x;
      const p1x = coordinates[1].x;
      const startX = Math.min(p0x, p1x);
      const endX = config.extendRight ? (overlay.bounding?.width || 3000) : Math.max(p0x, p1x);
      // 1. Dáº£i ná»n mĂ u giá»¯a cĂ¡c má»©c Fibonacci liĂªn tiáº¿p
      if (config.showBackground && activeLevels.length > 1) {
        for (let i = 0; i < activeLevels.length - 1; i++) {
          const topLevel = activeLevels[i];
          const btmLevel = activeLevels[i + 1];
          const yTop = coordinates[1].y + yDif * topLevel.level;
          const yBtm = coordinates[1].y + yDif * btmLevel.level;
          figures.push({
            type: 'polygon',
            attrs: {
              coordinates: [
                { x: startX, y: yTop },
                { x: endX, y: yTop },
                { x: endX, y: yBtm },
                { x: startX, y: yBtm }
              ]
            },
            styles: {
              style: 'fill',
              color: topLevel.fill || 'rgba(33, 150, 243, 0.15)'
            }
          });
        }
      }
      // 2. ÄÆ°á»ng xu hÆ°á»›ng nĂ©t Ä‘á»©t
      figures.push({
        type: 'line',
        attrs: { coordinates: [coordinates[0], coordinates[1]] },
        styles: { style: 'dashed', color: '#787b86', size: 1, dashedValue: [4, 4] }
      });
      // 3. ÄÆ°á»ng káº» ngang má»©c Fibonacci vĂ  Text nhĂ£n hiá»ƒn thá»‹ sá»‘ liá»‡u
      activeLevels.forEach(item => {
        const y = coordinates[1].y + yDif * item.level;
        const priceVal = price1 + valDif * item.level;
        const formattedPrice = priceVal >= 100
          ? priceVal.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
          : priceVal.toFixed(getPricePrecision(priceVal));
        // ÄÆ°á»ng káº» ngang
        figures.push({
          type: 'line',
          attrs: {
            coordinates: [
              { x: startX, y },
              { x: endX, y }
            ]
          },
          styles: {
            style: 'solid',
            color: item.color,
            size: config.lineWidth || 1
          }
        });
        // NhĂ£n text: e.g. "0.618 (81,270.3)" chuáº©n TradingView
        let labelText = '';
        if (config.showLabels && config.showPrices) {
          labelText = `${item.level} (${formattedPrice})`;
        } else if (config.showLabels) {
          labelText = `${item.level}`;
        } else if (config.showPrices) {
          labelText = `${formattedPrice}`;
        }
        if (labelText) {
          figures.push({
            type: 'text',
            attrs: {
              x: startX + 6,
              y: y - 2,
              text: labelText,
              align: 'left',
              baseline: 'bottom'
            },
            styles: {
              color: item.color,
              size: 11,
              family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              weight: 'bold'
            },
            ignoreEvent: true
          });
        }
      });
      // 4. Blue Handle Circles at anchor points (TradingView standard)
      figures.push({ type: 'circle', attrs: { x: coordinates[0].x, y: coordinates[0].y, r: 6 }, styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#ffffff', borderSize: 2 } });
      figures.push({ type: 'circle', attrs: { x: coordinates[1].x, y: coordinates[1].y, r: 6 }, styles: { style: 'stroke_fill', color: '#2962ff', borderColor: '#ffffff', borderSize: 2 } });
      // 5. Render custom user text if they type on the Fibonacci tool
      if (textStr) {
        figures.push({
          type: 'text',
          attrs: { x: startX + Math.abs(endX - startX) / 2, y: Math.min(coordinates[0].y, coordinates[1].y) - 10, text: textStr, align: 'center', baseline: 'bottom' },
          styles: { color: '#ffffff', size: 14, family: 'Inter' },
          ignoreEvent: true
        });
      }
    }
    return figures;
  }
});
// ÄÄƒng kĂ½ KhĂ´ng káº¿t ná»‘i KĂªnh (disjointChannel) - Image 5
registerOverlay({
  name: 'disjointChannel',
  totalStep: 5,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const figures: any[] = [];
    if (coordinates.length >= 4) {
      const p0 = coordinates[0];
      const p1 = coordinates[1];
      const p2 = coordinates[2];
      const p3 = coordinates[3];
      // 1. Translucent Green Shaded Fill (Matching Image 5)
      figures.push({
        type: 'polygon',
        attrs: { coordinates: [p0, p1, p3, p2] },
        styles: { style: 'stroke_fill', color: 'rgba(8, 153, 129, 0.22)', borderColor: 'transparent' }
      });
      // 2. Top & Bottom Channel Lines (Matching Image 5)
      figures.push({ type: 'line', attrs: { coordinates: [p0, p1] }, styles: { color: '#089981', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p2, p3] }, styles: { color: '#089981', size: 2 } });
      // 3. Cross X-Lines (p0 -> p3, p1 -> p2) (Matching Image 5)
      figures.push({ type: 'line', attrs: { coordinates: [p0, p3] }, styles: { color: '#089981', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#089981', size: 2 } });
      // 4. Interactive Handles
      [p0, p1, p2, p3].forEach(p => {
        figures.push({
          type: 'circle',
          attrs: { x: p.x, y: p.y, r: 6 },
          styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 }
        });
      });
    } else if (coordinates.length >= 2) {
      figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#089981', size: 2 } });
    }
    return figures;
  }
});
// Helper function to create Pitchfork figures (Standard, Schiff, Modified Schiff, Inside)
const drawPitchforkFigures = (coordinates: any[], type: 'standard' | 'schiff' | 'modified' | 'inside') => {
  const figures: any[] = [];
  if (coordinates.length >= 3) {
    const p0 = coordinates[0];
    const p1 = coordinates[1];
    const p2 = coordinates[2];
    const midP = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    let pBase = { x: p0.x, y: p0.y };
    let dirVector = { x: midP.x - p0.x, y: midP.y - p0.y };
    if (type === 'schiff') {
      pBase = { x: p0.x, y: (p0.y + p1.y) / 2 };
      dirVector = { x: midP.x - pBase.x, y: midP.y - pBase.y };
    } else if (type === 'modified') {
      pBase = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      dirVector = { x: midP.x - pBase.x, y: midP.y - pBase.y };
    } else if (type === 'inside') {
      pBase = { x: p0.x, y: p0.y };
      const m01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      dirVector = { x: p2.x - m01.x, y: p2.y - m01.y };
    }
    const length = Math.sqrt(dirVector.x * dirVector.x + dirVector.y * dirVector.y) || 1;
    const L = 1400; // Extension length
    const extVector = { x: (dirVector.x / length) * L, y: (dirVector.y / length) * L };
    // Calculate level lines: 0.0, 0.25, 0.5 (median), 0.75, 1.0
    const levels = [0.0, 0.25, 0.5, 0.75, 1.0];
    const levelStartPoints: { x: number; y: number }[] = [];
    const levelEndPoints: { x: number; y: number }[] = [];
    levels.forEach(t => {
      const sx = p1.x + t * (p2.x - p1.x);
      const sy = p1.y + t * (p2.y - p1.y);
      const ex = sx + extVector.x;
      const ey = sy + extVector.y;
      levelStartPoints.push({ x: sx, y: sy });
      levelEndPoints.push({ x: ex, y: ey });
    });
    // 1. Shaded Color Polygon Bands (Matching Images 1-4)
    // Band 0: Level 0.0 to 0.25 (Indigo/Blue Fill)
    figures.push({
      type: 'polygon',
      attrs: { coordinates: [levelStartPoints[0], levelEndPoints[0], levelEndPoints[1], levelStartPoints[1]] },
      styles: { style: 'stroke_fill', color: 'rgba(41, 98, 255, 0.18)', borderColor: 'transparent' }
    });
    // Band 1: Level 0.25 to 0.5 (Teal/Green Fill)
    figures.push({
      type: 'polygon',
      attrs: { coordinates: [levelStartPoints[1], levelEndPoints[1], levelEndPoints[2], levelStartPoints[2]] },
      styles: { style: 'stroke_fill', color: 'rgba(8, 153, 129, 0.22)', borderColor: 'transparent' }
    });
    // Band 2: Level 0.5 to 0.75 (Teal/Green Fill)
    figures.push({
      type: 'polygon',
      attrs: { coordinates: [levelStartPoints[2], levelEndPoints[2], levelEndPoints[3], levelStartPoints[3]] },
      styles: { style: 'stroke_fill', color: 'rgba(8, 153, 129, 0.22)', borderColor: 'transparent' }
    });
    // Band 3: Level 0.75 to 1.0 (Indigo/Blue Fill)
    figures.push({
      type: 'polygon',
      attrs: { coordinates: [levelStartPoints[3], levelEndPoints[3], levelEndPoints[4], levelStartPoints[4]] },
      styles: { style: 'stroke_fill', color: 'rgba(41, 98, 255, 0.18)', borderColor: 'transparent' }
    });
    // 2. Channel Lines
    // Outer Line 0.0 (Blue)
    figures.push({ type: 'line', attrs: { coordinates: [levelStartPoints[0], levelEndPoints[0]] }, styles: { color: '#2962ff', size: 2 } });
    // Inner Line 0.25 (Teal)
    figures.push({ type: 'line', attrs: { coordinates: [levelStartPoints[1], levelEndPoints[1]] }, styles: { color: '#089981', size: 1.5 } });
    // Center Median Line 0.5 (Red)
    figures.push({ type: 'line', attrs: { coordinates: [pBase, levelEndPoints[2]] }, styles: { color: '#f23645', size: 2 } });
    // Inner Line 0.75 (Teal)
    figures.push({ type: 'line', attrs: { coordinates: [levelStartPoints[3], levelEndPoints[3]] }, styles: { color: '#089981', size: 1.5 } });
    // Outer Line 1.0 (Blue)
    figures.push({ type: 'line', attrs: { coordinates: [levelStartPoints[4], levelEndPoints[4]] }, styles: { color: '#2962ff', size: 2 } });
    // 3. Red Guide Structure Lines (Matching Images 1-4)
    if (type === 'standard') {
      figures.push({ type: 'line', attrs: { coordinates: [p0, midP] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#f23645', size: 2 } });
    } else if (type === 'schiff') {
      figures.push({ type: 'line', attrs: { coordinates: [p0, pBase] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [pBase, midP] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#f23645', size: 2 } });
    } else if (type === 'modified') {
      figures.push({ type: 'line', attrs: { coordinates: [p0, p1] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [pBase, midP] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#f23645', size: 2 } });
    } else if (type === 'inside') {
      const m01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      figures.push({ type: 'line', attrs: { coordinates: [p0, p1] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [m01, p2] }, styles: { color: '#f23645', size: 2 } });
      figures.push({ type: 'line', attrs: { coordinates: [p1, p2] }, styles: { color: '#f23645', size: 2 } });
    }
    // 4. Interactive Handle Circles
    figures.push({ type: 'circle', attrs: { x: p0.x, y: p0.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
    figures.push({ type: 'circle', attrs: { x: p1.x, y: p1.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
    figures.push({ type: 'circle', attrs: { x: p2.x, y: p2.y, r: 6 }, styles: { style: 'stroke_fill', color: '#2196f3', borderColor: '#ffffff', borderSize: 2 } });
  } else if (coordinates.length === 2) {
    figures.push({ type: 'line', attrs: { coordinates }, styles: { color: '#f23645', size: 2 } });
  }
  return figures;
};

// ÄÄƒng kĂ½ Mô hình Pitchfork (Image 1)
registerOverlay({
  name: 'pitchfork',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => drawPitchforkFigures(coordinates, 'standard')
});

// ÄÄƒng kĂ½ Mô hình Schiff Pitchfork (Image 2)
registerOverlay({
  name: 'schiffPitchfork',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => drawPitchforkFigures(coordinates, 'schiff')
});

// ÄÄƒng kĂ½ Mô hình Schiff Pitchfork Biáº¿n Ä‘á»•i (Image 3)
registerOverlay({
  name: 'modifiedSchiffPitchfork',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => drawPitchforkFigures(coordinates, 'modified')
});

// ÄÄƒng kĂ½ Mô hình Pitchfork máº·t trong (Image 4)
registerOverlay({
  name: 'insidePitchfork',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => drawPitchforkFigures(coordinates, 'inside')
});
interface ChartAreaProps {
  activeTool: string;
  selectedStock: Stock;
  activeTimeframe: string;
  isReplaying: boolean;
  replayTime?: number | null;
  replayPrice?: number | null;
  replayStepTrigger?: number;
  replayReloadTrigger?: number;
  onReplayTimeChange?: (time: number) => void;
  onReplayPriceChange?: (price: number) => void;
  tradeOrders: TradeOrder[];
  chartSettings: ChartSettings;
  pendingOrders?: any[];
  activeIndicators?: string[];
  activePosition?: { quantity: number; averagePrice: number; side: 'LONG' | 'SHORT'; leverage: number; tp?: number; sl?: number };
  onPriceChange?: (price: number) => void;
  onPriceUpdate?: (price: number, timestamp?: number, bar?: { open: number; high: number; low: number; close: number; timestamp: number }) => void;
  isSelectingReplayStart?: boolean;
  onSelectReplayStart?: (timestamp: number, price?: number) => void;
  goToRealtimeTrigger?: number;
  onDataLoaded?: (count: number) => void;
  onToolSelect?: (tool: string) => void;
  magnetMode?: boolean;
  magnetType?: 'weak' | 'strong';
  stayInDrawingMode?: boolean;
  lockDrawing?: boolean;
  hideDrawing?: boolean;
  previewTPSL?: { tp?: number; sl?: number; side?: 'LONG' | 'SHORT'; enabled: boolean; orderPrice?: number; orderType?: 'LIMIT' | 'STOP'; quantity?: number; lot?: number; actualQty?: number } | null;
  onTPSLChange?: (type: 'tp' | 'sl' | 'orderPrice', price: number) => void;
  simulatorPositions?: any[];
  undoTrigger?: number;
  redoTrigger?: number;
  onUndoRedoChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}
// Cache data per stock+timeframe to avoid re-generating every render
const dataCache = new Map<string, KLineData[]>();
const getStockData = (stock: Stock): KLineData[] => {
  if (!dataCache.has(stock.symbol)) {
    dataCache.set(stock.symbol, generateOHLCV(stock.price, 300));
  }
  return dataCache.get(stock.symbol)!;
};
export const ChartArea = ({
  activeTool,
  onToolSelect,
  magnetMode,
  magnetType,
  stayInDrawingMode,
  lockDrawing,
  hideDrawing,
  selectedStock,
  activeTimeframe,
  isReplaying,
  replayTime,
  replayPrice,
  replayStepTrigger,
  replayReloadTrigger,
  onReplayTimeChange,
  onReplayPriceChange,
  tradeOrders,
  chartSettings,
  pendingOrders,
  activeIndicators = [],
  activePosition,
  simulatorPositions,
  onPriceUpdate,
  onPriceChange,
  isSelectingReplayStart,
  onSelectReplayStart,
  goToRealtimeTrigger,
  onDataLoaded,
  previewTPSL,
  onTPSLChange,
  undoTrigger,
  redoTrigger,
  onUndoRedoChange
}: ChartAreaProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const userKey = user?._id || user?.email || 'guest';
  const userKeyRef = useRef(userKey);
  userKeyRef.current = userKey;

  const saveDrawingsRef = useRef<() => void>(() => {});
  const loadDrawingsRef = useRef<() => void>(() => {});

  const debouncedSaveTimerRef = useRef<any>(null);
  const triggerAutoSaveDrawings = () => {
    if (debouncedSaveTimerRef.current) clearTimeout(debouncedSaveTimerRef.current);
    debouncedSaveTimerRef.current = setTimeout(() => {
      saveDrawingsRef.current?.();
    }, 150);
  };
  globalTriggerAutoSave = triggerAutoSaveDrawings;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const activeToolRef = useRef<string>('cursor');
  const activeTimeframeRef = useRef<string>(activeTimeframe);
  const isSelectingReplayStartRef = useRef(isSelectingReplayStart);
  const copiedOverlayRef = useRef<any>(null);
  isSelectingReplayStartRef.current = isSelectingReplayStart;
  const onSelectReplayStartRef = useRef(onSelectReplayStart);
  onSelectReplayStartRef.current = onSelectReplayStart;
  const replayTimeRef = useRef<number | null | undefined>(replayTime);
  replayTimeRef.current = replayTime;
  const replayPriceRef = useRef<number | null | undefined>(replayPrice);
  replayPriceRef.current = replayPrice;
  const onReplayTimeChangeRef = useRef(onReplayTimeChange);
  onReplayTimeChangeRef.current = onReplayTimeChange;
  const onReplayPriceChangeRef = useRef(onReplayPriceChange);
  onReplayPriceChangeRef.current = onReplayPriceChange;
  const crosshairIndexRef = useRef<number | null>(null);
  const subscriberCallbackRef = useRef<((data: KLineData) => void) | null>(null);
  const isDraggingRef = useRef(false);
  const currentTpRef = useRef<number | undefined>(undefined);
  const currentSlRef = useRef<number | undefined>(undefined);
  const currentOrderPriceRef = useRef<number | undefined>(undefined);
  const onTPSLChangeRef = useRef(onTPSLChange);
  const pendingOrderOverlayIdsRef = useRef<string[]>([]);
  const createdOverlaysRef = useRef<Record<string, boolean>>({});
  const stayInDrawingModeRef = useRef(stayInDrawingMode);
  stayInDrawingModeRef.current = stayInDrawingMode;
  const lastOverlayPointsRef = useRef<Record<string, any>>({});
  const isOverlayDraggingRef = useRef<boolean>(false);
  const lineDragHandleRef = useRef<Record<string, 'p0' | 'p1' | 'body' | 'none'>>({});
  // Fibonacci & Tool Floating Bar States
  const [isFibModalOpen, setIsFibModalOpen] = useState(false);
  const [fibConfig, setFibConfig] = useState<FibonacciConfig>(DEFAULT_FIBONACCI_CONFIG);
  const fibConfigRef = useRef<FibonacciConfig>(DEFAULT_FIBONACCI_CONFIG);
  const [selectedOverlay, setSelectedOverlay] = useState<{ id: string; name: string; extendData: FibonacciConfig; lock: boolean; x: number; y: number } | null>(null);
  // Undo / Redo History Stacks
  const historyStackRef = useRef<any[]>([]);
  const redoStackRef = useRef<any[]>([]);
  const updateUndoRedo = () => {
    onUndoRedoChange?.({
      canUndo: historyStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0
    });
  };
  const handleOverlayDrawEnd = (event: any) => {
    const ov = event.overlay;
    if (ov) {
      historyStackRef.current.push({
        id: ov.id,
        name: ov.name,
        points: ov.points,
        extendData: ov.extendData,
        styles: ov.styles,
        lock: ov.lock
      });
      redoStackRef.current = [];
      updateUndoRedo();
      triggerAutoSaveDrawings();

      if (ov.name === 'fibonacciLine') {
        const bounding = chartRef.current?.getSize();
        const w = bounding?.width || 800;
        const xPos = Math.min(w - 280, Math.max(20, (event.x || 300) - 100));
        const yPos = Math.max(50, (event.y || 150) - 50);
        setSelectedOverlay({
          id: ov.id,
          name: ov.name,
          extendData: ov.extendData || fibConfigRef.current,
          lock: ov.lock,
          x: xPos,
          y: yPos
        });
      }
    }
  };
  const handleOverlaySelect = (event: any) => {
    const ov = event.overlay;
    if (ov && ov.name === 'fibonacciLine') {
      const bounding = chartRef.current?.getSize();
      const w = bounding?.width || 800;
      const xPos = Math.min(w - 280, Math.max(20, (event.x || 300) - 100));
      const yPos = Math.max(50, (event.y || 150) - 50);
      setSelectedOverlay({
        id: ov.id,
        name: ov.name,
        extendData: ov.extendData || fibConfigRef.current,
        lock: ov.lock,
        x: xPos,
        y: yPos
      });
    }
  };
  // Listen to Undo trigger from toolbar / shortcut
  useEffect(() => {
    if (!undoTrigger) return;
    const chart = chartRef.current;
    if (!chart) return;
    if (historyStackRef.current.length > 0) {
      const last = historyStackRef.current.pop();
      chart.removeOverlay({ id: last.id });
      redoStackRef.current.push(last);
      if (selectedOverlay?.id === last.id) {
        setSelectedOverlay(null);
      }
      updateUndoRedo();
    }
  }, [undoTrigger]);
  // Listen to Redo trigger from toolbar / shortcut
  useEffect(() => {
    if (!redoTrigger) return;
    const chart = chartRef.current;
    if (!chart) return;
    if (redoStackRef.current.length > 0) {
      const item = redoStackRef.current.pop();
      const newId = chart.createOverlay({
        name: item.name,
        points: item.points,
        extendData: item.extendData,
        styles: item.styles,
        lock: item.lock,
        onDrawEnd: handleOverlayDrawEnd,
        onSelected: handleOverlaySelect,
        onClick: handleOverlaySelect
      });
      historyStackRef.current.push({ ...item, id: (newId as string) || item.id });
      updateUndoRedo();
    }
  }, [redoTrigger]);
  const handleSaveFibConfig = (newConfig: FibonacciConfig) => {
    setFibConfig(newConfig);
    fibConfigRef.current = newConfig;
    if (chartRef.current && selectedOverlay) {
      chartRef.current.overrideOverlay({
        id: selectedOverlay.id,
        extendData: newConfig
      });
      setSelectedOverlay(prev => prev ? { ...prev, extendData: newConfig } : null);
      triggerAutoSaveDrawings();
    }
  };
  const handleUpdateOverlayConfig = (patch: Partial<FibonacciConfig>) => {
    if (!selectedOverlay || !chartRef.current) return;
    const updated: FibonacciConfig = { ...selectedOverlay.extendData, ...patch };
    chartRef.current.overrideOverlay({
      id: selectedOverlay.id,
      extendData: updated
    });
    setSelectedOverlay(prev => prev ? { ...prev, extendData: updated } : null);
    setFibConfig(updated);
    fibConfigRef.current = updated;
    triggerAutoSaveDrawings();
  };
  useEffect(() => {
    onTPSLChangeRef.current = onTPSLChange;
  }, [onTPSLChange]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  // Overlay Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'style' | 'text' | 'coords' | 'visibility'>('style');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedOverlaySettings, setSelectedOverlaySettings] = useState<Partial<OverlaySettings>>({});
  const [floatingToolbar, setFloatingToolbar] = useState<{ overlayId: string, overlay: any, x: number, y: number } | null>(null);
  const [overlayPopup, setOverlayPopup] = useState<'color' | 'width' | 'style' | 'context' | 'templates' | null>(null);
  const [chartContextMenu, setChartContextMenu] = useState<{ x: number, y: number, price: number } | null>(null);
  const [overlayColor, setOverlayColor] = useState('#2962ff');
  const [overlayOpacity, setOverlayOpacity] = useState(100);
  const [overlayLineWidth, setOverlayLineWidth] = useState(2);
  const [overlayLineStyle, setOverlayLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [activeContextMenuSubMenu, setActiveContextMenuSubMenu] = useState<'visual_order' | 'timeframe_visibility' | 'templates' | null>(null);
  const onOverlayDoubleClickRef = useRef<((overlay: any, tab?: 'style' | 'text' | 'coords' | 'visibility') => void) | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isOverlayClickRef = useRef(false);
  // Map: indicator name â†’ sub-pane id (undefined = on main pane)
  const indicatorPaneRef = useRef<Map<string, string | undefined>>(new Map());
  useEffect(() => {
    isSelectingReplayStartRef.current = isSelectingReplayStart;
    onSelectReplayStartRef.current = onSelectReplayStart;
  }, [isSelectingReplayStart, onSelectReplayStart]);
  // Apply Lock All and Hide All Drawing Tools
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.overrideOverlay({ lock: lockDrawing });
    }
  }, [lockDrawing]);
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.overrideOverlay({ visible: !hideDrawing });
    }
  }, [hideDrawing]);
  useEffect(() => {
    replayTimeRef.current = replayTime;
  }, [replayTime]);
  useEffect(() => {
    replayPriceRef.current = replayPrice;
  }, [replayPrice]);
  useEffect(() => {
    onReplayTimeChangeRef.current = onReplayTimeChange;
  }, [onReplayTimeChange]);
  useEffect(() => {
    onReplayPriceChangeRef.current = onReplayPriceChange;
  }, [onReplayPriceChange]);
  useEffect(() => {
    if (goToRealtimeTrigger && goToRealtimeTrigger > 0 && chartRef.current) {
      chartRef.current.setOffsetRightDistance(50);
      chartRef.current.scrollToRealTime(0);
    }
  }, [goToRealtimeTrigger]);
  const chartSettingsRef = useRef(chartSettings);
  useEffect(() => {
    chartSettingsRef.current = chartSettings;
  }, [chartSettings]);
  const updateCrosshairStyles = (chart: Chart | null, tool: string) => {
    if (!chart) return;
    const isHide = tool === 'cursor_arrow' || tool === 'cursor_dot' || tool === 'eraser';
    chart.setStyles({
      crosshair: {
        show: !isHide,
        horizontal: {
          show: !isHide,
          line: { show: !isHide },
          text: { show: !isHide }
        },
        vertical: {
          show: !isHide,
          line: { show: !isHide },
          text: { show: !isHide }
        }
      }
    });
  };
  // Apply theme and chart settings dynamically to klinecharts
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chartSettings) return;
    const isDark = theme === 'dark';
    chart.setStyles(isDark ? 'dark' : 'light');
    // Resolve dynamic colors for light vs dark mode if using default dark palette
    const defaultGridDark = '#2a2e39';
    const hGridColor = (!isDark && chartSettings.canvas.hGridColor === defaultGridDark)
      ? '#f0f3f6'
      : chartSettings.canvas.hGridColor;
    const vGridColor = (!isDark && chartSettings.canvas.vGridColor === defaultGridDark)
      ? '#f0f3f6'
      : chartSettings.canvas.vGridColor;
    const textColor = (!isDark && chartSettings.scales.textColor === '#d1d4dc')
      ? '#50535e'
      : chartSettings.scales.textColor;
    const lineColor = (!isDark && chartSettings.scales.lineColor === defaultGridDark)
      ? '#e0e3eb'
      : chartSettings.scales.lineColor;
    chart.setStyles({
      grid: {
        horizontal: {
          show: chartSettings.canvas.hGridShow,
          size: 1,
          color: chartSettings.canvas.hGridShow ? hGridColor : 'transparent',
          style: chartSettings.canvas.hGridStyle === '—' ? 'solid' : 'dashed',
        },
        vertical: {
          show: chartSettings.canvas.vGridShow,
          size: 1,
          color: chartSettings.canvas.vGridShow ? vGridColor : 'transparent',
          style: chartSettings.canvas.vGridStyle === '—' ? 'solid' : 'dashed',
        }
      },
      candle: {
        type: 'candle_solid',
        tooltip: {
          showRule: 'always',
          showType: 'standard',
          title: {
            show: true,
            template: '{ticker} · {period}'
          },
          legend: {
            template: [
              { title: 'time', value: '{time}' },
              { title: 'open', value: '{open}' },
              { title: 'high', value: '{high}' },
              { title: 'low', value: '{low}' },
              { title: 'close', value: '{close}' },
              { title: 'volume', value: '{volume}' }
            ]
          }
        },
        bar: {
          upColor: chartSettings.candle.bodyUp,
          downColor: chartSettings.candle.bodyDown,
          noChangeColor: chartSettings.candle.bodyDown,
          upBorderColor: chartSettings.candle.borderUp,
          downBorderColor: chartSettings.candle.borderDown,
          noChangeBorderColor: chartSettings.candle.borderDown,
          upWickColor: chartSettings.candle.wickUp,
          downWickColor: chartSettings.candle.wickDown,
          noChangeWickColor: chartSettings.candle.wickDown,
        },
        priceMark: {
          show: true,
          high: {
            show: chartSettings.scales.hlVal.includes('Labels') || chartSettings.scales.hlVal.includes('Lines'),
            color: chartSettings.scales.hlColor,
            textOffset: 5,
            textSize: chartSettings.scales.textSize
          },
          low: {
            show: chartSettings.scales.hlVal.includes('Labels') || chartSettings.scales.hlVal.includes('Lines'),
            color: chartSettings.scales.hlColor,
            textOffset: 5,
            textSize: chartSettings.scales.textSize
          },
          last: {
            show: chartSettings.scales.symbolVal !== 'Hidden',
            upColor: chartSettings.scales.symbolLabelColor1,
            downColor: chartSettings.scales.symbolLabelColor2,
            noChangeColor: chartSettings.scales.symbolLabelColor2,
            text: {
              show: chartSettings.scales.symbolVal.includes('Value'),
              size: chartSettings.scales.textSize,
              family: 'Inter',
              weight: 'normal'
            }
          }
        }
      },
      indicator: {
        tooltip: {
          showRule: 'always'
        }
      },
      crosshair: {
        show: true,
        horizontal: {
          show: true,
          line: {
            show: true,
            style: chartSettings.canvas.crosshairStyle === '—' ? 'solid' : 'dashed',
            color: chartSettings.canvas.crosshairColor,
            size: 1,
          },
        },
        vertical: {
          show: true,
          line: {
            show: true,
            style: chartSettings.canvas.crosshairStyle === '—' ? 'solid' : 'dashed',
            color: chartSettings.canvas.crosshairColor,
            size: 1,
          }
        }
      },
      xAxis: {
        axisLine: { color: lineColor },
        tickText: { color: textColor, size: chartSettings.scales.textSize, family: 'Inter' },
      },
      yAxis: {
        axisLine: { color: lineColor },
        tickText: { color: textColor, size: chartSettings.scales.textSize, family: 'Inter' },
      }
    });
    updateCrosshairStyles(chart, activeToolRef.current);
    try {
      const topGap = Math.max(0.06, (chartSettings.canvas.marginTop ?? 9) / 100);
      const bottomGap = Math.max(0.05, (chartSettings.canvas.marginBottom ?? 8) / 100);
      chart.overrideYAxis({
        gap: {
          top: topGap,
          bottom: bottomGap
        }
      });
      const anyChart = chart as any;
      if (typeof anyChart.setTimezone === 'function') {
        anyChart.setTimezone(chartSettings.symbol.timezone);
      }
      if (typeof anyChart.setOffsetRightDistance === 'function') {
        anyChart.setOffsetRightDistance(chartSettings.canvas.marginRight);
      }
      if (typeof anyChart.setPriceVolumePrecision === 'function') {
        let pricePrecision = 2;
        switch (chartSettings.symbol.precision) {
          case '1': pricePrecision = 0; break;
          case '1/10': pricePrecision = 1; break;
          case '1/100': pricePrecision = 2; break;
          case '1/1000': pricePrecision = 3; break;
        }
        anyChart.setPriceVolumePrecision(pricePrecision, 0);
      }
    } catch (e) {
      // Ignored if API is not available in this version
    }
  }, [theme, chartSettings]);
  // Init chart ONCE
  useEffect(() => {
    if (!chartContainerRef.current) return;
    // Register custom overlays before init
    registerOverlay(emojiMark);
    registerOverlay(measureOverlay);
    registerOverlay(zoomInOverlay);
    const chart = init(chartContainerRef.current, {
      formatter: {
        formatDate: (params: any) => {
          const settings = chartSettingsRef.current;
          const tz = settings?.symbol?.timezone === 'Asia/Ho_Chi_Minh' ? 'Asia/Ho_Chi_Minh' : 'UTC';
          const d = new Date(params.timestamp);
          if (tz === 'Asia/Ho_Chi_Minh') {
            d.setHours(d.getHours() + 7);
          }
          let h = d.getHours();
          const mm = d.getMinutes().toString().padStart(2, '0');
          let suffix = '';
          if (settings?.scales?.timeFormat === '12-hours') {
            suffix = h >= 12 ? ' PM' : ' AM';
            h = h % 12 || 12;
          }
          const hhStr = h.toString().padStart(2, '0');
          const timeStr = `${hhStr}:${mm}${suffix}`;
          const dd = d.getDate().toString().padStart(2, '0');
          const moNum = (d.getMonth() + 1).toString().padStart(2, '0');
          const yyyy = d.getFullYear();
          const shortYear = yyyy.toString().slice(2);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const moName = monthNames[d.getMonth()];
          const dayName = dayNames[d.getDay()];
          let dateStr = `${dd}/${moNum}/${yyyy}`; // default
          const dFmt = settings?.scales?.dateFormat;
          if (dFmt === "Mon 29 Sep '97") dateStr = `${dayName} ${dd} ${moName} '${shortYear}`;
          else if (dFmt === "29 Sep '97") dateStr = `${dd} ${moName} '${shortYear}`;
          else if (dFmt === "Sep '97") dateStr = `${moName} '${shortYear}`;
          else if (dFmt === "09/29/1997") dateStr = `${moNum}/${dd}/${yyyy}`;
          else if (dFmt === "29/09/1997") dateStr = `${dd}/${moNum}/${yyyy}`;
          else if (dFmt === "1997-09-29") dateStr = `${yyyy}-${moNum}-${dd}`;
          if (settings?.scales?.dayOfWeek === false && dateStr.includes(dayName)) {
            dateStr = dateStr.replace(`${dayName} `, '');
          }
          const tf = activeTimeframeRef.current || 'D';
          const isIntraday = tf.endsWith('m') || tf.endsWith('h');
          if (params.type === 'crosshair' || params.type === 'tooltip') {
            return isIntraday ? `${dateStr} ${timeStr}` : dateStr;
          }
          if (isIntraday) {
            return `${dd}/${moNum} ${timeStr}`;
          } else {
            return dateStr;
          }
        }
      }
    });
    if (!chart) return;
    // Apply initial theme
    chart.setStyles(theme === 'dark' ? 'dark' : 'light');
    // Then override grid and candle styles
    chart.setStyles({
      grid: {
        horizontal: { color: theme === 'dark' ? '#2a2e39' : '#e6e8ea', size: 1, style: 'dashed' },
        vertical: { color: theme === 'dark' ? '#2a2e39' : '#e6e8ea', size: 1, style: 'dashed' },
      },
      candle: {
        bar: {
          upColor: '#089981',
          downColor: '#f23645',
          upBorderColor: '#089981',
          downBorderColor: '#f23645',
          upWickColor: '#089981',
          downWickColor: '#f23645',
        },
        tooltip: {
          showRule: 'always',
          showType: 'standard',
          title: {
            show: false,
            template: ''
          },
          legend: {
            template: [
              { title: 'time', value: '{time}' },
              { title: 'open', value: '{open}' },
              { title: 'high', value: '{high}' },
              { title: 'low', value: '{low}' },
              { title: 'close', value: '{close}' },
              { title: 'volume', value: '{volume}' }
            ]
          }
        }
      }
    });
    chart.overrideYAxis({
      gap: {
        top: 0.09,
        bottom: 0.08
      }
    });
    chartRef.current = chart;
    globalChartInstance = chart;
    (window as any).__STOCKSIM_CHART__ = chart;
    (window as any).__currentKlineChart = chart;
    // Globally prevent right-click from deleting ANY overlay and support Shift snapping on line tools
    const originalCreateOverlay = chart.createOverlay.bind(chart);
    chart.createOverlay = (value: any, paneId?: string) => {
      if (value && typeof value === 'object') {
        const originalOnRightClick = value.onRightClick;
        value.onRightClick = (event: any) => {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          if (typeof originalOnRightClick === 'function') {
            originalOnRightClick(event);
          }
          return true;
        };
        const originalOnDeselected = value.onDeselected;
        value.onDeselected = (event: any) => {
          if ((window as any).__selectedOverlayId === event?.overlay?.id) {
            (window as any).__selectedOverlayId = null;
          }
          if (typeof originalOnDeselected === 'function') {
            originalOnDeselected(event);
          }
        };
        const originalOnSelected = value.onSelected;
        value.onSelected = (event: any) => {
          if (event?.overlay?.id) {
            (window as any).__selectedOverlayId = event.overlay.id;
          }
          if (typeof originalOnSelected === 'function') {
            originalOnSelected(event);
          }
        };
        const originalOnDrawing = value.onDrawing;
        value.onDrawing = (event: any) => {
          if (typeof originalOnDrawing === 'function') {
            originalOnDrawing(event);
          }
          const isLine = ['segment', 'rayLine', 'arrow', 'trendAngle', 'straightLine', 'measure', 'infoLine', 'horizontalStraightLine', 'verticalStraightLine', 'priceLine'].includes(event.overlay?.name);
          if (isLine && event.overlay?.points?.length > 1) {
            const isShift = !!((window as any)._isShiftPressed || (event as any)?.shiftKey);
            if (isShift) {
              const pts = event.overlay.points;
              const p0 = pts[0];
              const pLast = pts[pts.length - 1];
              if (p0?.value !== undefined && pLast?.value !== undefined) {
                pLast.value = p0.value;
                chart.overrideOverlay({ id: event.overlay.id, points: pts });
              }
            }
          }
        };
        const originalOnPressedMoveStart = value.onPressedMoveStart;
        value.onPressedMoveStart = (event: any) => {
          isOverlayDraggingRef.current = true;
          const isLine = ['segment', 'rayLine', 'arrow', 'trendAngle', 'straightLine', 'measure', 'infoLine', 'horizontalStraightLine', 'verticalStraightLine', 'priceLine'].includes(event.overlay?.name);
          if (isLine && event.overlay?.points?.length > 1) {
            const pts = event.overlay.points;
            const overlayId = event.overlay.id;
            lastOverlayPointsRef.current[overlayId] = pts.map((p: any) => ({ ...p }));
            let dragHandle: 'p0' | 'p1' | 'body' | 'none' = 'none';
            if (event.x !== undefined && event.y !== undefined) {
              const pixelCoords = chart.convertToPixel(pts, { paneId: 'candle_pane' });
              const coords = Array.isArray(pixelCoords) ? pixelCoords : [pixelCoords];
              const c0 = coords[0];
              const cLast = coords[coords.length - 1];
              if (c0 && typeof c0.x === 'number' && typeof c0.y === 'number' && Math.hypot(c0.x - event.x, c0.y - event.y) <= 30) {
                dragHandle = 'p0';
              } else if (cLast && typeof cLast.x === 'number' && typeof cLast.y === 'number' && Math.hypot(cLast.x - event.x, cLast.y - event.y) <= 30) {
                dragHandle = 'p1';
              } else {
                dragHandle = 'body';
              }
            }
            lineDragHandleRef.current[overlayId] = dragHandle;
          }
          if (typeof originalOnPressedMoveStart === 'function') {
            originalOnPressedMoveStart(event);
          }
        };
        const originalOnPressedMoving = value.onPressedMoving;
        value.onPressedMoving = (event: any) => {
          let handled = false;
          if (typeof originalOnPressedMoving === 'function') {
            handled = originalOnPressedMoving(event) === true;
          }
          const isLine = ['segment', 'rayLine', 'arrow', 'trendAngle', 'straightLine', 'measure', 'infoLine', 'horizontalStraightLine', 'verticalStraightLine', 'priceLine'].includes(event.overlay?.name);
          if (!handled && isLine && event.overlay?.points?.length > 1) {
            const overlayId = event.overlay.id;
            const pts = event.overlay.points;
            const p0 = pts[0];
            const p1 = pts[pts.length - 1];
            const isShift = !!((window as any)._isShiftPressed || (event as any)?.shiftKey);

            if (isShift && p0?.value !== undefined && p1?.value !== undefined) {
              let handle = lineDragHandleRef.current[overlayId];
              if (!handle || handle === 'none') {
                const lastPts = lastOverlayPointsRef.current[overlayId];
                if (lastPts && lastPts[0] && lastPts[lastPts.length - 1]) {
                  const p0Changed = p0.timestamp !== lastPts[0].timestamp || p0.value !== lastPts[0].value;
                  const p1Changed = p1.timestamp !== lastPts[lastPts.length - 1].timestamp || p1.value !== lastPts[lastPts.length - 1].value;
                  if (p0Changed && !p1Changed) handle = 'p0';
                  else if (!p0Changed && p1Changed) handle = 'p1';
                  else if (p0Changed && p1Changed) handle = 'body';
                }
              }
              if (handle === 'p0') {
                p0.value = p1.value;
                chart.overrideOverlay({ id: overlayId, points: pts });
                lastOverlayPointsRef.current[overlayId] = pts.map((p: any) => ({ ...p }));
                return true;
              } else if (handle === 'p1') {
                p1.value = p0.value;
                chart.overrideOverlay({ id: overlayId, points: pts });
                lastOverlayPointsRef.current[overlayId] = pts.map((p: any) => ({ ...p }));
                return true;
              }
            }
            lastOverlayPointsRef.current[overlayId] = pts.map((p: any) => ({ ...p }));
          }
          return handled;
        };
        const originalOnPressedMoveEnd = value.onPressedMoveEnd;
        value.onPressedMoveEnd = (event: any) => {
          isOverlayDraggingRef.current = false;
          if (event.overlay?.id) {
            delete lineDragHandleRef.current[event.overlay.id];
          }
          if (typeof originalOnPressedMoveEnd === 'function') {
            originalOnPressedMoveEnd(event);
          }
        };
        const originalOnDrawEnd = value.onDrawEnd;
        value.onDrawEnd = (event: any) => {
          const isLine = ['segment', 'rayLine', 'arrow', 'trendAngle', 'straightLine', 'measure', 'infoLine', 'horizontalStraightLine', 'verticalStraightLine', 'priceLine'].includes(event.overlay?.name);
          if (isLine && event.overlay?.points?.length > 1) {
            const isShift = !!((window as any)._isShiftPressed || (event as any)?.shiftKey);
            if (isShift) {
              const pts = event.overlay.points;
              const p0 = pts[0];
              const pLast = pts[pts.length - 1];
              if (p0?.value !== undefined && pLast?.value !== undefined) {
                pLast.value = p0.value;
                chart.overrideOverlay({ id: event.overlay.id, points: pts });
              }
            }
          }
          if (typeof originalOnDrawEnd === 'function') {
            originalOnDrawEnd(event);
          }
        };
      }
      return (originalCreateOverlay as any)(value, paneId);
    };
    // Overlay click state tracking
    const lastOverlayClickTimeRef = { current: 0 };
    const lastOverlayClickIdRef = { current: '' };
    const handleOverlayClick = (event: any) => {
      isOverlayClickRef.current = true;
      const overlayId = event?.overlay?.id;
      if (overlayId) {
        (window as any).__selectedOverlayId = overlayId;
      }
      const now = Date.now();
      // If Eraser tool is active, delete it immediately!
      if (activeToolRef.current === 'eraser') {
        if (overlayId) {
          chartRef.current?.removeOverlay({ id: overlayId });
          if (floatingToolbar?.overlayId === overlayId) setFloatingToolbar(null);
          if (selectedOverlay?.id === overlayId) setSelectedOverlay(null);
          triggerAutoSaveDrawings();
        }
        return true; // prevent default behavior
      }
      if (overlayId && overlayId === lastOverlayClickIdRef.current && (now - lastOverlayClickTimeRef.current) < 500) {
        // Double click detected!
        onOverlayDoubleClickRef.current?.(event.overlay);
        setFloatingToolbar(null);
      } else {
        // Single click - show floating toolbar
        if (overlayId) {
          const styles = event.overlay?.styles || {};
          const line = styles.line || {};
          if (line.color) setOverlayColor(line.color);
          if (line.size) setOverlayLineWidth(line.size);
          if (line.style) setOverlayLineStyle(line.style === 'dashed' ? 'dashed' : line.style === 'dotted' ? 'dotted' : 'solid');
          setFloatingToolbar({
            overlayId,
            overlay: event.overlay,
            x: mousePosRef.current.x,
            y: mousePosRef.current.y
          });
          setOverlayPopup(null);
        }
      }
      lastOverlayClickTimeRef.current = now;
      lastOverlayClickIdRef.current = overlayId || '';
      return false;
    };
    // Attach handleOverlayClick to chart context so it can be used later
    (chart as any).handleOverlayClick = handleOverlayClick;
    // Listen for overlay finished event to re-activate same tool
    chart.subscribeAction('onOverlayDrawEnd' as any, () => {
      triggerAutoSaveDrawings();
      const currentTool = activeToolRef.current;
      if (currentTool !== 'cursor' && currentTool !== 'clear') {
        // Small delay then re-create overlay to keep tool active
        setTimeout(() => {
          chart.createOverlay({
            name: currentTool,
            lock: false,
            onClick: handleOverlayClick,
            onRightClick: () => false // prevent default right-click remove
          });
        }, 50);
      }
    });
    chart.subscribeAction('onCandleTooltipFeatureClick' as any, () => {
      // logic for tooltip feature click
    });
    chart.subscribeAction('onCrosshairChange', (data: any) => {
      crosshairIndexRef.current = data?.dataIndex ?? null;
    });
    // Native bar click for Bar Replay start point selection
    chart.subscribeAction('onCandleBarClick', (data: any) => {
      if (isSelectingReplayStartRef.current) {
        let ts: number | undefined = data?.kLineData?.timestamp;
        if (!ts && typeof data?.dataIndex === 'number') {
          const list = chartRef.current?.getDataList();
          ts = list?.[data.dataIndex]?.timestamp;
        }
        if (ts) {
          onSelectReplayStartRef.current?.(ts);
        }
      }
    });
    // Bind double click handler logic
    onOverlayDoubleClickRef.current = (overlay: any, tab: 'style' | 'text' | 'coords' | 'visibility' = 'style') => {
      if (overlay.name === 'fibonacciLine') {
        setSelectedOverlayId(overlay.id);
        setSelectedOverlay(overlay);
        setIsFibModalOpen(true);
        return;
      }
      setSelectedOverlayId(overlay.id);
      // Extract current styles and points from overlay
      const styles = overlay.styles || {};
      const line = styles.line || {};
      const text = styles.text || {};
      const points = overlay.points || [];
      const titleMap: Record<string, string> = {
        segment: 'ÄÆ°á»ng Xu hÆ°á»›ng',
        rayLine: 'Tia',
        infoLine: 'ÄÆ°á»ng ThĂ´ng tin',
        straightLine: 'ÄÆ°á»ng Má»Ÿ rá»™ng',
        trendAngle: 'Góc Xu hướng',
        horizontalStraightLine: 'ÄÆ°á»ng náº±m ngang',
        horizontalRayLine: 'Tia nằm ngang',
        verticalStraightLine: 'ÄÆ°á»ng tháº³ng Ä‘á»©ng',
        crossLine: 'ÄÆ°á»ng giao nhau',
        priceChannelLine: 'Kênh Song song',
        pitchfork: 'Mô hình Pitchfork',
        schiffPitchfork: 'Mô hình Schiff Pitchfork',
        modifiedSchiffPitchfork: 'Mô hình Schiff Pitchfork Biáº¿n Ä‘á»•i',
        insidePitchfork: 'Mô hình Pitchfork máº·t trong',
        simpleAnnotation: 'Văn bản',
        callout: 'Chú thích',
        note: 'Ghi chú',
        priceNote: 'Ghi chú Giá',
        pinMark: 'Mã Pin',
        tableMark: 'Bảng',
        arrow: 'Mũi tên',
        arrowMarker: 'Mũi tên đánh dấu',
        arrowUp: 'Mũi tên chỉ lên',
        arrowDown: 'Mũi tên chỉ xuống',
        arrowLeft: 'Mũi tên chỉ sang trái',
        arrowRight: 'Mũi tên chỉ sang phải',
        rect: 'Hình chữ nhật',
        circle: 'Vòng tròn',
        polyline: 'Hình Polyline',
        triangle: 'Hình tam giác',
        xabcd: 'Mẫu hình XABCD',
        abcd: 'Mẫu hình ABCD',
        elliottImpulse: 'Sóng đẩy Elliott (12345)',
        elliottTriangle: 'SĂ³ng Ä‘iá»u chá»‰nh Elliott (ABC)',
        elliottABCDE: 'Sóng Elliott Tam giác (ABCDE)',
        elliottWXY: 'Sóng đôi kết hợp Elliott (WXY)',
        elliottTriple: 'Sóng Elliott kết hợp ba (WXYXZ)',
        cycleLines: 'CĂ¡c Ä‘Æ°á»ng chu ká»³',
        timeCycles: 'VĂ²ng thá»i gian',
        sineLine: 'ÄÆ°á»ng Sine',
        longPosition: 'Thế giá lên',
        shortPosition: 'Thế giá xuống',
        forecast: 'Dự đoán',
        barsPattern: 'Mẫu hình Thanh',
        ghostFeed: 'Mô hình Ghost Feed',
        measure: 'Äo lÆ°á»ng'
      };
      setSelectedOverlaySettings({
        title: titleMap[overlay.name] || overlay.name || 'CĂ i Ä‘áº·t hĂ¬nh váº½',
        lineColor: line.color || '#2962ff',
        lineSize: line.size || 1,
        lineStyle: line.style === 'dashed' ? 'dashed' : 'solid',
        extendLeft: !!overlay.extendLeft,
        extendRight: !!overlay.extendRight,
        showMiddlePoint: !!overlay.showMiddlePoint,
        leftCap: !!overlay.leftCap,
        rightCap: !!overlay.rightCap,
        enableText: true,
        textContent: typeof overlay.extendData === 'string' && overlay.extendData && overlay.extendData !== '0.00' ? overlay.extendData : (
          (points && (points[1] || points[0]) && typeof (points[1] || points[0]).value === 'number' && (points[1] || points[0]).value !== 0)
            ? (points[1] || points[0]).value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : (
              points && (points[1] || points[0]) && typeof (points[1] || points[0]).dataIndex === 'number' && chartRef.current?.getDataList()?.[(points[1] || points[0]).dataIndex]?.close
                ? chartRef.current.getDataList()[(points[1] || points[0]).dataIndex].close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : getTr('chart.addText', 'Thêm văn bản')
            )
        ),
        textColor: text.color || '#2962ff',
        textSize: text.size || 14,
        isBold: text.weight === 'bold',
        isItalic: text.style === 'italic',
        vAlign: text.vAlign || 'top',
        hAlign: text.hAlign || 'center',
        textPosition: 'middle',
        point1Price: points[0]?.value ?? 278.784,
        point1Bar: points[0]?.dataIndex ?? 260,
        point2Price: points[1]?.value ?? 291.970,
        point2Bar: points[1]?.dataIndex ?? 291,
      });
      setActiveSettingsTab(tab);
      setIsSettingsModalOpen(true);
    };
    const handleChartClick = (e?: any) => {
      console.log("handleChartClick fired!", e);
      if (isOverlayClickRef.current) {
        isOverlayClickRef.current = false;
        return;
      }
      (window as any).__selectedOverlayId = null;
      setSelectedOverlay(null);
      setFloatingToolbar(null);
      setOverlayPopup(null);
      setActiveContextMenuSubMenu(null);
      setChartContextMenu(null);
      if (isSelectingReplayStartRef.current && crosshairIndexRef.current !== null) {
        const list = chartRef.current?.getDataList();
        const selCandle = list?.[crosshairIndexRef.current];
        const ts = selCandle?.timestamp;
        const p = selCandle?.close;
        if (ts) {
          if (p && !isNaN(p)) {
            replayPriceRef.current = p;
          }
          onSelectReplayStartRef.current?.(ts, p);
        }
      }
    };
    const handleChartContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const chart = chartRef.current;
      const bounding = chartContainerRef.current?.getBoundingClientRect();
      if (!chart || !bounding) return;
      const x = e.clientX - bounding.left;
      const y = e.clientY - bounding.top;
      const points = chart.convertFromPixel([{ x, y }], { paneId: 'candle_pane' });
      const price = (Array.isArray(points) ? points[0]?.value : (points as any)?.value) || 0;
      console.log('Right click detected:', { x: e.clientX, y: e.clientY, price });
      setChartContextMenu({
        x: e.clientX,
        y: e.clientY,
        price
      });
      setFloatingToolbar(null);
      setOverlayPopup(null);
      setActiveContextMenuSubMenu(null);
    };
    const handleRightClickMousedown = (e: MouseEvent) => {
      console.log('Mousedown button:', e.button);
      if (e.button === 2) {
        // Prevent default so we can handle it
        e.stopPropagation();
        handleChartContextMenu(e);
      }
    };

    const handleContainerPointerUp = () => {
      triggerAutoSaveDrawings();
    };

    const container = chartContainerRef.current;
    container?.addEventListener('click', handleChartClick);
    container?.addEventListener('contextmenu', handleChartContextMenu, { capture: true });
    container?.addEventListener('mousedown', handleRightClickMousedown, { capture: true });
    container?.addEventListener('pointerup', handleContainerPointerUp);
    container?.addEventListener('mouseup', handleContainerPointerUp);

    const handleResize = () => chart?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      container?.removeEventListener('click', handleChartClick);
      container?.removeEventListener('contextmenu', handleChartContextMenu, { capture: true });
      container?.removeEventListener('mousedown', handleRightClickMousedown, { capture: true });
      container?.removeEventListener('pointerup', handleContainerPointerUp);
      container?.removeEventListener('mouseup', handleContainerPointerUp);
      if (chartContainerRef.current) {
        dispose(chartContainerRef.current);
      }
      if (globalChartInstance === chartRef.current) {
        globalChartInstance = null;
      }
      chartRef.current = null;
    };
  }, []);
  const handleSaveOverlaySettings = (settings: OverlaySettings) => {
    const chart = chartRef.current;
    if (!chart || !selectedOverlayId) return;

    triggerAutoSaveDrawings();
    chart.overrideOverlay({
      id: selectedOverlayId,
      extendData: settings.textContent || settings.enableText ? settings.textContent : '',
      styles: {
        line: {
          color: settings.lineColor,
          size: settings.lineSize,
          style: settings.lineStyle === 'dashed' ? 'dashed' : settings.lineStyle === 'dotted' ? 'dashed' : 'solid'
        },
        text: {
          color: settings.textColor,
          size: settings.textSize,
          weight: settings.isBold ? 'bold' : 'normal',
          style: settings.isItalic ? 'italic' : 'normal',
          position: settings.textPosition || 'middle',
          paddingLeft: 4, paddingRight: 4, paddingTop: 4, paddingBottom: 4,
          borderRadius: 4,
          backgroundColor: (settings.enableText && settings.textContent) ? (theme === 'dark' ? 'rgba(30, 34, 45, 0.85)' : 'rgba(255, 255, 255, 0.85)') : 'transparent',
          borderSize: (settings.enableText && settings.textContent) ? 1 : 0,
          borderColor: settings.lineColor
        } as any
      }
    });
  };
  // --- Helper to calculate distance from point (px, py) to segment (x1, y1)-(x2, y2) ---
  const pointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };

  // --- Helper to check if pixel coordinates are on or near any overlay or handle ---
  const isNearAnyOverlay = (chart: any, clickX: number, clickY: number, excludeOverlayId?: string | null): boolean => {
    if (!chart || typeof chart.getOverlays !== 'function') return false;
    try {
      const overlays = chart.getOverlays() || [];
      for (const ov of overlays) {
        if (!ov || (excludeOverlayId && ov.id === excludeOverlayId)) continue;
        const pts = ov.points;
        if (!pts || !Array.isArray(pts) || pts.length === 0) continue;
        const converted = chart.convertToPixel(pts, { paneId: 'candle_pane' });
        const coords: Array<{ x?: number; y?: number }> = Array.isArray(converted) ? converted : [converted];
        // 1. Proximity to any handle / point (tolerance 30px)
        for (const pt of coords) {
          if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
            if (Math.hypot(pt.x - clickX, pt.y - clickY) <= 30) {
              return true;
            }
          }
        }
        // 2. Proximity to line segments between consecutive points (tolerance 20px)
        for (let i = 0; i < coords.length - 1; i++) {
          const c1 = coords[i];
          const c2 = coords[i + 1];
          if (c1 && c2 && typeof c1.x === 'number' && typeof c1.y === 'number' && typeof c2.x === 'number' && typeof c2.y === 'number') {
            if (pointToSegmentDistance(clickX, clickY, c1.x, c1.y, c2.x, c2.y) <= 20) {
              return true;
            }
          }
        }
      }
    } catch {
      // safe fallback
    }
    return false;
  };

  // --- Measure Feature using Shift + Drag on empty chart space ---
  const shiftMeasureOverlayIdRef = useRef<string | null>(null);
  const isShiftMeasuringRef = useRef<boolean>(false);
  const shiftStartPointRef = useRef<any>(null);
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    const handleMouseDown = (e: MouseEvent) => {
      // Keep _isShiftPressed in sync
      if (e.shiftKey !== undefined) {
        (window as any)._isShiftPressed = e.shiftKey;
      }

      const isCursorTool = !activeToolRef.current || ['cursor', 'cursor_group', 'cursor_dot', 'cursor_arrow'].includes(activeToolRef.current);
      if (!isCursorTool || !e.shiftKey || e.button !== 0 || !chartRef.current) return;

      const rect = container.getBoundingClientRect();
      const absoluteX = e.clientX - rect.left;
      const absoluteY = e.clientY - rect.top;

      // CRITICAL: If click is near ANY overlay (handle or line), or if an overlay is being dragged:
      // DO NOT intercept! Let the click pass to KlineCharts so the overlay/handle can be dragged and snapped horizontally!
      if (isOverlayDraggingRef.current || isNearAnyOverlay(chartRef.current, absoluteX, absoluteY, shiftMeasureOverlayIdRef.current)) {
        return;
      }

      // If an overlay is selected and click is near it, let it pass
      if ((window as any).__selectedOverlayId) {
        const selOvs = chartRef.current.getOverlays({ id: (window as any).__selectedOverlayId });
        if (selOvs && selOvs.length > 0) {
          const selPts = selOvs[0].points || [];
          const selCoords = chartRef.current.convertToPixel(selPts, { paneId: 'candle_pane' });
          const selArr = Array.isArray(selCoords) ? selCoords : [selCoords];
          for (const sc of selArr) {
            if (sc && typeof sc.x === 'number' && typeof sc.y === 'number') {
              if (Math.hypot(sc.x - absoluteX, sc.y - absoluteY) <= 50) {
                return;
              }
            }
          }
        }
      }

      // Only on EMPTY space: trigger shift measurement tool!
      e.stopPropagation();
      e.preventDefault();
      const chart = chartRef.current;
      const converted = chart.convertFromPixel([{ x: absoluteX, y: absoluteY }], { paneId: 'candle_pane' });
      const point = converted && (converted as any)[0];
      if (point) {
        isShiftMeasuringRef.current = true;
        shiftStartPointRef.current = { ...point, pixelX: absoluteX, pixelY: absoluteY };
        const id = chart.createOverlay({
          name: 'timePriceRange',
          points: [{ ...point }, { ...point }],
          lock: false,
        });
        if (id) {
          shiftMeasureOverlayIdRef.current = id as string;
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (e.shiftKey !== undefined) {
        (window as any)._isShiftPressed = e.shiftKey;
      }
      if (isShiftMeasuringRef.current && shiftMeasureOverlayIdRef.current && shiftStartPointRef.current && chartRef.current) {
        e.stopPropagation();
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const absoluteX = e.clientX - rect.left;
        const absoluteY = e.clientY - rect.top;
        const chart = chartRef.current;
        const converted = chart.convertFromPixel([{ x: absoluteX, y: absoluteY }], { paneId: 'candle_pane' });
        const p2 = converted && (converted as any)[0];
        if (p2) {
          chart.overrideOverlay({
            id: shiftMeasureOverlayIdRef.current,
            points: [
              { timestamp: shiftStartPointRef.current.timestamp, value: shiftStartPointRef.current.value },
              p2
            ]
          });
        }
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.shiftKey !== undefined) {
        (window as any)._isShiftPressed = e.shiftKey;
      }
      if (isShiftMeasuringRef.current) {
        isShiftMeasuringRef.current = false;
        e.stopPropagation();
        const rect = container.getBoundingClientRect();
        const absoluteX = e.clientX - rect.left;
        const absoluteY = e.clientY - rect.top;
        if (shiftStartPointRef.current?.pixelX !== undefined) {
          const dist = Math.hypot(absoluteX - shiftStartPointRef.current.pixelX, absoluteY - shiftStartPointRef.current.pixelY);
          if (dist < 5) {
            // Click without dragging: remove accidental 0-size dot
            if (shiftMeasureOverlayIdRef.current && chartRef.current) {
              chartRef.current.removeOverlay({ id: shiftMeasureOverlayIdRef.current });
            }
          } else {
            // Dragged successfully: finalize and persist the drawing!
            triggerAutoSaveDrawings();
          }
        }
        shiftMeasureOverlayIdRef.current = null;
        shiftStartPointRef.current = null;
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        (window as any)._isShiftPressed = true;
      }
      if (e.key === 'Escape' && isShiftMeasuringRef.current && shiftMeasureOverlayIdRef.current) {
        chartRef.current?.removeOverlay({ id: shiftMeasureOverlayIdRef.current });
        shiftMeasureOverlayIdRef.current = null;
        shiftStartPointRef.current = null;
        isShiftMeasuringRef.current = false;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        (window as any)._isShiftPressed = false;
      }
    };
    const handleBlur = () => {
      (window as any)._isShiftPressed = false;
    };
    container.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  // Sync activeTool to ref so the closure can access it
  useEffect(() => {
    activeToolRef.current = activeTool;
    const chart = chartRef.current;
    if (!chart) return;
    updateCrosshairStyles(chart, activeTool);
    if (activeTool === 'clear') {
      const activeChart = chartRef.current;
      if (activeChart) {
        const raw = typeof activeChart.getOverlays === 'function' ? activeChart.getOverlays() : [];
        if (Array.isArray(raw)) {
          raw.forEach((ov: any) => {
            if (isUserDrawingOverlay(ov)) {
              activeChart.removeOverlay({ id: ov.id });
            }
          });
        }
        try {
          activeChart.removeOverlay({ name: 'aiCorrectionZone' });
        } catch (_) {}
      }
      setFloatingToolbar(null);
      setSelectedOverlay(null);
      triggerAutoSaveDrawings();
      onToolSelect?.('cursor');
    } else if (activeTool === 'cursor' || activeTool === 'cursor_group' || activeTool === 'cursor_dot' || activeTool === 'cursor_arrow' || activeTool === 'eraser') {
      // Cancel active overlay creation mode
    } else if (activeTool.startsWith('emojiMark:')) {
      const emoji = activeTool.split(':')[1];
      chart.createOverlay({
        name: 'emojiMark',
        extendData: emoji,
        lock: false,
        styles: {
          text: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderSize: 0,
            borderRadius: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0
          }
        },
        onClick: (chart as any).handleOverlayClick,
        onRightClick: () => false
      });
    } else if (activeTool === 'priceLine') {
      chart.createOverlay({
        name: 'priceLine',
        lock: false,
        onClick: (chart as any).handleOverlayClick,
        onRightClick: () => false
      });
    } else if (activeTool === 'zoomIn') {
      chart.createOverlay({
        name: 'zoomInBox',
        lock: false,
        onDrawEnd: (event: any) => {
          const overlay = event.overlay;
          const points = overlay.points;
          if (points && points.length === 2) {
            const startIdx = points[0].dataIndex;
            const endIdx = points[1].dataIndex;
            const count = Math.abs(endIdx - startIdx) || 1;
            const width = chartContainerRef.current?.clientWidth || 800;
            const space = width / count;
            chart.setBarSpace(space);
            const dataList = chart.getDataList();
            const maxIdx = Math.max(startIdx, endIdx);
            const offset = (dataList.length - 1 - maxIdx) * space;
            chart.setOffsetRightDistance(offset);

            // Xóa há»™p zoom Ä‘i sau khi zoom xong
            chart.removeOverlay(overlay.id);
            onToolSelect?.('cursor');
          }
        },
        onRightClick: () => false
      });
    } else {
      let overlayName = activeTool;
      if (activeTool === 'highlighter') {
        const createHighlighterOverlay = () => {
          chart.createOverlay({
            name: 'brush',
            styles: { line: { color: 'rgba(255, 235, 59, 0.5)', size: 10 } },
            lock: lockDrawing,
            visible: !hideDrawing,
            mode: magnetMode ? (magnetType === 'weak' ? 'weak_magnet' : 'strong_magnet') : 'normal',
            onClick: (chart as any).handleOverlayClick,
            onDrawEnd: () => {
              if (stayInDrawingMode || activeToolRef.current === 'highlighter') {
                setTimeout(() => {
                  if (chartRef.current && activeToolRef.current === 'highlighter') {
                    createHighlighterOverlay();
                  }
                }, 20);
              } else {
                onToolSelect?.('cursor');
              }
            },
            onRightClick: () => false
          });
        };
        createHighlighterOverlay();
        return;
      } else if (activeTool === 'horizontalLine') {
        overlayName = 'horizontalStraightLine';
      } else if (activeTool === 'verticalLine') {
        overlayName = 'verticalStraightLine';
      } else if (activeTool === 'ray') {
        overlayName = 'rayLine';
      } else if (activeTool === 'arrowUp') {
        overlayName = 'arrowUp';
      } else if (activeTool === 'arrowDown') {
        overlayName = 'arrowDown';
      } else if (activeTool === 'arrowLeft') {
        overlayName = 'arrowLeft';
      } else if (activeTool === 'arrowRight') {
        overlayName = 'arrowRight';
      } else if (activeTool === 'arrowMarker') {
        overlayName = 'arrowMarker';
      } else if (activeTool === 'arrow') {
        overlayName = 'arrow';
      } else if (activeTool === 'dateRange') {
        overlayName = 'timeRange';
      } else if (activeTool === 'dateAndPriceRange') {
        overlayName = 'timePriceRange';
      } else if (['rotatedRect', 'ellipse', 'path', 'polyline', 'arc', 'curve', 'doubleCurve', 'cypher', 'threeDrives', 'headAndShoulders', 'longPosition', 'shortPosition', 'priceRange', 'timeRange', 'timePriceRange', 'ghostFeed', 'rect', 'triangle', 'xabcd', 'abcd', 'elliottImpulse', 'elliottTriangle', 'elliottABCDE', 'elliottWXY', 'elliottTriple', 'cycleLines', 'timeCycles', 'sineLine'].includes(activeTool)) {
        overlayName = activeTool;
      } else if (activeTool === 'circle') {
        overlayName = 'circleMark';
      } else if (['pitchfork', 'schiffPitchfork', 'modifiedSchiffPitchfork', 'insidePitchfork'].includes(activeTool)) {
        overlayName = activeTool;
      } else if (['priceChannelLine', 'regressionTrend', 'flatTopBottom', 'disjointChannel'].includes(activeTool)) {
        overlayName = activeTool;
      } else if (activeTool === 'trendAngle') {
        overlayName = 'trendAngle';
      } else if (activeTool === 'infoLine') {
        overlayName = 'infoLine';
      } else if (activeTool === 'priceNote') {
        overlayName = 'priceNote';
      } else if (activeTool === 'note') {
        overlayName = 'note';
      } else if (activeTool === 'pinMark') {
        overlayName = 'pinMark';
      } else if (activeTool === 'tableMark') {
        overlayName = 'tableMark';
      } else if (activeTool === 'callout') {
        overlayName = 'callout';
      } else if (activeTool === 'comment') {
        overlayName = 'comment';
      } else if (activeTool === 'priceLabel') {
        overlayName = 'priceLabel';
      } else if (activeTool === 'signpost') {
        overlayName = 'signpost';
      } else if (activeTool === 'flagMark') {
        overlayName = 'flagMark';
      } else if (['anchoredText'].includes(activeTool)) {
        overlayName = 'simpleAnnotation';
      }
      const createStandardOverlay = () => {
        chart.createOverlay({
          name: overlayName,
          lock: lockDrawing,
          visible: !hideDrawing,
          mode: magnetMode ? (magnetType === 'weak' ? 'weak_magnet' : 'strong_magnet') : 'normal',
          onClick: (chart as any).handleOverlayClick,
          onPressedMoveStart: (event: any) => {
            isOverlayDraggingRef.current = true;
            const allowedNames = ['rect', 'gannBox', 'priceRange', 'timeRange', 'timePriceRange'];
            if (allowedNames.includes(event.overlay?.name)) {
              handleRectPressedMoveStart(event);
            }
          },
          onPressedMoving: (event: any) => {
            if (event.overlay && event.overlay.points && event.overlay.points.length > 1) {
              const allowedNames = ['rect', 'gannBox', 'priceRange', 'timeRange', 'timePriceRange'];
              if (allowedNames.includes(event.overlay.name)) {
                if (handleRectPressedMoving(event)) return true;
              }
            }
            return false;
          },
          onPressedMoveEnd: (event: any) => {
            triggerAutoSaveDrawings();
            const allowedNames = ['rect', 'gannBox', 'priceRange', 'timeRange', 'timePriceRange'];
            if (allowedNames.includes(event.overlay?.name)) {
              handleRectPressedMoveEnd(event);
            }
          },
          onDrawEnd: (event: any) => {
            triggerAutoSaveDrawings();
            setTimeout(() => {
              (window as any).__selectedOverlayId = null;
              setSelectedOverlay(null);
              setFloatingToolbar(null);
            }, 50);
            const isContinuousTool = ['brush', 'highlighter', 'path', 'polyline'].includes(activeToolRef.current);
            if (stayInDrawingModeRef.current || isContinuousTool) {
              setTimeout(() => {
                if (chartRef.current && activeToolRef.current === activeTool) {
                  createStandardOverlay();
                }
              }, 20);
            } else {
              onToolSelect?.('cursor');
            }
          },
          onRightClick: handleOverlayPreventRightClickRemove
        });
      };
      createStandardOverlay();
    }
  }, [activeTool]);
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.overrideOverlay({ lock: lockDrawing, visible: !hideDrawing, mode: magnetMode ? (magnetType === 'weak' ? 'weak_magnet' : 'strong_magnet') : 'normal' });
    }
  }, [lockDrawing, hideDrawing, magnetMode, magnetType]);
  // Handle step updates during replay smoothly
  useEffect(() => {
    if (!replayStepTrigger || !isReplaying) return;
    const cacheKey = `${selectedStock.symbol}-${activeTimeframe}`;
    const fullData = dataCache.get(cacheKey);
    if (!fullData || fullData.length === 0) return;
    const currentTime = replayTimeRef.current ?? 0;
    const nextBar = fullData.find(d => d.timestamp > currentTime);
    if (nextBar) {
      if (subscriberCallbackRef.current) {
        subscriberCallbackRef.current(nextBar);
      }
      replayTimeRef.current = nextBar.timestamp;
      replayPriceRef.current = nextBar.close;
      onReplayPriceChangeRef.current?.(nextBar.close);
      if (onPriceUpdate) onPriceUpdate(nextBar.close, nextBar.timestamp, nextBar);
      onReplayTimeChangeRef.current?.(nextBar.timestamp);
    }
  }, [replayStepTrigger]);
  // Reload data when stock, timeframe, or replay state changes
  useEffect(() => {
    activeTimeframeRef.current = activeTimeframe;
    const chart = chartRef.current;
    if (!chart) return;
    let isMounted = true;
    let tickerInterval: any = null;
    let wsUnsubscribe: (() => void) | null = null;
    // Map activeTimeframe to klinecharts period
    let timespan = 'day';
    let multiplier = 1;
    if (activeTimeframe.endsWith('m')) {
      timespan = 'minute';
      multiplier = parseInt(activeTimeframe);
    } else if (activeTimeframe.endsWith('h')) {
      timespan = 'hour';
      multiplier = parseInt(activeTimeframe);
    } else if (activeTimeframe === 'W') {
      timespan = 'week';
    } else if (activeTimeframe === 'M') {
      timespan = 'month';
    }
    const loadData = async () => {
      setIsLoading(true);
      const cacheKey = `${selectedStock.symbol}-${activeTimeframe}`;
      const intervalMs = timeframeToMs(activeTimeframe);
      const currentReplayTime = replayTimeRef.current;
      let allData: KLineData[] = [];
      // Láº¥y dá»¯ liá»‡u náº¿n tháº­t tá»« táº¥t cáº£ cĂ¡c sĂ n (BingX cho VĂ ng/Forex/HĂ ng hĂ³a/Cá»• phiáº¿u, Binance cho Crypto)
      try {
        if (isReplaying && currentReplayTime) {
          const targetEndTime = Math.min(Date.now(), currentReplayTime + 300 * intervalMs);
          allData = await fetchUnifiedKlines({
            symbol: selectedStock.symbol,
            timeframe: activeTimeframe,
            limit: 1000,
            isFutures: selectedStock.isFutures,
            endTime: targetEndTime,
          });
        } else {
          allData = await fetchUnifiedKlines({
            symbol: selectedStock.symbol,
            timeframe: activeTimeframe,
            limit: 1000,
            isFutures: selectedStock.isFutures,
          });
        }
      } catch (error) {
        allData = [];
      }
      // Náº¾U allData rá»—ng (hoáº·c thá»‹ trÆ°á»ng khĂ´ng pháº£i Crypto, hoáº·c API lá»—i)
      if (!allData || allData.length === 0) {
        const targetEndTime = (isReplaying && currentReplayTime)
          ? Math.min(Date.now(), currentReplayTime + 500 * intervalMs)
          : undefined;
        // Kiá»ƒm tra xem cache hiá»‡n cĂ³ bao phá»§ Ä‘Æ°á»£c má»‘c replayTime khĂ´ng
        const cached = dataCache.get(cacheKey);
        const cacheValid = cached && cached.length > 0 && (!isReplaying || !currentReplayTime || (cached[0].timestamp <= currentReplayTime && cached[cached.length - 1].timestamp >= currentReplayTime));
        if (!cacheValid) {
          dataCache.set(cacheKey, generateOHLCV(selectedStock.price, 5000, activeTimeframe, targetEndTime));
        }
        allData = dataCache.get(cacheKey)!;
      } else {
        dataCache.set(cacheKey, allData);
      }
      onDataLoaded?.(allData.length);
      if (!isMounted) return;
      // In replay mode: filter data up to replayTime
      let visibleData = (isReplaying && currentReplayTime)
        ? allData.filter(d => d.timestamp <= currentReplayTime)
        : (isReplaying ? (allData.length > 0 ? [allData[0]] : []) : allData);
      if (isReplaying && visibleData.length === 0 && allData.length > 0) {
        visibleData = [allData[0]];
      }
      if (isReplaying && visibleData.length > 0) {
        const lastCandle = visibleData[visibleData.length - 1];
        const effectiveTime = currentReplayTime || lastCandle.timestamp;
        // Neo má»©c giĂ¡ chuáº©n (currentReplayPrice) khi chuyá»ƒn khung thá»i gian
        const targetPrice = (replayPriceRef.current && !isNaN(replayPriceRef.current))
          ? replayPriceRef.current
          : lastCandle.close;
        // Äá»“ng bá»™ náº¿n cuá»‘i cĂ¹ng Ä‘á»ƒ nĂ³ khĂ´ng chá»©a giĂ¡ tÆ°Æ¡ng lai cá»§a khung lá»›n
        if (targetPrice && targetPrice !== lastCandle.close) {
          const lastIdx = visibleData.length - 1;
          const orig = visibleData[lastIdx];
          visibleData[lastIdx] = {
            ...orig,
            close: targetPrice,
            high: Math.max(orig.open, targetPrice, orig.high >= targetPrice ? orig.high : targetPrice),
            low: Math.min(orig.open, targetPrice, orig.low <= targetPrice ? orig.low : targetPrice),
          };
        } else if (!replayPriceRef.current && lastCandle.close) {
          replayPriceRef.current = lastCandle.close;
          onReplayPriceChangeRef.current?.(lastCandle.close);
        }
        if (onPriceUpdate) onPriceUpdate(targetPrice, effectiveTime, visibleData[visibleData.length - 1]);
      } else if (!isReplaying && allData.length > 0 && onPriceUpdate) {
        onPriceUpdate(allData[allData.length - 1].close, allData[allData.length - 1].timestamp, allData[allData.length - 1]);
      }
      const precision = getPricePrecision(selectedStock.price);
      chart.setSymbol({
        ticker: selectedStock.symbol,
        name: selectedStock.name,
        shortName: selectedStock.symbol,
        pricePrecision: precision,
        volumePrecision: 2,
      });
      chart.setDataLoader({
        getBars: async (params: DataLoaderGetBarsParams) => {
          // Khi ngÆ°á»i dĂ¹ng cuá»™n sang trĂ¡i (kĂ©o vá» quĂ¡ khá»©)
          // CHĂ Ă: Trong KlineCharts v10, 'forward' lĂ  cuá»™n vá» quĂ¡ khá»© (prepend data)
          if (params.type === 'forward') {
            if (!params.timestamp) return params.callback([], true);
            // Láº¥y náº¿n cÅ© hÆ¡n dá»±a vĂ o timestamp cá»§a náº¿n Ä‘áº§u tiĂªn hiá»‡n táº¡i
            const oldestTime = params.timestamp;
            try {
              let olderData = await fetchUnifiedKlines({
                symbol: selectedStock.symbol,
                timeframe: activeTimeframe,
                limit: 1000,
                isFutures: selectedStock.isFutures,
                endTime: oldestTime - 1, // TrĂ¡nh láº¥y trĂ¹ng náº¿n Ä‘áº§u tiĂªn
              });
              olderData = olderData.filter(d => d.timestamp < oldestTime);
              if (olderData.length > 0) {
                // Ná»‘i dá»¯ liá»‡u cÅ© vĂ o máº£ng allData
                allData = [...olderData, ...allData];
                dataCache.set(cacheKey, allData);
                onDataLoaded?.(allData.length);
                params.callback(olderData, true); // LuĂ´n cho phĂ©p cuá»™n tiáº¿p
                return;
              }
            } catch (err) {
              // Fallback náº¿u lá»—i káº¿t ná»‘i
            }
            const oldestCandle = allData[0];
            const basePrice = oldestCandle ? oldestCandle.open : selectedStock.price;
            const olderData = generateOHLCV(basePrice, 500, activeTimeframe, oldestTime - 1).filter(d => d.timestamp < oldestTime);
            if (olderData.length > 0) {
              allData = [...olderData, ...allData];
              dataCache.set(cacheKey, allData);
              onDataLoaded?.(allData.length);
              params.callback(olderData, true);
            } else {
              params.callback([], true);
            }
            return;
          }
          // Khi ngÆ°á»i dĂ¹ng cuá»™n sang pháº£i (vá» tÆ°Æ¡ng lai)
          if (params.type === 'backward') {
            params.callback([], false);
            return;
          }
          // Gá»i láº§n Ä‘áº§u (type === 'init')
          params.callback(visibleData, true);
          setTimeout(() => {
            loadDrawingsRef.current?.();
          }, 80);
        },
        subscribeBar: (params: DataLoaderSubscribeBarParams) => {
          subscriberCallbackRef.current = params.callback;
          if (isReplaying) return;
          // Láº¥y dá»¯ liá»‡u tháº­t realtime cho Táº¤T Cáº¢ cĂ¡c sĂ n (Binance WebSocket cho Crypto, BingX Polling cho VĂ ng, HĂ ng hĂ³a, Forex, Cá»• phiáº¿u...)
          wsUnsubscribe = subscribeUnifiedBar(
            selectedStock.symbol,
            activeTimeframe,
            !!selectedStock.isFutures,
            (newCandle) => {
              params.callback(newCandle);
              const chart = chartRef.current;
              if (chart && typeof (chart as any).updateData === 'function') {
                (chart as any).updateData(newCandle);
              }
              if (onPriceUpdate) onPriceUpdate(newCandle.close, newCandle.timestamp, newCandle);
            }
          );
        },
        unsubscribeBar: () => {
          subscriberCallbackRef.current = null;
          if (tickerInterval) clearInterval(tickerInterval);
          if (wsUnsubscribe) wsUnsubscribe();
        }
      });
      setIsLoading(false);
    };
    loadData();
    // Pass the correct period so the chart tooltip displays it correctly and extrapolates into future timestamps
    chart.setPeriod({ type: timespan as any, span: multiplier });
    return () => {
      isMounted = false;
      if (tickerInterval) clearInterval(tickerInterval);
      if (wsUnsubscribe) wsUnsubscribe();
    };
  }, [selectedStock.symbol, selectedStock.market, selectedStock.isFutures, activeTimeframe, isReplaying, replayReloadTrigger]);
  // Sync active indicators with chart
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const paneMap = indicatorPaneRef.current;
    const currentlyOn = new Set(paneMap.keys());
    const wantOn = new Set(activeIndicators);
    // Remove indicators that are no longer active
    currentlyOn.forEach(name => {
      if (!wantOn.has(name)) {
        const paneId = paneMap.get(name);
        try {
          // API v10: removeIndicator(filter?: { id?, paneId?, name? })
          chart.removeIndicator(paneId ? { paneId, name } : { name });
        } catch (_) { }
        paneMap.delete(name);
      }
    });
    // Add indicators that are newly active
    wantOn.forEach(name => {
      if (!currentlyOn.has(name)) {
        const def = INDICATOR_LIST.find(i => i.name === name);
        if (!def) return;
        try {
          if (def.pane === 'main') {
            // Overlay on the main candle chart using IndicatorCreate shape
            chart.createIndicator({ name, paneId: 'candle_pane' } as any, true);
            paneMap.set(name, undefined);
          } else {
            // Create a new sub pane â€” returns the new pane id
            const paneId = chart.createIndicator(name, false);
            paneMap.set(name, paneId ?? undefined);
          }
        } catch (err) {
          console.warn(`Failed to create indicator ${name}:`, err);
        }
      }
    });
  }, [activeIndicators]);
  // Draw price lines for active position
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (isDraggingRef.current) return;
    const allData = chart.getDataList();
    if (allData.length === 0) return;
    const lastDataIndex = allData.length - 1;
    // Clear previous order overlays to prevent duplicates if this runs multiple times
    chart.removeOverlay({ name: 'tpslZone' });
    pendingOrderOverlayIdsRef.current.forEach(id => chart.removeOverlay({ id }));
    pendingOrderOverlayIdsRef.current = [];
    // Determine TP and SL to draw
    const activeSimPos = simulatorPositions?.find((p: any) => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase());
    const effectiveActivePos = (activePosition && activePosition.quantity > 0) ? activePosition : (activeSimPos ? {
      quantity: activeSimPos.lot || activeSimPos.quantity || 0,
      averagePrice: activeSimPos.entryPrice || activeSimPos.averagePrice || 0,
      side: activeSimPos.side || 'LONG',
      leverage: activeSimPos.leverage || 1,
      tp: activeSimPos.tp,
      sl: activeSimPos.sl
    } : undefined);
    const tpToDraw = (previewTPSL?.enabled && previewTPSL.tp) ? previewTPSL.tp : effectiveActivePos?.tp;
    const slToDraw = (previewTPSL?.enabled && previewTPSL.sl) ? previewTPSL.sl : effectiveActivePos?.sl;
    const orderToDraw = (previewTPSL?.enabled && previewTPSL.orderPrice) ? previewTPSL.orderPrice : (effectiveActivePos?.averagePrice || selectedStock.price);
    currentTpRef.current = tpToDraw;
    currentSlRef.current = slToDraw;
    currentOrderPriceRef.current = orderToDraw;
    // 0. (Removed giant tpsl_zone to prevent overlapping with individual TP and SL zones)
    // 1. Draw main entry price lines
    const positionsToDraw: Array<{ quantity: number; averagePrice: number; side: 'LONG' | 'SHORT'; leverage?: number }> = [];
    if (simulatorPositions && simulatorPositions.length > 0) {
      simulatorPositions
        .filter((p: any) => p.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase())
        .forEach((p: any) => {
          positionsToDraw.push({
            quantity: p.lot || p.quantity || 0,
            averagePrice: p.entryPrice || p.averagePrice || 0,
            side: p.side || 'LONG',
            leverage: p.leverage
          });
        });
    } else if (activePosition && activePosition.quantity > 0) {
      positionsToDraw.push(activePosition);
    }
    if (positionsToDraw.length > 0) {
      positionsToDraw.forEach((pos, index) => {
        if (pos.quantity <= 0 || pos.averagePrice <= 0) return;
        const isBuy = pos.side === 'LONG';
        const color = '#ffffff';
        const overlayId = `active_position_line_${index}`;
        const overlayProps = {
          name: 'orderTpslLine',
          lock: true,
          points: [
            { timestamp: allData[0].timestamp, value: pos.averagePrice },
            { timestamp: allData[lastDataIndex].timestamp, value: pos.averagePrice }
          ],
          extendData: {
            color: '#00b894',
            isDashed: true,
            badgeText: `${selectedStock.symbol} ${pos.averagePrice.toLocaleString('en-US')}`,
            price: pos.averagePrice,
            precision: getPricePrecision(pos.averagePrice)
          }
        };
        chart.removeOverlay({ id: overlayId });
        chart.createOverlay({ id: overlayId, ...overlayProps } as any);
      });
    } else {
      // We don't need createdOverlaysRef cleanup here, we just know which ones could exist
      // Since it's dynamic, we can just clear up to a reasonable number or let them be cleared on chart reload.
      for (let i = 0; i < 10; i++) {
        chart.removeOverlay({ id: `active_position_line_${i}` });
      }
    }
    // 1.5 Draw Preview Limit / Stop order line
    if (previewTPSL?.enabled && previewTPSL.orderPrice && previewTPSL.orderPrice > 0 && previewTPSL.orderType) {
      const isLimit = previewTPSL.orderType === 'LIMIT';
      const color = isLimit ? '#2962ff' : '#e65100'; // Blue for limit, Orange for stop
      const currentSide = previewTPSL.side || 'LONG';
      const precision = getPricePrecision(previewTPSL.orderPrice);
      const overlayProps = {
        name: 'orderTpslLine',
        lock: false,
        points: [
          { timestamp: allData[0].timestamp, value: previewTPSL.orderPrice },
          { timestamp: allData[lastDataIndex].timestamp, value: previewTPSL.orderPrice }
        ],
        extendData: {
          color,
          isDashed: true,
          badgeText: `${previewTPSL.orderType} ${currentSide}`,
          price: previewTPSL.orderPrice,
          precision
        },
        onPressedMoveStart: () => {
          isDraggingRef.current = true;
        },
        onPressedMoving: (event: any) => {
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const p = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(p));
            currentOrderPriceRef.current = cleanPrice;
            if (currentTpRef.current) {
              chart.overrideOverlay({
                id: 'preview_tp_zone',
                points: [
                  { timestamp: allData[0].timestamp, value: cleanPrice },
                  { timestamp: allData[lastDataIndex].timestamp, value: currentTpRef.current }
                ]
              });
              const side = previewTPSL?.side || effectiveActivePos?.side || 'LONG';
              const qty = previewTPSL?.quantity || (effectiveActivePos?.quantity ? effectiveActivePos.quantity * (getContractMultiplier(selectedStock) || 1) : 0);
              const tpBadge = computeOrderLineBadge('TP', currentTpRef.current, cleanPrice, side, qty);
              chart.overrideOverlay({
                id: 'preview_tp_line',
                extendData: {
                  color: '#089981',
                  isDashed: true,
                  badgeText: tpBadge,
                  price: currentTpRef.current,
                  precision: getPricePrecision(currentTpRef.current)
                }
              });
            }
            if (currentSlRef.current) {
              chart.overrideOverlay({
                id: 'preview_sl_zone',
                points: [
                  { timestamp: allData[0].timestamp, value: cleanPrice },
                  { timestamp: allData[lastDataIndex].timestamp, value: currentSlRef.current }
                ]
              });
              const side = previewTPSL?.side || effectiveActivePos?.side || 'LONG';
              const qty = previewTPSL?.quantity || (effectiveActivePos?.quantity ? effectiveActivePos.quantity * (getContractMultiplier(selectedStock) || 1) : 0);
              const slBadge = computeOrderLineBadge('SL', currentSlRef.current, cleanPrice, side, qty);
              chart.overrideOverlay({
                id: 'preview_sl_line',
                extendData: {
                  color: '#f23645',
                  isDashed: true,
                  badgeText: slBadge,
                  price: currentSlRef.current,
                  precision: getPricePrecision(currentSlRef.current)
                }
              });
            }
            onTPSLChangeRef.current?.('orderPrice', cleanPrice);
          }
        },
        onPressedMoveEnd: (event: any) => {
          isDraggingRef.current = false;
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const precision = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(precision));
            onTPSLChangeRef.current?.('orderPrice', cleanPrice);
          }
        }
      };
      chart.removeOverlay({ id: 'preview_order_line' });
      chart.createOverlay({ id: 'preview_order_line', ...overlayProps } as any);
    } else {
      chart.removeOverlay({ id: 'preview_order_line' });
    }
    // 2. Draw Take Profit line (TP) - Draggable
    if (tpToDraw) {
      const isPreview = previewTPSL?.enabled && previewTPSL.tp && (!effectiveActivePos || effectiveActivePos.quantity <= 0);
      const precision = getPricePrecision(tpToDraw);
      const side = previewTPSL?.side || effectiveActivePos?.side || 'LONG';
      const entryP = orderToDraw || selectedStock.price;
      const qty = previewTPSL?.quantity || (effectiveActivePos?.quantity ? effectiveActivePos.quantity * (getContractMultiplier(selectedStock) || 1) : 0);
      const badgeText = computeOrderLineBadge('TP', tpToDraw, entryP, side, qty);

      const isTpProfit = side === 'LONG' ? tpToDraw >= entryP : tpToDraw <= entryP;
      const tpColor = isTpProfit ? '#089981' : '#f23645';
      const tpZoneColor = isTpProfit ? 'rgba(8, 153, 129, 0.1)' : 'rgba(242, 54, 69, 0.1)';

      const overlayProps = {
        name: 'orderTpslLine',
        lock: false,
        points: [
          { timestamp: allData[0].timestamp, value: tpToDraw },
          { timestamp: allData[lastDataIndex].timestamp, value: tpToDraw }
        ],
        extendData: {
          color: tpColor,
          isDashed: isPreview,
          badgeText,
          price: tpToDraw,
          precision
        },
        onPressedMoveStart: () => {
          isDraggingRef.current = true;
        },
        onPressedMoving: (event: any) => {
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const p = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(p));
            currentTpRef.current = cleanPrice;
            const orderP = currentOrderPriceRef.current || previewTPSL?.orderPrice || selectedStock.price;
            
            const isTpProfit = side === 'LONG' ? cleanPrice >= orderP : cleanPrice <= orderP;
            const newTpColor = isTpProfit ? '#089981' : '#f23645';
            const newTpZoneColor = isTpProfit ? 'rgba(8, 153, 129, 0.1)' : 'rgba(242, 54, 69, 0.1)';

            chart.overrideOverlay({
              id: 'preview_tp_zone',
              points: [
                { timestamp: allData[0].timestamp, value: orderP },
                { timestamp: allData[lastDataIndex].timestamp, value: cleanPrice }
              ],
              styles: {
                polygon: { color: newTpZoneColor, borderColor: newTpColor }
              }
            });
            const newBadge = computeOrderLineBadge('TP', cleanPrice, orderP, side, qty);
            chart.overrideOverlay({
              id: 'preview_tp_line',
              points: [
                { timestamp: allData[0].timestamp, value: cleanPrice },
                { timestamp: allData[lastDataIndex].timestamp, value: cleanPrice }
              ],
              extendData: {
                ...event.overlay.extendData,
                color: newTpColor,
                price: cleanPrice,
                badgeText: newBadge,
                precision: p
              }
            });
            onTPSLChangeRef.current?.('tp', cleanPrice);
          }
        },
        onPressedMoveEnd: (event: any) => {
          isDraggingRef.current = false;
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const precision = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(precision));
            onTPSLChangeRef.current?.('tp', cleanPrice);
          }
        }
      };
      chart.removeOverlay({ id: 'preview_tp_line' });
      chart.createOverlay({ id: 'preview_tp_line', ...overlayProps } as any);
      chart.removeOverlay({ id: 'preview_tp_zone' });
      if (orderToDraw && tpToDraw) {
        chart.createOverlay({
          id: 'preview_tp_zone',
          name: 'tpslZone',
          lock: true,
          points: [
            { timestamp: allData[0].timestamp, value: orderToDraw },
            { timestamp: allData[lastDataIndex].timestamp, value: tpToDraw }
          ],
          styles: {
            polygon: {
              color: tpZoneColor,
              borderColor: tpColor
            }
          }
        } as any);
      }
    } else {
      chart.removeOverlay({ id: 'preview_tp_line' });
      chart.removeOverlay({ id: 'preview_tp_zone' });
    }
    // 3. Draw Stop Loss line (SL) - Draggable
    if (slToDraw) {
      const isPreview = previewTPSL?.enabled && previewTPSL.sl && (!effectiveActivePos || effectiveActivePos.quantity <= 0);
      const precision = getPricePrecision(slToDraw);
      const side = previewTPSL?.side || effectiveActivePos?.side || 'LONG';
      const entryP = orderToDraw || selectedStock.price;
      const qty = previewTPSL?.quantity || (effectiveActivePos?.quantity ? effectiveActivePos.quantity * (getContractMultiplier(selectedStock) || 1) : 0);
      const badgeText = computeOrderLineBadge('SL', slToDraw, entryP, side, qty);

      const isSlLoss = side === 'LONG' ? slToDraw <= entryP : slToDraw >= entryP;
      const slColor = isSlLoss ? '#f23645' : '#089981';
      const slZoneColor = isSlLoss ? 'rgba(242, 54, 69, 0.1)' : 'rgba(8, 153, 129, 0.1)';

      const overlayProps = {
        name: 'orderTpslLine',
        lock: false,
        points: [
          { timestamp: allData[0].timestamp, value: slToDraw },
          { timestamp: allData[lastDataIndex].timestamp, value: slToDraw }
        ],
        extendData: {
          color: slColor,
          isDashed: isPreview,
          badgeText,
          price: slToDraw,
          precision
        },
        onPressedMoveStart: () => {
          isDraggingRef.current = true;
        },
        onPressedMoving: (event: any) => {
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const p = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(p));
            currentSlRef.current = cleanPrice;
            const orderP = currentOrderPriceRef.current || previewTPSL?.orderPrice || selectedStock.price;

            const isSlLoss = side === 'LONG' ? cleanPrice <= orderP : cleanPrice >= orderP;
            const newSlColor = isSlLoss ? '#f23645' : '#089981';
            const newSlZoneColor = isSlLoss ? 'rgba(242, 54, 69, 0.1)' : 'rgba(8, 153, 129, 0.1)';

            chart.overrideOverlay({
              id: 'preview_sl_zone',
              points: [
                { timestamp: allData[0].timestamp, value: orderP },
                { timestamp: allData[lastDataIndex].timestamp, value: cleanPrice }
              ],
              styles: {
                polygon: { color: newSlZoneColor, borderColor: newSlColor }
              }
            });
            const newBadge = computeOrderLineBadge('SL', cleanPrice, orderP, side, qty);
            chart.overrideOverlay({
              id: 'preview_sl_line',
              points: [
                { timestamp: allData[0].timestamp, value: cleanPrice },
                { timestamp: allData[lastDataIndex].timestamp, value: cleanPrice }
              ],
              extendData: {
                ...event.overlay.extendData,
                color: newSlColor,
                price: cleanPrice,
                badgeText: newBadge,
                precision: p
              }
            });
            onTPSLChangeRef.current?.('sl', cleanPrice);
          }
        },
        onPressedMoveEnd: (event: any) => {
          isDraggingRef.current = false;
          const newPrice = event.overlay?.points?.[0]?.value;
          if (typeof newPrice === 'number' && !isNaN(newPrice)) {
            const precision = getPricePrecision(newPrice);
            const cleanPrice = Number(newPrice.toFixed(precision));
            onTPSLChangeRef.current?.('sl', cleanPrice);
          }
        }
      };
      chart.removeOverlay({ id: 'preview_sl_line' });
      chart.createOverlay({ id: 'preview_sl_line', ...overlayProps } as any);
      chart.removeOverlay({ id: 'preview_sl_zone' });
      if (orderToDraw && slToDraw) {
        chart.createOverlay({
          id: 'preview_sl_zone',
          name: 'tpslZone',
          lock: true,
          points: [
            { timestamp: allData[0].timestamp, value: orderToDraw },
            { timestamp: allData[lastDataIndex].timestamp, value: slToDraw }
          ],
          styles: {
            polygon: {
              color: slZoneColor,
              borderColor: slColor
            }
          }
        } as any);
      }
    } else {
      chart.removeOverlay({ id: 'preview_sl_line' });
      chart.removeOverlay({ id: 'preview_sl_zone' });
    }
    if (pendingOrders && pendingOrders.length > 0) {
      const stockPending = pendingOrders.filter(o =>
        o.symbol?.toUpperCase() === selectedStock.symbol?.toUpperCase()
      );
      stockPending.forEach(order => {
        const isBuy = (order.side || '').toUpperCase() === 'LONG';
        const isLimit = (order.type || '').toUpperCase() === 'LIMIT';
        const color = isLimit ? '#2962ff' : '#e65100'; // Blue for limit, Orange for stop
        const orderPrice = Number(order.price || order.limitPrice || 0);
        const orderQty = order.quantity !== undefined ? order.quantity : (order.lot !== undefined ? order.lot : 0);
        if (orderPrice <= 0) return;
        const overlayId = `pending_order_${order._id || order.id || orderPrice}`;
        const overlayProps = {
          name: 'orderTpslLine',
          lock: true,
          points: [
            { timestamp: allData[0].timestamp, value: orderPrice },
            { timestamp: allData[lastDataIndex].timestamp, value: orderPrice }
          ],
          extendData: {
            color,
            isDashed: true,
            badgeText: `${order.type || 'LIMIT'} ${order.side || ''} ${orderQty ? Number(orderQty).toFixed(2) : ''}`,
            price: orderPrice,
            precision: getPricePrecision(orderPrice)
          }
        };
        chart.removeOverlay({ id: overlayId });
        chart.createOverlay({ id: overlayId, ...overlayProps } as any);
        pendingOrderOverlayIdsRef.current.push(overlayId);
      });
    }
  }, [activePosition, simulatorPositions, pendingOrders, isReplaying, replayTime, replayPrice, replayStepTrigger, selectedStock, previewTPSL]);
  // Handle Alt + Drag to draw Rectangle (Khá»‘i lÆ°á»£ng/VĂ¹ng há»— trá»£ khĂ¡ng cá»±)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    let isAltDragging = false;
    let dragOverlayId: string | null = null;
    let startPoint: any = null;
    const handleMouseDown = (e: MouseEvent) => {
      if (e.altKey && e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        isAltDragging = true;
        const chart = chartRef.current;
        if (!chart) return;
        const bounding = container.getBoundingClientRect();
        const x = e.clientX - bounding.left;
        const y = e.clientY - bounding.top;
        // Convert pixel to chart data points
        const points = chart.convertFromPixel([{ x, y }], { paneId: 'candle_pane' });
        if (points && Array.isArray(points) && points.length > 0) {
          const rawPoint = points[0];
          // --- LOGIC NAM CHĂ‚M (MAGNET) ---
          const dataList = chart.getDataList();
          const candle = dataList[rawPoint.dataIndex || 0];
          if (candle && rawPoint.value !== undefined) {
            const prices = [candle.open, candle.high, candle.low, candle.close];
            let closestPrice = prices[0];
            let minDiff = Math.abs(rawPoint.value - closestPrice);
            for (let i = 1; i < 4; i++) {
              const diff = Math.abs(rawPoint.value - prices[i]);
              if (diff < minDiff) {
                minDiff = diff;
                closestPrice = prices[i];
              }
            }
            rawPoint.value = closestPrice;
          }
          // ---------------------------
          startPoint = rawPoint;
          dragOverlayId = chart.createOverlay({
            name: 'rect',
            points: [startPoint, startPoint],
            lock: false,
            onClick: (chart as any).handleOverlayClick,
            onRightClick: () => false
          }) as string;
        }
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isAltDragging && dragOverlayId && startPoint) {
        e.preventDefault();
        e.stopPropagation();
        const chart = chartRef.current;
        if (!chart) return;
        const bounding = container.getBoundingClientRect();
        const x = e.clientX - bounding.left;
        const y = e.clientY - bounding.top;
        const points = chart.convertFromPixel([{ x, y }], { paneId: 'candle_pane' });
        if (points && Array.isArray(points) && points.length > 0) {
          const rawPoint = points[0];
          // --- LOGIC NAM CHĂ‚M (MAGNET) ---
          const dataList = chart.getDataList();
          const candle = dataList[rawPoint.dataIndex || 0];
          if (candle && rawPoint.value !== undefined) {
            const prices = [candle.open, candle.high, candle.low, candle.close];
            let closestPrice = prices[0];
            let minDiff = Math.abs(rawPoint.value - closestPrice);
            for (let i = 1; i < 4; i++) {
              const diff = Math.abs(rawPoint.value - prices[i]);
              if (diff < minDiff) {
                minDiff = diff;
                closestPrice = prices[i];
              }
            }
            rawPoint.value = closestPrice;
          }
          // ---------------------------
          chart.overrideOverlay({
            id: dragOverlayId,
            points: [startPoint, rawPoint]
          });
        }
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (isAltDragging) {
        e.preventDefault();
        e.stopPropagation();
        isAltDragging = false;
        dragOverlayId = null;
        startPoint = null;
      }
    };
    // Láº¯ng nghe á»Ÿ capture phase Ä‘á»ƒ cháº·n sá»± kiá»‡n trÆ°á»›c khi thÆ° viá»‡n xá»­ lĂ½
    container.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, []);

  // Xóa overlay Ä‘ang chá»n báº±ng phĂ­m Backspace / Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bá» qua náº¿u Ä‘ang gĂµ chá»¯ trong tháº» input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const storeClickId = (chartRef.current as any)?.getChartStore?.()?.getClickOverlayInfo?.()?.overlay?.id;
      const targetId = floatingToolbar?.overlayId || selectedOverlay?.id || (window as any).__selectedOverlayId || storeClickId;
      // Workaround for KLineChart getOverlayById type issue
      let targetOverlay: any = null;
      if (targetId && chartRef.current) {
        targetOverlay = (chartRef.current as any).getOverlayById?.(targetId);
      }
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (targetOverlay) {
          copiedOverlayRef.current = {
            name: targetOverlay.name,
            points: targetOverlay.points,
            styles: targetOverlay.styles,
            extendData: targetOverlay.extendData
          };
        }
        return;
      }
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (copiedOverlayRef.current && chartRef.current) {
          const data = copiedOverlayRef.current;
          const shiftMs = timeframeToMs(activeTimeframeRef.current) * 5;
          // Offset the points slightly so it's visible
          const newPoints = data.points?.map((p: any) => {
            const np = { ...p };
            if (np.timestamp !== undefined) np.timestamp += shiftMs;
            if (np.dataIndex !== undefined) np.dataIndex += 5;
            if (np.value !== undefined) np.value *= 1.02; // Shift price by 2%
            return np;
          });
          chartRef.current.createOverlay({
            name: data.name,
            points: newPoints || data.points,
            styles: data.styles,
            extendData: data.extendData
          });
          triggerAutoSaveDrawings();
        }
        return;
      }
      // Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (targetId && chartRef.current) {
          chartRef.current.removeOverlay({ id: targetId });
          setFloatingToolbar(null);
          setSelectedOverlay(null);
          (window as any).__selectedOverlayId = null;
          triggerAutoSaveDrawings();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [floatingToolbar, selectedOverlay]);

  // Persist user overlays per symbol and per account across reloads (F5) and clean up when switching symbol/user
  useEffect(() => {
    const symbol = selectedStock?.symbol;
    if (!symbol) return;
    const currentUserKey = userKeyRef.current;

    // Helper: remove only user drawings and AI correction zone from chart
    const clearDrawingsFromChart = () => {
      const activeChart = chartRef.current;
      if (!activeChart) return;
      try {
        const raw = typeof activeChart.getOverlays === 'function' ? activeChart.getOverlays() : [];
        if (Array.isArray(raw)) {
          raw.forEach((ov: any) => {
            if (isUserDrawingOverlay(ov)) {
              activeChart.removeOverlay({ id: ov.id });
            }
          });
        }
        try {
          activeChart.removeOverlay({ name: 'aiCorrectionZone' });
        } catch (_) {}
      } catch (err) {
        console.error('Error clearing drawings from chart:', err);
      }
    };

    // Helper: save only user drawings for the given symbol to localStorage scoped by userKey
    const saveDrawingsForSymbol = (targetSymbol: string) => {
      const activeChart = chartRef.current;
      if (!activeChart || !targetSymbol) return;
      try {
        const raw = typeof activeChart.getOverlays === 'function' ? activeChart.getOverlays() : [];
        const userOverlays = (Array.isArray(raw) ? raw : [])
          .filter(isUserDrawingOverlay)
          .map((ov: any) => ({
            id: ov.id,
            name: ov.name,
            points: ov.points,
            extendData: ov.extendData,
            styles: ov.styles,
            lock: ov.lock,
            visible: ov.visible,
            zLevel: ov.zLevel
          }));

        const storageKey = `saved-overlays-${userKeyRef.current}-${targetSymbol}`;
        if (userOverlays.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(userOverlays));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (err) {
        console.error('Error saving drawings for symbol:', targetSymbol, err);
      }
    };

    saveDrawingsRef.current = () => saveDrawingsForSymbol(symbol);

    // Helper: load saved drawings for current symbol and userKey
    const loadDrawingsForSymbol = (force = false) => {
      const activeChart = chartRef.current;
      if (!activeChart) return;

      const currentOverlays = typeof activeChart.getOverlays === 'function' ? activeChart.getOverlays() : [];
      const hasUserOverlays = Array.isArray(currentOverlays) && currentOverlays.some(isUserDrawingOverlay);
      if (hasUserOverlays && !force) {
        return;
      }

      clearDrawingsFromChart();

      const userStorageKey = `saved-overlays-${userKeyRef.current}-${symbol}`;
      let saved = localStorage.getItem(userStorageKey);

      // Auto-migration: If not found under userKey, check legacy global key and migrate
      if (!saved && userKeyRef.current !== 'guest') {
        const legacyKey = `saved-overlays-${symbol}`;
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          saved = legacySaved;
          localStorage.setItem(userStorageKey, legacySaved);
          localStorage.removeItem(legacyKey);
        }
      }

      if (saved) {
        try {
          const overlays = JSON.parse(saved);
          if (Array.isArray(overlays)) {
            const currentPrice = selectedStock?.price || 0;
            overlays.forEach((ov: any) => {
              if (!isUserDrawingOverlay(ov)) return;
              
              // Validate overlay points against current symbol price to prevent cross-symbol contamination
              if (currentPrice > 0 && Array.isArray(ov.points) && ov.points.length > 0) {
                const hasValidPrice = ov.points.some((p: any) => {
                  const val = p.value !== undefined ? p.value : p.price;
                  if (typeof val !== 'number' || val <= 0) return true;
                  const ratio = Math.max(val / currentPrice, currentPrice / val);
                  return ratio < 8; // If price difference is > 8x, it belongs to another coin/market!
                });
                if (!hasValidPrice) return;
              }
              activeChart.createOverlay({
                ...ov,
                onClick: (activeChart as any).handleOverlayClick,
                onRightClick: () => false
              });
            });
          }
        } catch (e) {
          console.error('Error loading saved drawings for symbol:', symbol, e);
        }
      }
    };

    loadDrawingsRef.current = () => loadDrawingsForSymbol(false);

    // Immediately clear drawings when switching to new symbol or switching user so old drawings never linger
    clearDrawingsFromChart();

    // Load saved drawings for the new symbol/user after brief tick
    const timer = setTimeout(() => loadDrawingsForSymbol(true), 60);

    const handleBeforeUnload = () => {
      saveDrawingsForSymbol(symbol);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearTimeout(timer);
      // 1. Save drawings for the symbol/user we are leaving
      saveDrawingsForSymbol(symbol);
      // 2. Immediately strip user drawings from canvas so the next symbol/user starts completely clean
      clearDrawingsFromChart();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedStock?.symbol, userKey]);


  const priceColor = selectedStock.percent > 0 ? 'text-[#089981]' : selectedStock.percent < 0 ? 'text-[#f23645]' : 'text-[#787b86]';
  const isDark = theme === 'dark';
  const isDefaultDarkBg = chartSettings.canvas.bgSolid === '#131722' ||
    (chartSettings.canvas.bgGradientTop === '#131722' && chartSettings.canvas.bgGradientBottom === '#1e222d');
  let bgStyle: React.CSSProperties = {};
  if (!isDark && isDefaultDarkBg) {
    bgStyle = { backgroundColor: '#ffffff' };
  } else if (chartSettings.canvas.bgType === 'Solid') {
    bgStyle = { backgroundColor: chartSettings.canvas.bgSolid };
  } else {
    bgStyle = { background: `linear-gradient(to bottom, ${chartSettings.canvas.bgGradientTop}, ${chartSettings.canvas.bgGradientBottom})` };
  }
  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative transition-colors"
      style={bgStyle}
      onMouseMove={(e) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; }}
    >
      {/* Watermark overlay */}
      {chartSettings.canvas.watermarkVal !== 'Hidden' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1] overflow-hidden opacity-[0.03]">
          <span className="text-[120px] font-bold text-gray-900 dark:text-white select-none whitespace-nowrap">
            {chartSettings.canvas.watermarkVal === 'Ticker' ? selectedStock.symbol
              : chartSettings.canvas.watermarkVal === 'Description' ? selectedStock.name
                : chartSettings.canvas.watermarkVal === 'Interval' ? activeTimeframe
                  : chartSettings.canvas.watermarkVal === 'Replay mode' && isReplaying ? 'Replay Mode'
                    : selectedStock.symbol}
          </span>
        </div>
      )}
      {/* Replay Instructions / Banner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-[#131722]/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-[#787b86]">
            <div className="w-8 h-8 border-4 border-[#e6e8ea] dark:border-[#2a2e39] border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">{t('chart.loading', 'Đang tải dữ liệu...')}</span>
          </div>
        </div>
      )}
      {/* Active tool hint */}
      {activeTool !== 'cursor' && activeTool !== 'clear' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-blue-200 bg-blue-900/80 border border-blue-700/60 px-4 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-semibold text-white">{activeTool}</span>
            <span>{t('chart.toolActive', 'đang hoạt động')}</span>
          </span>
          {activeTool === 'fibonacciLine' && (
            <button
              onClick={() => setIsFibModalOpen(true)}
              className="ml-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 shadow"
            >
              <Settings className="w-3 h-3" />
              <span>{t('chart.adjustData', 'Chỉnh thông tin số liệu')}</span>
            </button>
          )}
        </div>
      )}
      <style>{`
        .cursor-mode-arrow, .cursor-mode-arrow * {
          cursor: default !important;
        }
        .cursor-mode-dot, .cursor-mode-dot * {
          cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='4' fill='%232196f3' stroke='%23ffffff' stroke-width='1.5'/></svg>") 8 8, crosshair !important;
        }
        .cursor-mode-eraser, .cursor-mode-eraser * {
          cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23f23645' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m7 21-4-4 11-11 7 7L10 24z'/><path d='m14 6 4 4'/><path d='M22 21H7'/></svg>") 4 16, pointer !important;
        }
        .cursor-mode-crosshair, .cursor-mode-crosshair * {
          cursor: crosshair !important;
        }
      `}</style>
      {/* Floating Action Toolbar for Fibonacci */}
      {selectedOverlay && selectedOverlay.name === 'fibonacciLine' && (
        <div
          className="absolute z-30 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl px-2 py-1.5 flex items-center gap-2 text-[#d1d4dc] text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            left: `${selectedOverlay.x}px`,
            top: `${selectedOverlay.y}px`
          }}
        >
          {/* Drag handle */}
          <div className="cursor-move text-[#787b86] p-0.5 hover:text-white" title="Thanh cĂ´ng cá»¥ Fibonacci">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="w-px h-4 bg-[#2a2e39]" />
          {/* Line width toggle */}
          <button
            onClick={() => {
              const nextWidth = ((selectedOverlay.extendData?.lineWidth || 1) % 3) + 1;
              handleUpdateOverlayConfig({ lineWidth: nextWidth });
            }}
            className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white font-mono flex items-center gap-1 transition-colors"
            title="Äá»™ dĂ y Ä‘Æ°á»ng káº»"
          >
            <span>—</span>
            <span>{selectedOverlay.extendData?.lineWidth || 1}px</span>
          </button>
          {/* Background fill toggle */}
          <button
            onClick={() => {
              handleUpdateOverlayConfig({ showBackground: !selectedOverlay.extendData?.showBackground });
            }}
            className={`p-1 rounded transition-colors ${selectedOverlay.extendData?.showBackground !== false
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
              }`}
            title="Báº­t/Táº¯t tĂ´ mĂ u ná»n"
          >
            <Layers className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#2a2e39]" />
          {/* Settings Cog button -> Opens Modal */}
          <button
            onClick={() => setIsFibModalOpen(true)}
            className="p-1.5 rounded hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1.5"
            title="CĂ i Ä‘áº·t thĂ´ng sá»‘ sá»‘ liá»‡u Fibonacci"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Chá»‰nh sá»‘ liá»‡u</span>
          </button>
          <div className="w-px h-4 bg-[#2a2e39]" />
          {/* Lock button */}
          <button
            onClick={() => {
              const newLock = !selectedOverlay.lock;
              chartRef.current?.overrideOverlay({ id: selectedOverlay.id, lock: newLock });
              setSelectedOverlay(prev => prev ? { ...prev, lock: newLock } : null);
              triggerAutoSaveDrawings();
            }}
            className={`p-1.5 rounded transition-colors ${selectedOverlay.lock ? 'text-amber-400 bg-amber-500/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
              }`}
            title={selectedOverlay.lock ? 'Mở khóa' : 'Khóa vá»‹ trĂ­'}
          >
            {selectedOverlay.lock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          {/* Delete button */}
          <button
            onClick={() => {
              chartRef.current?.removeOverlay({ id: selectedOverlay.id });
              setSelectedOverlay(null);
              triggerAutoSaveDrawings();
            }}
            className="p-1.5 rounded hover:bg-red-500/20 text-[#787b86] hover:text-red-400 transition-colors"
            title="Xóa Fibonacci này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {/* Close toolbar */}
          <button
            onClick={() => setSelectedOverlay(null)}
            className="p-1 rounded text-[#787b86] hover:text-white hover:bg-[#2a2e39] transition-colors"
            title="ÄĂ³ng thanh cĂ´ng cá»¥"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Fibonacci Settings Modal */}
      <FibonacciSettingsModal
        isOpen={isFibModalOpen}
        onClose={() => setIsFibModalOpen(false)}
        config={selectedOverlay?.extendData || fibConfig}
        onSave={handleSaveFibConfig}
      />
      {/* Chart canvas */}
      <div
        id="market-chart"
        ref={chartContainerRef}
        className={`absolute inset-0 ${isSelectingReplayStart ? 'cursor-crosshair' : ''} ${activeTool === 'cursor_arrow' ? 'cursor-mode-arrow' :
          activeTool === 'cursor_dot' ? 'cursor-mode-dot' :
            activeTool === 'eraser' ? 'cursor-mode-eraser' : 'cursor-mode-crosshair'
          }`}
      />
      {/* Selection Mode Overlay / Indicator */}
      {isSelectingReplayStart && (
        <div className="absolute inset-0 border-4 border-blue-500/30 pointer-events-none rounded transition-all animate-pulse z-10" />
      )}
      {/* Floating Toolbar for Overlays */}
      {floatingToolbar && (
        <>
          <div
            className="fixed z-50 flex items-center bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] py-1 px-1.5 gap-1 select-none"
            style={{ top: Math.max(10, floatingToolbar.y - 65), left: Math.max(10, floatingToolbar.x - 120) }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div
              className="p-1 cursor-grab active:cursor-grabbing text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                const initialX = floatingToolbar.x;
                const initialY = floatingToolbar.y;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const dx = moveEvent.clientX - startX;
                  const dy = moveEvent.clientY - startY;
                  setFloatingToolbar(prev => prev ? { ...prev, x: initialX + dx, y: initialY + dy } : null);
                };
                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
            {/* Templates button (4 squares icon) */}
            <button
              title="Bản mẫu"
              onClick={() => setOverlayPopup(prev => prev === 'templates' ? null : 'templates')}
              className={`p-1.5 rounded transition-colors ${overlayPopup === 'templates' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            {/* Color Picker button (pencil with color underline) */}
            <button
              title="MĂ u sáº¯c vĂ  Äá»™ má»"
              onClick={() => setOverlayPopup(prev => prev === 'color' ? null : 'color')}
              className={`p-1.5 rounded transition-colors relative flex flex-col items-center justify-center ${overlayPopup === 'color' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
            >
              <Pencil className="w-4 h-4" />
              <div className="w-3.5 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: overlayColor }} />
            </button>
            {/* Text button / Ghi tĂªn (T icon) */}
            <button
              title="CĂ i Ä‘áº·t vÄƒn báº£n / Ghi tĂªn"
              onClick={() => {
                if (floatingToolbar?.overlay) {
                  onOverlayDoubleClickRef.current?.(floatingToolbar.overlay, 'text');
                  setOverlayPopup(null);
                }
              }}
              className="p-1.5 rounded transition-colors text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-blue-500 flex items-center justify-center"
            >
              <Type className="w-4 h-4" />
            </button>
            {/* Line Width button (e.g. 2px) */}
            <button
              title="Äá»™ dĂ y nĂ©t"
              onClick={() => setOverlayPopup(prev => prev === 'width' ? null : 'width')}
              className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-colors ${overlayPopup === 'width' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
            >
              {overlayLineWidth}px
            </button>
            {/* Line Style button */}
            <button
              title="Kiá»ƒu nĂ©t"
              onClick={() => setOverlayPopup(prev => prev === 'style' ? null : 'style')}
              className={`p-1.5 rounded transition-colors font-mono font-bold text-xs ${overlayPopup === 'style' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
            >
              {overlayLineStyle === 'dashed' ? '---' : overlayLineStyle === 'dotted' ? '····' : '—'}
            </button>
            <div className="w-[1px] h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] mx-0.5" />
            {/* Lock */}
            <button
              title={floatingToolbar.overlay.lock ? "Mở khóa" : "Khóa"}
              onClick={() => {
                const newLockStatus = !floatingToolbar.overlay.lock;
                chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, lock: newLockStatus });
                setFloatingToolbar(prev => prev ? { ...prev, overlay: { ...prev.overlay, lock: newLockStatus } } : null);
                triggerAutoSaveDrawings();
              }}
              className={`p-1.5 rounded transition-colors ${floatingToolbar.overlay.lock ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-blue-500'}`}
            >
              {floatingToolbar.overlay.lock ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            {/* Trash */}
            <button
              title="Xóa"
              onClick={() => {
                chartRef.current?.removeOverlay({ id: floatingToolbar.overlayId });
                setFloatingToolbar(null);
                triggerAutoSaveDrawings();
              }}
              className="p-1.5 text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-red-500 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* More options (...) */}
            <button
              title="TĂ¹y chá»n khĂ¡c"
              onClick={() => setOverlayPopup(prev => prev === 'context' ? null : 'context')}
              className={`p-1.5 rounded transition-colors ${overlayPopup === 'context' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'text-[#787b86] hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          {/* Color Picker Popup */}
          {overlayPopup === 'color' && (
            <div
              className="fixed z-50 bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] p-3 flex flex-col gap-3 w-64 select-none"
              style={{ top: Math.max(10, floatingToolbar.y - 350), left: Math.max(10, floatingToolbar.x - 60) }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-8 gap-1.5">
                {COLOR_PALETTE_GRID.flatMap(row => row).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOverlayColor(c);
                      chartRef.current?.overrideOverlay({
                        id: floatingToolbar.overlayId,
                        styles: { line: { color: hexToRgba(c, overlayOpacity / 100) } }
                      });
                    }}
                    className={`w-5 h-5 rounded-sm transition-transform hover:scale-110 relative ${overlayColor === c ? 'ring-2 ring-blue-500 z-10' : ''}`}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #d1d4dc' : 'none' }}
                  />
                ))}
              </div>
              <div className="w-full h-[1px] bg-[#e6e8ea] dark:bg-[#2a2e39]" />
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = overlayColor;
                  input.onchange = (e: any) => {
                    const newC = e.target.value;
                    setOverlayColor(newC);
                    chartRef.current?.overrideOverlay({
                      id: floatingToolbar.overlayId,
                      styles: { line: { color: hexToRgba(newC, overlayOpacity / 100) } }
                    });
                  };
                  input.click();
                }}
                className="flex items-center justify-center p-1.5 rounded hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#787b86] dark:text-[#d1d4dc] transition-colors"
                title="Thêm màu tùy chỉnh"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="w-full h-[1px] bg-[#e6e8ea] dark:bg-[#2a2e39]" />
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs text-[#787b86]">
                  <span>{t('chart.opacity', 'Độ mờ')}</span>
                  <span className="font-mono text-[#1e2329] dark:text-white font-semibold">{overlayOpacity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setOverlayOpacity(val);
                      chartRef.current?.overrideOverlay({
                        id: floatingToolbar.overlayId,
                        styles: { line: { color: hexToRgba(overlayColor, val / 100) } }
                      });
                    }}
                    className="flex-1 h-1.5 bg-[#e6e8ea] dark:bg-[#2a2e39] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="px-2 py-0.5 bg-[#f0f3fa] dark:bg-[#131722] border border-[#e6e8ea] dark:border-[#2a2e39] rounded text-xs font-mono text-[#1e2329] dark:text-white w-12 text-center">
                    {overlayOpacity}%
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Line Style Popup */}
          {overlayPopup === 'style' && (
            <div
              className="fixed z-50 bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] py-1 w-52 flex flex-col select-none text-xs text-[#1e2329] dark:text-[#d1d4dc]"
              style={{ top: Math.max(10, floatingToolbar.y - 140), left: Math.max(10, floatingToolbar.x + 30) }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { id: 'solid', label: t('chart.solidLine', 'Đường thẳng'), val: 'solid', icon: <div className="w-6 h-[2px] bg-current" /> },
                { id: 'dashed', label: t('chart.dashedLine', 'Đường đứt nét'), val: 'dashed', icon: <div className="w-6 h-[2px] border-b-2 border-dashed border-current" /> },
                { id: 'dotted', label: t('chart.dottedLine', 'Đường chấm chấm'), val: 'dotted', icon: <div className="w-6 h-[2px] border-b-2 border-dotted border-current" /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOverlayLineStyle(item.val as any);
                    chartRef.current?.overrideOverlay({
                      id: floatingToolbar.overlayId,
                      styles: {
                        line: {
                          style: item.val === 'solid' ? 'solid' : 'dashed',
                          dashedValue: item.val === 'dotted' ? [2, 3] : [6, 6]
                        } as any
                      }
                    });
                    setOverlayPopup(null);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] ${overlayLineStyle === item.val ? 'text-blue-500 font-semibold bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#1e2329] dark:text-[#d1d4dc]'}`}
                >
                  <span className="text-[#787b86] dark:text-[#a3a6af] shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Line Width Popup */}
          {overlayPopup === 'width' && (
            <div
              className="fixed z-50 bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] py-1 w-32 flex flex-col select-none"
              style={{ top: Math.max(10, floatingToolbar.y - 170), left: Math.max(10, floatingToolbar.x) }}
              onClick={(e) => e.stopPropagation()}
            >
              {[1, 2, 3, 4].map(w => (
                <button
                  key={w}
                  onClick={() => {
                    setOverlayLineWidth(w);
                    chartRef.current?.overrideOverlay({
                      id: floatingToolbar.overlayId,
                      styles: { line: { size: w } }
                    });
                    setOverlayPopup(null);
                  }}
                  className={`flex items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] ${overlayLineWidth === w ? 'text-blue-500 font-semibold bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#1e2329] dark:text-[#d1d4dc]'}`}
                >
                  <span>{w}px</span>
                  <div className="bg-current rounded-full" style={{ height: w, width: 24 }} />
                </button>
              ))}
            </div>
          )}
          {/* Context Menu Popup */}
          {overlayPopup === 'context' && (
            <div
              className="fixed z-50 bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] py-1.5 w-64 flex flex-col text-xs text-[#1e2329] dark:text-[#d1d4dc] select-none"
              style={{ top: Math.max(10, floatingToolbar.y - 320), left: Math.max(10, floatingToolbar.x + (floatingToolbar.x > window.innerWidth - 320 ? -200 : 80)) }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Submenu 1: Bản mẫu */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveContextMenuSubMenu('templates')}
              >
                <button
                  onClick={() => setActiveContextMenuSubMenu(prev => prev === 'templates' ? null : 'templates')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
                >
                  <span>{t('ctx.template', 'Bản mẫu')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#787b86]" />
                </button>
                {activeContextMenuSubMenu === 'templates' && (
                  <div className={`absolute top-0 ${floatingToolbar.x > window.innerWidth - 320 ? '-left-48' : 'left-full ml-1'} bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-2xl py-1 w-48 z-50 max-h-64 overflow-y-auto`}>
                    <button
                      onClick={() => {
                        const name = window.prompt(t('ctx.promptNewTemplate', 'Nhập tên bản mẫu mới:'));
                        if (name) {
                          const currentOverlay = floatingToolbar.overlay;
                          const templates = JSON.parse(localStorage.getItem(`overlay-templates-${currentOverlay.name}`) || '{}');
                          templates[name] = { styles: currentOverlay.styles, extendData: currentOverlay.extendData };
                          localStorage.setItem(`overlay-templates-${currentOverlay.name}`, JSON.stringify(templates));
                          setOverlayPopup(null);
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc] border-b border-[#e6e8ea] dark:border-[#2a2e39] font-medium"
                    >
                      {t('ctx.saveAs', 'Lưu thành...')}
                    </button>
                    {Object.keys(JSON.parse(localStorage.getItem(`overlay-templates-${floatingToolbar.overlay.name}`) || '{}')).map((tplName) => (
                      <div key={tplName} className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc] group/tpl cursor-pointer">
                        <span
                          className="truncate flex-1"
                          onClick={() => {
                            const templates = JSON.parse(localStorage.getItem(`overlay-templates-${floatingToolbar.overlay.name}`) || '{}');
                            const tpl = templates[tplName];
                            if (tpl) {
                              chartRef.current?.overrideOverlay({
                                id: floatingToolbar.overlayId,
                                styles: tpl.styles,
                                extendData: tpl.extendData
                              });
                            }
                            setOverlayPopup(null);
                          }}
                        >
                          {tplName}
                        </span>
                        <Trash2
                          className="w-3 h-3 text-[#f23645] opacity-0 group-hover/tpl:opacity-100 transition-opacity shrink-0 ml-2 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`${t('ctx.confirmDeleteTemplate', 'Xóa bản mẫu')} "${tplName}"?`)) {
                              const templates = JSON.parse(localStorage.getItem(`overlay-templates-${floatingToolbar.overlay.name}`) || '{}');
                              delete templates[tplName];
                              localStorage.setItem(`overlay-templates-${floatingToolbar.overlay.name}`, JSON.stringify(templates));
                              setOverlayPopup(null);
                            }
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        chartRef.current?.overrideOverlay({
                          id: floatingToolbar.overlayId,
                          styles: { line: { color: '#2962ff', size: 1, style: 'solid' } }
                        });
                        setOverlayPopup(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc] border-t border-[#e6e8ea] dark:border-[#2a2e39]"
                    >
                      {t('ctx.applyDefault', 'Ăp dá»¥ng Máº·c Ä‘á»‹nh')}
                    </button>
                  </div>
                )}
              </div>

              {/* Submenu 2: Thứ tự Trực quan */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveContextMenuSubMenu('visual_order')}
              >
                <button
                  onClick={() => setActiveContextMenuSubMenu(prev => prev === 'visual_order' ? null : 'visual_order')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
                >
                  <span>{t('ctx.visualOrder', 'Thứ tự Trực quan')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#787b86]" />
                </button>
                {activeContextMenuSubMenu === 'visual_order' && (
                  <div className={`absolute top-0 ${floatingToolbar.x > window.innerWidth - 320 ? '-left-48' : 'left-full ml-1'} bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-2xl py-1 w-48 z-50`}>
                    <button
                      onClick={() => {
                        chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, zGroupId: 100 } as any);
                        setOverlayPopup(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
                    >
                      {t('ctx.bringToFront', 'ÄÆ°a lĂªn phĂ­a trÆ°á»›c')}
                    </button>
                    <button
                      onClick={() => {
                        chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, zGroupId: -100 } as any);
                        setOverlayPopup(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
                    >
                      {t('ctx.sendToBack', 'Gá»­i vá» sau')}
                    </button>
                    <button
                      onClick={() => {
                        chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, zGroupId: 10 } as any);
                        setOverlayPopup(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
                    >
                      {t('ctx.bringForward', 'ÄÆ°a lĂªn trĂªn')}
                    </button>
                    <button
                      onClick={() => {
                        chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, zGroupId: -10 } as any);
                        setOverlayPopup(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
                    >
                      {t('ctx.sendBackward', 'Gửi trở lại')}
                    </button>
                  </div>
                )}
              </div>
              {/* Submenu 3: Kháº£ nÄƒng hiá»ƒn thá»‹ trong cĂ¡c khoáº£ng thá»i gian */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveContextMenuSubMenu('timeframe_visibility')}
              >
                <button
                  onClick={() => setActiveContextMenuSubMenu(prev => prev === 'timeframe_visibility' ? null : 'timeframe_visibility')}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
                >
                  <span className="truncate pr-2">{t('ctx.visibility', 'Khả năng hiển thị trong các khoảng thời gian')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#787b86] shrink-0" />
                </button>
                {activeContextMenuSubMenu === 'timeframe_visibility' && (
                  <div className={`absolute top-0 ${floatingToolbar.x > window.innerWidth - 320 ? '-left-64' : 'left-full ml-1'} bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-2xl py-1 w-64 z-50`}>
                    <button onClick={() => setOverlayPopup(null)} className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]">{t('ctx.visCurrentAndFuture', 'Khoảng thời gian hiện tại trở đi')}</button>
                    <button onClick={() => setOverlayPopup(null)} className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]">{t('ctx.visCurrentAndPast', 'Khoảng thời gian hiện tại trở về trước')}</button>
                    <button onClick={() => setOverlayPopup(null)} className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]">{t('ctx.visCurrentOnly', 'Chỉ ở khoảng thời gian hiện tại')}</button>
                    <button onClick={() => setOverlayPopup(null)} className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]">{t('ctx.visAll', 'Tất cả khoảng thời gian')}</button>
                  </div>
                )}
              </div>
              <button onClick={() => setOverlayPopup(null)} className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]">
                {t('ctx.objectTree', 'Danh sách đối tượng...')}
              </button>
              <div className="w-full h-[1px] bg-[#e6e8ea] dark:bg-[#2a2e39] my-1" />

              {/* Bản sao */}
              <button
                onClick={() => {
                  const chart = chartRef.current;
                  if (chart && floatingToolbar) {
                    const currentOverlay = floatingToolbar.overlay;
                    const shiftMs = timeframeToMs(activeTimeframeRef.current) * 5;
                    const newPoints = currentOverlay.points?.map((p: any) => {
                      const np = { ...p };
                      if (np.timestamp !== undefined) np.timestamp += shiftMs;
                      if (np.dataIndex !== undefined) np.dataIndex += 5;
                      if (np.value !== undefined) np.value *= 1.02;
                      return np;
                    });
                    chart.createOverlay({
                      name: currentOverlay.name,
                      points: newPoints || currentOverlay.points,
                      styles: currentOverlay.styles,
                      extendData: currentOverlay.extendData
                    });
                  }
                  setOverlayPopup(null);
                }}
                className="flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                <span>{t('ctx.clone', 'Bản sao')}</span>
                <span className="text-[10px] text-[#787b86]">Alt + Drag</span>
              </button>

              {/* Sao chép */}
              <button
                onClick={() => {
                  if (floatingToolbar) {
                    const currentOverlay = floatingToolbar.overlay;
                    copiedOverlayRef.current = {
                      name: currentOverlay.name,
                      points: currentOverlay.points,
                      styles: currentOverlay.styles,
                      extendData: currentOverlay.extendData
                    };
                  }
                  setOverlayPopup(null);
                }}
                className="flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                <span>{t('ctx.copy', 'Sao chép')}</span>
                <span className="text-[10px] text-[#787b86]">Ctrl + C</span>
              </button>
              <div className="w-full h-[1px] bg-[#e6e8ea] dark:bg-[#2a2e39] my-1" />
              <button
                onClick={() => {
                  const newLockStatus = !floatingToolbar.overlay.lock;
                  chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, lock: newLockStatus });
                  setOverlayPopup(null);
                }}
                className="flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                <span>{floatingToolbar.overlay.lock ? t('ctx.unlock', 'Mở khóa') : t('ctx.lock', 'Khóa')}</span>
              </button>
              <button
                onClick={() => {
                  chartRef.current?.overrideOverlay({ id: floatingToolbar.overlayId, visible: false });
                  setOverlayPopup(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                {t('ctx.hide', 'Ẩn')}
              </button>
              <button
                onClick={() => {
                  chartRef.current?.removeOverlay({ id: floatingToolbar.overlayId });
                  if (selectedOverlay?.id === floatingToolbar.overlayId) setSelectedOverlay(null);
                  setFloatingToolbar(null);
                  triggerAutoSaveDrawings();
                }}
                className="flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-red-500"
              >
                <span>{t('ctx.remove', 'Loại bỏ')}</span>
                <span className="text-[10px] text-[#787b86]">Del</span>
              </button>
              <div className="w-full h-[1px] bg-[#e6e8ea] dark:bg-[#2a2e39] my-1" />
              <button
                onClick={() => {
                  onOverlayDoubleClickRef.current?.(floatingToolbar.overlay, 'text');
                  setOverlayPopup(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                {t('chart.addText', 'Thêm văn bản')}...
              </button>
              <button
                onClick={() => {
                  onOverlayDoubleClickRef.current?.(floatingToolbar.overlay, 'style');
                  setOverlayPopup(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] text-[#1e2329] dark:text-[#d1d4dc]"
              >
                {t('ctx.settings', 'Cài đặt...')}
              </button>
            </div>
          )}
        </>
      )}
      {/* Chart Context Menu Popup */}
      {chartContextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-[#1e222d] shadow-2xl rounded-lg border border-[#e6e8ea] dark:border-[#2a2e39] py-1.5 w-64 flex flex-col text-xs text-[#1e2329] dark:text-[#d1d4dc] select-none"
          style={{
            top: Math.min(chartContextMenu.y, window.innerHeight - 200),
            left: Math.min(chartContextMenu.x, window.innerWidth - 264)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              if (chartRef.current) {
                chartRef.current.setBarSpace(6);
                chartRef.current.setOffsetRightDistance(50);
                // Force re-calc Y axis by overriding with autoMinMax (if supported) or clearing
                const anyChart = chartRef.current as any;
                if (anyChart.overrideYAxis) {
                  anyChart.overrideYAxis({ autoMinMax: true });
                }
              }
              setChartContextMenu(null);
            }}
            className="w-full flex items-center px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2 text-[#787b86]" />
            <span>{t('chart.refresh', 'Làm mới biểu đồ')}</span>
          </button>
          <button
            onClick={() => {
              const priceStr = chartContextMenu.price.toFixed(getPricePrecision(selectedStock.price));
              navigator.clipboard.writeText(priceStr).then(() => {
                console.log("Đã copy giá:", priceStr);
              });
              setChartContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
          >
            <div className="flex items-center">
              <Copy className="w-3.5 h-3.5 mr-2 text-[#787b86]" />
              <span>{t('chart.copyPrice', 'Sao chép giá')} {chartContextMenu.price.toFixed(getPricePrecision(selectedStock.price))}</span>
            </div>
          </button>
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
              window.dispatchEvent(event);
              setChartContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#f0f3fa] dark:hover:bg-[#2a2e39] transition-colors"
          >
            <div className="flex items-center">
              <Clipboard className="w-3.5 h-3.5 mr-2 text-[#787b86]" />
              <span>{t('chart.paste', 'Dán (Paste)')}</span>
            </div>
            <span className="text-[10px] text-[#787b86]">Ctrl + V</span>
          </button>
        </div>
      )}
      {/* Overlay Settings Modal */}
      <OverlaySettingsModal
        isOpen={isSettingsModalOpen}
        activeTab={activeSettingsTab}
        onClose={() => setIsSettingsModalOpen(false)}
        initialSettings={selectedOverlaySettings}
        onSave={handleSaveOverlaySettings}
      />
      {/* Fibonacci Settings Modal */}
      <FibonacciSettingsModal
        isOpen={isFibModalOpen}
        onClose={() => setIsFibModalOpen(false)}
        config={fibConfig}
        onSave={handleSaveFibConfig}
      />
    </div>
  );
};


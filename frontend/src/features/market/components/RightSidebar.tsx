import { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, ChevronLeft, Settings2, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { STOCKS, type Stock, generateOHLCV, getPricePrecision, getContractMultiplier, getAssetUnit } from '../data';
import { useAuth } from '../../../contexts/AuthContext';
import { useModal } from '../../../contexts/ModalContext';
import { useI18n } from '../../../contexts/I18nContext';
import { OrderBook } from './OrderBook';

export const getLotMultiplier = (stock: Stock): number => {
  return getContractMultiplier(stock);
};

export { getAssetUnit };

export const getLotInputLabel = (stock: Stock, t: any): string => {
  if (stock.market === 'Ngoại hối (Forex)' || stock.market === 'Hàng hóa') {
    return `${t('order.qty', 'Khối lượng')} (Lot)`;
  }
  if (stock.market === 'Tiền điện tử (Crypto)') {
    const base = stock.symbol.replace('.SWAP', '').replace('.P', '').replace('USDT', '').replace('USD', '');
    return `${t('order.qty', 'Khối lượng')} (${base})`;
  }
  if (stock.market === 'Cổ phiếu') {
    return `${t('order.qty', 'Số lượng')} (${t('order.stock', 'Cổ phiếu')})`;
  }
  if (stock.market === 'Chỉ số') {
    return `${t('order.qty', 'Số lượng')} (${t('order.contract', 'Hợp đồng')})`;
  }
  return `${t('order.qty', 'Khối lượng')} (Lot)`;
};

interface RightSidebarProps {
  selectedStock: Stock;
  positions: Record<string, { quantity: number, averagePrice: number, side: 'LONG' | 'SHORT', leverage: number, tp?: number, sl?: number }>;
  balance: number;
  maxAllowedLeverage?: number;
  challengeBadge?: string;
  onStockSelect: (stock: Stock) => void;
  onTrade: (type: 'buy' | 'sell' | 'close' | 'limit_buy' | 'limit_sell' | 'stop_buy' | 'stop_sell', price: number, margin: number, leverage: number, tp?: number, sl?: number) => Promise<{ success: boolean; message: string }>;
  onUpdateTPSL: (symbol: string, side: 'LONG' | 'SHORT', tp?: number, sl?: number) => Promise<{ success: boolean; message: string }>;
  onAddMargin?: (symbol: string, side: 'LONG' | 'SHORT', amount: number) => Promise<{ success: boolean; message: string }>;
  isEditing?: boolean;
  onCancelEdit?: () => void;
  onPreviewTPSLChange?: (tpsl: { tp?: number; sl?: number; side?: 'LONG' | 'SHORT'; enabled: boolean; orderPrice?: number; orderType?: 'LIMIT' | 'STOP'; quantity?: number; lot?: number; actualQty?: number } | null) => void;
  draggedTPSL?: { tp?: number; sl?: number; orderPrice?: number } | null;
  onResetWallet?: () => void;
  totalEquity?: number;
}

export const RightSidebar = ({ selectedStock, positions, balance, totalEquity, maxAllowedLeverage, challengeBadge, onStockSelect, onTrade, onUpdateTPSL, onAddMargin, isEditing, onCancelEdit, onPreviewTPSLChange, draggedTPSL, onResetWallet }: RightSidebarProps) => {
  const { user, login } = useAuth();
  const { showAlert } = useModal();
  const { t } = useI18n();
  const [activeSidebarTab, setActiveSidebarTab] = useState<'orderbook' | 'trade'>('trade');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [isExpanded, setIsExpanded] = useState(true);
  const [limitPriceStr, setLimitPriceStr] = useState<string>('');
  const [lotStr, setLotStr] = useState<string>('0.1');
  const [leverage, setLev] = useState<number>(10);
  const [tp, setTp] = useState<string>('');
  const [sl, setSl] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTPSL, setShowTPSL] = useState(false);
  const [sizingMode, setSizingMode] = useState<'qty' | 'amount' | 'percent'>('qty');
  const prevTpslRef = useRef<string>('');
  const prevSymbolRef = useRef<string>(selectedStock.symbol);
  const prevPosRef = useRef<boolean>(false);
  const [sizingDropdownOpen, setSizingDropdownOpen] = useState(false);
  const [amountStr, setAmountStr] = useState<string>('');
  const [percentVal, setPercentVal] = useState<number>(0);

  // Force showTPSL when editing
  useEffect(() => {
    if (isEditing) {
      setShowTPSL(true);
    }
  }, [isEditing]);

  // Synchronize TP/SL with active position or stock changes
  useEffect(() => {
    const symbolChanged = prevSymbolRef.current !== selectedStock.symbol;
    prevSymbolRef.current = selectedStock.symbol;

    // Pre-fill TP/SL from active position if it exists
    const pos = positions[selectedStock.symbol];
    if (pos) {
      if (pos.tp !== undefined && pos.tp !== null) setTp(pos.tp.toString());
      if (pos.sl !== undefined && pos.sl !== null) setSl(pos.sl.toString());
      if (pos.tp || pos.sl) {
        setShowTPSL(true);
      }
    } else if (symbolChanged || prevPosRef.current) {
      setTp('');
      setSl('');
      setShowTPSL(false);
      onPreviewTPSLChange?.(null);
    }
    prevPosRef.current = !!pos;
    // Pre-fill limit price string if empty or symbol changed
    if (symbolChanged || !limitPriceStr || parseFloat(limitPriceStr) <= 0) {
      setLimitPriceStr(selectedStock.price.toString());
    }
  }, [selectedStock.symbol, positions, onPreviewTPSLChange]);

  // Listen for real-time drag updates from chart
  useEffect(() => {
    if (draggedTPSL) {
      if (draggedTPSL.tp !== undefined) {
        setTp(draggedTPSL.tp.toString());
      }
      if (draggedTPSL.sl !== undefined) {
        setSl(draggedTPSL.sl.toString());
      }
      if (draggedTPSL.orderPrice !== undefined && (orderType === 'limit' || orderType === 'stop')) {
        setLimitPriceStr(draggedTPSL.orderPrice.toString());
      }
    }
  }, [draggedTPSL, orderType]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateTPSL = async () => {
    if (!side) return;
    const tpVal = tp ? parseFloat(tp) : undefined;
    const slVal = sl ? parseFloat(sl) : undefined;
    if (isSubmitting) return;
    setIsSubmitting(true);
    const res = await onUpdateTPSL(selectedStock.symbol, side, tpVal, slVal);
    showToast(res.message, res.success);
    setIsSubmitting(false);
    if (res.success && onCancelEdit) onCancelEdit();
  };

  const lotMultiplier = getLotMultiplier(selectedStock);
  const assetUnit = getAssetUnit(selectedStock);
  const lotInputLabel = getLotInputLabel(selectedStock, t);

  const effectiveLeverageInfo = useMemo(() => {
    const stockInfo = selectedStock.leverageInfo || { max: 20, marks: [5, 10, 15, 20] };
    const max = maxAllowedLeverage ? Math.min(stockInfo.max, maxAllowedLeverage) : stockInfo.max;
    if (max === stockInfo.max) return stockInfo;

    let marks: number[] = [];
    if (max <= 5) marks = [2, 3, 4, 5];
    else if (max <= 10) marks = [2, 5, 8, 10];
    else if (max <= 20) marks = [5, 10, 15, 20];
    else if (max <= 30) marks = [5, 10, 20, 30];
    else if (max <= 50) marks = [10, 25, 50];
    else if (max <= 100) marks = [25, 50, 75, 100];
    else marks = [Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

    return { max, marks };
  }, [selectedStock.leverageInfo, maxAllowedLeverage]);

  // Clamp leverage when effectiveLeverageInfo.max changes or exceeds limit
  useEffect(() => {
    if (leverage > effectiveLeverageInfo.max) {
      setLev(effectiveLeverageInfo.max);
    }
  }, [effectiveLeverageInfo.max, leverage]);

  // Spot vs Margin / Futures check: Chỉ khoá Spot khi đòn bẩy tối đa là 1X (hoặc bị giới hạn bởi challenge)
  const isSpot = effectiveLeverageInfo.max <= 1;

  const held = positions[selectedStock.symbol]?.quantity || 0;
  const avgPrice = positions[selectedStock.symbol]?.averagePrice || 0;
  const side = positions[selectedStock.symbol]?.side;
  const posLeverage = positions[selectedStock.symbol]?.leverage || 1;
  const posTp = positions[selectedStock.symbol]?.tp;
  const posSl = positions[selectedStock.symbol]?.sl;

  const currentLeverage = isSpot ? 1 : (isEditing ? posLeverage : leverage);
  const pTotal = (orderType !== 'market' && !isEditing) ? (parseFloat(limitPriceStr) || selectedStock.price) : selectedStock.price;

  let actualQty = 0;
  let requiredMargin = 0;

  if (sizingMode === 'qty') {
    actualQty = parseFloat(lotStr) || 0;
    requiredMargin = (actualQty * pTotal) / currentLeverage;
  } else if (sizingMode === 'amount') {
    requiredMargin = parseFloat(amountStr) || 0;
    actualQty = pTotal > 0 ? (requiredMargin * currentLeverage) / pTotal : 0;
  } else if (sizingMode === 'percent') {
    requiredMargin = balance > 0 ? (balance * (percentVal / 100)) : 0;
    actualQty = pTotal > 0 ? (requiredMargin * currentLeverage) / pTotal : 0;
  }

  const handleQuickPercent = (pct: number) => {
    setPercentVal(pct);
    const targetMargin = (balance * pct) / 100;
    setAmountStr(targetMargin.toFixed(2));
    if (pTotal > 0) {
      const calcQty = (targetMargin * currentLeverage) / pTotal;
      const step = selectedStock.market === 'Tiền điện tử (Crypto)' ? 4 : selectedStock.market === 'Cổ phiếu' ? 0 : 2;
      setLotStr(calcQty.toFixed(step));
    }
  };

  const handleLotChange = (val: string) => {
    setLotStr(val);
    const q = parseFloat(val) || 0;
    const m = (q * pTotal) / currentLeverage;
    setAmountStr(m > 0 ? m.toFixed(2) : '');
    setPercentVal(balance > 0 ? Math.min(100, Math.round((m / balance) * 100)) : 0);
  };

  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    const m = parseFloat(val) || 0;
    setPercentVal(balance > 0 ? Math.min(100, Math.round((m / balance) * 100)) : 0);
    if (pTotal > 0) {
      const calcQty = (m * currentLeverage) / pTotal;
      const step = selectedStock.market === 'Tiền điện tử (Crypto)' ? 4 : selectedStock.market === 'Cổ phiếu' ? 0 : 2;
      setLotStr(calcQty > 0 ? calcQty.toFixed(step) : '');
    }
  };

  const handlePercentInput = (val: string) => {
    const num = Math.min(100, Math.max(0, parseInt(val) || 0));
    setPercentVal(num);
    const m = (balance * num) / 100;
    setAmountStr(m > 0 ? m.toFixed(2) : '');
    if (pTotal > 0) {
      const calcQty = (m * currentLeverage) / pTotal;
      const step = selectedStock.market === 'Tiền điện tử (Crypto)' ? 4 : selectedStock.market === 'Cổ phiếu' ? 0 : 2;
      setLotStr(calcQty > 0 ? calcQty.toFixed(step) : '');
    }
  };

  const handleTrade = async (type: 'buy' | 'sell' | 'close') => {
    const p = (orderType !== 'market' && type !== 'close') ? parseFloat(limitPriceStr) || 0 : selectedStock.price;
    const tpVal = tp ? parseFloat(tp) : undefined;
    const slVal = sl ? parseFloat(sl) : undefined;

    if (type === 'close') {
      const result = await onTrade('close', p, 1, currentLeverage, tpVal, slVal);
      showToast(result.message, result.success);
      return;
    }

    if (requiredMargin <= 0 || actualQty <= 0) {
      showAlert({ title: 'Khối lượng không hợp lệ', message: 'Vui lòng nhập khối lượng hoặc số tiền lớn hơn 0!', type: 'warning' });
      return;
    }

    if (requiredMargin > balance) {
      showAlert({
        title: 'Số dư không đủ',
        message: `Ký quỹ yêu cầu ($${requiredMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) vượt quá số dư khả dụng ($${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})!`,
        type: 'warning'
      });
      return;
    }

    // Validation
    if (orderType === 'limit') {
      if (p <= 0) return showAlert({ title: 'Giá không hợp lệ', message: 'Giá Limit không hợp lệ', type: 'warning' });
      if (type === 'buy' && p >= selectedStock.price) {
        return showAlert({ title: 'Giá Limit không hợp lệ', message: `Giá mua Limit (${p}) phải THẤP HƠN giá thị trường hiện tại (${selectedStock.price})`, type: 'warning' });
      }
      if (type === 'sell' && p <= selectedStock.price) {
        return showAlert({ title: 'Giá Limit không hợp lệ', message: `Giá bán Limit (${p}) phải CAO HƠN giá thị trường hiện tại (${selectedStock.price})`, type: 'warning' });
      }
    } else if (orderType === 'stop') {
      if (p <= 0) return showAlert({ title: 'Giá không hợp lệ', message: 'Giá Stop không hợp lệ', type: 'warning' });
      if (type === 'buy' && p <= selectedStock.price) {
        return showAlert({ title: 'Giá Stop không hợp lệ', message: `Giá mua Stop (${p}) phải CAO HƠN giá thị trường hiện tại (${selectedStock.price})`, type: 'warning' });
      }
      if (type === 'sell' && p >= selectedStock.price) {
        return showAlert({ title: 'Giá Stop không hợp lệ', message: `Giá bán Stop (${p}) phải THẤP HƠN giá thị trường hiện tại (${selectedStock.price})`, type: 'warning' });
      }
    }

    if (tpVal !== undefined) {
      if (type === 'buy' && tpVal <= p) return showAlert({ title: 'Thiết lập TP/SL', message: 'Chốt lời (TP) của lệnh LONG phải CAO HƠN giá mở lệnh', type: 'warning' });
      if (type === 'sell' && tpVal >= p) return showAlert({ title: 'Thiết lập TP/SL', message: 'Chốt lời (TP) của lệnh SHORT phải THẤP HƠN giá mở lệnh', type: 'warning' });
    }
    if (slVal !== undefined) {
      if (type === 'buy' && slVal >= p) return showAlert({ title: 'Thiết lập TP/SL', message: 'Cắt lỗ (SL) của lệnh LONG phải THẤP HƠN giá mở lệnh', type: 'warning' });
      if (type === 'sell' && slVal <= p) return showAlert({ title: 'Thiết lập TP/SL', message: 'Cắt lỗ (SL) của lệnh SHORT phải CAO HƠN giá mở lệnh', type: 'warning' });
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const tradeType = orderType === 'market' ? type :
      orderType === 'limit' ? (type === 'buy' ? 'limit_buy' : 'limit_sell') :
        (type === 'buy' ? 'stop_buy' : 'stop_sell');
    const result = await onTrade(tradeType, p, requiredMargin, currentLeverage, tpVal, slVal);
    showToast(result.message, result.success);
    if (result.success) {
      setShowTPSL(false);
      setTp('');
      setSl('');
      onPreviewTPSLChange?.(null);
    }
    setIsSubmitting(false);
  };

  const leverageInfo = effectiveLeverageInfo;

  let pnl = 0;
  let pnlPercent = 0;
  if (held > 0 && avgPrice > 0) {
    if (side === 'LONG') {
      pnl = (selectedStock.price - avgPrice) * held;
    } else {
      pnl = (avgPrice - selectedStock.price) * held;
    }
    const actualMargin = (avgPrice * held) / posLeverage;
    pnlPercent = (pnl / actualMargin) * 100; // ROE
  }
  const pnlColor = pnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]';
  const pnlSign = pnl >= 0 ? '+' : '';

  // Synchronize preview TP/SL and limit/stop line with parent chart
  useEffect(() => {
    const isLimitOrStop = orderType === 'limit' || orderType === 'stop';
    const limitPriceNum = parseFloat(limitPriceStr) || selectedStock.price;
    const currentSide = held > 0 && side ? side : 'LONG';
    const tpNum = tp ? parseFloat(tp) : undefined;
    const slNum = sl ? parseFloat(sl) : undefined;

    let newTpsl: any = null;
    if (isLimitOrStop) {
      newTpsl = {
        enabled: true,
        orderPrice: limitPriceNum,
        orderType: orderType === 'limit' ? 'LIMIT' : 'STOP',
        tp: showTPSL && tpNum !== undefined && !isNaN(tpNum) ? tpNum : undefined,
        sl: showTPSL && slNum !== undefined && !isNaN(slNum) ? slNum : undefined,
        side: currentSide,
        quantity: held > 0 ? held : undefined,
        actualQty: actualQty > 0 ? actualQty : undefined
      };
    } else if (showTPSL) {
      newTpsl = {
        enabled: true,
        tp: (tpNum !== undefined && !isNaN(tpNum)) ? tpNum : undefined,
        sl: (slNum !== undefined && !isNaN(slNum)) ? slNum : undefined,
        side: currentSide,
        quantity: held > 0 ? held : undefined,
        actualQty: actualQty > 0 ? actualQty : undefined
      };
    }

    const newTpslStr = JSON.stringify(newTpsl);
    if (prevTpslRef.current !== newTpslStr) {
      prevTpslRef.current = newTpslStr;
      onPreviewTPSLChange?.(newTpsl);
    }
  }, [showTPSL, tp, sl, side, held, orderType, limitPriceStr, actualQty, selectedStock.price, onPreviewTPSLChange]);

  if (!isExpanded) {
    return (
      <div className="w-10 flex flex-col bg-white dark:bg-[#131722] border-l border-[#e6e8ea] dark:border-[#2a2e39] flex-1 min-h-0 overflow-hidden items-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-4 flex items-center justify-center text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#f0f3fa] dark:hover:bg-[#1e222d] transition-colors"
          title="Mở bảng đặt lệnh"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 border-r border-[#e6e8ea] dark:border-[#2a2e39] w-0"></div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[280px] flex flex-col bg-white dark:bg-[#131722] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] flex-1 min-h-0 overflow-hidden text-[#1e2329] dark:text-[#d1d4dc]">
      {/* Header Tabs Sổ lệnh / Giao dịch */}
      <div className="flex items-center border-b border-[#e6e8ea] dark:border-[#2a2e39] shrink-0">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-3 text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#f0f3fa] dark:hover:bg-[#1e222d] transition-colors border-r border-[#e6e8ea] dark:border-[#2a2e39]"
          title="Thu gọn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center">
          <button
            onClick={() => setActiveSidebarTab('orderbook')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeSidebarTab === 'orderbook' ? 'text-blue-600 dark:text-white border-b-2 border-blue-500' : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
          >
            {t('panel.orderBook', 'Sổ lệnh')}
          </button>
          <button
            onClick={() => setActiveSidebarTab('trade')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeSidebarTab === 'trade' ? 'text-blue-600 dark:text-white border-b-2 border-blue-500' : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc]'}`}
          >
            {t('panel.trade', 'Giao dịch')}
          </button>
        </div>
        <button className="p-3 text-[#787b86] hover:text-[#1e2329] dark:hover:text-[#d1d4dc] hover:bg-[#f0f3fa] dark:hover:bg-[#1e222d] transition-colors">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {activeSidebarTab === 'orderbook' ? (
        <div className="flex-1 overflow-y-auto min-h-[120px]">
          <OrderBook symbol={selectedStock.symbol} currentPrice={selectedStock.price} isUp={selectedStock.type === 'up'} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-[120px]">
          <div className="flex items-center px-2 py-2 border-b border-[#e6e8ea] dark:border-[#2a2e39] text-[10px] uppercase tracking-wider text-[#787b86] font-semibold">
            <div className="flex-1 ml-1">Symbol</div>
            <div className="w-20 text-right">Price</div>
            <div className="w-14 text-right">Chg%</div>
          </div>

          {STOCKS.map(stock => (
            <div
              key={stock.symbol}
              onClick={() => { onStockSelect(stock); }}
              className={`flex items-center px-3 py-2 text-xs cursor-pointer transition-colors border-b border-[#e6e8ea] dark:border-[#2a2e39]/40 ${selectedStock.symbol === stock.symbol
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                : 'hover:bg-[#f0f3fa] dark:hover:bg-[#1e222d]'
                }`}
            >
              <div className="flex-1 flex flex-col">
                <span className="text-[#1e2329] dark:text-[#d1d4dc] font-semibold">{stock.symbol}</span>
                <span className="text-[#787b86] text-[10px]">{stock.name}</span>
              </div>
              <div className={`w-20 text-right font-mono font-semibold ${stock.type === 'up' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {stock.price >= 100 ? stock.price.toLocaleString('vi-VN') : stock.price.toFixed(getPricePrecision(stock.price))}
              </div>
              <div className={`w-14 text-right flex items-center justify-end gap-0.5 ${stock.type === 'up' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {stock.type === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(stock.percent).toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Entry */}
      {user ? (
        challengeBadge ? (
        <div className="border-t border-[#e6e8ea] dark:border-[#2a2e39] p-3 flex flex-col gap-2.5 shrink overflow-y-auto max-h-[55vh] lg:max-h-[60vh] bg-[#f8f9fa] dark:bg-[#131722]">
          {/* Balance row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#787b86]">
              <Wallet className="w-3.5 h-3.5" />
              <span>{t('order.balance', 'Số dư')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${balance <= 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {onResetWallet && (
                <button
                  type="button"
                  onClick={onResetWallet}
                  title="Khôi phục lại $100,000 USD khi tổng tài sản (tiền mặt + lệnh mở) dưới $5,000 USD (Tối đa 1 lần/ngày, 4 lần/tuần)"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset $100k</span>
                </button>
              )}
            </div>
          </div>

          {/* Cảnh báo khi tổng tài sản thực tế dưới $5,000 */}
          {((totalEquity !== undefined ? totalEquity : balance) < 5000) && onResetWallet && (
            <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-600 dark:text-rose-400 flex items-center justify-between gap-2">
              <span className="leading-tight">{t('order.restoreDesc', '⚠️ Tổng tài sản còn dưới $5,000 USD! Bạn có thể khôi phục lại $100,000 USD (Tối đa 1 lần/ngày, 4 lần/tuần).')}</span>
              <button
                type="button"
                onClick={onResetWallet}
                className="shrink-0 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
              >
                {t('order.restore', 'Khôi phục')}
              </button>
            </div>
          )}

          {/* Order type */}
          <div className="flex gap-1.5 text-xs font-semibold pb-1">
            <button
              onClick={() => { if (!isEditing) setOrderType('market'); }}
              className={`flex-1 py-1.5 rounded uppercase transition-colors ${orderType === 'market'
                ? 'bg-blue-600 text-white'
                : 'bg-[#f0f3fa] dark:bg-[#1e222d] text-[#787b86] ' + (isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#1e2329] dark:hover:text-[#d1d4dc]')
                }`}
            >
              {t('order.market', 'Thị trường')}
            </button>
            <button
              onClick={() => {
                if (!isEditing) {
                  setOrderType('limit');
                  if (!limitPriceStr || parseFloat(limitPriceStr) <= 0) {
                    setLimitPriceStr(selectedStock.price.toString());
                  }
                }
              }}
              className={`flex-1 py-1.5 rounded uppercase transition-colors ${orderType === 'limit'
                ? 'bg-blue-600 text-white'
                : 'bg-[#f0f3fa] dark:bg-[#1e222d] text-[#787b86] ' + (isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#1e2329] dark:hover:text-[#d1d4dc]')
                }`}
            >
              {t('order.limit', 'Limit')}
            </button>
            <button
              onClick={() => {
                if (!isEditing) {
                  setOrderType('stop');
                  if (!limitPriceStr || parseFloat(limitPriceStr) <= 0) {
                    setLimitPriceStr(selectedStock.price.toString());
                  }
                }
              }}
              className={`flex-1 py-1.5 rounded uppercase transition-colors ${orderType === 'stop'
                ? 'bg-blue-600 text-white'
                : 'bg-[#f0f3fa] dark:bg-[#1e222d] text-[#787b86] ' + (isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#1e2329] dark:hover:text-[#d1d4dc]')
                }`}
            >
              {t('order.stop', 'Stop')}
            </button>
          </div>

          {/* QUY MÔ LỆNH - Sizing Mode Selector */}
          <div className="flex items-center justify-between relative mt-0.5">
            <span className="text-[10px] text-[#787b86] uppercase tracking-wider font-semibold">
              {t('order.orderSize', 'QUY MÔ LỆNH')}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSizingDropdownOpen(!sizingDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-[#1e222d] hover:bg-slate-100 dark:hover:bg-[#2a2e39] text-xs font-semibold text-[#1e2329] dark:text-[#d1d4dc] border border-[#e6e8ea] dark:border-[#2a2e39] transition-all cursor-pointer shadow-xs"
              >
                <span>
                  {sizingMode === 'qty' ? t('order.qty', 'Khối lượng') : sizingMode === 'amount' ? t('order.amount', 'Số tiền') : t('order.percentBalance', '% số dư')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#787b86] transition-transform ${sizingDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sizingDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-xl z-50 py-1 text-xs"
                  onClick={() => setSizingDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setSizingMode('qty')}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#2a2e39] transition-colors cursor-pointer ${sizingMode === 'qty' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                      }`}
                  >
                    <span>{t('order.qty', 'Khối lượng')}</span>
                    {sizingMode === 'qty' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizingMode('amount')}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#2a2e39] transition-colors cursor-pointer ${sizingMode === 'amount' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                      }`}
                  >
                    <span>{t('order.amount', 'Số tiền')}</span>
                    {sizingMode === 'amount' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizingMode('percent')}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-[#2a2e39] transition-colors cursor-pointer ${sizingMode === 'percent' ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-[#1e2329] dark:text-[#d1d4dc]'
                      }`}
                  >
                    <span>{t('order.percentBalance', '% số dư')}</span>
                    {sizingMode === 'percent' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Price & Input Mode Inputs */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[#787b86] uppercase tracking-wider font-medium">
                {isEditing ? t('order.entryPrice', 'Giá vào lệnh') : `${t('order.price', 'Giá')} ${orderType === 'market' ? `(${t('order.market', 'Thị trường')})` : '(USD)'}`}
              </label>
              {isEditing ? (
                <div className="bg-[#f0f3fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#787b86] font-mono cursor-not-allowed">
                  {avgPrice >= 100 ? avgPrice.toLocaleString('en-US') : avgPrice.toFixed(getPricePrecision(avgPrice))}
                </div>
              ) : orderType === 'market' ? (
                <div className="bg-[#f0f3fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#787b86] font-mono cursor-not-allowed">
                  {selectedStock.price >= 100 ? selectedStock.price.toLocaleString('en-US') : selectedStock.price.toFixed(getPricePrecision(selectedStock.price))}
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <input
                    type="number"
                    disabled={isEditing}
                    value={limitPriceStr}
                    placeholder="VD: 64500"
                    onChange={e => setLimitPriceStr(e.target.value)}
                    className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-blue-500 transition-colors w-full disabled:opacity-50"
                  />
                  {!isEditing && (
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 italic">
                      {t('order.dragToSelectPrice')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] text-[#787b86] uppercase tracking-wider font-medium">
                {sizingMode === 'qty' ? lotInputLabel : sizingMode === 'amount' ? `${t('order.amount', 'Số tiền')} ($ USD)` : t('order.percentBalance', '% Số dư')}
              </label>
              {isEditing ? (
                <div className="bg-[#f0f3fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#787b86] font-mono cursor-not-allowed">
                  {held.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              ) : sizingMode === 'qty' ? (
                <input
                  type="number"
                  step={selectedStock.market === 'Tiền điện tử (Crypto)' ? "0.01" : selectedStock.market === 'Cổ phiếu' ? "1" : "0.01"}
                  min="0.0001"
                  value={lotStr}
                  onChange={e => handleLotChange(e.target.value)}
                  className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-blue-500 transition-colors w-full"
                />
              ) : sizingMode === 'amount' ? (
                <input
                  type="number"
                  min="1"
                  step="10"
                  placeholder="VD: 5000"
                  value={amountStr}
                  onChange={e => handleAmountChange(e.target.value)}
                  className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-blue-500 transition-colors w-full"
                />
              ) : (
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="100"
                    value={percentVal || ''}
                    onChange={e => handlePercentInput(e.target.value)}
                    className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-3 py-1.5 text-sm text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-blue-500 transition-colors w-full pr-7"
                  />
                  <span className="absolute right-2.5 text-xs text-[#787b86] pointer-events-none font-bold">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick percent buttons: [25%] [50%] [75%] [100%] */}
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className={`py-1 rounded text-xs font-semibold font-mono transition-all cursor-pointer ${percentVal === pct
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#f0f3fa] dark:bg-[#1e222d] text-[#787b86] hover:text-[#1e2329] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#2a2e39]'
                  }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Estimated helper info row */}
          {sizingMode !== 'qty' ? (
            <div className="flex items-center justify-between text-[11px] bg-blue-500/5 dark:bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              <span className="text-[#787b86]">{t('order.estQty', 'Khối lượng dự kiến:')}</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {actualQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {assetUnit}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] bg-[#f0f3fa] dark:bg-[#1e222d] px-2.5 py-1 rounded border border-[#e6e8ea] dark:border-[#2a2e39]">
              <span className="text-[#787b86]">{t('order.marginUsed', 'Dùng vốn (Ký quỹ):')}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${requiredMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Custom Leverage Slider Inline OR Spot Mode Notification */}
          {isSpot ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#f0f3fa] dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] text-xs">
              <span className="text-[10px] text-[#787b86] uppercase font-semibold whitespace-nowrap shrink-0">
                {t('order.tradingMode', 'Chế độ giao dịch')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap shrink-0">
                {t('order.spotMode', 'Spot (1X · Không đòn bẩy)')}
              </span>
            </div>
          ) : (
            <div className={`flex flex-col gap-1 mt-0.5 ${isEditing ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-[#787b86] uppercase tracking-wider">{t('order.leverage', 'Đòn bẩy')}</label>
                  {challengeBadge && (
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1 py-0.2 rounded font-medium">
                      {challengeBadge.includes('Tối đa theo sàn') ? `${challengeBadge} (${leverageInfo.max}X)` : `${challengeBadge} · Tối đa ${leverageInfo.max}X`}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-[#1e2329] dark:text-white">{isEditing ? ((posLeverage % 1 !== 0) ? posLeverage.toFixed(2) : posLeverage) : leverage}X</span>
              </div>

              <div className="relative mt-2 mb-5 mx-1">
                <input
                  type="range"
                  min="1"
                  max={leverageInfo.max}
                  value={isEditing ? posLeverage : leverage}
                  disabled={isEditing}
                  onChange={e => setLev(parseInt(e.target.value))}
                  className="w-full h-[3px] appearance-none cursor-pointer relative z-10 bg-transparent custom-leverage-slider m-0 p-0 block disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, var(--lev-fill) ${(((isEditing ? posLeverage : leverage) - 1) / (leverageInfo.max - 1 || 1)) * 100}%, var(--lev-bg) ${(((isEditing ? posLeverage : leverage) - 1) / (leverageInfo.max - 1 || 1)) * 100}%)`
                  }}
                />

                {/* Markers layer */}
                <div className="absolute top-[1.5px] left-[7px] right-[7px] pointer-events-none z-20">
                  {/* Base 1x */}
                  <div
                    className="absolute top-0 -translate-y-[14px] -translate-x-1/2 flex flex-col items-center justify-start cursor-pointer pointer-events-auto group w-[30px] h-[40px]"
                    style={{ left: '0%' }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLev(1); }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1e2329] dark:bg-white transition-transform group-hover:scale-125 shrink-0 mt-[10px]" />
                    <span className="text-[10px] font-semibold text-[#1e2329] dark:text-white whitespace-nowrap mt-1">1X</span>
                  </div>

                  {leverageInfo.marks.map(m => {
                    const percent = ((m - 1) / (leverageInfo.max - 1 || 1)) * 100;
                    const isActive = (isEditing ? posLeverage : leverage) >= m;
                    return (
                      <div
                        key={m}
                        className="absolute top-0 -translate-y-[14px] -translate-x-1/2 flex flex-col items-center justify-start cursor-pointer pointer-events-auto group w-[40px] h-[40px]"
                        style={{ left: `${percent}%` }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLev(m); }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125 shrink-0 mt-[10px] ${isActive ? 'bg-[#1e2329] dark:bg-white' : 'bg-[#e6e8ea] dark:bg-[#2a2e39]'}`} />
                        <span className={`text-[10px] font-semibold whitespace-nowrap mt-1 transition-colors ${isActive ? 'text-[#1e2329] dark:text-[#d1d4dc] group-hover:text-black dark:group-hover:text-white' : 'text-[#787b86] group-hover:text-[#1e2329] dark:group-hover:text-white'}`}>
                          {m}X
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TP / SL Toggle */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="toggle-tpsl"
              checked={showTPSL}
              disabled={isEditing}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setShowTPSL(isChecked);
                if (isChecked) {
                  const refPrice = orderType === 'limit' && parseFloat(limitPriceStr) > 0
                    ? parseFloat(limitPriceStr)
                    : (held > 0 && avgPrice > 0 ? avgPrice : selectedStock.price);
                  const precision = getPricePrecision(refPrice);
                  const currentSide = held > 0 && side ? side : 'LONG';

                  let newTp = tp;
                  let newSl = sl;
                  if (!newTp) {
                    const tpFactor = currentSide === 'LONG' ? 1.05 : 0.95;
                    newTp = (refPrice * tpFactor).toFixed(precision);
                    setTp(newTp);
                  }
                  if (!newSl) {
                    const slFactor = currentSide === 'LONG' ? 0.97 : 1.03;
                    newSl = (refPrice * slFactor).toFixed(precision);
                    setSl(newSl);
                  }
                } else {
                  setTp('');
                  setSl('');
                }
              }}
              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="toggle-tpsl" className="text-xs text-[#787b86] cursor-pointer hover:text-[#1e2329] dark:hover:text-[#d1d4dc] transition-colors">
              {t('order.setupTPSL', 'Thiết lập Chốt lời / Cắt lỗ (TP/SL)')}
            </label>
          </div>

          {/* TP / SL inputs */}
          {showTPSL && (() => {
            const baseRefPrice = held > 0 && avgPrice > 0 ? avgPrice : (orderType === 'limit' && parseFloat(limitPriceStr) > 0 ? parseFloat(limitPriceStr) : selectedStock.price);
            const sliderPrecision = getPricePrecision(baseRefPrice);
            const sliderStep = baseRefPrice > 1000 ? '1' : baseRefPrice > 10 ? '0.1' : Math.pow(10, -sliderPrecision).toString();
            const calcSide = held > 0 && side ? side : 'LONG';
            const currentQty = held > 0 ? held : actualQty;
            const currentLeverage = isEditing ? posLeverage : leverage;
            const initialMargin = (baseRefPrice * currentQty) / currentLeverage;

            const tpNum = tp ? parseFloat(tp) : null;
            const slNum = sl ? parseFloat(sl) : null;

            let estTpPnl = 0;
            let estTpRoe = 0;
            if (tpNum && currentQty > 0) {
              estTpPnl = calcSide === 'LONG' ? (tpNum - baseRefPrice) * currentQty : (baseRefPrice - tpNum) * currentQty;
              estTpRoe = initialMargin > 0 ? (estTpPnl / initialMargin) * 100 : 0;
            }

            let estSlPnl = 0;
            let estSlRoe = 0;
            if (slNum && currentQty > 0) {
              estSlPnl = calcSide === 'LONG' ? (slNum - baseRefPrice) * currentQty : (baseRefPrice - slNum) * currentQty;
              estSlRoe = initialMargin > 0 ? (estSlPnl / initialMargin) * 100 : 0;
            }

            let rrRatioStr = '-';
            if (tpNum && slNum && Math.abs(estSlPnl) > 0) {
              const rr = Math.abs(estTpPnl / estSlPnl);
              rrRatioStr = `1 : ${rr.toFixed(2)}`;
            }

            return (
              <div className="flex flex-col gap-2 border-t border-[#e6e8ea] dark:border-[#2a2e39]/50 pt-2 mt-1">
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-[#089981] uppercase tracking-wider font-semibold">{t('order.takeProfit', 'Chốt lời')} (TP)</label>
                    </div>
                    <input
                      type="number"
                      value={tp}
                      placeholder="Tùy chọn"
                      onChange={e => setTp(e.target.value)}
                      className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-2.5 py-1.5 text-xs text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-[#089981] transition-colors w-full placeholder:text-[#787b86]"
                    />
                    {/* Quick presets for TP */}
                    <div className="flex gap-1 mt-0.5">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const factor = calcSide === 'LONG' ? (1 + pct / 100) : (1 - pct / 100);
                            setTp((baseRefPrice * factor).toFixed(sliderPrecision));
                          }}
                          className="flex-1 text-[9px] font-mono py-0.5 bg-[#089981]/10 hover:bg-[#089981]/20 text-[#089981] rounded border border-[#089981]/20 transition-colors"
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                    {tpNum !== null && (
                      <div className={`text-[10px] font-mono font-bold mt-0.5 ${estTpPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {estTpPnl >= 0 ? '+' : ''}${estTpPnl.toFixed(2)} ({estTpRoe >= 0 ? '+' : ''}{estTpRoe.toFixed(1)}%)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-[#f23645] uppercase tracking-wider font-semibold">{t('order.stopLoss', 'Cắt lỗ')} (SL)</label>
                    </div>
                    <input
                      type="number"
                      value={sl}
                      placeholder="Tùy chọn"
                      onChange={e => setSl(e.target.value)}
                      className="bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded px-2.5 py-1.5 text-xs text-[#1e2329] dark:text-white font-mono focus:outline-none focus:border-[#f23645] transition-colors w-full placeholder:text-[#787b86]"
                    />
                    {/* Quick presets for SL */}
                    <div className="flex gap-1 mt-0.5">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const factor = calcSide === 'LONG' ? (1 - pct / 100) : (1 + pct / 100);
                            setSl((baseRefPrice * factor).toFixed(sliderPrecision));
                          }}
                          className="flex-1 text-[9px] font-mono py-0.5 bg-[#f23645]/10 hover:bg-[#f23645]/20 text-[#f23645] rounded border border-[#f23645]/20 transition-colors"
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                    {slNum !== null && (
                      <div className={`text-[10px] font-mono font-bold mt-0.5 ${estSlPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {estSlPnl >= 0 ? '+' : ''}${estSlPnl.toFixed(2)} ({estSlRoe >= 0 ? '+' : ''}{estSlRoe.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                </div>

                {tpNum !== null && slNum !== null && (
                  <div className="flex items-center justify-between bg-[#1e222d]/50 px-2 py-1 rounded text-[10px] border border-[#2a2e39]">
                    <span className="text-[#787b86]">{t('order.ratioRR', 'Tỷ lệ R:R (Lợi nhuận/Rủi ro)')}</span>
                    <span className="font-mono font-bold text-amber-400">{rrRatioStr}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Summary Box */}
          <div className="bg-[#f0f3fa] dark:bg-[#1a1e29] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg p-2.5 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-[#787b86]">
              <span>{t('order.balance', 'Số dư')}</span>
              <span className="font-mono font-medium text-[#1e2329] dark:text-[#d1d4dc]">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#787b86]">
              <span>{t('order.marginUsed', 'Sử dụng vốn').replace(' (Ký quỹ):', '')}</span>
              <span className="font-mono font-medium text-[#1e2329] dark:text-[#d1d4dc]">
                {balance > 0 ? ((requiredMargin / balance) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[#787b86]">
              <span>{t('order.leverage', 'Đòn bẩy')}</span>
              <span className="font-mono font-medium text-[#1e2329] dark:text-[#d1d4dc]">
                {isSpot ? 'Spot (1X)' : `${currentLeverage}X`}
              </span>
            </div>

            <div className="h-px bg-[#e6e8ea] dark:bg-[#2a2e39] my-0.5" />

            <div className="flex items-center justify-between font-bold">
              <span className="text-[#1e2329] dark:text-white">{t('order.margin', 'Ký quỹ')}</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                ${requiredMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between font-semibold">
              <span className="text-[#787b86]">{t('order.positionValue', 'Giá trị vị thế')}</span>
              <span className="font-mono text-[#1e2329] dark:text-white">
                ${(actualQty * pTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#787b86] pt-0.5">
              <span>{t('order.actualQty', 'Khối lượng thực tế')}</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {actualQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {assetUnit}
              </span>
            </div>
          </div>

          {/* Buttons */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={onCancelEdit}
                disabled={isSubmitting}
                className="flex-1 bg-[#2a2e39] hover:bg-[#363a45] text-white font-bold py-2.5 rounded text-sm transition-all"
              >
                {t('order.cancelEdit', 'HỦY SỬA')}
              </button>
              <button
                onClick={handleUpdateTPSL}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 rounded text-sm transition-all"
              >
                {t('order.saveUpdate', 'LƯU CẬP NHẬT')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleTrade('buy')}
                disabled={isSubmitting}
                className="flex-1 bg-[#089981] hover:bg-[#089981]/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded text-sm transition-all"
              >
                {t('order.btnBuy', 'LONG')}
              </button>
              <button
                onClick={() => handleTrade('sell')}
                disabled={isSubmitting}
                className="flex-1 bg-[#f23645] hover:bg-[#f23645]/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded text-sm transition-all"
              >
                {t('order.btnSell', 'SHORT')}
              </button>
            </div>
          )}

          {/* Toast notification */}
          {toast && (
            <div className={`text-xs px-3 py-2 rounded text-center font-medium transition-all ${toast.ok ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}>
              {toast.msg}
            </div>
          )}
        </div>
        ) : null
      ) : (
        <div className="border-t border-[#e6e8ea] dark:border-[#2a2e39] p-6 flex flex-col items-center justify-center text-center gap-4 shrink-0 bg-white dark:bg-[#131722]">
          <Wallet className="w-8 h-8 text-[#787b86] dark:text-[#434651]" />
          <p className="text-[#787b86] text-xs">Vui lòng đăng nhập để xem số dư và thực hiện giao dịch.</p>
          <button
            onClick={() => login()}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold py-2.5 rounded transition-all shadow-sm"
          >
            Đăng nhập
          </button>
        </div>
      )}
    </div>
  );
};

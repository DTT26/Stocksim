import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, MoreHorizontal, ChevronDown, Check, List, Trash2, Edit2, Copy, Share2 } from 'lucide-react';
import { STOCKS, type Stock } from '../data';
import { AssetAvatar } from './AssetAvatar';
import { useMarketStore } from '../../../stores/useMarketStore';
import { SymbolSearchModal } from './SymbolSearchModal';
import { AuthOverlay } from './AuthOverlay';
import { useAuth } from '../../../contexts/AuthContext';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useI18n } from '../../../contexts/I18nContext';

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

interface WatchlistPanelProps {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  onWatchlistChange: (id: string) => void;
  onUpdateWatchlist: (id: string, newSymbols: string[]) => void;
  onCreateWatchlist: (name: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onRenameWatchlist: (id: string, newName: string) => void;
  onSelectStock: (stock: Stock) => void;
  currentSymbol?: string;
}

export const WatchlistPanel = ({
  watchlists,
  activeWatchlistId,
  onWatchlistChange,
  onUpdateWatchlist,
  onCreateWatchlist,
  onDeleteWatchlist,
  onRenameWatchlist,
  onSelectStock,
  currentSymbol
}: WatchlistPanelProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const stocks = useMarketStore(state => state.stocks);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; listId: string | null }>({
    isOpen: false,
    listId: null,
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeWatchlist = useMemo(() => {
    return watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
  }, [watchlists, activeWatchlistId]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSymbol = (symbol: string) => {
    if (!activeWatchlist) return;
    const newSymbols = activeWatchlist.symbols.includes(symbol)
      ? activeWatchlist.symbols.filter(s => s !== symbol)
      : [...activeWatchlist.symbols, symbol];
    onUpdateWatchlist(activeWatchlist.id, newSymbols);
  };

  const handleCreateNew = () => {
    const name = window.prompt('Nhập tên danh sách mới:');
    if (name && name.trim()) {
      onCreateWatchlist(name.trim());
    }
    setIsDropdownOpen(false);
  };

  const handleRename = () => {
    if (!activeWatchlist) return;
    const name = window.prompt('Nhập tên mới:', activeWatchlist.name);
    if (name && name.trim()) {
      onRenameWatchlist(activeWatchlist.id, name.trim());
    }
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (!activeWatchlist) return;
    setConfirmState({ isOpen: true, listId: activeWatchlist.id });
    setIsMenuOpen(false);
  };

  return (
    <div className="w-full lg:w-[300px] lg:border-l border-[#e6e8ea] dark:border-[#2a2e39] flex flex-col bg-white dark:bg-[#131722] shrink-0 h-full relative">
      {!user ? (
        <AuthOverlay
          icon={<List className="w-8 h-8" />}
          title={t('auth.watchlistTitle', 'Danh sách theo dõi')}
          subtitle={t('auth.watchlistSubtitle', 'Theo dõi các mã giao dịch yêu thích tại một nơi')}
          features={[
            t('auth.feature1', 'Giá và biến động theo thời gian thực'),
            t('auth.feature2', 'Đồng bộ danh sách theo dõi trên mọi thiết bị của bạn'),
            t('auth.feature3', 'Gắn cờ màu và tự sắp xếp'),
            t('auth.feature4', 'Nhiều watchlist')
          ]}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 shrink-0 border-b border-[#e6e8ea] dark:border-transparent">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 hover:bg-[#f0f1f3] dark:hover:bg-[#2a2e39] py-1.5 px-2 rounded transition-colors font-bold text-lg text-[#1e2329] dark:text-white"
              >
                {(activeWatchlist?.name === 'Danh sách của tôi' || activeWatchlist?.name === 'My Watchlist') ? t('watchlist.myList', 'Danh sách của tôi') : (activeWatchlist?.name || 'Danh sách')}
                <ChevronDown className="w-4 h-4 text-[#787b86]" />
              </button>

              {/* List Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#787b86] uppercase tracking-wider">
                    {t('watchlist.recent', 'Gần đây')}
                  </div>
                  {watchlists.map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        onWatchlistChange(w.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        activeWatchlist?.id === w.id 
                          ? 'bg-[#089981]/10 dark:bg-[#089981]/20 text-[#089981]' 
                          : 'text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {activeWatchlist?.id === w.id && <Check className="w-4 h-4" />}
                        <span className={activeWatchlist?.id !== w.id ? 'pl-6' : ''}>
                          {(w.name === 'Danh sách của tôi' || w.name === 'My Watchlist') ? t('watchlist.myList', 'Danh sách của tôi') : w.name}
                        </span>
                      </span>
                    </button>
                  ))}
                  <div className="h-px bg-[#e6e8ea] dark:bg-[#2a2e39] my-1"></div>
                  <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50 transition-colors pl-9"
                  >
                    <Plus className="w-4 h-4 text-[#787b86]" />
                    Tạo danh sách mới...
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[#787b86]">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-1 hover:text-[#1e2329] dark:hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 hover:text-[#1e2329] dark:hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                {/* Options Dropdown */}
                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#1e222d] border border-[#e6e8ea] dark:border-[#2a2e39] rounded-lg shadow-xl py-1.5 z-50">
                    <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50">
                      Dạng bảng
                      <div className="w-8 h-4 bg-[#e6e8ea] dark:bg-[#2a2e39] rounded-full relative">
                        <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-[1px] left-[1px] shadow-sm"></div>
                      </div>
                    </button>
                    <div className="h-px bg-[#e6e8ea] dark:bg-[#2a2e39] my-1.5"></div>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50">
                      <Share2 className="w-4 h-4 text-[#787b86]" /> Chia sẻ danh sách
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50">
                      <Copy className="w-4 h-4 text-[#787b86]" /> Tạo bản sao...
                    </button>
                    <button onClick={handleRename} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/50">
                      <Edit2 className="w-4 h-4 text-[#787b86]" /> Đổi tên
                    </button>
                    <div className="h-px bg-[#e6e8ea] dark:bg-[#2a2e39] my-1.5"></div>
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#f23645] hover:bg-[#f23645]/10">
                      <Trash2 className="w-4 h-4" /> Xóa danh sách
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Symbol List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
            {/* Table Header */}
            <div className="flex items-center px-4 py-2 text-[10px] font-bold text-[#787b86] uppercase">
              <div className="w-[120px]">{t('watchlist.symbol', 'Mã giao dịch')}</div>
              <div className="flex-1 text-right">{t('watchlist.price', 'Giá')}</div>
              <div className="w-16 text-right">{t('watchlist.change', 'Thay đổi')}</div>
            </div>
            
            {activeWatchlist?.symbols.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center mt-10">
                <div className="w-16 h-16 rounded-full bg-[#f5f5f5] dark:bg-[#1e222d] flex items-center justify-center mb-4">
                  <List className="w-8 h-8 text-[#a0a3af] dark:text-[#434651]" />
                </div>
                <p className="text-sm text-[#787b86] mb-4">Danh sách theo dõi trống.</p>
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
                >
                  Thêm mã
                </button>
              </div>
            ) : (
              activeWatchlist?.symbols.map(symbol => {
                const stock = stocks.find(s => s.symbol === symbol);
                if (!stock) return null;
                
                const isSelected = currentSymbol === symbol;
                const priceColor = stock.type === 'up' ? 'text-[#089981]' : 'text-[#f23645]';

                return (
                  <div 
                    key={symbol}
                    onClick={() => onSelectStock(stock)}
                    className={`flex items-center px-3 py-2 cursor-pointer border-l-2 transition-colors gap-2.5 ${
                      isSelected 
                        ? 'border-blue-500 bg-[#f5f5f5] dark:bg-[#1e222d]' 
                        : 'border-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]/30'
                    }`}
                  >
                    <AssetAvatar stock={stock} size="sm" showExchangeBadge={true} />
                    <div className="w-[100px] flex flex-col min-w-0">
                      <span className="font-bold text-[#1e2329] dark:text-[#d1d4dc] text-sm truncate">{stock.symbol}</span>
                      <span className="text-[10px] text-[#787b86] truncate max-w-full">{stock.market === 'Tiền điện tử (Crypto)' ? t('market.crypto', 'Tiền điện tử (Crypto)') : stock.market}</span>
                    </div>
                    <div className="flex-1 text-right font-mono text-sm font-medium text-[#1e2329] dark:text-[#d1d4dc]">
                      {stock.price.toLocaleString('vi-VN', { maximumFractionDigits: stock.price < 10 ? 4 : 2 })}
                    </div>
                    <div className="w-16 text-right font-mono text-xs font-semibold">
                      <span className={`${priceColor}`}>
                        {stock.percent > 0 ? '+' : ''}{stock.percent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <SymbolSearchModal 
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelect={onSelectStock}
            watchlistMode={true}
            activeWatchlistSymbols={activeWatchlist?.symbols || []}
            onToggleWatchlist={handleToggleSymbol}
          />
        </>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, listId: null })}
        onConfirm={() => {
          if (confirmState.listId) {
            onDeleteWatchlist(confirmState.listId);
          }
        }}
        title="Xóa danh sách"
        message="Bạn có chắc chắn muốn xóa danh sách theo dõi này? Thao tác này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
};

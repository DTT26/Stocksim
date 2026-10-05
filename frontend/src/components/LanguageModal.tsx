import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'VI', name: 'Tiếng Việt' },
  { code: 'RU', name: 'Русский' },
  { code: 'ZH', name: '繁體中文' },
  { code: 'JA', name: '日本語' },
  { code: 'ES', name: 'Español (International)' },
  { code: 'ID', name: 'Bahasa Indonesia' },
  { code: 'PT', name: 'Português (International)' },
  { code: 'TH', name: 'ภาษาไทย' },
  { code: 'AR', name: 'العربية' },
  { code: 'FR', name: 'Français (International)' },
  { code: 'UK', name: 'Українська' },
  { code: 'UR', name: 'اردو' },
];

const CURRENCIES = [
  { code: 'AED', symbol: 'د.إ' },
  { code: 'ALL', symbol: 'L' },
  { code: 'AMD', symbol: 'դ' },
  { code: 'ARS', symbol: 'ARS$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'AZN', symbol: '₼' },
  { code: 'BAM', symbol: 'KM' },
  { code: 'BDT', symbol: '৳' },
  { code: 'BGN', symbol: 'лв' },
  { code: 'BHD', symbol: 'د.ب.' },
  { code: 'BMD', symbol: '$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'USD', symbol: '$' },
  { code: 'VND', symbol: '₫' },
  { code: 'EUR', symbol: '€' },
];

export const LanguageModal = ({ isOpen, onClose, currentLanguage, onSelectLanguage }: LanguageModalProps) => {
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e2329] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[75vh] max-h-[800px] border border-[#e6e8ea] dark:border-[#2a2e39] transition-colors overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-6 pt-2 border-b border-[#e6e8ea] dark:border-[#2a2e39] shrink-0">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('language')}
              className={`py-4 text-lg font-bold transition-colors border-b-2 ${
                activeTab === 'language' 
                  ? 'text-[#1e2329] dark:text-white border-[#1e2329] dark:border-white' 
                  : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white border-transparent'
              }`}
            >
              {currentLanguage === 'EN' ? 'Language' : 'Ngôn ngữ'}
            </button>
            <button
              onClick={() => setActiveTab('currency')}
              className={`py-4 text-lg font-bold transition-colors border-b-2 ${
                activeTab === 'currency' 
                  ? 'text-[#1e2329] dark:text-white border-[#1e2329] dark:border-white' 
                  : 'text-[#787b86] hover:text-[#1e2329] dark:hover:text-white border-transparent'
              }`}
            >
              {currentLanguage === 'EN' ? 'Currency' : 'Loại tiền'}
            </button>
          </div>
          <button 
            onClick={onClose}
            className="text-[#787b86] hover:text-[#1e2329] dark:hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search (Only for Currency Tab in the provided design, but we can keep it inside tab content) */}
        {activeTab === 'currency' && (
          <div className="px-6 py-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a3af] dark:text-[#787b86]" />
              <input 
                type="text"
                placeholder={currentLanguage === 'EN' ? 'Search currency...' : 'Tìm kiếm'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f5f5f5] dark:bg-[#131722] text-[#1e2329] dark:text-white pl-12 pr-4 py-3 rounded-full outline-none border border-transparent focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
          {activeTab === 'language' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`flex items-center p-3 rounded-lg transition-all text-left ${
                    currentLanguage === lang.code 
                      ? 'bg-[#f5f5f5] dark:bg-[#2a2e39] text-[#1e2329] dark:text-white font-medium' 
                      : 'text-[#1e2329] dark:text-[#d1d4dc] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39]'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 pb-6">
              {filteredCurrencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    // For now, we can just close since we don't have a global currency state
                    onClose();
                  }}
                  className="flex items-center text-left py-2 hover:bg-[#f5f5f5] dark:hover:bg-[#2a2e39] px-3 rounded-lg transition-colors -ml-3"
                >
                  <span className="text-[#1e2329] dark:text-[#d1d4dc] font-medium text-sm">
                    {c.code}-{c.symbol}
                  </span>
                </button>
              ))}
              {filteredCurrencies.length === 0 && (
                <div className="text-[#787b86] col-span-2 text-center py-8">
                  Không tìm thấy loại tiền tệ nào.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

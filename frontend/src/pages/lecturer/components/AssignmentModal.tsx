import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Target, BookOpen, AlertCircle, Calendar, ListChecks, Plus, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { STOCKS } from '../../../features/market/data';

interface RequirementItem {
  id: string;
  text: string;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  assignmentToEdit?: any | null;
  simulations: any[];
}

const DEFAULT_REQUIREMENTS: RequirementItem[] = [
  { id: 'r1', text: 'Quan sát và áp dụng chỉ báo MACD trên biểu đồ' },
  { id: 'r2', text: 'Quan sát và áp dụng chỉ báo RSI trên biểu đồ' },
  { id: 'r3', text: 'Viết nhận định tóm tắt về xu hướng giá' },
  { id: 'r4', text: 'Thực hành đặt lệnh Mua (Limit BUY) trên Trading Terminal' },
  { id: 'r5', text: 'Thiết lập mức Cắt lỗ (Stop Loss) an toàn cho lệnh' }
];

const PRESET_SUGGESTIONS = [
  'Quan sát và áp dụng chỉ báo MACD trên biểu đồ',
  'Quan sát và áp dụng chỉ báo RSI trên biểu đồ',
  'Phân tích đường trung bình động MA20/MA50',
  'Thực hành đặt lệnh Mua (Limit BUY) trên Trading Terminal',
  'Thực hành đặt lệnh Bán (Limit SELL) chốt lời',
  'Thiết lập mức Cắt lỗ (Stop Loss) an toàn cho lệnh',
  'Viết nhận định tóm tắt xu hướng và khối lượng giao dịch',
  'Đạt tỷ lệ R:R (Risk/Reward) tối thiểu 1:2'
];

export const AssignmentModal = ({ isOpen, onClose, onSaved, assignmentToEdit, simulations }: AssignmentModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    symbol: 'BTCUSDT',
    description: '',
    instructions: '',
    simulationId: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requirements: DEFAULT_REQUIREMENTS as RequirementItem[]
  });
  const [customSymbolMode, setCustomSymbolMode] = useState(false);
  const [newReqText, setNewReqText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setNewReqText('');
      if (assignmentToEdit) {
        const sym = (assignmentToEdit.symbol || 'BTCUSDT').toUpperCase();
        const isStandard = STOCKS.some(s => s.symbol.toUpperCase() === sym);
        setCustomSymbolMode(!isStandard);
        setFormData({
          title: assignmentToEdit.title || '',
          symbol: sym,
          description: assignmentToEdit.description || '',
          instructions: assignmentToEdit.instructions || '',
          simulationId: assignmentToEdit.simulationId?._id || assignmentToEdit.simulationId || '',
          deadline: assignmentToEdit.deadline ? new Date(assignmentToEdit.deadline).toISOString().split('T')[0] : '',
          requirements: Array.isArray(assignmentToEdit.requirements) && assignmentToEdit.requirements.length > 0
            ? assignmentToEdit.requirements
            : DEFAULT_REQUIREMENTS
        });
      } else {
        setCustomSymbolMode(false);
        setFormData({
          title: '',
          symbol: 'BTCUSDT',
          description: '',
          instructions: '',
          simulationId: simulations.length > 0 ? simulations[0]._id : '',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requirements: [...DEFAULT_REQUIREMENTS]
        });
      }
    }
  }, [assignmentToEdit, isOpen, simulations]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddRequirement = (customText?: string) => {
    const text = (customText || newReqText).trim();
    if (!text) return;
    if (formData.requirements.some(r => r.text.toLowerCase() === text.toLowerCase())) {
      return;
    }
    const newId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, { id: newId, text }]
    }));
    if (!customText) {
      setNewReqText('');
    }
  };

  const handleRemoveRequirement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r.id !== id)
    }));
  };

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const url = assignmentToEdit 
        ? `${apiUrl}/assignments/${assignmentToEdit._id}` 
        : `${apiUrl}/assignments`;
        
      const method = assignmentToEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        symbol: (formData.symbol || 'FPT').trim().toUpperCase()
      };

      const response = await fetch(url, { 
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSaved();
      } else {
        const data = await response.json();
        setError(data.message || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Thông tin cơ bản', icon: <Target className="w-4 h-4" /> },
    { num: 2, title: 'Nội dung & Checklist', icon: <BookOpen className="w-4 h-4" /> },
    { num: 3, title: 'Xem lại', icon: <Check className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-slate-200 dark:border-[#262626] transition-colors">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000]">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {assignmentToEdit ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1f] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stepper */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50 dark:bg-[#000000] border-b border-slate-200 dark:border-[#262626]">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {steps.map((s, i) => (
              <div key={s.num} className="flex-1 flex items-center">
                <div className={`flex flex-col items-center gap-1.5 sm:gap-2 w-full relative ${
                  s.num <= step ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors text-xs sm:text-sm font-semibold ${
                    s.num < step 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : s.num === step 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                      : 'border-slate-200 dark:border-[#262626] bg-slate-100 dark:bg-[#141416] text-slate-400 dark:text-slate-500'
                  }`}>
                    {s.num < step ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s.icon}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-center">{s.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-full -mt-5 sm:-mt-6 mx-1 sm:mx-2 transition-colors ${
                    s.num < step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-[#262626]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-[#09090b]">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="max-w-xl mx-auto py-2">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thông tin cơ bản</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tiêu đề bài tập *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Ví dụ: Phân tích kỹ thuật BTCUSDT & Thực hành vào lệnh"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Liên kết Kỳ thi mô phỏng *</label>
                    <select
                      name="simulationId"
                      required
                      value={formData.simulationId}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white transition-all text-sm cursor-pointer"
                    >
                      <option value="" disabled className="text-slate-400">Chọn một kỳ thi mô phỏng...</option>
                      {simulations.map(sim => (
                        <option key={sim._id} value={sim._id} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">
                          {sim.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mã tài sản trọng tâm *</label>
                      <button
                        type="button"
                        onClick={() => setCustomSymbolMode(!customSymbolMode)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium cursor-pointer"
                      >
                        {customSymbolMode ? '← Chọn từ danh sách mã' : '+ Nhập mã tùy chỉnh'}
                      </button>
                    </div>

                    {customSymbolMode ? (
                      <input
                        type="text"
                        name="symbol"
                        required
                        value={formData.symbol}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }));
                        }}
                        placeholder="Ví dụ: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono uppercase transition-all text-sm"
                      />
                    ) : (
                      <div className="relative">
                        <select
                          name="symbol"
                          required
                          value={formData.symbol}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white font-mono cursor-pointer appearance-none transition-all text-sm"
                        >
                          {formData.symbol && !STOCKS.some(s => s.symbol.toUpperCase() === formData.symbol.toUpperCase()) && (
                            <option value={formData.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white">
                              {formData.symbol} (Mã hiện tại / Tùy chỉnh)
                            </option>
                          )}
                          
                          <optgroup label="🇻🇳 Cổ phiếu Việt Nam (HOSE / UPCOM)" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-sans">
                            {STOCKS.filter(s => s.market === 'Cổ phiếu' && (s.exchange === 'HOSE' || s.exchange === 'UPCOM' || s.exchange === 'HNX')).map(s => (
                              <option key={s.symbol} value={s.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-mono">
                                {s.symbol} — {s.name} ({s.exchange})
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="🪙 Tiền điện tử (Crypto)" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-sans">
                            {STOCKS.filter(s => s.market === 'Tiền điện tử (Crypto)').map(s => (
                              <option key={s.symbol} value={s.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-mono">
                                {s.symbol} — {s.name} {s.isFutures ? '[Futures]' : '[Spot]'}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="🇺🇸 Cổ phiếu Mỹ (US Stocks)" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-sans">
                            {STOCKS.filter(s => s.market === 'Cổ phiếu' && (s.exchange === 'NASDAQ' || s.exchange === 'NYSE')).map(s => (
                              <option key={s.symbol} value={s.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-mono">
                                {s.symbol} — {s.name} ({s.exchange})
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="📈 Hàng hóa & Ngoại hối (Forex)" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-sans">
                            {STOCKS.filter(s => s.market === 'Hàng hóa' || s.market === 'Ngoại hối (Forex)').map(s => (
                              <option key={s.symbol} value={s.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-mono">
                                {s.symbol} — {s.name} ({s.exchange || s.market})
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="📊 Chỉ số thị trường (Indices)" className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-sans">
                            {STOCKS.filter(s => s.market === 'Chỉ số').map(s => (
                              <option key={s.symbol} value={s.symbol} className="bg-white dark:bg-[#121214] text-slate-900 dark:text-white font-mono">
                                {s.symbol} — {s.name} ({s.exchange})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {/* Stock badge preview */}
                    {(() => {
                      const currentStock = STOCKS.find(s => s.symbol.toUpperCase() === (formData.symbol || '').toUpperCase());
                      if (!currentStock) return null;
                      return (
                        <div className="mt-2.5 flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-[#262626] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentStock.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                              {currentStock.exchange}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {currentStock.market}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              ${currentStock.price.toLocaleString('vi-VN')}
                            </span>
                            <span className={`font-mono text-[11px] font-semibold ${currentStock.type === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {currentStock.change > 0 ? '+' : ''}{currentStock.percent}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hạn nộp bài (Deadline) *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="date"
                        name="deadline"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.deadline}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nội dung & Tiêu chí Checklist</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cấu hình mô tả và thiết lập danh sách checklist các tiêu chí để sinh viên tick hoàn thành khi làm bài.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mô tả tóm tắt (Brief Description)</label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tóm tắt ngắn gọn mục tiêu của bài tập..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hướng dẫn chi tiết (Detailed Instructions)</label>
                    <textarea
                      name="instructions"
                      rows={3}
                      value={formData.instructions}
                      onChange={handleChange}
                      placeholder="Chi tiết yêu cầu, câu hỏi định hướng, quy tắc nộp bài..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none text-sm transition-all"
                    />
                  </div>

                  {/* Checklist Builder */}
                  <div className="pt-4 border-t border-slate-200 dark:border-[#262626]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <label className="text-sm font-bold text-slate-900 dark:text-white">
                          Tiêu chí Checklist (Student Completion Checklist)
                        </label>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold">
                        {formData.requirements.length} tiêu chí
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Sinh viên sẽ thấy danh sách này và tick đánh dấu <strong className="text-emerald-600 dark:text-emerald-400">"Đã hoàn thành"</strong> trong quá trình làm bài và thực hành trên sàn mô phỏng.
                    </p>

                    {/* Input thêm tiêu chí mới */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newReqText}
                        onChange={(e) => setNewReqText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRequirement();
                          }
                        }}
                        placeholder="Nhập tiêu chí mới (nhấn Enter hoặc bấm Thêm)..."
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddRequirement()}
                        disabled={!newReqText.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm</span>
                      </button>
                    </div>

                    {/* Gợi ý thêm nhanh */}
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        Gợi ý thêm nhanh tiêu chí phổ biến:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_SUGGESTIONS.map((preset, idx) => {
                          const alreadyAdded = formData.requirements.some(r => r.text.toLowerCase() === preset.toLowerCase());
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddRequirement(preset)}
                              disabled={alreadyAdded}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                alreadyAdded
                                  ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                  : 'bg-slate-50 dark:bg-[#121214] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#262626] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#1c1c1f]'
                              }`}
                            >
                              + {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Danh sách tiêu chí checklist */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {formData.requirements.length === 0 ? (
                        <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#262626] text-slate-400 dark:text-slate-500 text-xs">
                          Chưa có tiêu chí nào. Vui lòng thêm ít nhất 1 tiêu chí để sinh viên có thể tick hoàn thành.
                        </div>
                      ) : (
                        formData.requirements.map((req, idx) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-slate-800 dark:text-slate-200 truncate" title={req.text}>
                                {req.text}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRequirement(req.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                              title="Xoá tiêu chí này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Xem lại bài tập</h3>
                
                <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Tiêu đề bài tập</p>
                      <p className="text-slate-900 dark:text-white font-medium">{formData.title || <span className="text-rose-500">Chưa nhập tiêu đề</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Mã cổ phiếu</p>
                      <p className="text-cyan-600 dark:text-cyan-400 font-mono font-bold flex items-center gap-2">
                        <span>{formData.symbol}</span>
                        {STOCKS.find(s => s.symbol.toUpperCase() === (formData.symbol || '').toUpperCase()) && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">
                            — {STOCKS.find(s => s.symbol.toUpperCase() === (formData.symbol || '').toUpperCase())?.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Kỳ mô phỏng</p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {simulations.find(s => s._id === formData.simulationId)?.name || <span className="text-rose-500">Chưa chọn</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Hạn nộp</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {formData.deadline}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pb-4 border-b border-slate-200 dark:border-[#262626]">
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-1">Mô tả tóm tắt</p>
                    <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-line">{formData.description || 'Không có mô tả'}</p>
                  </div>

                  {/* Checklist Review */}
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-2">
                      Tiêu chí Checklist sinh viên sẽ tick hoàn thành ({formData.requirements.length})
                    </p>
                    {formData.requirements.length === 0 ? (
                      <p className="text-xs text-amber-500 dark:text-amber-400">Chưa có tiêu chí checklist nào.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {formData.requirements.map((req, idx) => (
                          <div key={req.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span><strong className="text-slate-500 dark:text-slate-400 font-mono">{idx + 1}.</strong> {req.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          
          <div className="flex gap-2.5 sm:gap-3">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-4 sm:px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl hover:bg-slate-100 dark:hover:bg-[#1c1c1f] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && (!formData.title || !formData.simulationId || !formData.deadline)}
                className="px-5 sm:px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 sm:px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {assignmentToEdit ? 'Lưu thay đổi' : 'Tạo bài tập'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

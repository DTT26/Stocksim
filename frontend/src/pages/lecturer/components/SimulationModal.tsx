import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Target, Settings as SettingsIcon, Users, AlertCircle } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  simulationToEdit?: any | null;
}

export const SimulationModal = ({ isOpen, onClose, onSaved, simulationToEdit }: SimulationModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    market: 'VN',
    initialBalance: 100000000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      if (simulationToEdit) {
        setFormData({
          name: simulationToEdit.name || '',
          description: simulationToEdit.description || '',
          market: simulationToEdit.market || 'VN',
          initialBalance: simulationToEdit.initialBalance || 100000000,
          startDate: simulationToEdit.startDate ? new Date(simulationToEdit.startDate).toISOString().split('T')[0] : '',
          endDate: simulationToEdit.endDate ? new Date(simulationToEdit.endDate).toISOString().split('T')[0] : '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          market: 'VN',
          initialBalance: 100000000,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    }
  }, [simulationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(s => Math.min(4, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = simulationToEdit 
        ? `${apiUrl}/simulations/${simulationToEdit._id}` 
        : `${apiUrl}/simulations`;
      const method = simulationToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSaved();
      } else {
        const data = await response.json();
        setError(data.message || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save simulation');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Thông tin chung', icon: <Target className="w-4 h-4" /> },
    { num: 2, title: 'Cài đặt giao dịch', icon: <SettingsIcon className="w-4 h-4" /> },
    { num: 3, title: 'Thí sinh', icon: <Users className="w-4 h-4" /> },
    { num: 4, title: 'Xem lại', icon: <Check className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#09090b] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] border border-slate-200 dark:border-[#262626] transition-colors">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000]">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {simulationToEdit ? 'Chỉnh sửa kỳ thi mô phỏng' : 'Tạo kỳ thi mô phỏng mới'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c1c1f] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stepper */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/50 dark:bg-[#000000] border-b border-slate-200 dark:border-[#262626] overflow-x-auto scrollbar-hide no-scrollbar">
          <div className="flex items-center min-w-[460px] sm:min-w-[600px]">
            {steps.map((s, i) => (
              <div key={s.num} className="flex-1 flex items-center">
                <div className={`flex flex-col items-center gap-1.5 sm:gap-2 w-full relative ${
                  s.num <= step ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors text-xs sm:text-sm font-semibold ${
                    s.num < step 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : s.num === step 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                      : 'border-slate-200 dark:border-[#262626] bg-slate-100 dark:bg-[#141416] text-slate-400 dark:text-slate-500'
                  }`}>
                    {s.num < step ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s.icon}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{s.title}</span>
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
          
          <div className="max-w-2xl mx-auto py-2">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thông tin cơ bản</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tên kỳ thi mô phỏng *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="VD: Kỳ thi đầu tư chứng khoán HOSE - Khóa 2026"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mô tả chi tiết</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Mô tả mục tiêu, điều kiện và quy tắc cuộc thi..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Vốn khởi tạo ban đầu (USD) *</label>
                      <input
                        type="number"
                        name="initialBalance"
                        required
                        min="0"
                        step="1000"
                        value={formData.initialBalance}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white font-mono transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Thị trường giao dịch *</label>
                      <select
                        name="market"
                        value={formData.market}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white transition-colors cursor-pointer"
                      >
                        <option value="VN">Cổ phiếu Việt Nam (HOSE, HNX)</option>
                        <option value="GLOBAL">Crypto & Cổ phiếu Mỹ (Quốc tế)</option>
                        <option value="CRYPTO">Chỉ Tiền mã hóa (Crypto)</option>
                        <option value="US">Chỉ Cổ phiếu Mỹ (US Stocks)</option>
                        <option value="FOREX">Ngoại hối (Forex)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày bắt đầu *</label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày kết thúc *</label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        min={formData.startDate}
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#18181b] text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cài đặt quy tắc giao dịch</h3>
                <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <SettingsIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4 opacity-50" />
                  <h4 className="text-slate-900 dark:text-white font-bold mb-2">Cài đặt nâng cao đang được chuẩn bị</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                    Các tính năng như tỷ lệ đòn bẩy, mức phí giao dịch, giới hạn mở vị thế và cơ chế bán khống sẽ có mặt trong bản cập nhật tới. Hiện tại hệ thống áp dụng cơ chế khớp lệnh thị trường mô phỏng tiêu chuẩn.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thí sinh tham gia</h3>
                <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 text-indigo-500 mb-4 opacity-50" />
                  <h4 className="text-slate-900 dark:text-white font-bold mb-2">Phân bổ sinh viên sau khi tạo</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
                    Để thêm sinh viên, vui lòng hoàn tất khởi tạo kỳ thi trước. Sau đó bạn có thể dùng tính năng "Danh sách thí sinh" từ màn hình danh sách kỳ thi để duyệt hoặc gán sinh viên.
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Xem lại kỳ thi</h3>
                
                <div className="bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
                    <div className="col-span-3">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tên kỳ thi</p>
                      <p className="text-slate-900 dark:text-white font-bold">{formData.name || <span className="text-rose-500">Bắt buộc</span>}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Mô tả</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm">{formData.description || 'Chưa có mô tả'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Thị trường</p>
                      <p className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-500" />
                        {formData.market === 'VN' ? 'Việt Nam (HOSE, HNX)' : formData.market}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Vốn khởi tạo</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        ${Number(formData.initialBalance >= 1000000 ? formData.initialBalance / 1000 : formData.initialBalance).toLocaleString('en-US')} USD
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Thời gian diễn ra</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                        {formData.startDate} → {formData.endDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-[#262626] flex justify-between items-center bg-slate-50/80 dark:bg-[#000000] gap-2">
          <button
            onClick={onClose}
            className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          
          <div className="flex gap-2 sm:gap-3">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#262626] rounded-xl hover:bg-slate-100 dark:hover:bg-[#1c1c1f] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && (!formData.name || !formData.initialBalance || !formData.startDate || !formData.endDate)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/25"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {simulationToEdit ? 'Lưu thay đổi' : 'Tạo kỳ thi'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

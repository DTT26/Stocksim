import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface JournalErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export const JournalErrorState: React.FC<JournalErrorStateProps> = ({
  title = 'Không thể tải nhật ký giao dịch',
  message = 'Đã có lỗi xảy ra khi tải dữ liệu giao dịch của bạn.',
  onRetry
}) => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-rose-200 dark:border-rose-900/30 rounded-2xl p-10 text-center max-w-md mx-auto shadow-sm my-8">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Thử lại</span>
      </button>
    </div>
  );
};

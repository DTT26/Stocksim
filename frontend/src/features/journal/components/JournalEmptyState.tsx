import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';

interface JournalEmptyStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onAction?: () => void;
}

export const JournalEmptyState: React.FC<JournalEmptyStateProps> = ({
  title = 'Chưa có phiên giao dịch nào',
  description = 'Bắt đầu giao dịch trong kỳ thi mô phỏng và các phiên của bạn sẽ xuất hiện tại đây.',
  buttonText = 'Khám phá kỳ thi mô phỏng',
  onAction
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253047] rounded-2xl p-6 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-4 sm:my-8">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
        <Target className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
        {description}
      </p>
      <button
        onClick={onAction || (() => navigate('/student/simulations'))}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20"
      >
        <span>{buttonText}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

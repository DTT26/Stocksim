import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Clock, CheckCircle2, AlertCircle, Award, ArrowRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export const StudentAssignments = () => {
  const { lang, t } = useI18n();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/assignments/my`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAssignments(data);
          return;
        }
      }
      setAssignments([]);
    } catch (err) {
      console.warn('Lỗi lấy bài tập từ backend:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const getStatus = (a: any) => {
    if (a.studentStatus) {
      if (a.studentStatus === 'GRADED') return 'Graded';
      if (a.studentStatus === 'SUBMITTED') return 'Submitted';
      if (a.studentStatus === 'OVERDUE') return 'Overdue';
      return 'In Progress';
    }
    return a.status || 'In Progress';
  };

  const filteredAssignments = assignments.filter(a => {
    const status = getStatus(a);
    if (filter === 'All') return true;
    if (filter === 'In Progress') return status === 'In Progress' || status === 'Not Started';
    if (filter === 'Submitted') return status === 'Submitted';
    if (filter === 'Graded') return status === 'Graded' || status === 'Completed';
    if (filter === 'Overdue') return status === 'Overdue';
    return true;
  });

  const getTabCount = (tab: string) => {
    if (tab === 'All') return assignments.length;
    return assignments.filter(a => {
      const status = getStatus(a);
      if (tab === 'In Progress') return status === 'In Progress' || status === 'Not Started';
      if (tab === 'Submitted') return status === 'Submitted';
      if (tab === 'Graded') return status === 'Graded' || status === 'Completed';
      if (tab === 'Overdue') return status === 'Overdue';
      return false;
    }).length;
  };

  const getStatusBadge = (status: string, score?: number) => {
    switch (status) {
      case 'Graded':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 whitespace-nowrap">
            <Award className="w-3.5 h-3.5 shrink-0" />
            {score !== undefined ? (lang === 'vi' ? `Đã chấm: ${score}đ` : `Graded: ${score} pts`) : (lang === 'vi' ? 'Đã chấm điểm' : 'Graded')}
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {lang === 'vi' ? 'Đã nộp bài' : 'Submitted'}
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {lang === 'vi' ? 'Quá hạn' : 'Overdue'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {lang === 'vi' ? 'Đang làm' : 'In Progress'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {lang === 'vi' ? 'Bài tập & Phân tích' : 'Assignments & Analysis'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">
          {lang === 'vi' 
            ? 'Hoàn thành các bài tập phân tích kỹ thuật và quản trị vốn do Giảng viên giao.' 
            : 'Complete technical analysis and risk management assignments assigned by instructors.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] shadow-sm dark:shadow-xl overflow-hidden transition-colors">
        {/* Filter Tabs / Pills */}
        <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-[#253047] flex flex-wrap gap-1.5 sm:gap-2">
          {['All', 'In Progress', 'Submitted', 'Graded', 'Overdue'].map(tab => {
            const labelMap: Record<string, string> = {
              'All': lang === 'vi' ? 'Tất cả' : 'All',
              'In Progress': lang === 'vi' ? 'Đang làm' : 'In Progress',
              'Submitted': lang === 'vi' ? 'Đã nộp' : 'Submitted',
              'Graded': lang === 'vi' ? 'Đã chấm' : 'Graded',
              'Overdue': lang === 'vi' ? 'Quá hạn' : 'Overdue'
            };
            const count = getTabCount(tab);
            const isActive = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-[#172033] dark:hover:bg-[#1e2a42] dark:text-slate-300 border border-slate-200/60 dark:border-[#253047]/60'
                }`}
              >
                <span>{labelMap[tab] || tab}</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 text-slate-700 dark:bg-[#253047] dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Content Section */}
        <div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-sm">{lang === 'vi' ? 'Đang tải danh sách bài tập...' : 'Loading assignments...'}</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="py-12 sm:py-16 px-4 text-center text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#172033] flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                {lang === 'vi' ? 'Không có bài tập nào trong mục này' : 'No assignments found in this category'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {lang === 'vi'
                  ? 'Các bài tập mới từ giảng viên sẽ xuất hiện tại đây khi được giao.'
                  : 'New assignments from instructors will appear here once assigned.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md) */}
              <div className="divide-y divide-slate-100 dark:divide-[#1f283e] md:hidden">
                {filteredAssignments.map((assignment) => {
                  const id = assignment._id || assignment.id;
                  const status = getStatus(assignment);
                  const progress = assignment.progress !== undefined ? assignment.progress : (status === 'Submitted' || status === 'Graded' ? 100 : 0);
                  const simName = assignment.simulationId?.name || assignment.simulation || '—';
                  const score = assignment.mySubmission?.score;

                  return (
                    <div key={id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/70 dark:hover:bg-[#172033]/40 transition-colors">
                      {/* Top Row: Icon + Title & Symbol + Status Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            status === 'Graded' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                            status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            status === 'Overdue' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                            'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug break-words">
                              {assignment.title}
                            </h3>
                            <span className="inline-block mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              {lang === 'vi' ? 'Mã CP:' : 'Symbol:'} <strong className="text-slate-700 dark:text-slate-300 font-semibold">{assignment.symbol || 'BTCUSDT'}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(status, score)}
                        </div>
                      </div>

                      {/* Middle Info: Simulation & Deadline */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#172033]/60 border border-slate-100 dark:border-[#253047]/60">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                            {lang === 'vi' ? 'Kỳ thi' : 'Exam'}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate block" title={simName}>
                            {simName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-0.5">
                            {lang === 'vi' ? 'Hạn nộp' : 'Deadline'}
                          </span>
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{new Date(assignment.deadline).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {lang === 'vi' ? 'Tiến độ checklist' : 'Checklist progress'}
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#253047] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Action Button */}
                      <div className="pt-0.5">
                        <Link 
                          to={`/student/assignments/${id}`} 
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.99] text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 dark:text-indigo-300 dark:border-indigo-500/30 rounded-xl font-semibold text-xs transition-all shadow-sm"
                        >
                          <span>
                            {status === 'Submitted' || status === 'Graded'
                              ? (lang === 'vi' ? 'Xem bài làm' : 'View Submission')
                              : (lang === 'vi' ? 'Làm bài' : 'Start Assignment')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-[#172033] border-b border-slate-200 dark:border-[#253047] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4 font-semibold">{lang === 'vi' ? 'Tên bài tập' : 'Assignment Title'}</th>
                      <th className="px-6 py-4 font-semibold">{lang === 'vi' ? 'Kỳ thi mô phỏng' : 'Simulation Exam'}</th>
                      <th className="px-6 py-4 font-semibold">{lang === 'vi' ? 'Hạn nộp' : 'Deadline'}</th>
                      <th className="px-6 py-4 font-semibold">{lang === 'vi' ? 'Tiến độ checklist' : 'Checklist Progress'}</th>
                      <th className="px-6 py-4 font-semibold">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                      <th className="px-6 py-4 font-semibold text-right">{lang === 'vi' ? 'Thao tác' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#253047]">
                    {filteredAssignments.map((assignment) => {
                      const id = assignment._id || assignment.id;
                      const status = getStatus(assignment);
                      const progress = assignment.progress !== undefined ? assignment.progress : (status === 'Submitted' || status === 'Graded' ? 100 : 0);
                      const simName = assignment.simulationId?.name || assignment.simulation || '—';
                      const score = assignment.mySubmission?.score;

                      return (
                        <tr key={id} className="hover:bg-slate-50/80 dark:hover:bg-[#172033]/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${
                                status === 'Graded' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                status === 'Overdue' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                                  {assignment.title}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  {lang === 'vi' ? 'Mã CP:' : 'Symbol:'} <strong className="text-slate-600 dark:text-slate-400">{assignment.symbol || 'BTCUSDT'}</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                            {simName}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span>{new Date(assignment.deadline).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-200 dark:bg-[#253047] rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{progress}%</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {getStatusBadge(status, score)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/student/assignments/${id}`} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 dark:text-indigo-300 dark:border-indigo-500/30 rounded-lg font-semibold text-xs transition-colors"
                            >
                              <span>
                                {status === 'Submitted' || status === 'Graded'
                                  ? (lang === 'vi' ? 'Xem bài làm' : 'View Submission')
                                  : (lang === 'vi' ? 'Làm bài' : 'Start Assignment')}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

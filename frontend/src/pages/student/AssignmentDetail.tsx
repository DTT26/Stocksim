import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle2, User, PlayCircle, 
  Send, Award, AlertCircle, FileText, Check, Clock, TrendingUp,
  ShieldCheck, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export const StudentAssignmentDetail = () => {
  const { lang } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form submission state
  const [analysisContent, setAnalysisContent] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAssignmentData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // 1. Lấy thông tin bài tập
      let assData: any = null;
      try {
        const assRes = await fetch(`${apiUrl}/assignments/${id}`, {
          credentials: 'include',
          headers
        });
        if (assRes.ok) {
          assData = await assRes.json();
        }
      } catch (e) {
        console.warn('Backend fetch assignment error:', e);
      }

      setAssignment(assData);

      // 2. Lấy thông tin bài nộp của sinh viên nếu có
      try {
        const subRes = await fetch(`${apiUrl}/assignments/${id}/submission`, {
          credentials: 'include',
          headers
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData) {
            setSubmission(subData);
            setAnalysisContent(subData.content || '');
            if (subData.checklistStatus && Array.isArray(subData.checklistStatus)) {
              const map: Record<string, boolean> = {};
              subData.checklistStatus.forEach((item: any) => {
                map[item.requirementId] = item.completed;
              });
              setChecklist(map);
            }
          }
        }
      } catch (e) {
        console.warn('Backend fetch submission error:', e);
      }

      // Khởi tạo checklist nếu chưa có
      const reqList = (assData && assData.requirements && assData.requirements.length > 0)
        ? assData.requirements
        : [
            { id: 'r1', text: lang === 'vi' ? 'Quan sát và áp dụng chỉ báo MACD trên biểu đồ' : 'Observe and apply MACD indicator on chart' },
            { id: 'r2', text: lang === 'vi' ? 'Quan sát và áp dụng chỉ báo RSI trên biểu đồ' : 'Observe and apply RSI indicator on chart' },
            { id: 'r3', text: lang === 'vi' ? 'Viết nhận định tóm tắt về xu hướng giá' : 'Write summary analysis on price trends' },
            { id: 'r4', text: lang === 'vi' ? 'Thực hành đặt lệnh Mua (Limit BUY) trên Trading Terminal' : 'Practice placing Limit BUY orders on Trading Terminal' },
            { id: 'r5', text: lang === 'vi' ? 'Thiết lập mức Cắt lỗ (Stop Loss) an toàn cho lệnh' : 'Set safe Stop Loss (SL) for your orders' }
          ];

      setChecklist(prev => {
        const init: Record<string, boolean> = { ...prev };
        reqList.forEach((r: any) => {
          if (init[r.id] === undefined) {
            init[r.id] = false;
          }
        });
        return init;
      });

    } catch (err) {
      console.error('Failed to load assignment', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [id]);

  const toggleChecklist = (reqId: string) => {
    setChecklist(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  const rawReqs = (assignment?.requirements && assignment.requirements.length > 0)
    ? assignment.requirements
    : [
        { id: 'r1', text: lang === 'vi' ? 'Quan sát và áp dụng chỉ báo MACD trên biểu đồ' : 'Observe and apply MACD indicator on chart' },
        { id: 'r2', text: lang === 'vi' ? 'Quan sát và áp dụng chỉ báo RSI trên biểu đồ' : 'Observe and apply RSI indicator on chart' },
        { id: 'r3', text: lang === 'vi' ? 'Viết nhận định tóm tắt về xu hướng giá' : 'Write summary analysis on price trends' },
        { id: 'r4', text: lang === 'vi' ? 'Thực hành đặt lệnh Mua (Limit BUY) trên Trading Terminal' : 'Practice placing Limit BUY orders on Trading Terminal' },
        { id: 'r5', text: lang === 'vi' ? 'Thiết lập mức Cắt lỗ (Stop Loss) an toàn cho lệnh' : 'Set safe Stop Loss (SL) for your orders' }
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisContent.trim()) {
      setToastMsg({ text: lang === 'vi' ? 'Vui lòng nhập nội dung phân tích / giải trình lệnh giao dịch' : 'Please enter your trade analysis and explanation', type: 'error' });
      return;
    }

    setSubmitting(true);
    setToastMsg(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const checklistPayload = rawReqs.map((req: any) => ({
        requirementId: req.id,
        completed: !!checklist[req.id]
      }));

      const res = await fetch(`${apiUrl}/assignments/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content: analysisContent,
          checklistStatus: checklistPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
        setToastMsg({
          text: lang === 'vi' ? '🎉 Nộp bài tập thành công! Giảng viên sẽ chấm điểm bài làm của bạn.' : '🎉 Assignment submitted successfully! The instructor will review your work.',
          type: 'success'
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setToastMsg({ text: err.message || (lang === 'vi' ? 'Lỗi khi nộp bài tập' : 'Error submitting assignment'), type: 'error' });
      }
    } catch (err: any) {
      setToastMsg({ text: err.message || (lang === 'vi' ? 'Lỗi kết nối máy chủ' : 'Server connection error'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>{lang === 'vi' ? 'Đang tải thông tin bài tập...' : 'Loading assignment details...'}</span>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">{lang === 'vi' ? 'Không tìm thấy bài tập' : 'Assignment Not Found'}</h2>
        <p>{lang === 'vi' ? 'Bài tập này có thể đã bị gỡ bỏ hoặc bạn không có quyền truy cập.' : 'This assignment might have been removed or you do not have permission to access it.'}</p>
        <Link to="/student/assignments" className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          {lang === 'vi' ? 'Quay lại danh sách bài tập' : 'Back to Assignments'}
        </Link>
      </div>
    );
  }

  const totalReqs = rawReqs.length;
  const completedReqs = rawReqs.filter((r: any) => checklist[r.id]).length;
  const progressPercent = Math.min(100, Math.round((completedReqs / totalReqs) * 100));

  const isGraded = submission?.status === 'GRADED';
  const isSubmitted = submission?.status === 'SUBMITTED' || isGraded;

  const targetSymbol = (assignment.symbol || 'BTCUSDT').toLowerCase();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/student/assignments" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#172033] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {assignment.title}
              </h1>
              {isGraded ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {lang === 'vi' ? `Đã chấm điểm: ${submission.score}đ` : `Graded: ${submission.score} pts`}
                </span>
              ) : isSubmitted ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'vi' ? 'Đã nộp bài' : 'Submitted'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lang === 'vi' ? 'Đang làm' : 'In Progress'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'vi' ? 'Mã cổ phiếu trọng tâm:' : 'Target symbol:'} <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{assignment.symbol || 'BTCUSDT'}</strong>
            </p>
          </div>
        </div>

        <Link
          to={`/trade/${targetSymbol}`}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === 'vi' ? 'Mở Trading Terminal' : 'Open Trading Terminal'} ({assignment.symbol || 'BTCUSDT'})</span>
        </Link>
      </div>

      {/* Thông báo kết quả / Toast */}
      {toastMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">✕</button>
        </div>
      )}

      {/* Banner kết quả chấm điểm nếu đã Graded */}
      {isGraded && (
        <div className="bg-gradient-to-r from-purple-50 via-amber-50/50 to-amber-50 dark:from-purple-950/40 dark:via-[#172033] dark:to-amber-950/30 border border-amber-500/30 rounded-2xl p-6 shadow-sm dark:shadow-xl text-slate-800 dark:text-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Kết Quả Đánh Giá Của Giảng Viên' : 'Instructor Evaluation Results'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'vi' ? 'Chấm bởi:' : 'Graded by:'} <strong className="text-slate-800 dark:text-slate-200">{submission.gradedBy?.name || (lang === 'vi' ? 'Giảng viên phụ trách' : 'Assigned Lecturer')}</strong> {lang === 'vi' ? 'vào ngày' : 'on'} {new Date(submission.gradedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="text-right bg-amber-500/10 border border-amber-500/30 px-5 py-2 rounded-2xl">
              <span className="text-[11px] text-amber-600 dark:text-amber-300 font-semibold block uppercase tracking-wider">
                {lang === 'vi' ? 'Điểm số' : 'Score'}
              </span>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">{submission.score} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ 100</span></span>
            </div>
          </div>
          {submission.feedback && (
            <div className="pt-4 text-sm leading-relaxed">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">
                {lang === 'vi' ? 'Lời nhận xét:' : 'Feedback:'}
              </span>
              <p className="text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột chính bên trái: Hướng dẫn, Checklist & Form nộp bài */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hướng dẫn đề bài */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] p-6 shadow-sm dark:shadow-lg transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'vi' ? 'Yêu cầu & Hướng dẫn làm bài' : 'Requirements & Instructions'}</span>
            </h2>
            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-[#172033]/60 p-4 rounded-xl border border-slate-200 dark:border-[#253047]">
              {assignment.instructions || assignment.description || (lang === 'vi' ? 'Vui lòng thực hiện theo các yêu cầu trong checklist và giao dịch trên màn hình Trading Terminal.' : 'Please follow the checklist requirements and trade on the Trading Terminal.')}
            </div>
          </div>

          {/* Quy định & Ràng buộc bài tập (Rules & Constraints) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] p-6 shadow-sm dark:shadow-lg transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {lang === 'vi' ? 'Quy định & Ràng buộc bài tập' : 'Assignment Rules & Constraints'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047]">
                <div className="text-slate-500 dark:text-[#787b86] text-[11px] font-semibold uppercase mb-1">
                  {lang === 'vi' ? 'Mục tiêu' : 'Target Asset'}
                </div>
                <div className="text-slate-900 dark:text-white font-bold font-mono text-sm">{assignment.symbol || 'BTCUSDT'}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047]">
                <div className="text-slate-500 dark:text-[#787b86] text-[11px] font-semibold uppercase mb-1">
                  {lang === 'vi' ? 'Đòn bẩy tối đa' : 'Max Leverage'}
                </div>
                <div className="text-slate-900 dark:text-white font-bold font-mono text-sm">1x (Spot)</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047]">
                <div className="text-slate-500 dark:text-[#787b86] text-[11px] font-semibold uppercase mb-1">
                  {lang === 'vi' ? 'Hạn nộp bài' : 'Deadline'}
                </div>
                <div className="text-slate-900 dark:text-white font-bold font-mono text-sm">{new Date(assignment.dueDate).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#172033] rounded-xl border border-slate-200 dark:border-[#253047]">
                <div className="text-slate-500 dark:text-[#787b86] text-[11px] font-semibold uppercase mb-1">
                  {lang === 'vi' ? 'Trạng thái' : 'Status'}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">
                  {isSubmitted ? (lang === 'vi' ? 'Đã nộp bài' : 'Submitted') : (lang === 'vi' ? 'Đang làm' : 'In Progress')}
                </div>
              </div>
            </div>
          </div>

          {/* Checklist tiêu chí */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] overflow-hidden shadow-sm dark:shadow-lg transition-colors">
            <div className="p-5 border-b border-slate-200 dark:border-[#253047] flex justify-between items-center bg-slate-50/50 dark:bg-[#172033]/50">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Checklist yêu cầu bài tập' : 'Assignment Checklist'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'vi' ? 'Đánh dấu vào các mục bạn đã thực hiện hoàn thành' : 'Check off requirements as you complete them'}
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                {completedReqs} / {totalReqs} ({progressPercent}%)
              </span>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-[#253047]">
              {rawReqs.map((req: any) => {
                const isChecked = !!checklist[req.id];
                return (
                  <div 
                    key={req.id} 
                    onClick={() => toggleChecklist(req.id)}
                    className="p-4 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-[#172033]/60 transition-colors cursor-pointer select-none"
                  >
                    <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isChecked 
                        ? 'border-emerald-500 bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20' 
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-white/5 text-transparent hover:border-indigo-400'
                    }`}>
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <p className={`text-sm font-medium transition-colors ${
                      isChecked ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {req.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bằng chứng giao dịch xác thực bởi hệ thống */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] p-6 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#253047]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'vi' ? 'Bằng chứng giao dịch xác thực (System-Verified)' : 'System-Verified Trading Evidence'}
                </h2>
              </div>
              <Link
                to={`/trade/${targetSymbol}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{lang === 'vi' ? 'Mở Trading Terminal' : 'Open Trading Terminal'} ({assignment.symbol || 'BTCUSDT'})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {submission?.tradingEvidence?.isVerified ? (
              <div className="space-y-3">
                {(() => {
                  const ev = submission.tradingEvidence;
                  const currSymbol = ev.currencySymbol || '$';
                  const totalFilled = ev.totalFilledOrders !== undefined ? ev.totalFilledOrders : ev.totalOrders;
                  const totalCancelled = ev.totalCancelledOrders || 0;

                  return (
                    <>
                      {ev.timeWindow && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lang === 'vi' ? 'Khung giờ tính lệnh:' : 'Trade window:'}</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(ev.timeWindow.from).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                          <span>→</span>
                          <span className="text-indigo-600 dark:text-cyan-400 font-semibold">
                            {new Date(ev.timeWindow.to).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-50 dark:bg-[#172033] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                            {lang === 'vi' ? 'Lệnh khớp (Filled)' : 'Filled Orders'}
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold text-base mt-0.5 block">
                            {totalFilled} {lang === 'vi' ? 'lệnh' : 'orders'}
                          </span>
                          {totalCancelled > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">({totalCancelled} {lang === 'vi' ? 'lệnh hủy' : 'cancelled'})</span>
                          )}
                        </div>
                        <div className="bg-slate-50 dark:bg-[#172033] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                            {lang === 'vi' ? 'Mã cổ phiếu' : 'Target Symbol'}
                          </span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold text-base mt-0.5 block">
                            {ev.targetSymbol || assignment.symbol}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#172033] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                            {lang === 'vi' ? 'Kỷ luật Stop Loss' : 'Stop Loss Discipline'}
                          </span>
                          <span className={`font-bold text-sm mt-0.5 block ${ev.hasStopLoss ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {ev.hasStopLoss ? (lang === 'vi' ? '✓ Có cài SL' : '✓ SL Configured') : (lang === 'vi' ? '⚠️ Chưa cài SL' : '⚠️ No SL')}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#172033] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                            {lang === 'vi' ? 'P&L thực tế' : 'Realized P&L'}
                          </span>
                          <span className={`font-mono font-bold text-base mt-0.5 block ${ev.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {ev.totalPnL >= 0 ? '+' : ''}{Number(ev.totalPnL || 0).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} {currSymbol}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-100 dark:bg-[#172033] text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">{lang === 'vi' ? 'Lệnh' : 'Side'}</th>
                              <th className="py-2 px-3">{lang === 'vi' ? 'Mã' : 'Symbol'}</th>
                              <th className="py-2 px-3">{lang === 'vi' ? 'Khối lượng' : 'Volume'}</th>
                              <th className="py-2 px-3">{lang === 'vi' ? 'Giá khớp' : 'Price'}</th>
                              <th className="py-2 px-3">SL / TP</th>
                              <th className="py-2 px-3">P&L</th>
                              <th className="py-2 px-3">{lang === 'vi' ? 'Thời gian' : 'Time'}</th>
                              <th className="py-2 px-3 text-right">{lang === 'vi' ? 'Trạng thái' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                            {ev.orders.slice(0, 10).map((ord: any, idx: number) => {
                              const isBuy = ord.side === 'BUY' || ord.side === 'LONG';
                              const isCancelled = ord.status === 'CANCELLED' || ord.status === 'REJECTED';
                              return (
                                <tr key={ord.id || idx} className={isCancelled ? 'opacity-60' : ''}>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isCancelled 
                                        ? 'bg-slate-500/15 text-slate-500 border border-slate-400/30'
                                        : isBuy 
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                    }`}>
                                      {isBuy ? 'BUY' : 'SELL'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-bold">{ord.symbol}</td>
                                  <td className="py-2 px-3">{Number(ord.quantity).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</td>
                                  <td className="py-2 px-3">{Number(ord.price).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} {currSymbol}</td>
                                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                                    {ord.stopLoss || ord.takeProfit ? (
                                      <span>
                                        SL: {ord.stopLoss ? `${Number(ord.stopLoss).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} ${currSymbol}` : '-'} | TP: {ord.takeProfit ? `${Number(ord.takeProfit).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} ${currSymbol}` : '-'}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-2 px-3">
                                    {ord.pnl !== undefined && !isCancelled ? (
                                      <span className={ord.pnl >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                        {ord.pnl >= 0 ? '+' : ''}{Number(ord.pnl).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} {currSymbol}
                                      </span>
                                    ) : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                                    {new Date(ord.time).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      ord.status === 'FILLED' 
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : ord.status === 'CANCELLED'
                                        ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    }`}>
                                      {ord.status === 'FILLED' ? (lang === 'vi' ? 'KHỚP' : 'FILLED') : ord.status === 'CANCELLED' ? (lang === 'vi' ? 'ĐÃ HỦY' : 'CANCELLED') : ord.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">
                    {lang === 'vi' 
                      ? `Chưa có lệnh giao dịch nào khớp với mã ${assignment.symbol || 'BTCUSDT'}` 
                      : `No executed trades found matching symbol ${assignment.symbol || 'BTCUSDT'}`}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 leading-relaxed">
                    {lang === 'vi'
                      ? 'Giảng viên sẽ kiểm tra trực tiếp bằng chứng giao dịch thực tế trên sàn khi chấm bài. Hãy mở Trading Terminal để đặt lệnh thực hành trước khi nộp bài.'
                      : 'Instructors review verified exchange trading logs during grading. Open the Trading Terminal to place practice orders before submitting.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form nộp bài tập */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] p-6 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'vi' ? 'Bài làm & Phân tích của sinh viên' : 'Student Analysis & Submission'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  {lang === 'vi' ? 'Nội dung phân tích kỹ thuật, lý do vào lệnh & chiến lược quản trị rủi ro:' : 'Technical analysis, trade rationale & risk management plan:'}
                </label>
                <textarea
                  rows={6}
                  value={analysisContent}
                  onChange={(e) => setAnalysisContent(e.target.value)}
                  placeholder={lang === 'vi' ? 'Ví dụ: Dựa trên chỉ báo RSI chạm vùng quá bán 28 và đường MACD chuẩn bị cắt lên Signal line tại khung H1, tôi đã lên kế hoạch đặt lệnh Mua Limit giá 135.50 USD...' : 'E.g., Based on the H1 RSI touching oversold at 28 and MACD crossing above Signal line, I entered a Limit BUY order at $135.50 with a tight stop loss...'}
                  className="w-full p-4 bg-slate-50 dark:bg-[#172033] border border-slate-200 dark:border-[#253047] rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isSubmitted && submission?.submittedAt ? (
                    <span>{lang === 'vi' ? 'Đã nộp bài lúc:' : 'Submitted at:'} <strong className="text-slate-800 dark:text-slate-200">{new Date(submission.submittedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</strong></span>
                  ) : (
                    <span>{lang === 'vi' ? 'Chưa gửi bài nộp' : 'Not submitted yet'}</span>
                  )}
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0088ff] hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting 
                      ? (lang === 'vi' ? 'Đang gửi...' : 'Submitting...') 
                      : isSubmitted 
                      ? (lang === 'vi' ? 'Cập nhật bài nộp' : 'Update Submission') 
                      : (lang === 'vi' ? 'Nộp bài tập' : 'Submit Assignment')}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Cột thông tin phụ bên phải */}
        <div className="space-y-6">
          
          {/* Hộp thông tin Assignment Info */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253047] p-6 shadow-sm dark:shadow-lg space-y-5 transition-colors">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#253047] pb-3">
              {lang === 'vi' ? 'Thông Tin Bài Tập' : 'Assignment Information'}
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{lang === 'vi' ? 'Kỳ thi mô phỏng:' : 'Simulation Exam:'}</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {assignment.simulationId?.name || assignment.simulation || '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{lang === 'vi' ? 'Giảng viên phụ trách:' : 'Instructor:'}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {assignment.createdBy?.name || assignment.lecturer || (lang === 'vi' ? 'Giảng viên phụ trách' : 'Instructor')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{lang === 'vi' ? 'Hạn nộp bài (Deadline):' : 'Deadline:'}</span>
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold font-mono">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{new Date(assignment.deadline).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-0.5">{lang === 'vi' ? 'Mã cổ phiếu thực hành:' : 'Practice Symbol:'}</span>
                <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 font-bold font-mono rounded border border-cyan-200 dark:border-cyan-500/30 inline-block">
                  {assignment.symbol || 'BTCUSDT'}
                </span>
              </div>
            </div>

            {/* Thanh tiến độ */}
            <div className="pt-4 border-t border-slate-200 dark:border-[#253047]">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">{lang === 'vi' ? 'Tiến độ hoàn thành:' : 'Completion Progress:'}</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#253047] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hộp hành động mở Trading Terminal */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-white to-white dark:from-indigo-950/40 dark:via-[#111827] dark:to-[#111827] rounded-2xl border border-indigo-200 dark:border-indigo-500/30 p-6 shadow-sm dark:shadow-xl text-center space-y-4 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {lang === 'vi' ? 'Thực hành trên sàn giả lập' : 'Practice on Trading Terminal'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'vi' 
                  ? `Mở Trading Terminal với mã ` 
                  : `Open Trading Terminal with symbol `}
                <strong className="text-cyan-600 dark:text-cyan-400">{assignment.symbol || 'BTCUSDT'}</strong>
                {lang === 'vi' 
                  ? ' để áp dụng chỉ báo kỹ thuật và đặt lệnh thị trường.' 
                  : ' to test technical indicators and execute simulated market orders.'}
              </p>
            </div>
            <Link 
              to={`/trade/${targetSymbol}`} 
              className="block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              {lang === 'vi' ? 'Mở Trading Terminal' : 'Open Trading Terminal'} ({assignment.symbol || 'BTCUSDT'})
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, Sparkles, 
  Lightbulb, CheckCircle2, MousePointerClick, ArrowRight
} from 'lucide-react';

export interface TourStep {
  target: string; // CSS selector or data-tour identifier
  panel?: 'simulation' | 'order' | 'journal' | 'watchlist' | null;
  title: string;
  badge: string;
  actionPrompt: string;
  content: string;
  tip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface SpotlightOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  isReplaying?: boolean;
  onSetRightPanel?: (panel: 'watchlist' | 'order' | 'simulation' | 'calculator' | 'journal' | null) => void;
  onNavigateToJournal?: () => void;
  onTriggerReplayStart?: () => void;
}

export const SpotlightOnboardingTour: React.FC<SpotlightOnboardingTourProps> = ({
  isOpen,
  onClose,
  isReplaying = false,
  onSetRightPanel,
  onNavigateToJournal,
  onTriggerReplayStart
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [actionSuccess, setActionSuccess] = useState<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  const steps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="ticker-search"]',
      title: '1. Tìm & Chọn Mã Giao Dịch',
      badge: 'BƯỚC 1 / 23',
      actionPrompt: '👉 Click chuột vào ô Ticker (BTCUSDT) để chọn mã',
      content: 'Nhấp trực tiếp vào ô mã ở góc trên bên trái để tìm kiếm và chọn mã giao dịch (BTCUSDT, ETHUSDT, AAPL, NVDA, FPT...).',
      tip: 'Mẹo: Bạn có thể chọn bất kỳ mã nào để hệ thống tải lại toàn bộ biểu đồ lịch sử.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="bar-replay-btn"]',
      title: '2. Bật Tính Năng Tua Nến (Replay)',
      badge: 'BƯỚC 2 / 23',
      actionPrompt: '👉 Click nút Replay để kích hoạt chế độ chọn nến',
      content: 'Bấm nút "Replay" trên thanh công cụ để chuẩn bị chọn điểm bắt đầu phiên luyện tập trong quá khứ.',
      tip: 'Chế độ Replay sẽ giúp bạn cắt toàn bộ nến tương lai để thực hành như thời gian thực.',
      placement: 'bottom'
    },
    {
      target: '#market-chart',
      panel: 'simulation',
      title: '3. Chọn Cây Nến Bắt Đầu Trên Biểu Đồ',
      badge: 'BƯỚC 3 / 23',
      actionPrompt: '👉 Nhấp chuột vào 1 cây nến trên biểu đồ để cắt nến',
      content: 'Di chuột vào khu vực nến trên biểu đồ và click vào một cây nến bạn muốn bắt đầu. Toàn bộ nến sau đó sẽ bị ẩn đi.',
      tip: 'Hãy nhấp chuột trực tiếp vào vùng thân nến bất kỳ trên màn hình biểu đồ.',
      placement: 'top'
    },
    {
      target: '[data-tour="sim-new-session-btn"], [data-tour="sim-continue-btn"]',
      panel: 'simulation',
      title: '4. Mở Phiên Mô Phỏng Giao Dịch',
      badge: 'BƯỚC 4 / 23',
      actionPrompt: '👉 Nhấp nút (+) BẮT ĐẦU PHIÊN MỚI (hoặc ▶ Tiếp tục)',
      content: 'Trong bảng Mô phỏng Giao dịch bên phải, nhấn nút xanh (+) BẮT ĐẦU PHIÊN MỚI để tạo phiên, hoặc bấm Tiếp tục phiên đang có.',
      tip: 'Số dư $100,000 hoàn toàn là tiền ảo không có rủi ro tài chính.',
      placement: 'left'
    },
    {
      target: '[data-tour="sim-start-create-btn"], [data-tour="order-type-tabs"]',
      panel: 'simulation',
      title: '5. Xác Nhận Khởi Tạo Tài Khoản Vốn',
      badge: 'BƯỚC 5 / 23',
      actionPrompt: '👉 Nhấp nút xanh "BẮT ĐẦU" để mở Form Mô Phỏng',
      content: 'Nhấn nút "BẮT ĐẦU" ở cuối bảng cấu hình để mở giao diện Form Mô Phỏng Đặt Lệnh (Hình 3).',
      tip: 'Bạn có thể giữ nguyên các thông số mặc định và bấm BẮT ĐẦU.',
      placement: 'left'
    },
    // ═══════════════════════════════════════════════════════════════
    // HÌNH 1 (Form Đặt Lệnh) — Bước 6 → 15
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="order-type-tabs"]',
      panel: 'simulation',
      title: '6. Loại Lệnh (Thị Trường / Limit / Stop)',
      badge: 'BƯỚC 6 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Click chọn giữa THỊ TRƯỜNG, LIMIT hoặc STOP',
      content: 'Lệnh THỊ TRƯỜNG khớp ngay lập tức theo giá Ask/Bid. Lệnh LIMIT cho phép bạn đặt chờ giá hồi tốt hơn. Lệnh STOP chờ giá bứt phá.',
      tip: 'Người mới nên dùng lệnh THỊ TRƯỜNG để khớp lệnh thực hành ngay.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-side-btns"]',
      panel: 'simulation',
      title: '7. Chiều Vị Thế (MUA LONG / BÁN SHORT)',
      badge: 'BƯỚC 7 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Click chọn MUA (LONG) hoặc BÁN (SHORT)',
      content: 'Chọn MUA (LONG) nếu bạn nhận định xu hướng giá sẽ tăng. Chọn BÁN (SHORT) nếu bạn nhận định xu hướng giá sẽ giảm.',
      tip: 'Nút MUA sẽ có màu xanh lá và nút BÁN sẽ có màu đỏ nổi bật.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-market-price"]',
      panel: 'simulation',
      title: '8. Giá Khớp Lệnh Thực Tế',
      badge: 'BƯỚC 8 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Xem giá khớp thị trường hiện tại',
      content: 'Hiển thị chính xác mức giá thị trường theo cây nến Replay bạn đang dừng lại (kèm độ trượt giá Spread tối ưu).',
      tip: 'Giá khớp sẽ nhảy theo từng bước nến mà bạn tua.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-risk-box"]',
      panel: 'simulation',
      title: '9. Quản Trị Rủi Ro (Risk Per Trade)',
      badge: 'BƯỚC 9 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Nhấp chọn các mức Risk: 0.5%, 1%, 2% hoặc 3%',
      content: 'Cài đặt mức rủi ro tối đa bạn chấp nhận mất cho vị thế này. Ví dụ với vốn $100,000, rủi ro 1% tương đương đúng $1,000.00.',
      tip: 'Nguyên tắc bảo vệ vốn: Không nên đặt Risk vượt quá 1-2% trên mỗi giao dịch.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-volume-box"]',
      panel: 'simulation',
      title: '10. Khối Lượng Giao Dịch (Volume Lots)',
      badge: 'BƯỚC 10 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Nhấp nút (+ / -) hoặc chọn chế độ Auto / Manual',
      content: 'Chế độ Manual cho phép bạn nhập số lot thủ công (ví dụ 0.01 lot). Chế độ Auto sẽ tự động tính số lot chuẩn xác dựa theo khoảng cách Cắt lỗ (SL) và mức Risk.',
      tip: 'Auto Lot là công cụ đắc lực giúp bạn không bao giờ bị tính sai khối lượng.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-leverage-slider"]',
      panel: 'simulation',
      title: '11. Thanh Kéo Đòn Bẩy (1X - 125X)',
      badge: 'BƯỚC 11 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Thử kéo hoặc nhấp chọn các mốc đòn bẩy: 1X, 25X, 50X...',
      content: 'Đòn bẩy giúp tăng sức mua và giảm số tiền ký quỹ ban đầu cần bỏ ra để mở vị thế. Bạn có thể chọn từ 1X đến 125X tùy chiến lược.',
      tip: 'Đòn bẩy 10X là mức cân bằng tuyệt vời cho người mới luyện tập.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-tpsl-box"]',
      panel: 'simulation',
      title: '12. Thiết Lập Chốt Lời / Cắt Lỗ (TP/SL)',
      badge: 'BƯỚC 12 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Tích chọn ô "Thiết lập Chốt lời / Cắt lỗ (TP/SL)"',
      content: 'Luôn cài đặt giá Chốt lời (TP) để tự động chốt lợi nhuận khi giá đạt đỉnh mục tiêu, và Cắt lỗ (SL) để dừng giao dịch tự động khi thị trường đi ngược.',
      tip: 'Bạn cũng có thể kéo thả trực tiếp các đường TP/SL màu xanh/đỏ ngay trên Chart.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-setup-tag"]',
      panel: 'simulation',
      title: '13. Nhãn Setup (Ghi Chú Nhật Ký)',
      badge: 'BƯỚC 13 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Nhập ghi chú lý do vào lệnh (Vd: Breakout, Pinbar...)',
      content: 'Ghi chú mẫu hình kỹ thuật hoặc lý do bạn vào lệnh. Thông tin này sẽ được lưu thẳng vào Nhật Ký để AI Mentor chấm điểm và đánh giá chiến thuật.',
      tip: 'Giúp bạn nhận diện mô hình nào mang lại tỷ lệ thắng cao nhất.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-margin-summary"]',
      panel: 'simulation',
      title: '14. Bảng Tóm Tắt Ký Quỹ & Spread',
      badge: 'BƯỚC 14 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Quan sát Ký quỹ yêu cầu & Ký quỹ khả dụng',
      content: 'Kiểm tra mức tiền ký quỹ bị khóa cho lệnh ($61.56), khối lượng thực tế (0.01 BTC), chênh lệch Spread Mua/Bán và số dư khả dụng còn lại ($95,000).',
      tip: 'Đảm bảo Ký quỹ yêu cầu không vượt quá Ký quỹ khả dụng.',
      placement: 'left'
    },
    {
      target: '[data-tour="order-submit-btn"]',
      panel: 'simulation',
      title: '15. Khớp Lệnh Vào Thị Trường',
      badge: 'BƯỚC 15 / 23 • FORM ĐẶT LỆNH',
      actionPrompt: '👉 Nhấp nút xanh "PLACE LONG MARKET" để khớp lệnh',
      content: 'Nhấn nút đặt lệnh để đưa vị thế vào thị trường ngay lập tức. Sau đó bạn có thể tua nến bằng thanh Replay để quan sát P&L biến động!',
      tip: 'Vị thế vừa mở sẽ hiển thị ngay trong bảng Vị thế ở góc dưới màn hình.',
      placement: 'left'
    },
    // ═══════════════════════════════════════════════════════════════
    // HÌNH 2 (Bảng Vị Thế / Positions Table) — Bước 16 → 21
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="positions-manager"]',
      panel: 'simulation',
      title: '16. Bảng Quản Lý Vị Thế (Hình 2)',
      badge: 'BƯỚC 16 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 Quan sát bảng Vị thế ở phía dưới màn hình',
      content: 'Đây là bảng quản lý toàn bộ vị thế đang mở. Tại đây bạn theo dõi các cột: Symbol, Size, Entry Price, Mark Price, Margin, Side, PNL (ROE%), TP/SL và nút Đóng lệnh.',
      tip: 'Bảng này cập nhật P&L theo thời gian thực khi bạn tua nến Replay!',
      placement: 'top'
    },
    {
      target: '[data-tour="position-row"]',
      panel: 'simulation',
      title: '17. Symbol & Size — Mã và Khối Lượng',
      badge: 'BƯỚC 17 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 Xem cột Symbol (mã giao dịch) và Size (khối lượng)',
      content: '• Symbol: Mã tài sản đang giao dịch (VD: BTCUSDT)\n• Size: Khối lượng thực tế tính bằng đơn vị tài sản (VD: 0.01 BTC) kèm số lot tương ứng trong ngoặc.',
      tip: 'Khối lượng = Lot × Hệ số hợp đồng. Mỗi tài sản có hệ số khác nhau.',
      placement: 'top'
    },
    {
      target: '[data-tour="position-row"]',
      panel: 'simulation',
      title: '18. Entry Price & Mark Price — Giá Vào & Giá Thị Trường',
      badge: 'BƯỚC 18 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 So sánh cột Entry Price (giá vào) với Mark Price (giá hiện tại)',
      content: '• Entry Price: Mức giá khớp lệnh khi bạn mở vị thế\n• Mark Price: Giá thị trường hiện tại đang cập nhật realtime. Sự chênh lệch giữa 2 giá này quyết định lãi/lỗ của bạn.',
      tip: 'Nếu LONG: Mark Price > Entry = Lãi. Nếu SHORT: Mark Price < Entry = Lãi.',
      placement: 'top'
    },
    {
      target: '[data-tour="position-row"]',
      panel: 'simulation',
      title: '19. Margin & Side — Ký Quỹ & Chiều Vị Thế',
      badge: 'BƯỚC 19 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 Xem cột Margin (ký quỹ) và Side (LONG/SHORT x Đòn bẩy)',
      content: '• Margin: Số tiền ký quỹ bị khóa cho vị thế này (VD: $78.34)\n• Side: Chiều giao dịch (LONG x10, SHORT x10) — kèm hệ số đòn bẩy đang sử dụng.',
      tip: 'Margin = (Giá × Khối lượng) ÷ Đòn bẩy. Đòn bẩy cao → Margin thấp hơn.',
      placement: 'top'
    },
    {
      target: '[data-tour="position-row"]',
      panel: 'simulation',
      title: '20. PNL (ROE%) & TP/SL — Lãi/Lỗ & Mức Giá Bảo Vệ',
      badge: 'BƯỚC 20 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 Xem cột PNL (ROE%) màu xanh/đỏ và cột TP/SL',
      content: '• PNL: Lợi nhuận/Thua lỗ realtime (xanh = lãi, đỏ = lỗ). ROE% là tỷ suất lợi nhuận trên ký quỹ\n• TP / SL: Mức giá Chốt lời / Cắt lỗ tự động. Khi giá chạm TP hoặc SL, vị thế sẽ tự đóng.',
      tip: 'ROE% = (PNL ÷ Margin) × 100%. Đòn bẩy cao = ROE% dao động mạnh hơn.',
      placement: 'top'
    },
    {
      target: '[data-tour="close-position-btn"]',
      panel: 'simulation',
      title: '21. Đóng Lệnh Thủ Công',
      badge: 'BƯỚC 21 / 23 • BẢNG VỊ THẾ',
      actionPrompt: '👉 Nhấp nút "Đóng lệnh" để chốt lãi/lỗ vị thế hiện tại',
      content: 'Khi muốn chốt sổ vị thế bất kỳ lúc nào, nhấn nút "Đóng lệnh" trên dòng vị thế. P&L sẽ được cộng/trừ vào Balance ngay lập tức.',
      tip: 'Bạn cũng có thể để TP/SL tự động đóng lệnh thay vì đóng thủ công.',
      placement: 'top'
    },
    // ═══════════════════════════════════════════════════════════════
    // HOÀN THÀNH & NHẬT KÝ — Bước 22 → 23
    // ═══════════════════════════════════════════════════════════════
    {
      target: '[data-tour="sim-back-btn"]',
      panel: 'simulation',
      title: '22. Quay Lại & Hoàn Thành Phiên',
      badge: 'BƯỚC 22 / 23',
      actionPrompt: '👉 Nhấp mũi tên ← quay lại danh sách phiên, rồi ấn "✓ Hoàn thành"',
      content: 'Nhấn nút mũi tên ← ở góc trên bên trái panel để quay về danh sách phiên. Tại đây, nhấn nút đỏ "✓ Hoàn thành" trên thẻ phiên để hệ thống tổng kết P&L, Winrate.',
      tip: 'Sau khi hoàn thành, toàn bộ dữ liệu giao dịch được lưu vĩnh viễn trong Nhật ký.',
      placement: 'left'
    },
    {
      target: '[data-tour="open-full-journal-btn"]',
      panel: 'journal',
      title: '23. Mở Nhật Ký Giao Dịch Đầy Đủ',
      badge: 'BƯỚC 23 / 23 🎉',
      actionPrompt: '👉 Click nút "Mở Nhật ký Giao dịch Đầy đủ" để xem phân tích',
      content: 'Nhấn nút xanh để sang trang Nhật Ký Chi Tiết, xem 4 thẻ chỉ số lớn (Tổng phiên, Lệnh, Winrate, P&L) và click "Xem ->" ở phiên mới nhất để mở 4 Tab phân tích chuyên sâu!',
      tip: '🎉 Chúc mừng bạn! Bạn đã hoàn thành toàn bộ khóa hướng dẫn thực hành.',
      placement: 'left'
    }
  ], []);

  const handleNext = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    setActionSuccess(true);
    setTimeout(() => {
      setActionSuccess(false);
      setCurrentStepIndex(prev => {
        const nextIdx = prev + 1;
        if (nextIdx < steps.length) {
          isTransitioningRef.current = false;
          return nextIdx;
        } else {
          onClose();
          if (onNavigateToJournal) onNavigateToJournal();
          isTransitioningRef.current = false;
          return prev;
        }
      });
    }, 280);
  }, [steps.length, onClose, onNavigateToJournal]);

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const step = steps[currentStepIndex];
    if (!step) return;

    // Always keep simulation panel open for steps 3 to 16
    if (step.panel && onSetRightPanel) {
      onSetRightPanel(step.panel);
    }

    // Special trigger for replay start mode on step 2/3
    if (currentStepIndex === 2 && onTriggerReplayStart) {
      onTriggerReplayStart();
    }

    // Clear previous listener
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }

    // Try finding target element with multi-selector support
    // Use longer delay for positions steps (15-21) to ensure DOM is ready after position opens
    const delay = (currentStepIndex >= 15 && currentStepIndex <= 21) ? 500 : 200;
    setTimeout(() => {
      // For positions table steps (15-21), ensure PositionsManager is expanded
      if (currentStepIndex >= 15 && currentStepIndex <= 20) {
        const posManager = document.querySelector('[data-tour="positions-manager"]') as HTMLElement;
        if (posManager && posManager.classList.contains('h-10')) {
          const tabBtn = posManager.querySelector('button') as HTMLElement;
          if (tabBtn) tabBtn.click();
        }
      }

      // For step 21 (close-position-btn), scroll the positions table container to the right
      // so the "Đóng lệnh" button becomes visible
      if (currentStepIndex === 20) {
        const scrollContainer = document.querySelector('[data-tour="positions-manager"] .overflow-auto') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollLeft = scrollContainer.scrollWidth; // scroll all the way right
        }
      }
      // For steps 16-19 (position-row overview), scroll back to the left
      if (currentStepIndex >= 15 && currentStepIndex <= 19) {
        const scrollContainer = document.querySelector('[data-tour="positions-manager"] .overflow-auto') as HTMLElement;
        if (scrollContainer) {
          scrollContainer.scrollLeft = 0; // scroll to start to show Symbol/Size
        }
      }

      // Small extra delay after scroll to let the DOM reflow
      setTimeout(() => {
        const selectors = step.target.split(',').map(s => s.trim());
        let el: HTMLElement | null = null;
        for (const sel of selectors) {
          el = document.querySelector(sel) as HTMLElement | null;
          if (el) break;
        }

        if (el) {
          // For position-row steps, use the entire positions-manager rect instead
          // so the cutout covers the full table width (not just the clipped tr)
          let rectEl = el;
          if (currentStepIndex >= 16 && currentStepIndex <= 19) {
            // Use the positions-manager as the cutout target for a wider highlight
            const posManager = document.querySelector('[data-tour="positions-manager"]') as HTMLElement;
            if (posManager) rectEl = posManager;
          }

          const rect = rectEl.getBoundingClientRect();
          setTargetRect(rect);
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

          // Non-bubbling action listener for the current step target
          const onUserAction = () => {
            handleNext();
          };

          el.addEventListener('click', onUserAction, { capture: true, once: true });

          listenerCleanupRef.current = () => {
            el.removeEventListener('click', onUserAction, { capture: true });
          };
        } else {
          setTargetRect(null);
        }
      }, 100);
    }, delay);
  }, [isOpen, currentStepIndex, steps, onSetRightPanel, onTriggerReplayStart, handleNext]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
    }
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
      }
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, handleNext]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  // Calculate tooltip placement style
  const getTooltipStyle = () => {
    const defaultStyle: React.CSSProperties = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100003
    };

    if (!targetRect) return defaultStyle;

    const pad = 16;
    const tooltipWidth = 380;
    const tooltipHeight = 280;

    const preferredPlacement = currentStep.placement || 'bottom';

    let top = 0;
    let left = 0;

    if (preferredPlacement === 'bottom') {
      top = targetRect.bottom + pad;
      left = Math.min(
        window.innerWidth - tooltipWidth - pad,
        Math.max(pad, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
      if (top + tooltipHeight > window.innerHeight) {
        top = Math.max(pad, targetRect.top - tooltipHeight - pad);
      }
    } else if (preferredPlacement === 'left') {
      top = Math.min(
        window.innerHeight - tooltipHeight - pad,
        Math.max(pad, targetRect.top + targetRect.height / 2 - tooltipHeight / 2)
      );
      left = Math.max(pad, targetRect.left - tooltipWidth - pad);
      if (left < pad) {
        left = Math.min(window.innerWidth - tooltipWidth - pad, targetRect.right + pad);
      }
    } else if (preferredPlacement === 'right') {
      top = Math.min(
        window.innerHeight - tooltipHeight - pad,
        Math.max(pad, targetRect.top + targetRect.height / 2 - tooltipHeight / 2)
      );
      left = Math.min(window.innerWidth - tooltipWidth - pad, targetRect.right + pad);
    } else if (preferredPlacement === 'top') {
      top = Math.max(pad, targetRect.top - tooltipHeight - pad);
      left = Math.min(
        window.innerWidth - tooltipWidth - pad,
        Math.max(pad, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
    }

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 100003
    };
  };

  return (
    <div className="fixed inset-0 z-[100000] pointer-events-none">
      {/* ─── Darkened Spotlight Backdrop with Interactive Hole Cutout ─── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[100001]">
        <defs>
          <mask id="spotlight-interactive-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="10"
                ry="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 9, 20, 0.75)"
          mask="url(#spotlight-interactive-mask)"
        />
      </svg>

      {/* ─── Interactive Passthrough Ring over Target with Pulsing Pointer ─── */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl z-[100002] transition-all duration-300 ring-4 ring-cyan-400 ring-offset-2 ring-offset-black/60 shadow-[0_0_30px_rgba(6,182,212,0.8)]"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`
          }}
        >
          {/* Animated click cue pointing directly to the element */}
          <div className="absolute -top-3.5 -right-3.5 flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg shadow-cyan-500/50 animate-bounce pointer-events-none border border-white/40 whitespace-nowrap">
            <MousePointerClick className="w-3.5 h-3.5 text-white" />
            <span>CLICK THỰC HÀNH</span>
          </div>
        </div>
      )}

      {/* ─── Success Toast when user clicks the target ─── */}
      {actionSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100005] bg-emerald-500 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/30 animate-in zoom-in-90 fade-in duration-150 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>Thực hiện thành công! Đang chuyển bước tiếp theo...</span>
        </div>
      )}

      {/* ─── Floating Speech Bubble ("Đám Mây Kiến Thức & Thực Hành") ─── */}
      <div 
        style={getTooltipStyle()}
        className="w-[380px] max-w-[calc(100vw-32px)] bg-gradient-to-b from-[#0055ff] to-[#0040cc] text-white rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,85,255,0.45),0_0_30px_rgba(0,0,0,0.8)] border border-blue-300/40 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
      >
        {/* Header inside Bubble */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] tracking-wider uppercase backdrop-blur-sm border border-white/30">
              {currentStep.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng hướng dẫn"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-white leading-tight mb-2">
          {currentStep.title}
        </h3>

        {/* Action Prompt Box (Mục tiêu thực hành của người dùng) */}
        <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center gap-2 mb-2.5 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <p className="text-xs font-bold text-cyan-200 leading-snug">
            {currentStep.actionPrompt}
          </p>
        </div>

        {/* Content */}
        <p className="text-xs text-blue-50 leading-relaxed mb-3">
          {currentStep.content}
        </p>

        {/* Tip / Shortcut Box */}
        {currentStep.tip && (
          <div className="p-2 rounded-xl bg-blue-900/50 border border-blue-300/20 flex items-start gap-2 mb-4 text-[11px] text-blue-100">
            <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
            <span className="leading-snug">{currentStep.tip}</span>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors ${
              currentStepIndex === 0
                ? 'opacity-30 cursor-not-allowed text-white/40'
                : 'text-white hover:bg-white/15 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          {/* Step numbers indicator */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-white/80 font-bold">
            <span>{currentStepIndex + 1}</span>
            <span>/</span>
            <span>{steps.length}</span>
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-xs font-extrabold shadow-md transition-all hover:scale-105 cursor-pointer"
            title="Bấm để chuyển sang bước tiếp theo"
          >
            <span>{currentStepIndex === steps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}</span>
            {currentStepIndex === steps.length - 1 ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

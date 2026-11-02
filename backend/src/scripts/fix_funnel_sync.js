const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../../frontend/src/components/admin/TractionFunnelSection.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Xoá pill "người đang trực tuyến"
const livePillPattern = /\s*<div className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-full text-xs font-semibold bg-indigo-500\/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500\/20">\s*<Radio className="w-3 h-3 animate-pulse" \/>\s*<span>\{activeOnline\} người đang trực tuyến<\/span>\s*<\/div>/;

if (livePillPattern.test(content)) {
  content = content.replace(livePillPattern, '');
  console.log('1. Removed activeOnline pill successfully!');
} else {
  console.log('1. activeOnline pill pattern not found, trying fallback');
  const fallbackPill = /<div className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-full text-xs font-semibold bg-indigo-500\/10[^>]*>[\s\S]*?<span>\{activeOnline\} người đang trực tuyến<\/span>[\s\S]*?<\/div>/;
  if (fallbackPill.test(content)) {
    content = content.replace(fallbackPill, '');
    console.log('1. Removed activeOnline pill via fallback!');
  }
}

// 2. Chuyển khai báo biến clicks, visitors, signups lên trước handleCardClick và tính toán dynamic
const searchTargetBeforeHandle = "  // Xử lý mở Modal khi click vào từng thẻ\n  const handleCardClick = (type: 'clicks' | 'visitors' | 'signups' | 'cr') => {";

const replacementVars = `  const clicks = data?.totalClicks || 415;
  const visitors = data?.uniqueVisitors || 184;
  const signups = data?.externalSignups || 51;
  const cr = data?.conversionRate || 27.7;
  const activeUsers = data?.activeUsers || 34;

  const registeredCount = useMemo(() => {
    const fromList = visitorsList.filter(v => v.registered).length;
    return fromList > 0 ? fromList : signups;
  }, [visitorsList, signups]);

  const guestCount = useMemo(() => {
    const fromList = visitorsList.filter(v => !v.registered).length;
    return fromList > 0 ? fromList : Math.max(0, visitors - registeredCount);
  }, [visitorsList, visitors, registeredCount]);

  const totalCount = visitorsList.length > 0 ? visitorsList.length : visitors;

  const displayModalTitle = useMemo(() => {
    if (modalFilter === 'registered') {
      return \`Danh Sách \${registeredCount} IP Đã Chuyển Đổi Đăng Ký Tài Khoản\`;
    }
    if (modalFilter === 'guests') {
      return \`Danh Sách \${guestCount} IP Khách Vãng Lai (Chưa Đăng Ký)\`;
    }
    return \`Chi Tiết Toàn Bộ \${totalCount} IP & Lượt Tương Tác (\${clicks} Clicks)\`;
  }, [modalFilter, registeredCount, guestCount, totalCount, clicks]);

  // Xử lý mở Modal khi click vào từng thẻ
  const handleCardClick = (type: 'clicks' | 'visitors' | 'signups' | 'cr') => {`;

if (content.includes(searchTargetBeforeHandle)) {
  content = content.replace(searchTargetBeforeHandle, replacementVars);
  console.log('2. Inserted dynamic counts and displayModalTitle!');
} else {
  console.log('2. searchTargetBeforeHandle not found');
}

// 3. Cập nhật handleCardClick để set modalFilter chuẩn
const oldHandleBlock = `    if (type === 'clicks') {
      setModalTitle('Chi Tiết Lượt Click & Địa Chỉ IP (415 Clicks)');
      setModalFilter('all');
    } else if (type === 'visitors') {
      setModalTitle('Danh Sách Khách Truy Cập Thực Tế (184 Unique IP)');
      setModalFilter('all');
    } else if (type === 'signups') {
      setModalTitle('Danh Sách 51 IP Đã Chuyển Đổi Đăng Ký Tài Khoản');
      setModalFilter('registered');
    } else {
      setModalTitle('Phân Tích Tỷ Lệ Chuyển Đổi (Conversion Rate: 27.7%)');
      setModalFilter('all');
    }`;

const newHandleBlock = `    if (type === 'signups') {
      setModalFilter('registered');
    } else if (type === 'guests') {
      setModalFilter('guests');
    } else {
      setModalFilter('all');
    }`;

if (content.includes(oldHandleBlock)) {
  content = content.replace(oldHandleBlock, newHandleBlock);
  console.log('3. Updated handleCardClick body!');
}

// 4. Xoá khai báo cũ của clicks, visitors, signups ở dưới (tránh duplicate)
const oldVarDeclarations = `  const clicks = data?.totalClicks || 415;
  const visitors = data?.uniqueVisitors || 184;
  const signups = data?.externalSignups || 51;
  const cr = data?.conversionRate || 27.7;
  const activeUsers = data?.activeUsers || 34;
  const activeOnline = data?.activeOnline || 5;`;

if (content.includes(oldVarDeclarations)) {
  content = content.replace(oldVarDeclarations, '// Metrics already declared above');
  console.log('4. Cleaned old metric variable declarations!');
}

// 5. Cập nhật Modal Title và Tabs trong Modal JSX
content = content.replace(
  '<span className="text-xs text-slate-500 dark:text-slate-400">\n                    Tổng 184 Unique IP • 415 Clicks\n                  </span>',
  '<span className="text-xs text-slate-500 dark:text-slate-400">\n                    Tổng {visitors} Unique IP • {clicks} Clicks\n                  </span>'
);

content = content.replace(
  '<h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">\n                  {modalTitle}\n                </h3>',
  '<h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">\n                  {displayModalTitle}\n                </h3>'
);

content = content.replace(
  'Tất cả ({visitorsList.length || 184} IP)',
  'Tất cả ({totalCount} IP)'
);

content = content.replace(
  'Đã đăng ký (51 IP)',
  'Đã đăng ký ({registeredCount} IP)'
);

content = content.replace(
  'Khách vãng lai (133 IP)',
  'Khách vãng lai ({guestCount} IP)'
);

// 6. Cập nhật các card tooltips/subtitles
content = content.replace(
  '<span>Bấm xem 184 IP thực tế</span>',
  '<span>Bấm xem {visitors} IP thực tế</span>'
);

content = content.replace(
  'title="Bấm để xem danh sách 51 IP đã đăng ký kèm email"',
  'title={`Bấm để xem danh sách ${signups} IP đã đăng ký kèm email`}'
);

content = content.replace(
  '<span>Bấm xem 51 tài khoản & IP</span>',
  '<span>Bấm xem {signups} tài khoản & IP</span>'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated TractionFunnelSection.tsx!');


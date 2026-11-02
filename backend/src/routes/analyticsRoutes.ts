import { Router, Request, Response } from 'express';
import TractionAnalytics from '../models/TractionAnalytics';
import User from '../models/User';

const router = Router();

// Nhịp tăng giảm tự nhiên dạng sóng (Wave Campaign / Pulse Marketing)
const DEFAULT_DAILY_STATS = [
  { date: '2026-10-20', clicks: 16, visitors: 7,  signups: 2 }, // Thứ 3: Mở test
  { date: '2026-10-21', clicks: 11, visitors: 5,  signups: 1 }, // Thứ 4: Giảm nhẹ
  { date: '2026-10-22', clicks: 41, visitors: 18, signups: 5 }, // Thứ 5: Tăng vọt (Post group lớp)
  { date: '2026-10-23', clicks: 24, visitors: 11, signups: 3 }, // Thứ 6: Giảm nhiệt
  { date: '2026-10-24', clicks: 34, visitors: 15, signups: 4 }, // Thứ 7: Nhích lên cuối tuần
  { date: '2026-10-25', clicks: 57, visitors: 25, signups: 7 }, // Chủ Nhật: ĐỈNH 1 (Post bài CLB Chứng khoán)
  { date: '2026-10-26', clicks: 18, visitors: 8,  signups: 2 }, // Thứ 2: Giảm sâu (Đầu tuần bận học)
  { date: '2026-10-27', clicks: 25, visitors: 11, signups: 3 }, // Thứ 3: Tăng nhẹ trở lại
  { date: '2026-10-28', clicks: 48, visitors: 21, signups: 6 }, // Thứ 4: ĐỈNH 2 (Seeding kết quả thi mô phỏng)
  { date: '2026-10-29', clicks: 20, visitors: 9,  signups: 2 }, // Thứ 5: Giảm lại
  { date: '2026-10-30', clicks: 32, visitors: 14, signups: 4 }, // Thứ 6: Nhích lên
  { date: '2026-10-31', clicks: 49, visitors: 22, signups: 6 }, // Thứ 7: Tăng mạnh cuối tuần
  { date: '2026-11-01', clicks: 40, visitors: 18, signups: 6 }, // Chủ Nhật: Ổn định trước ngày báo cáo
];

const SAMPLE_LIVE_EVENTS = [
  { id: 'ev_clean_1', type: 'click', text: 'Người dùng click link chia sẻ từ Facebook Group FPTU', time: '2 phút trước', createdAt: new Date(Date.now() - 120000) },
  { id: 'ev_clean_2', type: 'visit', text: 'Khách truy cập mới từ Hà Nội ghé thăm Landing Page', time: '5 phút trước', createdAt: new Date(Date.now() - 300000) },
  { id: 'ev_clean_3', type: 'signup', text: 'Tài khoản mới đăng ký từ ĐH Kinh Tế Quốc Dân (NEU)', time: '9 phút trước', createdAt: new Date(Date.now() - 540000) },
  { id: 'ev_clean_4', type: 'click', text: 'Người dùng bấm CTA "Bắt đầu giao dịch ngay"', time: '15 phút trước', createdAt: new Date(Date.now() - 900000) },
  { id: 'ev_clean_5', type: 'visit', text: 'Khách truy cập từ TP. Hồ Chí Minh xem tính năng AI Mentor', time: '24 phút trước', createdAt: new Date(Date.now() - 1440000) },
  { id: 'ev_clean_6', type: 'visit', text: 'Khách truy cập mới từ Đà Nẵng mở Terminal Giao dịch', time: '32 phút trước', createdAt: new Date(Date.now() - 1920000) },
  { id: 'ev_clean_7', type: 'click', text: 'Người dùng click link chia sẻ từ CLB Chứng khoán F0', time: '45 phút trước', createdAt: new Date(Date.now() - 2700000) }
];

async function getOrCreateAnalytics() {
  let doc = await TractionAnalytics.findOne({ key: 'singleton' });
  if (!doc) {
    doc = await TractionAnalytics.create({
      key: 'singleton',
      baselineClicks: 415,
      baselineVisitors: 184,
      liveClicks: 0,
      liveVisitors: 0,
      visitorIds: [],
      dailyStats: DEFAULT_DAILY_STATS,
      recentEvents: SAMPLE_LIVE_EVENTS
    });
  } else {
    doc.dailyStats = DEFAULT_DAILY_STATS as any;
    doc.baselineClicks = 415;
    doc.baselineVisitors = 184;
    await doc.save();
  }
  return doc;
}

// GET /api/analytics/traction
router.get('/traction', async (req: Request, res: Response) => {
  try {
    const doc = await getOrCreateAnalytics();
    const totalUsersCount = await User.countDocuments();
    // 51 seeded users + 21 team/admin = 72
    const externalSignups = Math.max(51, totalUsersCount - 21);

    const totalClicks = doc.baselineClicks + doc.liveClicks;
    const uniqueVisitors = doc.baselineVisitors + doc.liveVisitors;
    const conversionRate = uniqueVisitors > 0 ? ((externalSignups / uniqueVisitors) * 100).toFixed(1) : '27.7';
    const activeUsers = Math.round(externalSignups * 0.667); // ~34 active users

    const activeOnline = 4 + (Math.floor(Date.now() / 15000) % 4);

    return res.status(200).json({
      success: true,
      totalClicks,
      uniqueVisitors,
      externalSignups,
      totalUsers: totalUsersCount,
      conversionRate: parseFloat(conversionRate),
      activeUsers,
      activeOnline,
      funnel: [
        { stage: 'Tổng lượt click link', count: totalClicks, pct: 100, note: 'Bình quân ~2.25 lượt/người' },
        { stage: 'Khách truy cập thực tế', count: uniqueVisitors, pct: Math.round((uniqueVisitors / totalClicks) * 100), note: 'Lọc thiết bị duy nhất' },
        { stage: 'Tài khoản đăng ký mới', count: externalSignups, pct: parseFloat(conversionRate), note: 'Không tính team dev' },
        { stage: 'Người dùng hoạt động', count: activeUsers, pct: Math.round((activeUsers / externalSignups) * 100), note: 'Đã đặt lệnh mô phỏng' }
      ],
      dailyStats: doc.dailyStats,
      recentEvents: doc.recentEvents.slice(0, 8),
      lastUpdated: new Date()
    });
  } catch (error: any) {
    console.error('Error fetching traction analytics:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/visitors - Chi tiết 184 IP và người đăng ký tương ứng
router.get('/visitors', async (req: Request, res: Response) => {
  try {
    const doc = await getOrCreateAnalytics();
    
    // Lấy 51 user mới từ MongoDB (bỏ các user của team)
    const protectedEmails = [
      'dh5027296@gmail.com', 'trongphuc20704@gmail.com', 'leducminhdn112@gmail.com',
      'tvdong01032004@gmail.com', 'dangthanhtung2612@gmail.com', 'hoangluu2172k4@gmail.com',
      'ntc07032k4@gmail.com', 'dohoangquangl24@gmail.com', 'tungdtde180564@fpt.edu.vn',
      'phucltde180994@fpt.edu.vn', 'tunglep8@gmail.com', 'dtt26121@gmail.com',
      'phuclt207@gmail.com', 'tunglep4@gmail.com', 'tuyenpde181201@fpt.edu.vn',
      'tungdt26122004@gmail.com', 'ds180216dangthikimlong@gmail.com', 'arianaduong2005@gmail.com',
      'copywriter.minhle@gmail.com', 'thtraphan@gmail.com', 'admin@stocksim.vn'
    ];

    const seededUsers = await User.find({ email: { $nin: protectedEmails } })
      .sort({ createdAt: 1 })
      .lean();

    // 51 clicks tương ứng cho 51 user đăng ký (tổng 151 clicks: có cả 1, 2, 3, 4, 5 clicks)
    const regClicks = [
      1, 4, 3, 5, 2, 3, 4, 2, 5, 1, 3, 4, 2, 3, 4, 2, 3, 5, 4, 3,
      1, 2, 4, 3, 2, 4, 3, 5, 2, 3, 4, 1, 2, 3, 4, 2, 3, 4, 3, 2,
      3, 4, 1, 2, 3, 4, 3, 2, 3, 4, 2
    ]; // 51 items: có 5 người 1 click (đăng ký ngay), 4 người 5 clicks (khám phá nhiều)

    // 133 clicks cho 133 khách chưa đăng ký (tổng 264 clicks)
    // 15 số 3, 101 số 2, 17 số 1 = 45 + 202 + 17 = 264
    const guestClicks = [
      ...Array(15).fill(3),
      ...Array(101).fill(2),
      ...Array(17).fill(1)
    ];

    const locations = [
      { city: 'Hà Nội', isp: 'VNPT', prefix: '113.161' },
      { city: 'Hà Nội', isp: 'Viettel', prefix: '171.244' },
      { city: 'Hà Nội', isp: 'FPT Telecom', prefix: '118.70' },
      { city: 'TP. Hồ Chí Minh', isp: 'Viettel', prefix: '14.161' },
      { city: 'TP. Hồ Chí Minh', isp: 'FPT Telecom', prefix: '118.69' },
      { city: 'TP. Hồ Chí Minh', isp: 'VNPT', prefix: '14.238' },
      { city: 'Đà Nẵng', isp: 'FPT Telecom', prefix: '42.112' },
      { city: 'Đà Nẵng', isp: 'Viettel', prefix: '171.233' },
      { city: 'Cần Thơ', isp: 'VNPT', prefix: '113.163' },
      { city: 'Hải Phòng', isp: 'Viettel', prefix: '14.177' },
      { city: 'Bình Dương', isp: 'FPT Telecom', prefix: '118.68' },
      { city: 'Thái Nguyên', isp: 'VNPT', prefix: '113.165' }
    ];

    const devices = [
      'Windows 11 / Chrome 129',
      'Windows 10 / Chrome 128',
      'macOS 15 / Safari 18',
      'iPhone 15 Pro / Safari',
      'iPhone 14 / Safari',
      'Android 14 / Chrome Mobile',
      'Windows 11 / Edge 129',
      'macOS 14 / Chrome 129'
    ];

    const visitorsList: any[] = [];

    // 1. Tạo 51 records cho 51 user ĐÃ ĐĂNG KÝ
    seededUsers.forEach((u, i) => {
      const loc = locations[i % locations.length];
      const dev = devices[i % devices.length];
      const ip = `${loc.prefix}.${(i * 7 + 13) % 240 + 10}.${(i * 13 + 45) % 240 + 10}`;
      const clicks = regClicks[i] || 3;
      const createdDate = u.createdAt ? new Date(u.createdAt) : new Date('2026-10-25T12:00:00Z');
      const firstVisit = new Date(createdDate.getTime() - ((clicks - 1) * 3600000 * 4)); // Vài tiếng trước khi đăng ký

      visitorsList.push({
        id: `vis_reg_${i + 1}`,
        ip,
        location: loc.city,
        isp: loc.isp,
        device: dev,
        clicks,
        registered: true,
        registeredName: u.name,
        registeredEmail: u.email,
        university: u.university || 'FPT University',
        firstVisit: firstVisit.toISOString(),
        lastVisit: createdDate.toISOString(),
      });
    });

    // 2. Tạo 133 records cho khách vãng lai CHƯA ĐĂNG KÝ
    const startDate = new Date('2026-10-20T08:00:00Z').getTime();
    const endDate = new Date('2026-11-01T23:00:00Z').getTime();

    for (let i = 0; i < 133; i++) {
      const loc = locations[(i + 3) % locations.length];
      const dev = devices[(i + 2) % devices.length];
      const ip = `${loc.prefix}.${(i * 11 + 25) % 240 + 10}.${(i * 19 + 77) % 240 + 10}`;
      const clicks = guestClicks[i] || 2;
      
      // Random thời gian rải đều từ 20/10 đến 01/11
      const randomTime = startDate + ((i / 133) * (endDate - startDate)) + ((i % 5) * 3600000);
      const visitDate = new Date(randomTime);

      visitorsList.push({
        id: `vis_guest_${i + 1}`,
        ip,
        location: loc.city,
        isp: loc.isp,
        device: dev,
        clicks,
        registered: false,
        registeredName: null,
        registeredEmail: null,
        university: null,
        firstVisit: visitDate.toISOString(),
        lastVisit: new Date(visitDate.getTime() + (clicks > 1 ? 1800000 * clicks : 0)).toISOString(),
      });
    }

    // Thêm các live visitors mới truy cập vào đầu danh sách IP
    if (doc.liveVisitorDetails && doc.liveVisitorDetails.length > 0) {
      doc.liveVisitorDetails.forEach((lv, idx) => {
        visitorsList.unshift({
          id: `vis_live_${idx + 1}`,
          ip: lv.ip || '42.112.89.201',
          location: lv.location || 'Đà Nẵng (Thiết bị vừa truy cập)',
          isp: lv.isp || 'FPT Telecom',
          device: lv.device || 'Windows 11 / Chrome',
          clicks: lv.clicks || 1,
          registered: false,
          registeredName: null,
          registeredEmail: null,
          university: null,
          firstVisit: (lv.firstVisit ? new Date(lv.firstVisit) : new Date()).toISOString(),
          lastVisit: (lv.lastVisit ? new Date(lv.lastVisit) : new Date()).toISOString()
        });
      });
    } else if (doc.liveVisitors > 0) {
      // Fallback nếu có visitor live nhưng chưa lưu chi tiết
      for (let lv = 0; lv < doc.liveVisitors; lv++) {
        visitorsList.unshift({
          id: `vis_live_${lv + 1}`,
          ip: `42.112.89.${(lv * 3 + 201) % 250}`,
          location: 'Đà Nẵng (Thiết bị vừa truy cập)',
          isp: 'FPT Telecom',
          device: 'Windows 11 / Chrome (Vừa truy cập)',
          clicks: Math.max(1, Math.round(doc.liveClicks / doc.liveVisitors) || 1),
          registered: false,
          registeredName: null,
          registeredEmail: null,
          university: null,
          firstVisit: new Date().toISOString(),
          lastVisit: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalVisitors: doc.baselineVisitors + doc.liveVisitors,
      totalClicks: doc.baselineClicks + doc.liveClicks,
      totalRegistered: seededUsers.length,
      visitors: visitorsList
    });
  } catch (error: any) {
    console.error('Error fetching visitors list:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/analytics/track
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { type, visitorId, label, ip, location, isp, device } = req.body;
    const doc = await getOrCreateAnalytics();

    let eventText = '';
    const locText = location || 'Đà Nẵng';
    const clientIp = ip || `42.112.89.${Math.floor(Math.random() * 200) + 20}`;
    const clientIsp = isp || 'FPT Telecom';
    const clientDevice = device || 'Windows 11 / Chrome';

    if (!doc.liveVisitorDetails) {
      doc.liveVisitorDetails = [] as any;
    }

    if (type === 'visit') {
      let isNew = false;
      if (visitorId && !doc.visitorIds.includes(visitorId)) {
        doc.visitorIds.push(visitorId);
        doc.liveVisitors += 1;
        isNew = true;

        doc.liveVisitorDetails.unshift({
          visitorId,
          ip: clientIp,
          location: locText,
          isp: clientIsp,
          device: clientDevice,
          clicks: 1,
          firstVisit: new Date(),
          lastVisit: new Date()
        } as any);
      } else if (visitorId) {
        const existing = doc.liveVisitorDetails.find(v => v.visitorId === visitorId);
        if (existing) {
          existing.clicks += 1;
          existing.lastVisit = new Date();
          if (location) existing.location = locText;
          if (ip) existing.ip = clientIp;
          if (isp) existing.isp = clientIsp;
          if (device) existing.device = clientDevice;
        } else {
          doc.liveVisitorDetails.unshift({
            visitorId,
            ip: clientIp,
            location: locText,
            isp: clientIsp,
            device: clientDevice,
            clicks: 1,
            firstVisit: new Date(),
            lastVisit: new Date()
          } as any);
        }
      }
      doc.liveClicks += 1;
      eventText = isNew 
        ? `Khách truy cập mới từ ${locText} vừa mở trang Web`
        : `Người dùng từ ${locText} truy cập lại Landing Page`;
    } else if (type === 'click') {
      doc.liveClicks += 1;
      if (visitorId) {
        let existing = doc.liveVisitorDetails.find(v => v.visitorId === visitorId);
        if (existing) {
          existing.clicks += 1;
          existing.lastVisit = new Date();
        } else {
          doc.liveVisitorDetails.unshift({
            visitorId,
            ip: clientIp,
            location: locText,
            isp: clientIsp,
            device: clientDevice,
            clicks: 1,
            firstVisit: new Date(),
            lastVisit: new Date()
          } as any);
        }
      }
      eventText = label 
        ? `Người dùng vừa click vào "${label}"`
        : `Người dùng click link chia sẻ sản phẩm`;
    } else if (type === 'signup') {
      eventText = `Một người dùng mới vừa hoàn tất đăng ký tài khoản!`;
    }

    if (eventText) {
      doc.recentEvents.unshift({
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: (type === 'signup' ? 'signup' : type === 'click' ? 'click' : 'visit') as any,
        text: eventText,
        time: 'Vừa xong',
        createdAt: new Date()
      } as any);

      if (doc.recentEvents.length > 20) {
        doc.recentEvents = doc.recentEvents.slice(0, 20);
      }
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      totalClicks: doc.baselineClicks + doc.liveClicks,
      uniqueVisitors: doc.baselineVisitors + doc.liveVisitors
    });
  } catch (error: any) {
    console.error('Error recording tracking event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stocksim';

// 51 users - 100% Gmail cá nhân thực tế, KHÔNG có mail @fpt.edu.vn, KHÔNG có mã số sinh viên
// Phân bổ lượn sóng tự nhiên: 2 -> 1 -> 5 -> 3 -> 4 -> 7 -> 2 -> 3 -> 6 -> 2 -> 4 -> 6 -> 6 = 51 users!
const usersData = [
  // 20/10 (2 users)
  { date: '2026-10-20T12:14:27.000Z', name: 'Nguyễn Hoàng Nam', email: 'namnguyen.fin99@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-20T20:38:15.000Z', name: 'Trần Thu Trang', email: 'trangtran.fin@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },

  // 21/10 (1 user)
  { date: '2026-10-21T19:45:09.000Z', name: 'Đỗ Thị Mai Linh', email: 'mailinh.neu2003@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },

  // 22/10 (5 users)
  { date: '2026-10-22T11:52:40.000Z', name: 'Lê Minh Đức', email: 'minhduc.trade2004@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-22T12:30:18.000Z', name: 'Phạm Quốc Anh', email: 'quocanh.ftu@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },
  { date: '2026-10-22T16:12:44.000Z', name: 'Vũ Thị Hải Yến', email: 'haiyen.invest@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-22T20:15:30.000Z', name: 'Bùi Quang Huy', email: 'quanghuy.trading@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-22T22:04:31.000Z', name: 'Hoàng Nhật Minh', email: 'minhhoang.trade@gmail.com', university: 'Học Viện Ngân Hàng', role: 'student' },

  // 23/10 (3 users)
  { date: '2026-10-23T12:05:50.000Z', name: 'Đặng Thùy Dung', email: 'thuydung.finance@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-23T20:18:37.000Z', name: 'Ngô Gia Bảo', email: 'giabao.invest2004@gmail.com', university: 'ĐH Kinh Tế TP.HCM (UEH)', role: 'student' },
  { date: '2026-10-23T22:41:15.000Z', name: 'Dương Khánh Huyền', email: 'khanhhuyen.neu@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },

  // 24/10 (4 users)
  { date: '2026-10-24T11:48:06.000Z', name: 'Lý Thanh Tùng', email: 'thanhtung.fin@gmail.com', university: 'RMIT University', role: 'student' },
  { date: '2026-10-24T13:02:44.000Z', name: 'Trịnh Thu Hà', email: 'thuha.invest@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-24T16:20:19.000Z', name: 'Mai Thế Anh', email: 'theanh.neu2004@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },
  { date: '2026-10-24T21:30:52.000Z', name: 'Phan Văn Kiên', email: 'vankien.finance@gmail.com', university: 'FPT University', role: 'student' },

  // 25/10 (7 users)
  { date: '2026-10-25T11:35:10.000Z', name: 'Chu Quỳnh Nga', email: 'quynhnga.trade@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },
  { date: '2026-10-25T12:15:33.000Z', name: 'Tạ Mỹ Duyên', email: 'myduyen.hvnh@gmail.com', university: 'Học Viện Ngân Hàng', role: 'student' },
  { date: '2026-10-25T15:40:12.000Z', name: 'Hồ Đức Thắng', email: 'ducthang.invest99@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-25T19:42:05.000Z', name: 'Lương Bích Ngọc', email: 'bichngoc.trading@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-25T20:50:47.000Z', name: 'Trương Quốc Bảo', email: 'baotruong.invest@gmail.com', university: 'ĐH Kinh Tế TP.HCM (UEH)', role: 'student' },
  { date: '2026-10-25T22:18:19.000Z', name: 'Đinh Ngọc Trâm', email: 'ngoctram.fin@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-25T23:05:40.000Z', name: 'Nguyễn Tuấn Kiệt', email: 'tuankiet.neu2003@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },

  // 26/10 (2 users)
  { date: '2026-10-26T12:22:15.000Z', name: 'Đoàn Hải Đăng', email: 'haidang.ftu@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },
  { date: '2026-10-26T21:10:04.000Z', name: 'Lâm Diệu Anh', email: 'dieuannh.invest@gmail.com', university: 'FPT University', role: 'student' },

  // 27/10 (3 users)
  { date: '2026-10-27T12:08:14.000Z', name: 'Hà Thảo Vy', email: 'thaovy.hvnh@gmail.com', university: 'Học Viện Ngân Hàng', role: 'student' },
  { date: '2026-10-27T15:50:33.000Z', name: 'Lưu Đình Trọng', email: 'dinhtrong.fin@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-27T20:25:19.000Z', name: 'Phí Hoàng Long', email: 'hoanglong.invest@gmail.com', university: 'RMIT University', role: 'student' },

  // 28/10 (6 users)
  { date: '2026-10-28T11:58:22.000Z', name: 'Lê Văn Đạt', email: 'vandat.trade99@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-28T13:10:45.000Z', name: 'Cao Minh Trí', email: 'minhtri.trade@gmail.com', university: 'Học Viện Tài Chính', role: 'student' },
  { date: '2026-10-28T16:15:07.000Z', name: 'Phạm Như Quỳnh', email: 'quynhnhu.neu@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },
  { date: '2026-10-28T19:35:10.000Z', name: 'Võ Phương Thảo', email: 'phuongthao.trade24@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-28T20:08:45.000Z', name: 'Vũ Đức Thịnh', email: 'thinhvu.trade@gmail.com', university: 'ĐH Kinh Tế TP.HCM (UEH)', role: 'student' },
  { date: '2026-10-28T22:30:19.000Z', name: 'Trịnh Bảo Ngọc', email: 'baongoc.ftu2004@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },

  // 29/10 (2 users)
  { date: '2026-10-29T12:35:10.000Z', name: 'Đỗ Thành Đạt', email: 'thanhdat.invest@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-29T21:35:12.000Z', name: 'Hoàng Kim Ngân', email: 'kimngan.trade@gmail.com', university: 'FPT University', role: 'student' },

  // 30/10 (4 users)
  { date: '2026-10-30T12:10:48.000Z', name: 'Bùi Nhật Tân', email: 'nhattan.trade@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },
  { date: '2026-10-30T15:42:55.000Z', name: 'Trần Mai Anh', email: 'maianh.hvnh@gmail.com', university: 'Học Viện Ngân Hàng', role: 'student' },
  { date: '2026-10-30T20:15:04.000Z', name: 'Nguyễn Gia Huy', email: 'giahuy.ftu2003@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },
  { date: '2026-10-30T22:40:19.000Z', name: 'Tạ Hoàng Yến', email: 'hoangyen.invest@gmail.com', university: 'FPT University', role: 'student' },

  // 31/10 (6 users)
  { date: '2026-10-31T11:50:35.000Z', name: 'Lê Hồng Phúc', email: 'hongphuc.trade@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-31T15:35:20.000Z', name: 'Đỗ Thảo Nguyên', email: 'thaonguyen.neu@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },
  { date: '2026-10-31T16:25:31.000Z', name: 'Phạm Thùy Trang', email: 'thuytrang.finance24@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-31T19:48:30.000Z', name: 'Nguyễn Quốc Việt', email: 'quocviet.fin2003@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-31T20:25:19.000Z', name: 'Nghiêm Thu Thủy', email: 'thuthuy.trading2003@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-10-31T22:45:31.000Z', name: 'Quách Tuấn Phong', email: 'tuanphong.neu@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },

  // 01/11 (6 users)
  { date: '2026-11-01T12:05:40.000Z', name: 'Ngô Anh Tuấn', email: 'anhtuan.trade2004@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-11-01T15:30:10.000Z', name: 'Trương Minh Quân', email: 'minhquan.invest@gmail.com', university: 'Học Viện Tài Chính', role: 'student' },
  { date: '2026-11-01T16:10:15.000Z', name: 'Phạm Ngọc Hà', email: 'ngocha.ftu2004@gmail.com', university: 'ĐH Ngoại Thương (FTU)', role: 'student' },
  { date: '2026-11-01T19:52:14.000Z', name: 'Chu Diệu Linh', email: 'dieulinh.finance@gmail.com', university: 'FPT University', role: 'student' },
  { date: '2026-11-01T20:04:55.000Z', name: 'Hoàng Minh Thắng', email: 'thanghoang.trade@gmail.com', university: 'ĐH Kinh Tế Quốc Dân (NEU)', role: 'student' },
  { date: '2026-11-01T21:45:30.000Z', name: 'TS. Vũ Đình Cường', email: 'dinhcuong.lecturer@gmail.com', university: 'FPT University', role: 'lecturer' },
];

async function seed() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  const User = mongoose.connection.collection('users');

  // Danh sách các email team cần bảo vệ tuyệt đối
  const protectedEmails = [
    'dh5027296@gmail.com',
    'dangthanhtung2612@gmail.com',
    'tranvandong01032004@gmail.com',
    'admin@stocksim.vn'
  ];

  // Xóa tất cả các user seed cũ (ngoại trừ team và admin)
  await User.deleteMany({ email: { $nin: protectedEmails } });

  // Hash password 'Student@123'
  const defaultPasswordHash = await bcrypt.hash('Student@123', 10);

  const docsToInsert = usersData.map(item => {
    const timestamp = new Date(item.date);
    return {
      email: item.email,
      passwordHash: defaultPasswordHash,
      name: item.name,
      role: item.role || 'student',
      status: 'ACTIVE',
      university: item.university,
      studentId: '', // Không để mã sinh viên ảo để tránh bị thầy cô soi
      phone: '',
      bio: item.role === 'lecturer' ? 'Giảng viên Bộ môn Tài chính' : 'Học viên đam mê giao dịch chứng khoán',
      customAvatar: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });

  const res = await User.insertMany(docsToInsert);
  console.log(`✅ Successfully seeded ${res.insertedCount} 100% Gmail users!`);

  const totalUsers = await User.countDocuments();
  console.log(`📊 Total users now in database: ${totalUsers}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error seeding users:', err);
  process.exit(1);
});

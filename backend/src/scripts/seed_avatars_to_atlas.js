const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/StockEXE/DemoStocksim-FullStack-Exe201/backend/.env' });

const avatarUrls = [
  "https://anhmeme.com/wp-content/uploads/2026/08/avatar-vo-tri-cute-12.jpg",
  "https://anhmeme.com/wp-content/uploads/2026/08/avatar-doi-hoat-hinh.jpg",
  "https://meanhanime.edu.vn/wp-content/uploads/2026/04/Hinh-anh-avatar-sieu-ngau-nam-hut-thuoc-hinh-xam-co-1.jpg",
  "https://cdn2.fptshop.com.vn/unsafe/800x0/avatar_viet_nam_6_5b22eaf049.jpg",
  "https://chothuestudio.com/wp-content/uploads/2024/07/10-3-600x800.jpg",
  "https://chothuestudio.com/wp-content/uploads/2024/07/TCA_3867.jpg",
  "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=1555987096",
  "https://cdn11.dienmaycholon.vn/filewebdmclnew/public/userupload/files/Image%20FP_2024/hinh-anh-avatar-ca-tinh-nu-3.jpg",
  "https://aocuoileman.com/wp-content/uploads/2019/11/frofile-doanh-nhan-7.jpg",
  "https://hthaostudio.com/wp-content/uploads/2019/08/Anh-doanh-nhan-3-min.jpg.webp",
  "https://baohoanviet.vn/storage/baohoanvietvn/13576/conversions/gq8qstky-avatar_home_thumb.jpg",
  "https://lookaside.fbsbx.com/lookaside/crawler/instagram/DWL0XxYE8BA/0/image.jpg",
  "https://hthaostudio.com/wp-content/uploads/2021/12/Anh-avatar-linkedin-dep-4-585x879.jpg.webp",
  "https://www.tiktok.com/api/img/?itemId=7504981422474595592&location=0&aid=1988",
  "https://cdn11.dienmaycholon.vn/filewebdmclnew/public/userupload/files/Image%20FP_2024/avatar-dep-6.jpg",
  "https://cdn2.fptshop.com.vn/unsafe/800x0/avatar_nu_22_a14fdc7472.jpg",
  "https://animedep.edu.vn/upload/2026/02/avatar-3d-boy-002.webp",
  "https://images.pexels.com/photos/39921589/pexels-photo-39921589.jpeg?cs=srgb&dl=pexels-chipi1189-39921589.jpg&fm=jpg",
  "https://cdn11.dienmaycholon.vn/filewebdmclnew/public/userupload/files/Image%20FP_2024/avatar-dep-2.jpg",
  "https://images.pexels.com/photos/21576123/pexels-photo-21576123/free-photo-of-den-va-tr-ng-ng-i-chan-dung-m-m-c-i.jpeg?cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/photos/20457216/pexels-photo-20457216/free-photo-of-thanh-ph-k-ngh-nh-ng-ng-i-m-c.jpeg?cs=tinysrgb&dpr=1&w=500",
  "https://anhavatardep.com/wp-content/uploads/2025/05/avatar-vo-danh-2.jpg",
  "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/avatar_viet_nam_224a10b5b2.jpg",
  "https://bazaarvietnam.vn/wp-content/uploads/2018/03/20180312-xu-huong-trang-diem-02.png",
  "https://animedep.edu.vn/upload/2025/11/avatar-anime-dep-011.webp",
  "https://cdn2.tuoitre.vn/zoom/1200_900/471584752817336320/2026/8/8/doraemon-1772090387899350860801-23-0-526-960-crop-1786152314086122008938.jpg",
  "https://cellphones.com.vn/sforum/wp-content/uploads/2024/01/avartar-anime-1.jpg",
  "https://s3.ap-southeast-1.amazonaws.com/cdn.vntre.vn/default/avatar-anime-18-1724512404.jpg",
  "https://cdn2.tuoitre.vn/thumb_w/730/471584752817336320/2026/8/12/ban-sao-cua-anh-ghep-10-1786520917002782987881.png",
  "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-avatar-anime-21.jpg",
  "https://animedep.edu.vn/upload/2025/11/avatar-anime-ngau-015.webp",
  "https://cdn-media.sforum.vn/storage/app/media/THANHAN/avartar-anime-90.jpg",
  "https://animedep.edu.vn/upload/2025/11/avatar-anime-dep-019.webp",
  "https://cdn11.dienmaycholon.vn/filewebdmclnew/public/userupload/files/Image%20FP_2024/avatar-anime-58.png"
];

const protectedEmails = [
  'dh5027296@gmail.com', 'trongphuc20704@gmail.com', 'leducminhdn112@gmail.com',
  'tvdong01032004@gmail.com', 'dangthanhtung2612@gmail.com', 'hoangluu2172k4@gmail.com',
  'ntc07032k4@gmail.com', 'dohoangquangl24@gmail.com', 'tungdtde180564@fpt.edu.vn',
  'phucltde180994@fpt.edu.vn', 'tunglep8@gmail.com', 'dtt26121@gmail.com',
  'phuclt207@gmail.com', 'tunglep4@gmail.com', 'tuyenpde181201@fpt.edu.vn',
  'tungdt26122004@gmail.com', 'ds180216dangthikimlong@gmail.com', 'arianaduong2005@gmail.com',
  'copywriter.minhle@gmail.com', 'thtraphan@gmail.com', 'admin@stocksim.vn'
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const col = mongoose.connection.collection('users');

  const externalUsers = await col.find({
    email: { $nin: protectedEmails }
  }).sort({ createdAt: -1 }).toArray();

  console.log(`Found ${externalUsers.length} external users to process.`);

  let assignedCount = 0;
  let letterAvatarCount = 0;
  let urlIdx = 0;

  // Xen kẽ: Cứ khoảng 2-3 người có ảnh thật thì 1 người dùng avatar chữ mặc định Gmail
  for (let i = 0; i < externalUsers.length; i++) {
    const user = externalUsers[i];

    // Xen kẽ: Vị trí 2, 5, 8, 12, 16, 20... để trống để hiện chữ cái Gmail
    const isLetterAvatar = (i % 3 === 2) || (urlIdx >= avatarUrls.length);

    if (isLetterAvatar) {
      await col.updateOne({ _id: user._id }, {
        $set: {
          picture: '',
          customAvatar: false
        }
      });
      letterAvatarCount++;
    } else {
      const pic = avatarUrls[urlIdx % avatarUrls.length];
      await col.updateOne({ _id: user._id }, {
        $set: {
          picture: pic,
          customAvatar: true
        }
      });
      assignedCount++;
      urlIdx++;
    }
  }

  console.log(`Updated successfully: ${assignedCount} users with custom pictures, ${letterAvatarCount} users with Gmail letter circles.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error seeding avatars:', err.message);
  process.exit(1);
});


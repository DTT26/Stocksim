const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/StockEXE/DemoStocksim-FullStack-Exe201/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const col = mongoose.connection.collection('tractionanalytics');
  const doc = await col.findOne({ key: 'singleton' });
  if (doc) {
    const liveVisitorDetails = (doc.visitorIds || []).map((vid, idx) => ({
      visitorId: vid,
      ip: '42.112.89.201',
      location: 'Đà Nẵng (Thiết bị vừa truy cập)',
      isp: 'FPT Telecom',
      device: 'Windows 11 / Chrome',
      clicks: doc.liveClicks || 4,
      firstVisit: new Date(),
      lastVisit: new Date()
    }));

    // Cập nhật cả event recentEvents nếu có nhắc đến Hà Nội
    const updatedEvents = (doc.recentEvents || []).map(ev => {
      if (ev.text && ev.text.includes('Hà Nội')) {
        return { ...ev, text: ev.text.replace('Hà Nội', 'Đà Nẵng') };
      }
      return ev;
    });

    await col.updateOne({ key: 'singleton' }, {
      $set: {
        liveVisitorDetails: liveVisitorDetails,
        recentEvents: updatedEvents
      }
    });
    console.log('Updated Atlas liveVisitorDetails to Da Nang & FPT Telecom successfully!');
  }
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});


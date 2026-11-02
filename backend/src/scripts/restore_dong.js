const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/StockEXE/DemoStocksim-FullStack-Exe201/backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.collection('users').updateOne(
    { email: 'de180115tranvandong@gmail.com' },
    { $set: { picture: '', customAvatar: false } }
  );
  console.log('Restored de180115tranvandong to green Gmail letter Đ circle!');
  process.exit(0);
}
run();


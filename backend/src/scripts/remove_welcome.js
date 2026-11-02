const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../../frontend/src/pages/admin/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /\r?\n\s*<p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">[\s\S]*?Chào mừng trở lại[\s\S]*?<\/p>/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully removed welcome paragraph!');
} else {
  console.log('Regex did not match');
}


const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../../frontend/src/pages/admin/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Thêm helper getGmailAvatarBg nếu chưa có
const helperFunc = `
const GMAIL_COLORS = [
  'bg-emerald-600 text-white',
  'bg-rose-600 text-white',
  'bg-amber-600 text-white',
  'bg-purple-600 text-white',
  'bg-blue-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white'
];

function getGmailAvatarBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GMAIL_COLORS.length;
  return GMAIL_COLORS[index];
}
`;

if (!content.includes('function getGmailAvatarBg')) {
  content = helperFunc + '\n' + content;
  console.log('Added getGmailAvatarBg helper');
}

// Cập nhật cả 2 vị trí render avatar trong AdminDashboard
content = content.replace(
  /<img src=\{u\.picture\} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-\[#1e293b\] shrink-0 object-cover" \/>/g,
  '<img src={u.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#1e293b] shrink-0 object-cover" />'
);

const oldLetterAvatarPattern = /<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500\/20 to-purple-600\/20 border border-blue-500\/30 text-blue-500 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">\s*\{u\.name \? u\.name\.charAt\(0\)\.toUpperCase\(\) : u\.email\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>/g;

content = content.replace(
  oldLetterAvatarPattern,
  `<div className={\`w-8 h-8 rounded-full \${getGmailAvatarBg(u.email || u.name || '')} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm\`}>
    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
  </div>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx!');


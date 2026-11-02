const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../../frontend/src/pages/admin/Users.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

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
  console.log('Added getGmailAvatarBg helper to Users.tsx');
}

// Add referrerPolicy="no-referrer" to all user avatar images in Users.tsx
content = content.replace(/<img src=\{u\.picture\} alt="" className="([^"]+)" \/>/g, '<img src={u.picture} alt="" referrerPolicy="no-referrer" className="$1" />');
content = content.replace(/<img src=\{user\.picture\} alt="" className="([^"]+)" \/>/g, '<img src={user.picture} alt="" referrerPolicy="no-referrer" className="$1" />');

// Replace table letter avatar in Users.tsx (w-9 h-9)
content = content.replace(
  /<div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500\/20 to-purple-600\/20 border border-blue-500\/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">\s*\{u\.name \? u\.name\.charAt\(0\)\.toUpperCase\(\) : u\.email\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>/g,
  `<div className={\`w-9 h-9 rounded-full \${getGmailAvatarBg(u.email || u.name || '')} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm\`}>
    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
  </div>`
);

// Replace mobile card letter avatar in Users.tsx (w-10 h-10)
content = content.replace(
  /<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500\/20 to-purple-600\/20 border border-blue-500\/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">\s*\{u\.name \? u\.name\.charAt\(0\)\.toUpperCase\(\) : u\.email\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>/g,
  `<div className={\`w-10 h-10 rounded-full \${getGmailAvatarBg(u.email || u.name || '')} flex items-center justify-center text-sm font-bold shrink-0 shadow-sm\`}>
    {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
  </div>`
);

// Replace modal letter avatar (w-12 h-12)
content = content.replace(
  /<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500\/20 to-purple-600\/20 border border-blue-500\/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold">\s*\{user\.name \? user\.name\.charAt\(0\)\.toUpperCase\(\) : user\.email\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>/g,
  `<div className={\`w-12 h-12 rounded-full \${getGmailAvatarBg(user.email || user.name || '')} flex items-center justify-center text-lg font-bold shrink-0 shadow-sm\`}>
    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
  </div>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated Users.tsx!');


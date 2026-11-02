const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../../frontend/src/pages/shared/LandingPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { trackVisit } from '../../utils/tractionTracker';",
  "import { trackVisit, trackLinkClick } from '../../utils/tractionTracker';"
);

const searchPattern = /useEffect\(\(\) => \{\r?\n\s+trackVisit\(\);\r?\n\s+\}, \[\]\);/;

const replacement = `useEffect(() => {
    trackVisit();

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest('button, a');
      if (clickable) {
        const text = (clickable.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 35);
        if (text) {
          trackLinkClick(text);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);`;

if (searchPattern.test(content)) {
  content = content.replace(searchPattern, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated LandingPage.tsx with auto-click tracker!');
} else {
  console.log('Pattern not matched');
}


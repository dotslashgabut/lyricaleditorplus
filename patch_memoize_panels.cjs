const fs = require('fs');
let content = fs.readFileSync('components/AIAssistant.tsx', 'utf8');
content = content.replace('export default AIAssistant;', 'export default React.memo(AIAssistant);');
fs.writeFileSync('components/AIAssistant.tsx', content);

content = fs.readFileSync('components/WordDetail.tsx', 'utf8');
content = content.replace('export default WordDetail;', 'export default React.memo(WordDetail);');
fs.writeFileSync('components/WordDetail.tsx', content);

console.log('Memoized AIAssistant and WordDetail');

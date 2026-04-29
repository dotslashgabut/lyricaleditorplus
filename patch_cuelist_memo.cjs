const fs = require('fs');
let content = fs.readFileSync('components/CueList.tsx', 'utf8');

content = content.replace(
    'export default CueList;',
    'export default React.memo(CueList);'
);

fs.writeFileSync('components/CueList.tsx', content);
console.log('Memoized CueList');

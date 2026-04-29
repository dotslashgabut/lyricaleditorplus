const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(
    'import React, { useState, useEffect, useRef } from \'react\';',
    'import React, { useState, useEffect, useRef, useMemo } from \'react\';'
);

content = content.replace(
    '  const filteredCues = cues.filter(c => \n    c.text.toLowerCase().includes(searchQuery.toLowerCase())\n  );',
    '  const filteredCues = useMemo(() => {\n    const q = searchQuery.toLowerCase();\n    if (!q) return cues;\n    return cues.filter(c => c.text.toLowerCase().includes(q));\n  }, [cues, searchQuery]);'
);

fs.writeFileSync('App.tsx', content);
console.log('patched App.tsx with useMemo for filteredCues');

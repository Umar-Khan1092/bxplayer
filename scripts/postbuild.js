const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/app/api/**/route.ts.hidden');
files.forEach(f => {
  fs.renameSync(f, f.replace('.hidden', ''));
});
console.log('Restoring API routes');

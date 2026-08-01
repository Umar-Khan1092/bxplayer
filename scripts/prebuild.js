const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/app/api/**/route.ts');
files.forEach(f => {
  fs.renameSync(f, f + '.hidden');
});
console.log('Hiding API routes');

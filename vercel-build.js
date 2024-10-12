const { execSync } = require('child_process');

execSync('npx prisma generate');

execSync('next build', { stdio: 'inherit' });

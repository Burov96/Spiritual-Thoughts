import { execSync } from 'child_process';

// Run Prisma generate
execSync('npx prisma generate');

// Run the actual build command
execSync('next build', { stdio: 'inherit' });

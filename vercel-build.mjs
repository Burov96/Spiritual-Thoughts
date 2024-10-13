import { execSync } from 'child_process';

// Run Prisma generate and migrate
execSync('npx prisma generate && npx prisma migrate deploy');

// Run the actual build command
execSync('next build', { stdio: 'inherit' });

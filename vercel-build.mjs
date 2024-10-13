import { execSync } from 'child_process';

try {
  console.log('Running Prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Running Prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('Running Next.js build...');
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build script failed:', error);
  process.exit(1);
}

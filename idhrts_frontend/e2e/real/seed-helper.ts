import { execSync } from 'child_process';
import path from 'path';

export function runSeedE2E() {
  const isDocker = process.env.USE_DOCKER === '1';
  if (isDocker) {
    console.log('🐳 Seeding Docker PostgreSQL database...');
    execSync('docker exec idhrts_backend python manage.py seed_e2e', { stdio: 'inherit' });
  } else {
    console.log('🐍 Seeding Local SQLite database...');
    const backendPath = path.resolve(__dirname, '../../../idhrts_backend');
    execSync('python manage.py seed_e2e', {
      cwd: backendPath,
      stdio: 'inherit',
    });
  }
}

export function getLatestOTP(phone: string): string {
  const isDocker = process.env.USE_DOCKER === '1';
  const pythonCmd = `from users.models import OTP; otp = OTP.objects.filter(phone_number='${phone}', is_used=False).order_by('-created_at').first(); print(otp.code if otp else 'NO_OTP')`;
  
  let result: string;
  if (isDocker) {
    result = execSync(`docker exec idhrts_backend python manage.py shell -c "${pythonCmd}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } else {
    const backendPath = path.resolve(__dirname, '../../../idhrts_backend');
    result = execSync(`python manage.py shell -c "${pythonCmd}"`, {
      cwd: backendPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
  
  return result.trim().split('\n').filter(Boolean).pop()!.trim();
}

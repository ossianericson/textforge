import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env');
const templatePath = path.resolve('.env.example');
const isProduction = process.env.NODE_ENV === 'production';

if (fs.existsSync(envPath)) {
  process.exit(0);
}

if (isProduction) {
  console.error('Missing .env file in production environment.');
  process.exit(1);
}

if (!fs.existsSync(templatePath)) {
  console.warn('Missing .env.example. Create .env manually if needed.');
  process.exit(0);
}

fs.copyFileSync(templatePath, envPath);
console.log('Created .env from .env.example. Review and customize if needed.');

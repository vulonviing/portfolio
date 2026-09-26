import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('../../who-speaks-for-the-crowd');
const javascript = readdirSync(resolve(output, 'assets'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(resolve(output, 'assets', name), 'utf8'))
  .join('\n');
const html = readFileSync(resolve(output, 'index.html'), 'utf8');
const forbidden = [
  '/v1/admin/', '/api/operator', '/api/service/start', '/api/service/stop',
  'PRESENTER CONTROL', 'Start fresh run', 'Download raw archive',
  'X-Local-Lab-Token', '__LOCAL_TOKEN__',
];
const present = forbidden.filter((value) => javascript.includes(value) || html.includes(value));
if (present.length) {
  throw new Error(`Public build contains operator-only material: ${present.join(', ')}`);
}
console.log('Public build contains no operator controls or local token markers.');

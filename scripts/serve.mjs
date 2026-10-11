import {context} from 'esbuild';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await context({});
await server.serve({servedir: root, host: '127.0.0.1', port: 8000});
console.log('城市生成器：http://127.0.0.1:8000');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await server.dispose();
  process.exit(0);
});

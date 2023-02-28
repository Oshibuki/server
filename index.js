import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// const config = require('./server-config');
import config from './server-config.js';
const { port } = config
// const server = require(env === 'production'
//   ? './build/app'
//   : './src/app').default;
import server from './src/app.js';

server.listen(port, () =>
  console.log(`Server started on port ${port}`)
);
server.timeout = 240000;

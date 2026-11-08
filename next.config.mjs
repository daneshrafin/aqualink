import {fileURLToPath} from 'node:url';

// Keep extracted copies independent of unrelated lockfiles in parent folders.
export default {
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
};

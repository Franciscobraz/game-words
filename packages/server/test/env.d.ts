import type { Env as WorkerEnv } from '../src/env.ts';

// The bindings of `env` and the main module behind `exports` from `cloudflare:workers` in the tests.
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
    interface GlobalProps {
      mainModule: typeof import('../src/worker.ts');
    }
  }
}

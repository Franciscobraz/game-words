import type { Env as WorkerEnv } from '../src/env.ts';

// The bindings `env` from `cloudflare:workers` has in the tests.
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}

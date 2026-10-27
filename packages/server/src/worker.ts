import type { Env } from './env.ts';

export { RoomDO } from './room-do.ts';

export default {
  async fetch(): Promise<Response> {
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

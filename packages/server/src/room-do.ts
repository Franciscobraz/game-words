import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env.ts';

/** One room per Durable Object, named by its code. */
export class RoomDO extends DurableObject<Env> {}

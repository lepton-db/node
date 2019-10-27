/**
 * Generate random 64 char hex ids
 */

import { randomBytes } from 'crypto';

export function id() {
  return randomBytes(32).toString('hex');
}

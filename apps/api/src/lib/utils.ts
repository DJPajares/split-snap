import { SESSION_CODE_LENGTH } from './constants.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0, I/1 to avoid confusion

export function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < SESSION_CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

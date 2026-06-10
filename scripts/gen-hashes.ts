// scripts/gen-hashes.ts
import { hashPassword } from '../src/utils/auth.utils'

const passwords = ['admin123', 'admin@01', 'admin@02']
for (const p of passwords) {
  console.log(await hashPassword(p))
}
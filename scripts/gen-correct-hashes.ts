// scripts/gen-correct-hashes.ts
import { hashPassword } from '../src/utils/auth.utils'

const passwords = [
  'vimovies123',  // Super Admin
  'admin123',     // Admin One  
  'admin456'      // Admin Two
]

console.log('Generando hashes para las contraseñas correctas:')
console.log('')

for (let i = 0; i < passwords.length; i++) {
  const p = passwords[i]
  const hash = await hashPassword(p)
  console.log(`Contraseña: ${p}`)
  console.log(`Hash: ${hash}`)
  console.log('')
}

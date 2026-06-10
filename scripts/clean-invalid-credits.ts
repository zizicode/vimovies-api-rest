const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nadwnngiahknfwfbppqt.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZHdubmdpYWhrbmZ3ZmJwcHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1NzY2MywiZXhwIjoyMDk0MzMzNjYzfQ._INsWZijCHx2eSt0b7S2i_8XZgx3R0LKzeFJbaO7NeI'

async function supabaseFetch(table: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  return response.json()
}

async function checkCredits() {
  console.log('Verificando créditos...')
  console.log(`URL: ${SUPABASE_URL}`)
  
  // Obtener muestra de créditos
  const response = await supabaseFetch('media_credits?select=id,person_id,media_id&limit=10')
  console.log('Respuesta cruda:', JSON.stringify(response, null, 2))
  
  const credits = Array.isArray(response) ? response : []
  
  console.log(`\nMuestra de ${credits.length} créditos:`)
  
  // Verificar cada crédito
  for (const credit of credits) {
    const person = await supabaseFetch(`people?id=eq.${credit.person_id}&select=id,name,tmdb_id,profile_path`)
    
    if (person.error) {
      console.log(`❌ Crédito ${credit.id}: person_id=${credit.person_id} - ERROR: ${person.error.message}`)
    } else if (!person || person.length === 0) {
      console.log(`❌ Crédito ${credit.id}: person_id=${credit.person_id} - NO EXISTE en people`)
    } else {
      const p = person[0]
      console.log(`✅ Crédito ${credit.id}: name="${p.name || 'SIN NOMBRE'}", tmdb_id=${p.tmdb_id}, profile_path=${p.profile_path ? 'YES' : 'NO'}`)
    }
  }
}

checkCredits()
  .then(() => {
    console.log('\nProceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

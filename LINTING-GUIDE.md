# Guía de Linting y Type-Checking - Vimovies API

Esta guía explica cómo usar las herramientas instaladas para detectar errores de TypeScript y compilación antes del build en producción.

---

## 📦 Herramientas Instaladas

### 1. TypeScript Compiler (tsc)
**Propósito**: Verificar tipos y errores de TypeScript sin generar archivos

**Instalación**: Ya incluido con `typescript`

**Uso**:
```bash
npm run type-check
```

**Qué detecta**:
- Errores de tipos
- Variables no usadas
- Parámetros no usados
- Retornos implícitos
- Cases fallthrough en switches
- Acceso a índices sin validar
- Override de métodos sin `override`

---

### 2. ESLint
**Propósito**: Detectar errores de código y problemas de estilo

**Instalación**:
- `eslint`: Core de ESLint
- `@typescript-eslint/parser`: Parser para TypeScript
- `@typescript-eslint/eslint-plugin`: Reglas específicas de TypeScript
- `eslint-plugin-import`: Reglas para imports
- `eslint-config-prettier`: Desactiva reglas de ESLint que conflictúan con Prettier

**Uso**:
```bash
# Verificar errores
npm run lint

# Corregir errores automáticamente
npm run lint:fix
```

**Qué detecta**:
- Variables no usadas (`@typescript-eslint/no-unused-vars`)
- Uso de `any` (advertencia)
- Promesas no manejadas (`@typescript-eslint/no-floating-promises`)
- Promesas mal usadas (`@typescript-eslint/no-misused-promises`)
- Type assertions innecesarios
- Orden de imports
- Consistencia en imports

---

### 3. Prettier
**Propósito**: Formatear código de manera consistente

**Instalación**:
- `prettier`: Formateador de código

**Uso**:
```bash
# Formatear código
npm run format

# Verificar formato sin modificar
npm run format:check
```

**Qué hace**:
- Formatea consistentemente todo el código
- Asegura estilo uniforme
- Elimina debates sobre formato

---

## 🚀 Scripts Disponibles

### type-check
```bash
npm run type-check
```
**Descripción**: Ejecuta `tsc --noEmit` para verificar tipos sin generar archivos  
**Cuándo usar**: Antes de commits, en CI/CD, antes de build  
**Si falla**: El build no continuará

---

### lint
```bash
npm run lint
```
**Descripción**: Ejecuta ESLint para detectar errores de código  
**Cuándo usar**: Antes de commits, en CI/CD  
**Si falla**: Indica problemas de código que deben corregirse

---

### lint:fix
```bash
npm run lint:fix
```
**Descripción**: Ejecuta ESLint y corrige errores automáticamente  
**Cuándo usar**: Para corregir errores rápidos antes de commit  
**Nota**: No corrige todos los errores automáticamente

---

### format
```bash
npm run format
```
**Descripción**: Formatea todo el código con Prettier  
**Cuándo usar**: Antes de commits, después de escribir código  
**Nota**: Modifica archivos directamente

---

### format:check
```bash
npm run format:check
```
**Descripción**: Verifica si el código está formateado correctamente  
**Cuándo usar**: En CI/CD  
**Si falla**: El código necesita formatearse

---

### build
```bash
npm run build
```
**Descripción**: Ejecuta `type-check` antes de `tsup`  
**Flujo**: `type-check` → Si pasa → `tsup` → Si pasa → Build exitoso  
**Si falla**: Build falla y muestra errores

---

## 🔍 Configuraciones Agregadas

### tsconfig.json - Opciones Estrictas

```json
{
  "noUnusedLocals": true,              // Error si hay variables locales no usadas
  "noUnusedParameters": true,          // Error si hay parámetros no usados
  "noImplicitReturns": true,           // Error si funciones no retornan explícitamente
  "noFallthroughCasesInSwitch": true,  // Error si hay cases sin break en switch
  "noUncheckedIndexedAccess": true,    // Error al acceder a índices sin validar
  "noImplicitOverride": true,          // Error al override sin keyword override
  "allowUnusedLabels": false,          // Error si hay labels no usados
  "allowUnreachableCode": false        // Error si hay código inalcanzable
}
```

---

### .eslintrc.json - Reglas Configuradas

**Reglas de TypeScript**:
- `@typescript-eslint/no-unused-vars`: Error en variables/parámetros no usados
- `@typescript-eslint/no-explicit-any`: Advertencia en uso de `any`
- `@typescript-eslint/no-floating-promises`: Error en promesas no manejadas
- `@typescript-eslint/no-misused-promises`: Error en promesas mal usadas
- `@typescript-eslint/await-thenable`: Error en await de no-promesas
- `@typescript-eslint/no-unnecessary-type-assertion`: Error en type assertions innecesarios
- `@typescript-eslint/prefer-nullish-coalescing`: Preferir `??` sobre `||`
- `@typescript-eslint/prefer-optional-chain`: Preferir optional chaining
- `@typescript-eslint/no-throw-literal`: Error en throw de no-Error

**Reglas de Imports**:
- `import/order`: Ordena imports automáticamente
  - Built-in → External → Internal → Parent → Sibling → Index
  - Orden alfabético
  - Newlines entre grupos

**Reglas Generales**:
- `no-console`: Advertencia en console.log (permite console.warn y console.error)

---

### .prettierrc - Configuración de Formato

```json
{
  "semi": true,                    // Punto y coma obligatorio
  "trailingComma": "es5",          // Comas trailing en ES5+
  "singleQuote": true,             // Comillas simples
  "printWidth": 100,               // Máximo 100 caracteres por línea
  "tabWidth": 2,                   // 2 espacios de indentación
  "useTabs": false,                // Usar espacios, no tabs
  "arrowParens": "always",         // Paréntesis en arrow functions
  "endOfLine": "lf"                // Fin de línea LF (Unix)
}
```

---

## 📋 Flujo de Trabajo Recomendado

### Antes de Commit
```bash
# 1. Verificar tipos
npm run type-check

# 2. Verificar linting
npm run lint

# 3. Corregir linting automáticamente
npm run lint:fix

# 4. Formatear código
npm run format
```

### En CI/CD (GitHub Actions, GitLab CI, etc.)
```yaml
# Ejemplo de workflow
- name: Type Check
  run: npm run type-check

- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check

- name: Build
  run: npm run build
```

### Antes de Deploy en Producción
```bash
# El script build ya incluye type-check
npm run build
```

---

## 🎯 Qué Hace Que el Build Falle

### Errores de TypeScript (type-check)
- Tipos incorrectos
- Variables no usadas
- Parámetros no usados
- Funciones sin retorno
- Cases sin break
- Acceso a índices sin validar
- Override sin keyword

### Errores de ESLint (lint)
- Promesas no manejadas
- Promesas mal usadas
- Type assertions innecesarios
- Imports desordenados
- Código inalcanzable

### Errores de Formato (format:check)
- Código no formateado según Prettier

---

## 🔧 Solución de Problemas Comunes

### Error: "Variable is declared but its value is never read"
**Solución**: Usar la variable o prefijar con `_` si es intencional
```typescript
// ❌ Error
const unused = 'value'

// ✅ Solución 1: Usar la variable
const used = 'value'
console.log(used)

// ✅ Solución 2: Prefijar con _
const _unused = 'value'
```

---

### Error: "Parameter is declared but its value is never read"
**Solución**: Usar el parámetro o prefijar con `_`
```typescript
// ❌ Error
function example(param: string) {
  return 'result'
}

// ✅ Solución 1: Usar el parámetro
function example(param: string) {
  return param
}

// ✅ Solución 2: Prefijar con _
function example(_param: string) {
  return 'result'
}
```

---

### Error: "Not all code paths return a value"
**Solución**: Asegurar que todos los caminos retornan un valor
```typescript
// ❌ Error
function example(value: number) {
  if (value > 0) {
    return 'positive'
  }
}

// ✅ Solución
function example(value: number) {
  if (value > 0) {
    return 'positive'
  }
  return 'negative'
}
```

---

### Error: "Fallthrough case in switch"
**Solución**: Agregar `break` o `return` en cada case
```typescript
// ❌ Error
switch (value) {
  case 1:
    console.log('one')
  case 2:
    console.log('two')
}

// ✅ Solución
switch (value) {
  case 1:
    console.log('one')
    break
  case 2:
    console.log('two')
    break
}
```

---

### Error: "Object is possibly 'undefined'"
**Solución**: Validar antes de acceder
```typescript
// ❌ Error
const array: string[] | undefined = getArray()
const first = array[0]

// ✅ Solución
const array: string[] | undefined = getArray()
const first = array?.[0]

// ✅ Solución con validación
const array: string[] | undefined = getArray()
const first = array ? array[0] : undefined
```

---

## 📊 Resumen de Comandos

| Comando | Propósito | Falla si... |
|---------|-----------|-------------|
| `npm run type-check` | Verificar tipos | Hay errores de TypeScript |
| `npm run lint` | Verificar código | Hay errores de linting |
| `npm run lint:fix` | Corregir código | - |
| `npm run format` | Formatear código | - |
| `npm run format:check` | Verificar formato | Código no formateado |
| `npm run build` | Compilar para producción | type-check o tsup falla |

---

## 🚨 Importante

### El build ahora fallará si:
1. Hay errores de TypeScript
2. Hay errores de ESLint
3. Hay problemas de formato (si se agrega en CI)

### Esto asegura que:
- No se despliegue código con errores de tipos
- No se despliegue código con problemas de calidad
- El código sea consistente en todo el proyecto

---

## 📝 Próximos Pasos Opcionales

### Husky + lint-staged (Git Hooks)
Instalar para ejecutar linting y formateo automáticamente antes de cada commit:

```bash
npm install -D husky lint-staged
npx husky init
```

Configurar `package.json`:
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

Crear `.husky/pre-commit`:
```bash
npx lint-staged
```

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0

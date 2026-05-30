import { SupportedLocale } from '../middleware/locale.middleware'

declare module 'hono' {
  interface ContextVariableMap {
    locale: SupportedLocale
    localeSource: string
  }
}

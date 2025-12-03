/// <reference types="vite/client" />

declare module 'vuetify/styles' {}
declare module 'vuetify/components' {
  import type { DefineComponent } from 'vue'
  const components: Record<string, DefineComponent>
  export = components
}
declare module 'vuetify/directives' {
  import type { Directive } from 'vue'
  const directives: Record<string, Directive>
  export = directives
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

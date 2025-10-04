/// <reference types="vite/client" />

// PDF file type declarations for Vite
declare module '*.pdf' {
  const src: string;
  export default src;
}

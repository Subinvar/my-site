/**
 * TypeScript helper to ensure editors resolve the lucide-react package types.
 * Some setups may flag "Cannot find module 'lucide-react'" despite the package
 * being installed, so we explicitly point to the bundled declaration file.
 */
declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react';
}
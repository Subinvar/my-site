// src/app/keystatic/keystatic.tsx
import { makePage } from '@keystatic/next/ui/app';

import config from '../../../keystatic.config';
import KeystaticClientWrapper from './KeystaticClientWrapper';

const KeystaticPage = makePage(config);

export default function KeystaticApp() {
  return (
    <KeystaticClientWrapper>
      <KeystaticPage />
    </KeystaticClientWrapper>
  );
}

'use client';

import Wizard from '@/components/Wizard';
import { DebugProvider } from '@/lib/debugContext';

export default function Home() {
  return (
    <DebugProvider>
      <Wizard />
    </DebugProvider>
  );
}

'use client';

import { useEffect } from 'react';
import { NetworkStatus } from '@/utils/network-status';

export function NetworkStatusHandler() {
  useEffect(() => {
    NetworkStatus.initialize();
  }, []);

  return null;
}
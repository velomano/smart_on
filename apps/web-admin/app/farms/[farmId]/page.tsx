'use client';

import { use } from 'react';
import FarmAutoDashboard from '@/components/farm/FarmAutoDashboard';

interface PageProps {
  params: Promise<{
    farmId: string;
  }>;
}

export default function FarmDetailPage({ params }: PageProps) {
  const { farmId } = use(params);
  return <FarmAutoDashboard farmId={farmId} />;
}
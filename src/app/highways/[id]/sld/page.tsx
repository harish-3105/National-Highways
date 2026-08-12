import React from 'react';
import StraightLineDiagram from '@/components/highways/StraightLineDiagram';

export const metadata = {
  title: 'Straight-Line Diagram (SLD) | TN National Highways',
  description: 'Interactive linear asset diagram and straight-line timeline for National Highway corridors',
};

interface SldPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HighwaySldPage({ params }: SldPageProps) {
  const resolvedParams = await params;
  const highwayId = resolvedParams.id;

  return <StraightLineDiagram highwayIdOrCode={highwayId} />;
}

import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonLoader() {
  return (
    <Card>
      <div className="p-6 space-y-4">
        <Skeleton className="w-full h-[118px]" />
        <Skeleton className="w-3/5 h-4" />
        <Skeleton className="w-4/5 h-4" />
      </div>
    </Card>
  );
}

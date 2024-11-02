import React from 'react';
import { Card } from "@/components/ui/card";

interface FileExplorerProps {
  children?: React.ReactNode;
}

export default function FileExplorer({ children }: FileExplorerProps) {
  return (
    <Card>
      <div className="p-6">
        {children}
      </div>
    </Card>
  );
}

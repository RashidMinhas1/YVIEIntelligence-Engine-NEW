import React from 'react';
import { Info } from 'lucide-react';

interface InfoCardProps {
  title: string;
  purpose: string;
  whenToUse: string;
  workflow: string;
  example: string;
  nextStep: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  purpose,
  whenToUse,
  workflow,
  example,
  nextStep,
}) => {
  return (
    <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-md mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Purpose</dt>
          <dd>{purpose}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">When to use</dt>
          <dd>{whenToUse}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Typical workflow</dt>
          <dd>{workflow}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Real‑world example</dt>
          <dd>{example}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Next step</dt>
          <dd>{nextStep}</dd>
        </div>
      </dl>
    </div>
  );
};

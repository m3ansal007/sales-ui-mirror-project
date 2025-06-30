
import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionSummaryProps {
  selectedCount: number;
  onClearSelection: () => void;
}

export const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  selectedCount,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-slate-300">
          {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button
          variant="outline"
          onClick={onClearSelection}
          className="border-slate-600 text-slate-300"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

'use client';

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'ALL';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeSelector({ dateRange, onDateRangeChange }: DateRangeSelectorProps) {
  const dateRanges: DateRange[] = ['1M', '3M', '6M', '1Y', '2Y', 'ALL'];

  return (
    <div className="flex rounded border border-terminal-border overflow-hidden">
      {dateRanges.map((range) => (
        <button
          key={range}
          onClick={() => onDateRangeChange(range)}
          className={`px-3 py-1.5 text-xs transition-colors ${
            dateRange === range
              ? 'bg-terminal-green text-terminal-bg font-medium'
              : 'text-terminal-muted hover:bg-terminal-border'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

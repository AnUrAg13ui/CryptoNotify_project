import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PriceChangeProps {
  value: number;
}

export function PriceChange({ value }: PriceChangeProps) {
  const isPriceUp = value >= 0;
  const Icon = isPriceUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`flex items-center ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
      <Icon className="h-4 w-4" />
      <span className="ml-1 text-sm font-medium">
        {Math.abs(value).toFixed(2)}%
      </span>
    </div>
  );
}
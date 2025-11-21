interface PriceDisplayProps {
    price: number;
  }
  
  export function PriceDisplay({ price }: PriceDisplayProps) {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Current Price</p>
        <p className="text-2xl font-bold tracking-tight">{formattedPrice}</p>
      </div>
    );
  }
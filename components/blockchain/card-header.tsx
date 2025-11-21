import { PriceChange } from "@/components/ui/price-change";
import { useRouter } from "next/navigation";
interface BlockchainCardHeaderProps {
  name: string;
  symbol: string;
  image: string;
  priceChange: number;
}

export function BlockchainCardHeader({
  name,
  symbol,
  image,
  priceChange,
}: BlockchainCardHeaderProps)
 {
  let router=useRouter();
  // console.log(name);
  return (
    <div className="flex items-start justify-between mb-4"
    onClick={()=>{
      console.log("clicked ",name);
      router.push(`${name}`);
    }}>
      <div className="flex items-center space-x-3">
        <div className="relative w-10 h-10">
          <img
            src={image}
            alt={name}
            className="rounded-full object-cover"
          />
          <div className="absolute inset-0 rounded-full ring-1 ring-black/5 dark:ring-white/5" />
        </div>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{symbol.toUpperCase()}</p>
        </div>
      </div>
      <PriceChange value={priceChange} />
    </div>
  );
}
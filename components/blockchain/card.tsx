import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { BlockchainCardHeader } from "./card-header";
import { PriceDisplay } from "./price-display";
import type { Blockchain } from "@/types/blockchain";
import { useRouter } from "next/navigation";

interface BlockchainCardProps {
  key: string;
  blockchain: Blockchain;
  onAdd: () => void;
  isAdded: boolean;
}

export function BlockchainCard({
  key,
  blockchain,
  onAdd,
  isAdded,
}: BlockchainCardProps) {
  const nav = useRouter();
  return (
    <motion.div
      layoutId={`card-${blockchain.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className=" hover:cursor-pointer"
    >
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardContent onClick={
          () => nav.push(`/${blockchain.id}`)
        } className="p-6">
          <BlockchainCardHeader
            name={blockchain.name}
            symbol={blockchain.symbol}
            image={blockchain.image}
            priceChange={blockchain.price_change_percentage_24h}
          />
          <PriceDisplay price={blockchain.current_price} />
        </CardContent>
        <CardFooter className="p-4 bg-muted/50">
          <Button
            className="w-full font-medium"
            variant={isAdded ? "secondary" : "default"}
            onClick={onAdd}
            disabled={isAdded}
          >
            {isAdded ? "Set Price Alerts" : "Set Price Alerts"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
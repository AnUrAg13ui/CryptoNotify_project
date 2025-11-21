import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Edit2, TrendingUp, TrendingDown, AlertOctagon, Bell, Clock, Zap } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BlockchainItem {
  name: string;
  targetPrice: number;
  alertMode: string;
  id?: string;
  userId?: string;
  currentValue?: number;
  logo?: string;
  symbol?: string;
}

interface CryptoHoverEffectProps {
  items: BlockchainItem[];
  className?: string;
  onEdit?: (item: BlockchainItem) => void;
}

const CryptoHoverEffect: React.FC<CryptoHoverEffectProps> = ({ 
  items, 
  className,
  onEdit 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getStatusInfo = (item: BlockchainItem) => {
    if (!item.currentValue) return { 
      borderColor: "border-gray-300 dark:border-gray-600",
      bgGradient: "bg-gray-100 dark:bg-gray-700",
      statusText: "No Data",
      statusColor: "text-gray-700 dark:text-gray-300"
    };
    
    const diff = item.targetPrice - item.currentValue;
    const percentage = Math.abs(diff / item.currentValue * 100);
    
    // Close to target (within 5%)
    if (percentage <= 5) return { 
      borderColor: "border-yellow-400 dark:border-yellow-500",
      bgGradient: "bg-yellow-100 dark:bg-yellow-900",
      statusText: "Near Target",
      statusColor: "text-yellow-800 dark:text-yellow-300"
    };
    
    // Above or below target
    if (item.targetPrice > item.currentValue) {
      return { 
        borderColor: "border-green-400 dark:border-green-600", 
        bgGradient: "bg-green-100 dark:bg-green-900",
        statusText: "Awaiting Rise",
        statusColor: "text-green-800 dark:text-green-300"
      };
    } else {
      return { 
        borderColor: "border-red-400 dark:border-red-600",
        bgGradient: "bg-red-100 dark:bg-red-900",
        statusText: "Awaiting Drop",
        statusColor: "text-red-800 dark:text-red-300"
      };
    }
  };

  const getPriceDirection = (item: BlockchainItem) => {
    if (!item.currentValue) return { 
      color: "text-gray-700 dark:text-gray-300", 
      icon: AlertOctagon, 
      text: "No data available",
      bgColor: "bg-gray-100 dark:bg-gray-800"
    };
    
    if (item.targetPrice > item.currentValue) {
      const percent = ((item.targetPrice/item.currentValue - 1) * 100).toFixed(2);
      return { 
        color: "text-green-800 dark:text-green-300", 
        icon: TrendingUp, 
        text: `${percent}% to target`,
        bgColor: "bg-green-100 dark:bg-green-900"
      };
    } else {
      const percent = ((1 - item.targetPrice/item.currentValue) * 100).toFixed(2);
      return { 
        color: "text-red-800 dark:text-red-300", 
        icon: TrendingDown, 
        text: `${percent}% to target`,
        bgColor: "bg-red-100 dark:bg-red-900"
      };
    }
  };

  return (
    <div className="w-full">
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}>
        {items.map((item, idx) => {
          const statusInfo = getStatusInfo(item);
          const priceDirection = getPriceDirection(item);
          const PriceIcon = priceDirection.icon;
          
          return (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Card 
                className={cn(
                  "overflow-hidden transition-all duration-300 hover:-translate-y-2",
                  "border-2 rounded-xl shadow-md",
                  statusInfo.borderColor,
                  hoveredIndex === idx ? "shadow-xl" : "",
                  "bg-white dark:bg-gray-900"
                )}
              >
                {/* Status indicator at the top */}
                <div className={cn(
                  "h-2 w-full",
                  statusInfo.bgGradient
                )} />
                
                <CardContent className="p-6 relative">
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      statusInfo.bgGradient,
                      statusInfo.statusColor
                    )}>
                      {statusInfo.statusText}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-shrink-0 w-14 h-14">
                      <div className="absolute inset-0 rounded-full bg-blue-200 dark:bg-blue-700"></div>
                      <div className="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-full"></div>
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                        {item.logo ? (
                          <Image
                            src={item.logo}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="object-contain rounded-full"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.symbol?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xl text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-1">
                        <span className="text-sm font-medium">{item.symbol}</span>
                        <span>•</span>
                        <div className={cn(
                          "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                          item.alertMode === "recurring" 
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        )}>
                          {item.alertMode === "recurring" ? (
                            <><Clock className="w-3 h-3" /> Recurring</>
                          ) : (
                            <><Zap className="w-3 h-3" /> Once</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Current Price */}
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Current Price</span>
                      <span className="font-mono font-medium text-lg text-gray-900 dark:text-white">
                        ${item.currentValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "N/A"}
                      </span>
                    </div>
                    
                    {/* Target Price */}
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Target Price</span>
                      <span className="font-mono font-medium text-lg text-gray-900 dark:text-white">
                        ${item.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    {/* Price Direction */}
                    <div className={cn(
                      "flex items-center justify-between mt-3 px-4 py-3 rounded-lg",
                      priceDirection.bgColor
                    )}>
                      <span className={cn("text-sm font-medium", priceDirection.color)}>
                        Distance to Target
                      </span>
                      <div className="flex items-center gap-2">
                        <PriceIcon className={cn("w-4 h-4", priceDirection.color)} />
                        <span className={cn("text-sm font-bold", priceDirection.color)}>
                          {priceDirection.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 bg-gray-50 dark:bg-gray-800">
                  <Button
                    variant="outline"
                    className="w-full font-medium flex items-center gap-2 bg-white dark:bg-gray-700 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:text-white border border-gray-200 dark:border-gray-600"
                    onClick={() => onEdit && onEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" /> Edit Alert
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoHoverEffect;
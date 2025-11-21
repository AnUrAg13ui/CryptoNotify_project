"use client";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/Navbar";
import axios from "axios";
import CryptoHoverEffect from "@/components/ui/card-hover-effect";
import { AuthDialog } from "@/components/auth-dialog";
import { ThresholdForm } from "@/components/ThresholdForm";
import { Loader2, Wallet, PlusCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";


interface BlockchainItem {
  blockchainId: string;
  name: string;
  targetPrice: number;
  logo: string;
  alertMode: string;
  userId: string;
  symbol: string;
  currentValue?: number;
}


interface DashboardHoverItem {
  id: string;
  name: string;
  targetPrice: number;
  alertMode: string;
  logo: string;
  userId: string;
  symbol: string;
  currentValue: number;
}

function Dashboard() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/");
    },
  });

  const [blockchains, setBlockchains] = useState<DashboardHoverItem[]>([]);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] = useState<any>(null);
  const { theme } = useTheme();
  
  const { toast } = useToast();

  const fetchBlockchains = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/user");
      if (response.data) {
        // Get current prices for all cryptocurrencies
        const coinIds = response.data.map((item: BlockchainItem) => item.blockchainId).join(",");
        const priceResponse = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
        );

        const data: DashboardHoverItem[] = response.data.map((item: BlockchainItem) => {
          return {
            id: item.blockchainId,
            name: item.name,
            targetPrice: item.targetPrice,
            alertMode: item.alertMode || "once",
            logo: item.logo,
            userId: item.userId,
            symbol: item.symbol || "",
            currentValue: priceResponse.data[item.blockchainId]?.usd || 0,
          };
        });
        setBlockchains(data);
      }
    } catch (error) {
      console.error("Failed to fetch blockchains:", error);
      toast({
        title: "Error",
        description: "Failed to load your cryptocurrency alerts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchains();
  }, [toast]);

  const handleSignIn = () => {
    setShowAuthDialog(true);
  };

  const handleEditAlert = (blockchain: DashboardHoverItem) => {
    setSelectedBlockchain({
      id: blockchain.id,
      name: blockchain.name,
      symbol: blockchain.symbol,
      current_price: blockchain.currentValue,
      image: blockchain.logo
    });
    setShowEditForm(true);
  };

  const handleUpdateAlert = async (data: any) => {
    try {
      await axios.put("/api/updatethreshold", data);
      toast({
        title: "Success",
        description: "Price alert updated successfully",
      });
      setShowEditForm(false);
      fetchBlockchains(); // Refresh the list
    } catch (error) {
      console.error("Failed to update price alert:", error);
      toast({
        title: "Error",
        description: "Failed to update price alert",
        variant: "destructive",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar 
        userName={session?.user?.name}
        onSignIn={handleSignIn}
        onLogout={() => signOut()}
      />
      
      <div className="container pt-24 mx-auto py-8 px-4">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 p-2 rounded-full bg-blue-100 dark:bg-blue-900"
          >
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-3 text-blue-600 dark:text-blue-300"
          >
            Your Crypto Alerts Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Monitor your cryptocurrency price alerts in real-time. Get notified when prices hit your specified targets.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your alerts...</p>
          </div>
        ) : blockchains.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <CryptoHoverEffect 
              items={blockchains} 
              onEdit={handleEditAlert}
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 shadow-lg"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Wallet className="h-10 w-10 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">No price alerts set up yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Visit the explorer section to add cryptocurrencies and set up price alerts to monitor their performance.
            </p>
            <Button 
              onClick={() => redirect("/explorer")}
              className="px-6 py-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-full text-white font-medium transition-all shadow-lg hover:shadow-blue-300/30 dark:hover:shadow-blue-500/20 flex items-center gap-2 mx-auto"
              size="lg"
            >
              <PlusCircle className="w-5 h-5" />
              Explore Cryptocurrencies
            </Button>
          </motion.div>
        )}
      </div>

      {showAuthDialog && (
        <AuthDialog 
          onClose={() => setShowAuthDialog(false)} 
          onSuccessfulAuth={() => {
            setShowAuthDialog(false);
          }}
        />
      )}

      {showEditForm && selectedBlockchain && (
        <ThresholdForm
          blockchain={selectedBlockchain}
          onSubmit={handleUpdateAlert}
          onClose={() => setShowEditForm(false)}
          isEditing={true}
        />
      )}
    </div>
  );
}

export default Dashboard;
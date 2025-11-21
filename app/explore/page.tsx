"use client";

import { useEffect ,useState} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { BlockchainCard } from "@/components/blockchain/card";
import { useInView } from "react-intersection-observer";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";
import { useBlockchainSearch } from "@/hooks/useBlockchainSearch";
import { useSession, signOut } from "next-auth/react";
import { ThresholdForm } from "@/components/ThresholdForm";
import { AuthDialog } from "@/components/auth-dialog";
import { useToast } from "@/components/ui/use-toast";
import type { Blockchain } from "@/types/blockchain";

const ITEMS_PER_PAGE = 20;

export default function BlockchainExplorerPage() {
  const { data: session } = useSession();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });
  const { toast } = useToast();

  const [selectedBlockchain, setSelectedBlockchain] = useState<Blockchain | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const {
    blockchains,
    search,
    setSearch,
    loading,
    hasMore,
    error,
    page,
    setPage,
    debouncedSearch,
    fetchBlockchains
  } = useBlockchainSearch(ITEMS_PER_PAGE);

 
  useEffect(() => {
    fetchBlockchains(1);
  }, [fetchBlockchains]);

  
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      setPage(1);
      fetchBlockchains(1, debouncedSearch, true);
    }
  }, [debouncedSearch, fetchBlockchains, setPage]);

 
  useEffect(() => {
    if (inView && hasMore && !loading && !search) {
      setPage(prev => prev + 1);
      fetchBlockchains(page + 1);
    }
  }, [inView, hasMore, loading, search, page, fetchBlockchains, setPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setPage(1);
      fetchBlockchains(1, search.trim(), true);
    }
  };

  const handleAddBlockchain = (blockchain: Blockchain) => {
    if (!session) {
      setSelectedBlockchain(blockchain);
      setShowAuthDialog(true);
    } else {
      setSelectedBlockchain(blockchain);
      setShowThresholdForm(true);
    }
  };
  const handleSignIn = () => {
    console.log("Sign in clicked");
    setShowAuthDialog(true); 
  };
  

  const handleThresholdSubmit = async (data: any) => {
    try {
      console.log("Submitting threshold data:", data);
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          name: selectedBlockchain?.name,
          symbol: selectedBlockchain?.symbol,
          logo: selectedBlockchain?.image
        }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        // console.log("Error response:", responseData);
        throw new Error(responseData.error || "Couldn’t set up price alert for the selected blockchain.");
      }
  
      setWatchlist(prev => [...prev, data.blockchainId]);
      toast({
        title: "Success",
        description: `${selectedBlockchain?.name} added for price alerts.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Couldn’t set up price alert for the selected blockchain.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setShowThresholdForm(false);
      setSelectedBlockchain(null);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <Navbar 
          userName={session?.user?.name} onSignIn={handleSignIn}
          onLogout={() => signOut()} 
        />
       

        <main className="container mx-auto px-4 pt-20">
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4">
            <SearchBar 
              value={search} 
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              isLoading={loading}
            />
          </div>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center"
              >
                <p className="text-xl font-semibold text-destructive">{error}</p>
              </motion.div>
            ) : blockchains.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center"
              >
                <p className="text-xl font-semibold text-muted-foreground">
                  {loading ? "Loading..." : "No blockchains found"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {search.trim() 
                    ? "Try adjusting your search terms" 
                    : "Try searching for a blockchain"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6"
              >
                {blockchains.map((blockchain) => (
                  <BlockchainCard
                    key={blockchain.id}
                    blockchain={blockchain}
                    onAdd={() => handleAddBlockchain(blockchain)}
                    isAdded={watchlist.includes(blockchain.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {loading && !error && (
            <div className="flex justify-center my-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {hasMore && !loading && !search && !error && (
            <div ref={ref} className="h-20 w-full" />
          )}
        </main>

        <AnimatePresence>
          {showAuthDialog && (
            <AuthDialog 
              onClose={() => setShowAuthDialog(false)} 
              onSuccessfulAuth={() => {
                setShowAuthDialog(false);
                if (selectedBlockchain) {
                  setShowThresholdForm(true);
                }
              }}
            />
          )}

          {showThresholdForm && selectedBlockchain && (
            <ThresholdForm
              blockchain={selectedBlockchain}
              onSubmit={handleThresholdSubmit}
              onClose={() => {
                setShowThresholdForm(false);
                setSelectedBlockchain(null);
              }}
              
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/Navbar";
import { AuthDialog } from "@/components/auth-dialog";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LineChart, Bell } from "lucide-react";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const nav = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/explore");
    }
  }, [session, router]);

  const handleLoginSuccess = () => {
    setShowAuthDialog(false);
    router.push("/explore");
  };

  const handleSignIn = () => {
    // console.log("Sign in clicked");
    setShowAuthDialog(true);
  };

  return (
    <BackgroundLines className="min-h-screen flex flex-col">
      <Navbar userName={session?.user?.name} onSignIn={handleSignIn} />

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-4rem)] text-center px-4">
        <h1 className=" hidden md:block text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400">
          CryptoNotify
        </h1>
        <p className="mt-4 font-normal text-base sm:text-lg md:text-xl text-neutral-700 dark:text-neutral-300 max-w-lg">
          Smarter Alerts for Smarter Investors. Track, Notify, and Analyze
          Blockchain Prices.
        </p>

        <Button onClick={() => nav.push("/explore")} className="mt-8">
          Get started
        </Button>
        <motion.div
          className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-12 md:mt-20 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="w-full max-w-md mx-auto p-4 md:p-6 border-2 rounded-lg bg-card dark:border-none">
            <LineChart className="h-8 md:h-12 w-8 md:w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Real-time Tracking
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Monitor cryptocurrency prices in real-time with accurate data and
              beautiful visualizations.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto p-4 md:p-6 border-2 rounded-lg bg-card dark:border-none">
            <Bell className="h-8 md:h-12 w-8 md:w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Smart Alerts
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Set custom price thresholds and receive instant email
              notifications when they're triggered.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Auth Dialog */}
      {showAuthDialog && (
        <AuthDialog
          onClose={() => setShowAuthDialog(false)}
          onSuccessfulAuth={handleLoginSuccess}
        />
      )}
    </BackgroundLines>
  );
}

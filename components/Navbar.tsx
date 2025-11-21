import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";
import Link from "next/link";

interface NavbarProps {
  userName?: string;
  onLogout?: () => void;
  onSignIn?: () => void; // Callback for Sign In button
}

export function Navbar({ userName, onLogout, onSignIn }: NavbarProps) {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md shadow-md"
          : "bg-background/50 backdrop-blur-sm"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" passHref>
            <div className="flex items-center space-x-2 hover:cursor-pointer">
              <Image
                src={logo}
                alt="CryptoNotify Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-cover rounded-full"
              />
              <span
                className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent hover:text-primary transition-colors "
                role="heading"
                aria-level={1}
              >
                CryptoNotify
              </span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {session ? (
              <UserMenu userName={userName} onLogout={onLogout!} />
            ) : (
              <Button
                variant="default"
                onClick={onSignIn}
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

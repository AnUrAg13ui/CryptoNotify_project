
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

interface AuthDialogProps {
  onClose: () => void;
  onSuccessfulAuth: () => void;
  onAuthStart?: () => void; // Add this optional prop
}

export function AuthDialog({ onClose, onSuccessfulAuth, onAuthStart }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to register");
        }

        toast({
          title: "Account created successfully!",
          description: "Please sign in with your credentials.",
        });
        setIsSignUp(false);
      } else {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        
        if (result?.error) {
          toast({
            title: "Error",
            description: "Invalid credentials",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Signed in successfully!",
          });
          onSuccessfulAuth(); // Only call this for successful credential login
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    try {
      // Call onAuthStart when OAuth process begins
      onAuthStart?.();
      
      // Sign in with OAuth provider
      await signIn(provider, {
        callbackUrl: window.location.href,
      });
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      toast({
        title: "Error",
        description: `Failed to sign in with ${provider}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-2xl font-bold text-center">
          {isSignUp ? "Create an account" : "Sign in"}
        </DialogTitle>
        <div className="grid gap-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : (isSignUp ? "Sign up" : "Sign in")}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm font-medium">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Create an account"}
              </button>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn("github")}
            >
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn("google")}
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
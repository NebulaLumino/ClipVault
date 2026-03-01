import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Gamepad2,
  Sparkles,
} from "lucide-react";

interface LinkedPageProps {
  searchParams: Promise<{ platform?: string; error?: string }>;
}

export default async function LinkedPage({ searchParams }: LinkedPageProps) {
  const params = await searchParams;
  const platform = params.platform || "unknown";
  const error = params.error;

  const platformInfo: Record<
    string,
    { name: string; icon: string; color: string }
  > = {
    steam: { name: "Steam", icon: "🎮", color: "from-orange-500/20 to-orange-500/5" },
    riot: { name: "Riot Games", icon: "⚔️", color: "from-red-500/20 to-red-500/5" },
    epic: { name: "Epic Games", icon: "🏆", color: "from-purple-500/20 to-purple-500/5" },
  };

  const info = platformInfo[platform] || {
    name: "Account",
    icon: "✅",
    color: "from-primary/20 to-primary/5",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 bg-radial-gradient pointer-events-none" />

      <div className="container max-w-md relative">
        <div className="text-center mb-8 animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-lg font-bold text-gradient">ClipVault</span>
          </Link>
        </div>

        <Card className="glass-card border-0 animate-fade-in-up">
          <CardContent className="p-8 text-center">
            {error ? (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <Badge variant="destructive" className="mb-4">
                  Error
                </Badge>
                <h1 className="text-2xl font-bold mb-2">Linking Failed</h1>
                <p className="text-muted-foreground mb-6">
                  {error || "There was an error linking your account. Please try again."}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 glow-primary-sm">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <Badge variant="success" className="mb-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Success!
                </Badge>
                <h1 className="text-2xl font-bold mb-2">
                  {info.name} Account Linked!
                </h1>
                <p className="text-muted-foreground mb-6">
                  Your {info.name} account has been successfully connected to ClipVault. 
                  You'll now receive your gaming highlights automatically in Discord.
                </p>
              </>
            )}

            <div className="space-y-3">
              <Button className="w-full glow" asChild>
                <Link href="/">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Go to Discord to Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center animate-fade-in-up animate-delay-200">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="#" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

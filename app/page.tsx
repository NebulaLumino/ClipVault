import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Gamepad2,
  Zap,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  Twitter,
  Github,
  ExternalLink,
  Sparkles,
  Target,
  Layers,
  Cpu,
  Send,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />
      <div className="fixed inset-0 bg-radial-gradient pointer-events-none" />
      <div className="fixed inset-0 bg-radial-gradient-bottom pointer-events-none" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary-sm">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-gradient">ClipVault</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#games" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Games
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Testimonials
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Sign In
              </Button>
              <Button size="sm" className="glow">
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <Badge variant="success" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Now with AI-powered clip detection
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Automate Your{" "}
                <span className="text-gradient">Gaming Highlights</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Never miss a highlight again. ClipVault automatically captures and delivers 
                your best gaming moments from CS2, Dota 2, League of Legends, and Fortnite 
                directly to your Discord.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="glow text-base">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Add to Discord
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="xl" variant="outline" className="text-base">
                  <Zap className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    10K+ gamers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    4.9/5 rating
                  </span>
                </div>
              </div>
            </div>
            <div className="relative animate-fade-in animate-delay-300">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative glass-card rounded-2xl p-6 glow-primary">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">New Clip Available</div>
                        <div className="text-sm text-muted-foreground">Just now</div>
                      </div>
                    </div>
                    <Badge variant="success">New</Badge>
                  </div>
                  <div className="rounded-lg bg-black/40 aspect-video flex items-center justify-center border border-primary/20">
                    <PlayButton />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ACE clutch on Mirage</span>
                      <span className="text-primary">15K views</span>
                    </div>
                    <Progress value={75} className="h-1" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Send className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 glass-card rounded-xl p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Account Linked!</div>
                    <div className="text-xs text-muted-foreground">Steam connected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-gradient">Never Miss a Moment</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for competitive gamers who want to 
              capture and share their best plays automatically.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Discord Integration",
                description: "Direct delivery to your DMs or channel. Share highlights with friends instantly.",
                color: "from-blue-500/20 to-blue-500/5",
              },
              {
                icon: Layers,
                title: "Multi-Platform",
                description: "Support for CS2, Dota 2, League of Legends, and Fortnite. One bot for all games.",
                color: "from-purple-500/20 to-purple-500/5",
              },
              {
                icon: Target,
                title: "Smart Detection",
                description: "AI-powered highlight detection automatically finds your best moments.",
                color: "from-green-500/20 to-green-500/5",
              },
              {
                icon: Zap,
                title: "Fast Delivery",
                description: "Get clips delivered within seconds of match completion. No waiting around.",
                color: "from-yellow-500/20 to-yellow-500/5",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="glass-card glass-card-hover border-0 relative overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-50`} />
                <CardContent className="p-6 relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Games Section */}
      <section id="games" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4">
              Supported Games
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Works With Your{" "}
              <span className="text-gradient">Favorite Games</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Link your accounts and let ClipVault automatically capture highlights 
              from all your games in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Counter-Strike 2",
                short: "CS2",
                color: "from-orange-500/20 to-orange-500/5",
                borderColor: "border-orange-500/30",
                icon: "🎯",
              },
              {
                name: "Dota 2",
                short: "Dota 2",
                color: "from-red-500/20 to-red-500/5",
                borderColor: "border-red-500/30",
                icon: "⚔️",
              },
              {
                name: "League of Legends",
                short: "LoL",
                color: "from-blue-500/20 to-blue-500/5",
                borderColor: "border-blue-500/30",
                icon: "🏆",
              },
              {
                name: "Fortnite",
                short: "FN",
                color: "from-purple-500/20 to-purple-500/5",
                borderColor: "border-purple-500/30",
                icon: "🏝️",
              },
            ].map((game, index) => (
              <Card
                key={index}
                className={`glass-card glass-card-hover border-0 relative overflow-hidden animate-fade-in-up ${game.borderColor}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-50`} />
                <CardContent className="p-8 relative flex flex-col items-center text-center">
                  <div className="text-5xl mb-4">{game.icon}</div>
                  <h3 className="text-xl font-bold mb-1">{game.short}</h3>
                  <p className="text-sm text-muted-foreground">{game.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Request a Game
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Set Up in{" "}
              <span className="text-gradient">3 Easy Steps</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes. No complicated setup required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            
            {[
              {
                step: "01",
                title: "Add to Discord",
                description: "Click the button to add ClipVault to your Discord server. Grant the necessary permissions.",
                icon: MessageSquare,
              },
              {
                step: "02",
                title: "Link Your Accounts",
                description: "Use /link command to connect your Steam, Riot, or Epic Games account.",
                icon: Cpu,
              },
              {
                step: "03",
                title: "Get Highlights",
                description: "That's it! You'll automatically receive your best highlights directly in Discord.",
                icon: Zap,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="glass-card rounded-2xl p-8 h-full">
                  <div className="text-6xl font-bold text-gradient/20 mb-4">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge variant="outline" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by{" "}
              <span className="text-gradient">Competitive Gamers</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what gamers are saying about ClipVault.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Alex",
                handle: "@alex_clutch",
                avatar: "A",
                content: "ClipVault has completely changed how I share my highlights. My clips now get uploaded automatically right after my matches end. Game changer!",
              },
              {
                name: "Maya",
                handle: "@mayaplays",
                avatar: "M",
                content: "I used to miss all my best plays because I was busy playing. Now ClipVault catches everything and delivers it straight to my Discord. Love it!",
              },
              {
                name: "Jaden",
                handle: "@jadenfps",
                avatar: "J",
                content: "The AI detection is insane. It somehow knows exactly when I make a crazy play. My viewers love the instant clip drops in the channel.",
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="glass-card glass-card-hover border-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.handle}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card rounded-3xl p-12 text-center relative overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to{" "}
                <span className="text-gradient">Never Miss a Moment?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                Add ClipVault to your Discord server today and start capturing 
                your best gaming highlights automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" className="glow text-base">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Add to Discord
                </Button>
                <Button size="xl" variant="outline" className="text-base">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-gradient">ClipVault</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automate your gaming highlights. Capture, share, and celebrate 
                your best moments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-primary/10">
            <p className="text-sm text-muted-foreground">
              © 2024 ClipVault. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlayButton() {
  return (
    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors group">
      <div className="w-16 h-16 rounded-full bg-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
        <svg
          className="w-8 h-8 text-primary ml-1"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, BarChart3, Brain, Shield, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* 3D Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%, rgba(34, 197, 94, 0.3) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Floating Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

      {/* Header */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-12">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            EchoNest
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black">
              Dashboard
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent">
              Trade Smarter
            </span>
            <br />
            <span className="text-white">With AI Insights</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            The most advanced trading journal with AI-powered analytics, mood tracking, 
            and real-time market insights. Transform your trading performance today.
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-emerald-400 text-black hover:from-green-600 hover:to-emerald-500 text-lg px-8 py-3"
            >
              Start Trading Journey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: <BarChart3 className="w-8 h-8" />,
              title: "Advanced Analytics",
              description: "Real-time P&L tracking with comprehensive performance metrics and insights."
            },
            {
              icon: <Brain className="w-8 h-8" />,
              title: "AI Predictions",
              description: "Machine learning models predict trade success probability and market trends."
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "Risk Management",
              description: "Automated stop-loss tracking and risk assessment for every position."
            },
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Real-time Updates",
              description: "Live market data integration with TwelveData API for instant P&L updates."
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: "Community Insights",
              description: "Learn from top traders with anonymous performance benchmarks."
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: "Strategy Builder",
              description: "Create, test, and optimize trading strategies with backtesting tools."
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className="bg-gradient-to-br from-gray-900 to-black border-green-500/20 hover:border-green-500/40 transition-all duration-300 transform hover:scale-105 hover:rotate-1"
              style={{
                transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`,
              }}
            >
              <CardContent className="p-6">
                <div className="text-green-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "10K+", label: "Active Traders" },
              { number: "500K+", label: "Trades Analyzed" },
              { number: "85%", label: "Success Rate" },
              { number: "24/7", label: "Market Coverage" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-green-400 mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-green-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-400/10 rounded-full blur-xl animate-pulse delay-500" />
    </div>
  );
}

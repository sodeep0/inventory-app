"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRightLeft, TrendingUp } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          Welcome to <span className="text-primary">Stock Keeper</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground sm:text-lg md:text-xl">
          A minimalist, modern, and consistent inventory management solution.
        </p>
      </div>

      {user ? (
        <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 w-full max-w-4xl sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manage Inventory
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View, add, and manage your items.
              </p>
              <Button asChild className="mt-4 w-full sm:w-auto">
                <Link href="/inventory">Go to Inventory</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Track Movements
              </CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Record sales, returns, and adjustments.
              </p>
              <Button asChild className="mt-4 w-full sm:w-auto">
                <Link href="/movements">Go to Movements</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                View Reports
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Analyze your inventory performance.
              </p>
              <Button asChild className="mt-4 w-full sm:w-auto" disabled>
                <Link href="#">Coming Soon</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button asChild className="w-full">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="secondary" asChild className="w-full">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

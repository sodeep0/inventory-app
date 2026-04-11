"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhosphorIcon } from "@/components/icons"

interface DashboardStats {
  totalItems: number
  totalQuantity: number
  lowStockItems: number
  totalMovements: number
  recentMovements: any[]
  topItems: { name: string; quantity: number; sku: string }[]
}

export default function Home() {
  const { user } = useAuth()
  const token = user?.token
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  return (
    <div className="flex flex-col space-y-12 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}>
          Stock Keeper
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          Inventory management, refined.
        </p>
      </div>

      {user ? (
        <div className="space-y-8 w-full max-w-4xl mx-auto">
          {/* Stats Summary Cards */}
          {stats && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border border-border/60 p-4">
                <CardHeader className="p-0 mb-2">
                  <PhosphorIcon name="Package" size={20} className="text-muted-foreground mb-1" />
                  <CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-2xl font-semibold">{stats.totalItems}</p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 p-4">
                <CardHeader className="p-0 mb-2">
                  <PhosphorIcon name="List" size={20} className="text-muted-foreground mb-1" />
                  <CardTitle className="text-sm text-muted-foreground">Total Quantity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-2xl font-semibold">{stats.totalQuantity}</p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 p-4">
                <CardHeader className="p-0 mb-2">
                  <PhosphorIcon name="Warning" size={20} className="text-muted-foreground mb-1" />
                  <CardTitle className="text-sm text-muted-foreground">Low Stock</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-2xl font-semibold">{stats.lowStockItems}</p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 p-4">
                <CardHeader className="p-0 mb-2">
                  <PhosphorIcon name="ArrowsLeftRight" size={20} className="text-muted-foreground mb-1" />
                  <CardTitle className="text-sm text-muted-foreground">Movements</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-2xl font-semibold">{stats.totalMovements}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Cards - Bento Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-border/60 p-6">
              <CardHeader className="p-0 mb-4">
                <PhosphorIcon name="Package" size={20} className="text-muted-foreground mb-3" />
                <CardTitle className="text-base">Inventory</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground mb-4">
                  View, add, and manage your stock items.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/inventory">Open Inventory</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/60 p-6">
              <CardHeader className="p-0 mb-4">
                <PhosphorIcon name="ArrowsLeftRight" size={20} className="text-muted-foreground mb-3" />
                <CardTitle className="text-base">Movements</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Record sales, returns, and stock adjustments.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/movements">View Movements</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/60 p-6 sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-0 mb-4">
                <PhosphorIcon name="TrendUp" size={20} className="text-muted-foreground mb-3" />
                <CardTitle className="text-base">Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze your inventory performance and trends.
                </p>
                <Button asChild variant="outline" className="w-full" asChild>
                  <Link href="/reports">View Reports</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Top Items Section */}
          {stats && stats.topItems.length > 0 && !loading && (
            <div className="space-y-4">
              <h2 className="text-xl font-medium" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.01em" }}>
                Top Items by Quantity
              </h2>
              <div className="space-y-2">
                {stats.topItems.map((item, index) => (
                  <Card key={item._id || index} className="border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold">{item.quantity}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Movements Section */}
          {stats && stats.recentMovements.length > 0 && !loading && (
            <div className="space-y-4">
              <h2 className="text-xl font-medium" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.01em" }}>
                Recent Movements
              </h2>
              <div className="space-y-2">
                {stats.recentMovements.map((movement: any) => (
                  <Card key={movement._id} className="border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {movement.itemId ? movement.itemId.name : "Unknown Item"}
                        </p>
                        <p className="text-sm text-muted-foreground">{movement.type}</p>
                      </div>
                      <p className={`text-lg font-medium ${movement.delta >= 0 ? "text-pale-green-text" : "text-pale-red-text"}`}>
                        {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Auth Prompt */
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto">
          <Button asChild className="w-full">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

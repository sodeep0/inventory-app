"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhosphorIcon } from "@/components/icons";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/contexts/AuthContext";
import { handleAuthError } from "@/lib/auth";
import { formatNepaliDateTime } from "@/lib/utils";

interface ReportData {
  totalStockValue: number;
  potentialRevenue: number;
  salesCount: number;
  returnsCount: number;
  recentActivity: any[];
}

interface MovementsByType {
  _id: string;
  count: number;
}

const movementTypeColors: Record<string, string> = {
  sale: "bg-pale-red-bg text-pale-red-text",
  purchase: "bg-pale-green-bg text-pale-green-text",
  return: "bg-pale-yellow-bg text-pale-yellow-text",
  adjustment: "bg-pale-blue-bg text-pale-blue-text",
  initial: "bg-muted text-muted-foreground",
};

const movementTypeLabel: Record<string, string> = {
  sale: "Sale",
  purchase: "Purchase",
  return: "Return",
  adjustment: "Adjustment",
  initial: "Initial Stock",
};

function ReportsPage({ token }: { token?: string }) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [movementsByType, setMovementsByType] = useState<MovementsByType[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const fetchReports = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [reportRes, typeRes] = await Promise.all([
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/reports`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/reports/movements-by-type`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);
      setReportData(reportRes.data);
      setMovementsByType(typeRes.data.movementsByType || []);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      handleAuthError(error, logout);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}
        >
          Reports
        </h1>
        <p className="text-muted-foreground">Loading report data...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-8">
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}
        >
          Reports
        </h1>
        <p className="text-muted-foreground">Failed to load report data.</p>
      </div>
    );
  }

  const maxCount = Math.max(...movementsByType.map(m => m.count), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}
        >
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze your inventory performance and trends.
        </p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <PhosphorIcon name="Coins" size={24} className="text-primary mb-2" />
            <CardTitle className="text-sm text-muted-foreground">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(reportData.totalStockValue)}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <PhosphorIcon name="TrendUp" size={24} className="text-pale-green-text mb-2" />
            <CardTitle className="text-sm text-muted-foreground">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(reportData.potentialRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <PhosphorIcon name="ShoppingCart" size={24} className="text-accent mb-2" />
            <CardTitle className="text-sm text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{reportData.salesCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <PhosphorIcon name="ArrowCounterClockwise" size={24} className="text-pale-yellow-text mb-2" />
            <CardTitle className="text-sm text-muted-foreground">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{reportData.returnsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Movement Breakdown */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle>Movement Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Count of stock movements by type</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {movementsByType.length > 0 ? (
              movementsByType.map(m => {
                const label = movementTypeLabel[m._id] || m._id;
                const colorClass = movementTypeColors[m._id] || movementTypeColors.adjustment;
                const percentage = Math.round((m.count / maxCount) * 100);
                return (
                  <div key={m._id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                        {label}
                      </span>
                      <span className="font-medium">{m.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No movements recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Last 10 stock movements</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportData.recentActivity.length > 0 ? (
              reportData.recentActivity.map((movement: any) => {
                const type = movement.type as keyof typeof movementTypeColors;
                const colorClass = movementTypeColors[type] || movementTypeColors.adjustment;
                const label = movementTypeLabel[type] || movement.type;
                return (
                  <div
                    key={movement._id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {movement.itemId ? movement.itemId.name : "Unknown"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${movement.delta >= 0 ? "text-pale-green-text" : "text-pale-red-text"}`}>
                      {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(ReportsPage);

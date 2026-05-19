"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RecordSaleDialog } from "@/components/record-sale-dialog";
import { AddStockDialog } from "@/components/add-stock-dialog";
import { RecordReturnDialog } from "@/components/record-return-dialog";
import { AdjustStockDialog } from "@/components/adjust-stock-dialog";
import withAuth from "@/components/withAuth";
import { PhosphorIcon } from "@/components/icons";
import { formatNepaliDateTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { handleAuthError } from "@/lib/auth";
import { downloadCsvExport } from "@/lib/export";
import { StockMovement } from "@/types";

const movementTypeStyle = {
  sale: "bg-pale-red-bg text-pale-red-text",
  purchase: "bg-pale-green-bg text-pale-green-text",
  addition: "bg-pale-green-bg text-pale-green-text",
  return: "bg-pale-yellow-bg text-pale-yellow-text",
  adjustment: "bg-pale-blue-bg text-pale-blue-text",
};

const movementTypeLabel = {
  sale: "Sale",
  purchase: "Purchase",
  addition: "Addition",
  return: "Return",
  adjustment: "Adjusted",
};

function MovementsPage({ token }: { token?: string }) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecordSaleDialogOpen, setIsRecordSaleDialogOpen] = useState(false);
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [isRecordReturnDialogOpen, setIsRecordReturnDialogOpen] =
    useState(false);
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { logout } = useAuth();
  
  const isLoadingRef = useRef(false);

  const fetchMovements = useCallback(async (requestedPage = 1) => {
    if (!token || isLoadingRef.current) return;
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(requestedPage));
      params.set("limit", String(pageSize));
      if (search.trim()) params.set("search", search.trim());
      if (typeFilter) params.set("type", typeFilter);
      const sortParam = sortDir === "desc" ? `-${sortField}` : sortField;
      params.set("sort", sortParam);

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/movements?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetched = res.data.movements || [];
      const fetchedTotal = res.data.total || 0;
      setTotal(fetchedTotal);
      if (requestedPage === 1) {
        setMovements(fetched);
      } else {
        setMovements((prev) => [...prev, ...fetched]);
      }
      setPage(requestedPage);
    } catch (error) {
      console.error("Failed to fetch movements", error);
      handleAuthError(error, logout);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [token, pageSize, search, typeFilter, sortField, sortDir]);

  useEffect(() => {
    if (token) {
      fetchMovements();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const timeoutId = setTimeout(() => {
      fetchMovements(1);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [search, typeFilter, sortField, sortDir, token]);

  const handleMovementAdded = () => {
    fetchMovements(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (movements.length < total && !isLoading) {
      fetchMovements(nextPage);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}>
            Movements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track stock changes across your inventory.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadCsvExport("/export/movements", "movements.csv")}
        >
          <PhosphorIcon name="DownloadSimple" size={16} /> Export
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          onClick={() => setIsRecordSaleDialogOpen(true)}
          variant="outline"
        >
          <PhosphorIcon name="Minus" size={16} /> Sale
        </Button>
        <Button
          onClick={() => setIsAddStockDialogOpen(true)}
          variant="outline"
        >
          <PhosphorIcon name="Plus" size={16} /> Add Stock
        </Button>
        <Button
          onClick={() => setIsRecordReturnDialogOpen(true)}
          variant="outline"
        >
          <PhosphorIcon name="ArrowCounterClockwise" size={16} /> Return
        </Button>
        <Button
          onClick={() => setIsAdjustStockDialogOpen(true)}
          variant="outline"
        >
          <PhosphorIcon name="SlidersHorizontal" size={16} /> Adjust
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <input
            type="text"
            placeholder="Search by item name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All Types</option>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
          <option value="return">Return</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("itemId")}
              >
                <span className="flex items-center gap-1">
                  Item
                  {sortField === "itemId" && (
                    <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                  )}
                </span>
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("type")}
              >
                <span className="flex items-center gap-1">
                  Type
                  {sortField === "type" && (
                    <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("delta")}
              >
                <span className="flex items-center gap-1">
                  Delta
                  {sortField === "delta" && (
                    <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort("createdAt")}
              >
                <span className="flex items-center gap-1">
                  Date
                  {sortField === "createdAt" && (
                    <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                  )}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => {
              const type = movement.type as keyof typeof movementTypeStyle;
              const style = movementTypeStyle[type] || movementTypeStyle.adjustment;
              const label = movementTypeLabel[type] || movement.type;
              return (
                <TableRow key={movement._id}>
                  <TableCell>
                    {movement.itemId ? movement.itemId.name : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.itemId ? movement.itemId.sku : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${style}`}
                    >
                      {label}
                    </span>
                  </TableCell>
                  <TableCell className={movement.delta >= 0 ? "text-pale-green-text" : "text-pale-red-text"}>
                    {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {movements.map((movement) => {
          const type = movement.type as keyof typeof movementTypeStyle;
          const style = movementTypeStyle[type] || movementTypeStyle.adjustment;
          const label = movementTypeLabel[type] || movement.type;
          return (
            <div
              key={movement._id}
              className="rounded-lg border border-border/60 p-4 bg-card"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">
                      {movement.itemId ? movement.itemId.name : "—"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      SKU: {movement.itemId ? movement.itemId.sku : "—"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${style}`}
                  >
                    {label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Delta</span>
                    <p className={`font-medium ${movement.delta >= 0 ? "text-pale-green-text" : "text-pale-red-text"}`}>
                      {movement.delta >= 0 ? `+${movement.delta}` : movement.delta}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">
                      {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      <div className="flex items-center justify-center py-4">
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={isLoading || movements.length >= total}
          className="w-full sm:w-auto"
        >
          {movements.length >= total ? "All records loaded" : isLoading ? "Loading..." : "Load more"}
        </Button>
      </div>

      <RecordSaleDialog
        isOpen={isRecordSaleDialogOpen}
        onClose={() => setIsRecordSaleDialogOpen(false)}
        onMovementAdded={handleMovementAdded}
        token={token}
      />
      <AddStockDialog
        isOpen={isAddStockDialogOpen}
        onClose={() => setIsAddStockDialogOpen(false)}
        onMovementAdded={handleMovementAdded}
        token={token}
      />
      <RecordReturnDialog
        isOpen={isRecordReturnDialogOpen}
        onClose={() => setIsRecordReturnDialogOpen(false)}
        onMovementAdded={handleMovementAdded}
        token={token}
      />
      <AdjustStockDialog
        isOpen={isAdjustStockDialogOpen}
        onClose={() => setIsAdjustStockDialogOpen(false)}
        onMovementAdded={handleMovementAdded}
        token={token}
      />
    </div>
  );
}

export default withAuth(MovementsPage);

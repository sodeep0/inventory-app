"use client";

import { useState, useEffect, useCallback } from "react";
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
import { PlusCircle, MinusCircle, Undo2, Settings2 } from "lucide-react";
import { formatNepaliDateTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { handleAuthError } from "@/lib/auth";
import { StockMovement } from "@/types";

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
  const { logout } = useAuth();

  const fetchMovements = useCallback(async (requestedPage = 1) => {
    if (!token || isLoading) return;
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/movements?page=${requestedPage}&limit=${pageSize}`,
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
      setIsLoading(false);
    }
  }, [token, pageSize, logout, isLoading]);

  useEffect(() => {
    if (token) {
      fetchMovements();
    }
  }, [token, fetchMovements]);

  const handleMovementAdded = () => {
    // Refresh from first page to show the newest movement at the top
    fetchMovements(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (movements.length < total && !isLoading) {
      fetchMovements(nextPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Stock Movements</h1>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button 
          onClick={() => setIsRecordSaleDialogOpen(true)}
          className="w-full"
        >
          <MinusCircle className="mr-2 h-4 w-4" /> Record Sale
        </Button>
        <Button 
          onClick={() => setIsAddStockDialogOpen(true)}
          className="w-full"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
        </Button>
        <Button 
          onClick={() => setIsRecordReturnDialogOpen(true)}
          className="w-full"
        >
          <Undo2 className="mr-2 h-4 w-4" /> Record Return
        </Button>
        <Button 
          onClick={() => setIsAdjustStockDialogOpen(true)}
          className="w-full"
        >
          <Settings2 className="mr-2 h-4 w-4" /> Adjust Stock
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement._id}>
                <TableCell>
                  {movement.itemId ? movement.itemId.name : "N/A"}
                </TableCell>
                <TableCell>
                  {movement.itemId ? movement.itemId.sku : "N/A"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movement.type === "sale"
                        ? "bg-red-100 text-red-800"
                        : movement.type === "purchase" || movement.type === "addition"
                        ? "bg-green-100 text-green-800"
                        : movement.type === "return"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {movement.type === "adjustment"
                      ? "Adjusted"
                      : movement.type === "purchase" || movement.type === "addition"
                      ? "Purchased"
                      : movement.type === "sale"
                      ? "Sale"
                      : movement.type === "return"
                      ? "Returned"
                      : movement.type}
                  </span>
                </TableCell>
                <TableCell>{(movement.delta)}</TableCell>
                <TableCell>
                  {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {movements.map((movement) => (
          <div
            key={movement._id}
            className="rounded-lg border p-4 shadow-sm bg-card"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-lg">
                    {movement.itemId ? movement.itemId.name : "N/A"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {movement.itemId ? movement.itemId.sku : "N/A"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    movement.type === "sale"
                      ? "bg-red-100 text-red-800"
                      : movement.type === "purchase" || movement.type === "addition"
                      ? "bg-green-100 text-green-800"
                      : movement.type === "return"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {movement.type === "adjustment"
                    ? "Adjusted"
                    : movement.type === "purchase" || movement.type === "addition"
                    ? "Purchased"
                    : movement.type === "sale"
                    ? "Sale"
                    : movement.type === "return"
                    ? "Returned"
                    : movement.type}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantity Change:</span>
                  <p className="font-medium">{movement.delta}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex items-center justify-center py-4">
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={isLoading || movements.length >= total}
          className="w-full sm:w-auto"
        >
          {movements.length >= total ? "No more records" : isLoading ? "Loading..." : "Load more"}
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

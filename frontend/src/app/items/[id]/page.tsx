'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Item, StockMovement } from '@/types';
import { ReturnReasonDialog } from '@/components/return-reason-dialog';
import withAuth from '@/components/withAuth';
import { formatNepaliDateTime } from '@/lib/utils';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { handleAuthError } from '@/lib/auth';

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

function ItemDetailsPage({ token }: { token?: string }) {
  const [item, setItem] = useState<Item | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [continuationQuantity, setContinuationQuantity] = useState<number | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { logout } = useAuth();

  const fetchItemDetails = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItem(res.data);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 404) {
        router.replace('/not-found');
        return;
      }
      console.error('Failed to fetch item details', error);
      handleAuthError(error, logout);
    }
  }, [id, token, router, logout]);

  const fetchItemMovements = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/movements/item/${id}?page=1&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const movementsData = res.data;
      if (movementsData && Array.isArray(movementsData.movements)) {
        setMovements(movementsData.movements);
        setTotal(movementsData.total);
        setContinuationQuantity(movementsData.continuationQuantity);
      } else {
        setMovements([]);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch item movements', error);
      handleAuthError(error, logout);
    }
  }, [id, limit, token, logout]);

  useEffect(() => {
    if (token) {
      fetchItemDetails();
      fetchItemMovements();
    }
  }, [token, fetchItemDetails, fetchItemMovements]);

  const loadMore = async () => {
    if (!id) return;
    const nextPage = page + 1;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/movements/item/${id}?page=${nextPage}&limit=${limit}&startingQuantity=${continuationQuantity}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data;
      if (data && Array.isArray(data.movements)) {
        setMovements([...movements, ...data.movements]);
        setPage(nextPage);
        setContinuationQuantity(data.continuationQuantity);
      }
    } catch (error: unknown) {
      console.error('Failed to load more movements', error);
      handleAuthError(error, logout);
    }
  };

  const handleReturnClick = (movementId: string) => {
    setSelectedMovementId(movementId);
    setIsReturnDialogOpen(true);
  };

  const handleReturnSubmit = async (reason: string) => {
    if (!selectedMovementId) return;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/returns/from-movement/${selectedMovementId}`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 201) {
        setPage(1);
        fetchItemDetails();
        fetchItemMovements();
      }
    } catch (error: unknown) {
      console.error('Failed to submit return', error);
      handleAuthError(error, logout);
    }
  };

  if (!item) {
    return <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Item Details */}
      <div>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          &larr; Back
        </Button>
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}>
          {item.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">SKU: {item.sku}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Quantity</p>
          <p className="text-2xl font-semibold">{item.quantity}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Low Stock</p>
          <p className="text-2xl font-semibold">{item.lowStockThreshold}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Supplier</p>
          <p className="text-lg">{item.supplierName || "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</p>
          <p className="text-lg">{item.status}</p>
        </div>
        {item.category && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Category</p>
            <p className="text-lg">{item.category}</p>
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-xl tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>Transaction History</h2>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Running</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => {
                const type = movement.type as keyof typeof movementTypeStyle;
                const style = movementTypeStyle[type] || movementTypeStyle.adjustment;
                const label = movementTypeLabel[type] || movement.type;
                return (
                  <TableRow key={movement._id.toString()}>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${style}`}>
                        {label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{movement.customerName || "—"}</TableCell>
                    <TableCell>
                      <span className={movement.delta > 0 ? 'text-pale-green-text font-medium' : movement.delta < 0 ? 'text-pale-red-text font-medium' : ''}>
                        {movement.delta > 0 ? '+' : ''}{movement.delta}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{movement.runningQuantity ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                    </TableCell>
                    <TableCell>
                      {movement.type === 'sale' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturnClick(movement._id.toString())}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {movements.map((movement) => {
            const type = movement.type as keyof typeof movementTypeStyle;
            const style = movementTypeStyle[type] || movementTypeStyle.adjustment;
            const label = movementTypeLabel[type] || movement.type;
            return (
              <div
                key={movement._id.toString()}
                className="rounded-lg border border-border/60 p-4 bg-card"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${style}`}>
                      {label}
                    </span>
                    {movement.type === 'sale' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturnClick(movement._id.toString())}
                      >
                        Return
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-medium">{movement.customerName || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delta</span>
                      <p className={`font-medium ${movement.delta > 0 ? 'text-pale-green-text' : movement.delta < 0 ? 'text-pale-red-text' : ''}`}>
                        {movement.delta > 0 ? '+' : ''}{movement.delta}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Running</span>
                      <p className="font-semibold">{movement.runningQuantity ?? '—'}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">
                      {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center">
          {movements.length < total && (
            <Button variant="outline" onClick={loadMore} className="w-full sm:w-auto">
              Load More
            </Button>
          )}
        </div>
      </div>

      <ReturnReasonDialog
        isOpen={isReturnDialogOpen}
        onClose={() => setIsReturnDialogOpen(false)}
        onSubmit={handleReturnSubmit}
      />
    </div>
  );
}

export default withAuth(ItemDetailsPage);

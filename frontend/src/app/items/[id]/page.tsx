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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, StockMovement } from '@/types';
import { ReturnReasonDialog } from '@/components/return-reason-dialog';
import withAuth from '@/components/withAuth';
import { formatNepaliDateTime } from '@/lib/utils';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { handleAuthError } from '@/lib/auth';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Item Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">SKU</p>
              <p className="text-lg">{item.sku}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Quantity</p>
              <p className="text-lg font-semibold">{item.quantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Low Stock Threshold</p>
              <p className="text-lg">{item.lowStockThreshold}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg">{item.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold sm:text-2xl">Transaction History</h2>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Quantity Change</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement._id.toString()}>
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
                  <TableCell>{movement.customerName}</TableCell>
                  <TableCell>{movement.delta}</TableCell>
                  <TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {movements.map((movement) => (
            <div
              key={movement._id.toString()}
              className="rounded-lg border p-4 shadow-sm bg-card"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
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
                    <span className="text-muted-foreground">Customer:</span>
                    <p className="font-medium">{movement.customerName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-medium">{movement.delta}</p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {formatNepaliDateTime(movement.createdAt, { language: 'en' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
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

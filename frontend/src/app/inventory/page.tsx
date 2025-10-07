"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddItemDialog } from "@/components/add-item-dialog";
import { EditItemDialog } from "@/components/edit-item-dialog";
import { DeleteItemDialog } from "@/components/delete-item-dialog";
import withAuth from "@/components/withAuth";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import { Item } from "@/types";
import ErrorBoundary from "@/components/error-boundary";

// Memoized Item Row Component to prevent unnecessary re-renders
const ItemRow = memo(({
  item,
  onNameClick,
  onEdit,
  onDelete,
}: {
  item: Item;
  onNameClick: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) => {
  const isLowStock = item.quantity <= item.lowStockThreshold;
  
  return (
    <TableRow
      className={isLowStock ? "bg-red-50 dark:bg-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/50" : ""}
    >
      <TableCell
        className="font-medium text-primary hover:underline cursor-pointer"
        onClick={() => onNameClick(item._id)}
      >
        {item.name}
      </TableCell>
      <TableCell>{item.sku}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{item.lowStockThreshold}</TableCell>
      <TableCell>{item.supplierName}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(item)}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

ItemRow.displayName = 'ItemRow';

// Memoized Item Card Component for mobile
const ItemCard = memo(({
  item,
  onNameClick,
  onEdit,
  onDelete,
}: {
  item: Item;
  onNameClick: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) => {
  const isLowStock = item.quantity <= item.lowStockThreshold;
  
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        isLowStock
          ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800"
          : "bg-card"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3
            className="font-medium text-primary hover:underline cursor-pointer text-lg"
            onClick={() => onNameClick(item._id)}
          >
            {item.name}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item)}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">SKU:</span>
            <p className="font-medium">{item.sku}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Quantity:</span>
            <p className="font-medium">{item.quantity}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Low Stock:</span>
            <p className="font-medium">{item.lowStockThreshold}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Supplier:</span>
            <p className="font-medium">{item.supplierName || "N/A"}</p>
          </div>
        </div>

        {isLowStock && (
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">
            ⚠️ Low Stock Alert
          </div>
        )}
      </div>
    </div>
  );
});

ItemCard.displayName = 'ItemCard';

function InventoryPage({ token }: { token?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref for loading state to avoid dependency in useCallback
  const isLoadingRef = useRef(false);
  const [, setLoadingState] = useState(false); // For triggering re-renders only
  
  const router = useRouter();
  const { logout } = useAuth();

  // Optimized fetchItems without isLoading dependency
  const fetchItems = useCallback(async (requestedPage = 1) => {
    if (!token || isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoadingState(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set("page", String(requestedPage));
      params.set("limit", String(pageSize));
      if (search.trim()) params.set("search", search.trim());
      
      const data = await apiClient.get<{ items: Item[]; total: number }>(
        `/items?${params.toString()}`
      );
      
      const fetched = data.items || [];
      const fetchedTotal = data.total || 0;
      
      setTotal(fetchedTotal);
      setItems(prev => requestedPage === 1 ? fetched : [...prev, ...fetched]);
      setPage(requestedPage);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error("Failed to fetch items:", errorMessage);
      
      // Handle 401 specifically (already handled by interceptor, but for safety)
      if (errorMessage.includes('401')) {
        logout();
      }
    } finally {
      isLoadingRef.current = false;
      setLoadingState(false);
    }
  }, [token, pageSize, search]); // Remove logout from dependencies

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchItems(1);
    }
  }, [token]); // Remove fetchItems from dependencies

  // Debounced search
  useEffect(() => {
    if (!token) return;
    
    const timeoutId = setTimeout(() => {
      fetchItems(1);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [search, token]); // Remove fetchItems from dependencies

  // Memoized filtered items - only recalculate when items or lowOnly changes
  const displayedItems = useMemo(() => {
    if (!lowOnly) return items;
    return items.filter(item => item.quantity <= item.lowStockThreshold);
  }, [items, lowOnly]);

  // Memoized event handlers to prevent child re-renders
  const handleNameClick = useCallback((itemId: string) => {
    router.push(`/items/${itemId}`);
  }, [router]);

  const handleOpenEditDialog = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsEditItemDialogOpen(true);
  }, []);

  const handleOpenDeleteDialog = useCallback((item: Item) => {
    setSelectedItem(item);
    setIsDeleteItemDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditItemDialogOpen(false);
    setSelectedItem(null);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteItemDialogOpen(false);
    setSelectedItem(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    if (items.length < total && !isLoadingRef.current) {
      fetchItems(nextPage);
    }
  }, [page, items.length, total, fetchItems]);

  const handleRefresh = useCallback(() => {
    fetchItems(1);
  }, [fetchItems]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Inventory</h1>
          <Button
            onClick={() => setIsAddItemDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <div className="flex items-center gap-2 whitespace-nowrap">
            <input
              id="low-only"
              type="checkbox"
              checked={lowOnly}
              onChange={() => setLowOnly(v => !v)}
              className="h-4 w-4"
            />
            <Label htmlFor="low-only" className="text-sm">
              Low stock only
            </Label>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Low Stock Threshold</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedItems.map((item) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  onNameClick={handleNameClick}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {displayedItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onNameClick={handleNameClick}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex items-center justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingRef.current || items.length >= total}
            className="w-full sm:w-auto"
          >
            {items.length >= total
              ? "No more records"
              : isLoadingRef.current
              ? "Loading..."
              : "Load more"}
          </Button>
        </div>

        {/* Dialogs */}
        <AddItemDialog
          isOpen={isAddItemDialogOpen}
          onClose={() => setIsAddItemDialogOpen(false)}
          onItemAdded={handleRefresh}
          token={token}
        />
        {selectedItem && (
          <>
            <EditItemDialog
              isOpen={isEditItemDialogOpen}
              onClose={handleCloseEditDialog}
              item={selectedItem}
              onItemUpdated={handleRefresh}
              token={token}
            />
            <DeleteItemDialog
              isOpen={isDeleteItemDialogOpen}
              onClose={handleCloseDeleteDialog}
              item={selectedItem}
              onItemDeleted={handleRefresh}
              token={token}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default withAuth(InventoryPage);


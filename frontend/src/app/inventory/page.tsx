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
import { PhosphorIcon } from "@/components/icons";
import { AddItemDialog } from "@/components/add-item-dialog";
import { EditItemDialog } from "@/components/edit-item-dialog";
import { DeleteItemDialog } from "@/components/delete-item-dialog";
import { ImportCsvDialog } from "@/components/import-csv-dialog";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import { Item } from "@/types";
import ErrorBoundary from "@/components/error-boundary";

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
  const formatPrice = (price: number) => {
    if (!price && price !== 0) return "—";
    return price === 0 ? "—" : `$${price.toFixed(2)}`;
  };
  
  return (
    <TableRow
      className={isLowStock ? "bg-pale-red-bg/50" : ""}
    >
      <TableCell
        className="font-medium text-foreground hover:underline cursor-pointer"
        onClick={() => onNameClick(item._id)}
      >
        {item.name}
      </TableCell>
      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell className="text-muted-foreground">{item.lowStockThreshold}</TableCell>
      <TableCell className="text-muted-foreground">{formatPrice(item.buyPrice)}</TableCell>
      <TableCell className="text-muted-foreground">{formatPrice(item.sellPrice)}</TableCell>
      <TableCell className="text-muted-foreground">{item.supplierName || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
      <TableCell className="text-muted-foreground">
        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <PhosphorIcon name="PencilSimple" size={14} />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(item)}
          >
            <PhosphorIcon name="Trash" size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

ItemRow.displayName = 'ItemRow';

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
      className={`rounded-lg border p-4 ${
        isLowStock
          ? "bg-pale-red-bg/50 border-pale-red-text/20"
          : "bg-card border-border/60"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3
            className="font-medium text-foreground hover:underline cursor-pointer text-lg"
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
              <PhosphorIcon name="PencilSimple" size={14} />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item)}
            >
              <PhosphorIcon name="Trash" size={14} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">SKU</span>
            <p className="font-medium">{item.sku}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Quantity</span>
            <p className="font-medium">{item.quantity}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Low Stock</span>
            <p className="font-medium">{item.lowStockThreshold}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Supplier</span>
            <p className="font-medium">{item.supplierName || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Buy Price</span>
            <p className="font-medium">{item.buyPrice ? `$${item.buyPrice.toFixed(2)}` : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sell Price</span>
            <p className="font-medium">{item.sellPrice ? `$${item.sellPrice.toFixed(2)}` : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{item.category || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {item.tags && item.tags.length > 0 ? (
                item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-secondary">—</span>
              )}
            </div>
          </div>
        </div>

        {isLowStock && (
          <div className="text-sm text-pale-red-text font-medium">
            Low stock alert
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
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>("quantity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string | null>(null);
  
  const isLoadingRef = useRef(false);
  const [, setLoadingState] = useState(false);
  
  const router = useRouter();
  const { logout } = useAuth();

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
      if (categoryFilter) params.set("category", categoryFilter);
      const sortParam = sortDir === "desc" ? `-${sortField}` : sortField;
      params.set("sort", sortParam);
      
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
      
      if (errorMessage.includes('401')) {
        logout();
      }
    } finally {
      isLoadingRef.current = false;
      setLoadingState(false);
    }
  }, [token, pageSize, search, sortField, sortDir, categoryFilter, logout]);

  useEffect(() => {
    if (token) {
      fetchItems(1);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const timeoutId = setTimeout(() => {
      fetchItems(1);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [search, token]);

  const displayedItems = useMemo(() => {
    if (!lowOnly) return items;
    return items.filter(item => item.quantity <= item.lowStockThreshold);
  }, [items, lowOnly]);

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

  // Fetch categories
  useEffect(() => {
    if (!token) return;
    apiClient.get<{ categories: string[] }>("/items/categories")
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, [token]);

  // Export handlers
  const handleExportItems = useCallback(() => {
    const userJSON = localStorage.getItem("user");
    if (!userJSON) return;
    const userData = JSON.parse(userJSON);
    const token = userData.token;
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/items?token=${token}`, "_blank");
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}>
            Inventory
          </h1>
          <Button
            onClick={() => setIsAddItemDialogOpen(true)}
            className="sm:w-auto"
          >
            <PhosphorIcon name="Plus" size={16} /> Add Item
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-pale-red-text/20 bg-pale-red-bg px-4 py-3 text-sm text-pale-red-text">
            <div className="flex items-center justify-between">
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-pale-red-text hover:text-pale-red-text/80"
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
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={() => setLowOnly(v => !v)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              Low stock only
            </span>
          </label>
          <Button
            variant="outline"
            onClick={handleExportItems}
            className="sm:ml-auto"
          >
            <PhosphorIcon name="DownloadSimple" size={16} /> Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImportCsvDialogOpen(true)}
          >
            <PhosphorIcon name="Plus" size={16} /> Import CSV
          </Button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center gap-1">
                    Name
                    {sortField === "name" && (
                      <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                    )}
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground">SKU</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort("quantity")}
                >
                  <span className="flex items-center gap-1">
                    Qty
                    {sortField === "quantity" && (
                      <PhosphorIcon name={sortDir === "asc" ? "CaretUp" : "CaretDown"} size={14} />
                    )}
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground">Low Stock</TableHead>
                <TableHead className="text-muted-foreground">Buy Price</TableHead>
                <TableHead className="text-muted-foreground">Sell Price</TableHead>
                <TableHead className="text-muted-foreground">Supplier</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Tags</TableHead>
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
              ? "All items loaded"
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
        <ImportCsvDialog
          isOpen={isImportCsvDialogOpen}
          onClose={() => setIsImportCsvDialogOpen(false)}
          onImportComplete={handleRefresh}
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

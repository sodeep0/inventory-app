"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddItemDialog } from "@/components/add-item-dialog";
import { EditItemDialog } from "@/components/edit-item-dialog";
import { DeleteItemDialog } from "@/components/delete-item-dialog";
import withAuth from "@/components/withAuth";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { handleAuthError } from "@/lib/auth";
import { Item } from "@/types";

function InventoryPage({ token }: { token?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const fetchItems = useCallback(async (requestedPage = 1) => {
    if (!token || isLoading) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(requestedPage));
      params.set("limit", String(pageSize));
      if (search.trim()) params.set("search", search.trim());
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/items?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const fetched = res.data.items || [];
      const fetchedTotal = res.data.total || 0;
      setTotal(fetchedTotal);
      if (requestedPage === 1) {
        setItems(fetched);
      } else {
        setItems((prev) => [...prev, ...fetched]);
      }
      setPage(requestedPage);
    } catch (error) {
      console.error("Failed to fetch items", error);
      handleAuthError(error, logout);
    } finally {
      setIsLoading(false);
    }
  }, [token, isLoading, pageSize, search, logout]);

  useEffect(() => {
    if (token) {
      fetchItems(1);
    }
  }, [token, fetchItems]);

  // Debounce search input to avoid spamming requests
  useEffect(() => {
    const handle = setTimeout(() => {
      if (token) {
        fetchItems(1);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, token, fetchItems]);

  const handleNameClick = (itemId: string) => {
    router.push(`/items/${itemId}`);
  };

  // Handlers for opening dialogs
  const handleOpenEditDialog = (item: Item) => {
    setSelectedItem(item);
    setIsEditItemDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteItemDialogOpen(true);
  };
  
  // Handlers for closing dialogs to also clear the selected item
  const handleCloseEditDialog = () => {
    setIsEditItemDialogOpen(false);
    setSelectedItem(null);
  };
  
  const handleCloseDeleteDialog = () => {
    setIsDeleteItemDialogOpen(false);
    setSelectedItem(null);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (items.length < total && !isLoading) {
      fetchItems(nextPage);
    }
  };


  return (
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
            onChange={() => setLowOnly((v) => !v)}
            className="h-4 w-4"
          />
          <Label htmlFor="low-only" className="text-sm">Low stock only</Label>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow key="header">
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Low Stock Threshold</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lowOnly ? items.filter((it) => it.quantity <= it.lowStockThreshold) : items).map((item) => (
              <TableRow
                key={item._id}
                className={item.quantity <= item.lowStockThreshold ? "bg-red-50 dark:bg-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/50" : ""}
              >
                <TableCell
                  className="font-medium text-primary hover:underline cursor-pointer"
                  onClick={() => handleNameClick(item._id)}
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
                            onClick={() => handleOpenEditDialog(item)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(item)}
                        >
                            Delete
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {(lowOnly ? items.filter((it) => it.quantity <= it.lowStockThreshold) : items).map((item) => (
          <div
            key={item._id}
            className={`rounded-lg border p-4 shadow-sm ${
              item.quantity <= item.lowStockThreshold 
                ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800" 
                : "bg-card"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 
                  className="font-medium text-primary hover:underline cursor-pointer text-lg"
                  onClick={() => handleNameClick(item._id)}
                >
                  {item.name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(item)}
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
              
              {item.quantity <= item.lowStockThreshold && (
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Low Stock Alert
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex items-center justify-center py-4">
        <Button
          variant="outline"
          onClick={handleLoadMore}
          disabled={isLoading || items.length >= total}
          className="w-full sm:w-auto"
        >
          {items.length >= total ? "No more records" : isLoading ? "Loading..." : "Load more"}
        </Button>
      </div>

      <AddItemDialog
        isOpen={isAddItemDialogOpen}
        onClose={() => setIsAddItemDialogOpen(false)}
        onItemAdded={() => fetchItems(1)}
        token={token}
      />
      {selectedItem && (
        <>
          <EditItemDialog
            isOpen={isEditItemDialogOpen}
            onClose={handleCloseEditDialog}
            item={selectedItem}
            onItemUpdated={() => fetchItems(1)}
            token={token}
          />
          <DeleteItemDialog
            isOpen={isDeleteItemDialogOpen}
            onClose={handleCloseDeleteDialog}
            item={selectedItem}
            onItemDeleted={() => fetchItems(1)}
            token={token}
          />
        </>
      )}
    </div>
  );
}

export default withAuth(InventoryPage);
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface Item {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface SaleItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
}

interface RecordSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementAdded: () => void;
  token?: string;
}

export function RecordSaleDialog({
  isOpen,
  onClose,
  onMovementAdded,
  token,
}: RecordSaleDialogProps) {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data.items)) {
        setAllItems(res.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch items", error);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      // Reset form on open
      setSaleItems([]);
      setCustomerName("");
      setSelectedItem("");
      setQuantity(1);
      setErrorMessage("");
    }
  }, [isOpen, fetchItems]);

  const handleAddItem = () => {
    const itemToAdd = allItems.find((item) => item._id === selectedItem);
    if (!itemToAdd || quantity <= 0) return;

    // Check if item is already in the sale
    const existingItemIndex = saleItems.findIndex(
      (item) => item.itemId === itemToAdd._id
    );

    const existingQty = existingItemIndex > -1 ? saleItems[existingItemIndex].quantity : 0;
    const desiredTotal = existingQty + quantity;
    if (desiredTotal > itemToAdd.quantity) {
      setErrorMessage(
        `Cannot add ${desiredTotal}. Available stock for ${itemToAdd.name} is ${itemToAdd.quantity}.`
      );
      return;
    }

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      const updatedSaleItems = [...saleItems];
      updatedSaleItems[existingItemIndex].quantity += quantity;
      setSaleItems(updatedSaleItems);
    } else {
      // Add new item to the sale
      setSaleItems([
        ...saleItems,
        {
          itemId: itemToAdd._id,
          sku: itemToAdd.sku,
          name: itemToAdd.name,
          quantity,
        },
      ]);
    }

    // Reset inputs
    setSelectedItem("");
    setQuantity(1);
    setErrorMessage("");
  };

  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter((item) => item.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) return;

    // Client-side validation before submit
    for (const si of saleItems) {
      const item = allItems.find((ai) => ai._id === si.itemId || ai.sku === si.sku);
      if (!item) {
        setErrorMessage(`Item not found for SKU ${si.sku}.`);
        return;
      }
      if (si.quantity > item.quantity) {
        setErrorMessage(
          `Cannot record sale. ${si.name} requested ${si.quantity}, but only ${item.quantity} in stock.`
        );
        return;
      }
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/sales`,
        {
          items: saleItems.map(({ sku, quantity }) => ({ sku, quantity })),
          customerName,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onMovementAdded();
      onClose();
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to record sale", error);
      const backendMsg = error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? (error.response.data as { message: string }).message
        : undefined;
      setErrorMessage(backendMsg || "Failed to record sale. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl" ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Record Batch Sale</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200">
              {errorMessage}
            </div>
          )}
          
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          {/* Sale Items List */}
          <div className="space-y-2">
            <Label>Sale Items</Label>
            <div className="rounded-md border px-4 py-2 space-y-2 max-h-40 overflow-y-auto">
              {saleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items added yet.
                </p>
              ) : (
                saleItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm">
                      {item.name} (Qty: {item.quantity})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.itemId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Item Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Add Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent container={contentRef.current || undefined} className="max-h-60 overflow-y-auto">
                  {allItems
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedItem || quantity <= 0}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saleItems.length === 0} className="w-full sm:w-auto">
            Record Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
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
import { PhosphorIcon } from "@/components/icons";

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
  const [quantity, setQuantity] = useState<number | "">("");
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setSaleItems([]);
      setCustomerName("");
      setSelectedItem("");
      setQuantity("");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleAddItem = () => {
    const itemToAdd = allItems.find((item) => item._id === selectedItem);
    if (!itemToAdd || typeof quantity !== 'number' || quantity <= 0) return;

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
      const updatedSaleItems = [...saleItems];
      updatedSaleItems[existingItemIndex].quantity += quantity;
      setSaleItems(updatedSaleItems);
    } else {
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

    setSelectedItem("");
    setQuantity("");
    setErrorMessage("");
  };

  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter((item) => item.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (saleItems.length === 0) return;

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
      setIsSubmitting(true);
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
      const totalItems = saleItems.reduce((sum, item) => sum + item.quantity, 0);
      toast.success("Sale recorded successfully.", {
        description: `Sold ${totalItems} item(s)${customerName ? ` to ${customerName}` : ''}.`,
      });
    } catch (error) {
      console.error("Failed to record sale", error);
      const backendMsg = error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
        ? (error.response.data as { message: string }).message
        : undefined;
      setErrorMessage(backendMsg || "Failed to record sale. Please try again.");
      toast.error("Failed to record sale.", {
        description: backendMsg || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl" ref={contentRef}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>Record Sale</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errorMessage && (
            <div className="rounded-md border border-pale-red-text/20 bg-pale-red-bg px-4 py-2 text-sm text-pale-red-text">
              {errorMessage}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <Label>Sale Items</Label>
            <div className="rounded-md border border-border/60 px-4 py-2 max-h-40 overflow-y-auto">
              {saleItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items added yet.
                </p>
              ) : (
                saleItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex justify-between items-center py-1.5"
                  >
                    <span className="text-sm">
                      {item.name} <span className="text-muted-foreground">(Qty: {item.quantity})</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.itemId)}
                    >
                      <PhosphorIcon name="X" size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Add Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
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
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddItem}
                  disabled={!selectedItem || typeof quantity !== 'number' || quantity <= 0}
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
          <Button onClick={handleSubmit} disabled={saleItems.length === 0 || isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Recording..." : "Record Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

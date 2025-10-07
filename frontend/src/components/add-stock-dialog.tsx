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

interface Item {
  _id: string;
  name: string;
}

interface AddStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementAdded: () => void;
  token?: string;
}

export function AddStockDialog({
  isOpen,
  onClose,
  onMovementAdded,
  token,
}: AddStockDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data.items)) {
        setItems(res.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch items", error);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  const handleSubmit = async () => {
    if (typeof quantity !== 'number' || quantity <= 0) return;
    
    try {
      const itemName = items.find(item => item._id === selectedItem)?.name;
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${selectedItem}/adjust`,
        { delta: quantity, reason: "Stock addition", type: "purchase" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onMovementAdded();
      onClose();
      toast.success("Stock added successfully!", {
        description: `Added ${quantity} units${itemName ? ` to ${itemName}` : ''}.`,
      });
    } catch (error) {
      console.error("Failed to add stock", error);
      toast.error("Failed to add stock", {
        description: "Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md" ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Select onValueChange={setSelectedItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent container={contentRef.current || undefined} className="max-h-60 overflow-y-auto">
                {items
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
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          
          <Button onClick={handleSubmit} disabled={!selectedItem || typeof quantity !== 'number' || quantity <= 0} className="w-full sm:w-auto">Add Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

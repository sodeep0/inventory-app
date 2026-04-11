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

interface AdjustStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementAdded: () => void;
  token?: string;
}

export function AdjustStockDialog({
  isOpen,
  onClose,
  onMovementAdded,
  token,
}: AdjustStockDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const delta = parseInt(quantity) || 0;
      const itemName = items.find(item => item._id === selectedItem)?.name;
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${selectedItem}/adjust`,
        { delta, reason, type: "adjustment" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onMovementAdded();
      onClose();
      toast.success("Stock adjusted successfully.", {
        description: `${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} unit(s)${itemName ? ` ${delta > 0 ? 'to' : 'from'} ${itemName}` : ''}.`,
      });
      
      setSelectedItem("");
      setQuantity("");
      setReason("");
    } catch (error) {
      console.error("Failed to adjust stock", error);
      toast.error("Failed to adjust stock.", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md" ref={contentRef}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>Adjust Stock</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Select onValueChange={setSelectedItem} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
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
            <Label htmlFor="quantity">Adjustment</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., -5 or 10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this adjustment needed?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedItem || isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Adjusting..." : "Adjust Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

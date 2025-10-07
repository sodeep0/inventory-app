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
  sku: string;
}

interface RecordReturnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMovementAdded: () => void;
  token?: string;
}

export function RecordReturnDialog({
  isOpen,
  onClose,
  onMovementAdded,
  token,
}: RecordReturnDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
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
  }, [isOpen]); // Remove fetchItems from dependencies

  const handleSubmit = async () => {
    if (typeof quantity !== 'number' || quantity <= 0) return;
    
    try {
      const selectedItemObject = items.find(item => item._id === selectedItem);
      if (!selectedItemObject) return;

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/returns`,
        {
          items: [{ sku: selectedItemObject.sku, quantity, reason }],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onMovementAdded();
      onClose();
      toast.success("Return recorded successfully!", {
        description: `Returned ${quantity} unit(s) of ${selectedItemObject.name}.`,
      });
    } catch (error) {
      console.error("Failed to record return", error);
      toast.error("Failed to record return", {
        description: "Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md" ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Record Return</DialogTitle>
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
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter return reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedItem || typeof quantity !== 'number' || quantity <= 0} className="w-full sm:w-auto">Record Return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import { Item } from "@/types";

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: Item) => void;
  token?: string;
}

export function AddItemDialog({
  isOpen,
  onClose,
  onItemAdded,
  token,
}: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | "">("");
  const [supplierName, setSupplierName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setQuantity("");
      setLowStockThreshold("");
      setSupplierName("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items`,
        { 
          name, 
          quantity: quantity === "" ? 0 : quantity, 
          lowStockThreshold: lowStockThreshold === "" ? 0 : lowStockThreshold, 
          supplierName 
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onItemAdded(res.data);
      // Reset form after successful add
      setName("");
      setQuantity("");
      setLowStockThreshold("");
      setSupplierName("");
      onClose();
    } catch (error) {
      console.error("Failed to add item", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              placeholder="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
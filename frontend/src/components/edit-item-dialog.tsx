"use client";

import { useEffect, useState } from "react";
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

interface Item {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  supplierName?: string;
}

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onItemUpdated: (item: Item) => void;
  token?: string;
}

export function EditItemDialog({
  isOpen,
  onClose,
  item,
  onItemUpdated,
  token,
}: EditItemDialogProps) {
  const [name, setName] = useState(item.name);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    item.lowStockThreshold || 0
  );
  const [supplierName, setSupplierName] = useState(item.supplierName || "");

  useEffect(() => {
    setName(item.name);
    setLowStockThreshold(item.lowStockThreshold || 0);
    setSupplierName(item.supplierName || "");
  }, [item]);

  const handleSubmit = async () => {
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${item._id}`,
        { name, lowStockThreshold, supplierName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onItemUpdated(res.data);
      onClose();
    } catch (error) {
      console.error("Failed to update item", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
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
            <Label htmlFor="quantity">Current Quantity</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {item.quantity}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
              placeholder="Enter threshold"
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

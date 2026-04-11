"use client";

import { useState, useEffect } from "react";
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
  const [buyPrice, setBuyPrice] = useState<number | "">("");
  const [sellPrice, setSellPrice] = useState<number | "">("");
  const [supplierName, setSupplierName] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setQuantity("");
      setLowStockThreshold("");
      setBuyPrice("");
      setSellPrice("");
      setSupplierName("");
      setCategory("");
      setTags("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items`,
        {
          name,
          quantity: quantity === "" ? 0 : quantity,
          lowStockThreshold: lowStockThreshold === "" ? 0 : lowStockThreshold,
          buyPrice: buyPrice === "" ? 0 : buyPrice,
          sellPrice: sellPrice === "" ? 0 : sellPrice,
          supplierName,
          category: category || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onItemAdded(res.data);
      setName("");
      setQuantity("");
      setLowStockThreshold("");
      setSupplierName("");
      onClose();
      toast.success("Item added successfully.", {
        description: `${name} has been added to inventory.`,
      });
    } catch (error) {
      console.error("Failed to add item", error);
      toast.error("Failed to add item.", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>Add New Item</DialogTitle>
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
            <Label htmlFor="buyPrice">Buy Price</Label>
            <Input
              id="buyPrice"
              type="number"
              placeholder="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price</Label>
            <Input
              id="sellPrice"
              type="number"
              placeholder="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value === "" ? "" : Number(e.target.value))}
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
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter category"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Adding..." : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

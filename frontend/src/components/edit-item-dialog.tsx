"use client";

import { useEffect, useState } from "react";
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

interface Item {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  buyPrice: number;
  sellPrice: number;
  supplierName?: string;
  category?: string;
  tags?: string[];
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
  const [quantity, setQuantity] = useState(item.quantity);
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [supplierName, setSupplierName] = useState(item.supplierName || "");
  const [category, setCategory] = useState(item.category || "");
  const [tags, setTags] = useState(item.tags?.join(", ") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(item.name);
    setQuantity(item.quantity);
    setLowStockThreshold(item.lowStockThreshold?.toString() || "");
    setBuyPrice(item.buyPrice?.toString() || "0");
    setSellPrice(item.sellPrice?.toString() || "0");
    setSupplierName(item.supplierName || "");
    setCategory(item.category || "");
    setTags(item.tags?.join(", ") || "");
  }, [item]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${item._id}`,
        { name, quantity, lowStockThreshold: parseInt(lowStockThreshold) || 0, buyPrice: parseFloat(buyPrice) || 0, sellPrice: parseFloat(sellPrice) || 0, supplierName, category: category || undefined, tags: tags.split(',').map(t => t.trim()).filter(Boolean) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onItemUpdated(res.data);
      onClose();
      toast.success("Item updated successfully.", {
        description: `${name} has been updated.`,
      });
    } catch (error) {
      console.error("Failed to update item", error);
      toast.error("Failed to update item.", {
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
          <DialogTitle style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>Edit Item</DialogTitle>
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
            <div className="px-3 py-2 bg-muted rounded-md text-sm border border-border/60">
              {item.quantity}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="Enter threshold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price</Label>
              <Input
                id="buyPrice"
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0"
              />
            </div>
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
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

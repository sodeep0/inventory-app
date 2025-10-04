"use client";

import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Item {
  _id: string;
  name: string;
}

interface DeleteItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onItemDeleted: (itemId: string) => void;
  token?: string;
}

export function DeleteItemDialog({
  isOpen,
  onClose,
  item,
  onItemDeleted,
  token,
}: DeleteItemDialogProps) {
  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/items/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onItemDeleted(item._id);
      onClose();
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the item
            &quot;{item.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

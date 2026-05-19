"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { InventoryItemOption } from "@/types/movement-ui";

export function useInventoryItems(token?: string, enabled = true) {
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = useCallback(
    async (search?: string) => {
      if (!token) return;
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.set("limit", "100");
        params.set("sort", "name");
        if (search?.trim()) params.set("search", search.trim());

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/items?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (Array.isArray(res.data.items)) {
          setItems(res.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (enabled && token) {
      fetchItems();
    }
  }, [enabled, token, fetchItems]);

  return { items, isLoading, fetchItems, refetch: () => fetchItems() };
}

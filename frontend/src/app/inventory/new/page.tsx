"use client";

import withAuth from "@/components/withAuth";
import { AddItemForm } from "@/components/inventory/forms/add-item-form";

function AddItemPage({ token }: { token?: string }) {
  return <AddItemForm token={token} />;
}

export default withAuth(AddItemPage);

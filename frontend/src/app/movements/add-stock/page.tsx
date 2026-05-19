"use client";

import withAuth from "@/components/withAuth";
import { AddStockForm } from "@/components/movements/forms/add-stock-form";

function AddStockPage({ token }: { token?: string }) {
  return <AddStockForm token={token} />;
}

export default withAuth(AddStockPage);

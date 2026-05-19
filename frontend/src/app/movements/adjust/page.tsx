"use client";

import withAuth from "@/components/withAuth";
import { AdjustStockForm } from "@/components/movements/forms/adjust-stock-form";

function AdjustStockPage({ token }: { token?: string }) {
  return <AdjustStockForm token={token} />;
}

export default withAuth(AdjustStockPage);

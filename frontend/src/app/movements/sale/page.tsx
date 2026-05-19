"use client";

import withAuth from "@/components/withAuth";
import { RecordSaleForm } from "@/components/movements/forms/record-sale-form";

function RecordSalePage({ token }: { token?: string }) {
  return <RecordSaleForm token={token} />;
}

export default withAuth(RecordSalePage);

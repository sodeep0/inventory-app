"use client";

import withAuth from "@/components/withAuth";
import { RecordReturnForm } from "@/components/movements/forms/record-return-form";

function RecordReturnPage({ token }: { token?: string }) {
  return <RecordReturnForm token={token} />;
}

export default withAuth(RecordReturnPage);

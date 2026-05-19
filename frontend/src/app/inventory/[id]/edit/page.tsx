"use client";

import { useParams } from "next/navigation";
import withAuth from "@/components/withAuth";
import { EditItemForm } from "@/components/inventory/forms/edit-item-form";

function EditItemPage({ token }: { token?: string }) {
  const params = useParams();
  const id = params.id as string;
  return <EditItemForm token={token} itemId={id} />;
}

export default withAuth(EditItemPage);

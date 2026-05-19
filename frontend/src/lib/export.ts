import { toast } from "sonner";

/**
 * Downloads a CSV export using Authorization header (no token in URL).
 */
export async function downloadCsvExport(
  path: "/export/items" | "/export/movements",
  filename: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    toast.error("API URL is not configured");
    return;
  }

  const userJSON = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  if (!userJSON) {
    toast.error("Please log in to export");
    return;
  }

  let token: string;
  try {
    token = JSON.parse(userJSON).token;
  } catch {
    toast.error("Session expired. Please log in again.");
    return;
  }

  if (!token) {
    toast.error("Session expired. Please log in again.");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { message?: string }).message || "Export failed");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  } catch {
    toast.error("Export failed. Check your connection.");
  }
}

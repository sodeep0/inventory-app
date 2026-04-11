"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "@/lib/api";

interface ImportResult {
  created: number;
  skipped: number;
  errors?: string[];
}

type Step = "upload" | "preview" | "importing" | "result";

interface CSVRow {
  [key: string]: string;
}

type FieldMapping = {
  [csvColumn: string]: string | null;
};

const ITEM_FIELDS = [
  { value: "name", label: "Name *" },
  { value: "sku", label: "SKU" },
  { value: "quantity", label: "Quantity *" },
  { value: "buyPrice", label: "Buy Price" },
  { value: "sellPrice", label: "Sell Price" },
  { value: "lowStockThreshold", label: "Low Stock Threshold" },
  { value: "category", label: "Category" },
  { value: "tags", label: "Tags (comma-separated)" },
  { value: "supplierName", label: "Supplier Name" },
];

export function ImportCsvDialog({
  isOpen,
  onClose,
  onImportComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseCSV = useCallback((text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    // Parse rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: CSVRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      rows.push(row);
    }

    return { headers, rows };
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const { headers, rows } = parseCSV(text);
        setCsvHeaders(headers);
        setCsvData(rows);

        // Auto-map columns with same name as item fields
        const mapping: FieldMapping = {};
        headers.forEach((header) => {
          const normalizedHeader = header.toLowerCase();
          const matchedField = ITEM_FIELDS.find(
            (f) => f.value.toLowerCase() === normalizedHeader
          );
          mapping[header] = matchedField ? matchedField.value : null;
        });
        setFieldMapping(mapping);
        setStep("preview");
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  const handleMappingChange = useCallback((csvColumn: string, itemField: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [csvColumn]: itemField || null,
    }));
  }, []);

  const mappedItems = useCallback(() => {
    return csvData.map((row) => {
      const item: Record<string, unknown> = {};
      Object.entries(fieldMapping).forEach(([csvColumn, itemField]) => {
        if (!itemField || !row[csvColumn]) return;

        const value = row[csvColumn];
        if (itemField === "quantity" || itemField === "lowStockThreshold") {
          item[itemField] = parseInt(value, 10) || 0;
        } else if (itemField === "buyPrice" || itemField === "sellPrice") {
          item[itemField] = parseFloat(value) || 0;
        } else if (itemField === "tags") {
          item[itemField] = value
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t);
        } else {
          item[itemField] = value;
        }
      });
      return item;
    }).filter((item) => item.name); // Filter out rows without a name
  }, [csvData, fieldMapping]);

  const handleImport = useCallback(async () => {
    const items = mappedItems();
    if (items.length === 0) {
      toast.error("No valid items to import");
      return;
    }

    setStep("importing");
    try {
      const result = await apiClient.post<ImportResult>("/items/import", { items });
      setImportResult(result);
      setStep("result");
      if (result.created > 0) {
        onImportComplete();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setStep("preview");
    }
  }, [mappedItems, onImportComplete]);

  const handleClose = useCallback(() => {
    setStep("upload");
    setCsvData([]);
    setCsvHeaders([]);
    setFileName("");
    setFieldMapping({});
    setImportResult(null);
    onClose();
  }, [onClose]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setCsvData([]);
    setCsvHeaders([]);
    setFileName("");
    setFieldMapping({});
    setImportResult(null);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
          >
            Import Items from CSV
          </DialogTitle>
          {step === "upload" && (
            <DialogDescription>
              Upload a CSV file to import inventory items. Supported fields: name,
              sku, quantity, buyPrice, sellPrice, lowStockThreshold, category, tags,
              supplierName.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border/60 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <PhosphorIcon name="DownloadSimple" size={32} className="text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-primary">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-muted-foreground">CSV files only</p>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PhosphorIcon name="Table" size={14} />
              <span>{fileName} - {csvData.length} rows detected</span>
            </div>

            {/* Column Mapping */}
            <div className="rounded-lg border border-border/60 p-4 bg-card">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <PhosphorIcon name="SlidersHorizontal" size={14} />
                Map CSV Columns to Fields
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[80px] truncate">
                      {header}
                    </span>
                    <PhosphorIcon name="CaretRight" size={12} className="text-muted-foreground" />
                    <select
                      value={fieldMapping[header] || ""}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">— Skip column —</option>
                      {ITEM_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <div className="px-4 py-2 bg-muted/50 border-b border-border/60">
                <span className="text-sm font-medium">Preview (first 5 rows)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      {csvHeaders.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-border/40">
                        {csvHeaders.map((header) => (
                          <td key={header} className="px-3 py-2 whitespace-nowrap">
                            {row[header] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
              <Button onClick={handleImport}>
                Import {mappedItems().length} Items
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin">
              <PhosphorIcon name="ArrowCounterClockwise" size={32} />
            </div>
            <p className="text-sm text-muted-foreground">Importing items...</p>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-6 py-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {importResult.created > 0 && importResult.skipped === 0 ? (
                  <PhosphorIcon name="CheckCircle" size={20} weight="fill" className="text-green-600" />
                ) : importResult.created > 0 ? (
                  <PhosphorIcon name="CheckCircle" size={20} weight="fill" className="text-yellow-600" />
                ) : (
                  <PhosphorIcon name="WarningCircle" size={20} weight="fill" className="text-destructive" />
                )}
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-medium">Import Complete</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2">
                    <span className="text-green-600 font-medium">
                      {importResult.created} items created
                    </span>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
                    <span className="text-yellow-600 font-medium">
                      {importResult.skipped} items skipped
                    </span>
                  </div>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 max-h-32 overflow-y-auto">
                    <p className="text-sm text-destructive font-medium mb-2">
                      Skipped items:
                    </p>
                    <ul className="text-xs text-destructive space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                {importResult.created > 0 ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

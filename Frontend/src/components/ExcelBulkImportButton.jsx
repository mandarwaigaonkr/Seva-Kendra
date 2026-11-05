import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileWarning,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { runWithoutErrorToasts } from "@/lib/api";
import { parseSheet } from "@/lib/excelImport/core";
import {
  buildErrorWorkbook,
  buildTemplateWorkbook,
  readWorkbookRows,
  writeWorkbookFile,
} from "@/lib/excelImport/workbook";

const CONCURRENCY = 3;
const PREVIEW_ROWS = 200;

const slug = (value) =>
  String(value || "records")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const errorText = (errors) => errors.map((e) => (e.label ? `${e.label}: ${e.message}` : e.message)).join("; ");

/**
 * Bulk Excel import with template download, validation preview, progress and error report.
 *
 * Pass either a `template` object (preferred — see lib/excelImport/templates) or the legacy
 * `templateFields` / `sampleRow` props.
 */
const ExcelBulkImportButton = ({
  label = "Import Excel",
  title,
  template,
  templateFields,
  templateColumns,
  sampleRow,
  createRecord,
  onImported,
  disabled = false,
  compact = false,
}) => {
  const inputRef = useRef(null);
  const runningRef = useRef(false);
  const [stage, setStage] = useState("idle"); // idle | reading | preview | importing | done
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  const fields = useMemo(
    () => template?.fields || templateFields || templateColumns || [],
    [template, templateFields, templateColumns]
  );
  const sample = template?.sampleRow || sampleRow;
  const recordName = title || template?.title || "records";
  const open = stage === "preview" || stage === "importing" || stage === "done";

  const reset = () => {
    setStage("idle");
    setParsed(null);
    setSheet(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setFileName("");
  };

  const downloadTemplate = () => {
    if (!fields.length) {
      toast.error("No template columns were provided for this page.");
      return;
    }
    writeWorkbookFile(buildTemplateWorkbook(fields, sample), `${slug(recordName)}-import-template.xlsx`);
  };

  const triggerFilePicker = () => {
    if (disabled || stage !== "idle") return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStage("reading");
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const book = readWorkbookRows(buffer, { fields });
      if (!book.headers.length) {
        toast.error("That file has no header row. Download the template to see the expected columns.");
        reset();
        return;
      }
      const result = parseSheet(book.headers, book.rows, fields, {
        uniqueKeys: template?.uniqueKeys,
        transform: template?.transform,
      });
      if (!result.rows.length) {
        toast.error("No data rows found below the header row.");
        reset();
        return;
      }
      setSheet(book);
      setParsed(result);
      setStage("preview");
    } catch (error) {
      console.error(`Error reading ${recordName} import file:`, error);
      toast.error("Couldn't read that file. Please upload an .xlsx, .xls or .csv file.");
      reset();
    }
  };

  const runImport = async () => {
    // Synchronous guard: a double-click lands before React re-renders the disabled button.
    if (runningRef.current || !parsed?.validRows.length) return;
    runningRef.current = true;
    const queue = [...parsed.validRows];
    const failures = [];
    const notAttempted = [];
    let imported = 0;
    let sessionExpired = false;
    setStage("importing");
    setProgress({ done: 0, total: queue.length });

    const worker = async () => {
      while (queue.length && !sessionExpired) {
        const row = queue.shift();
        try {
          const response = await createRecord(row.payload);
          if (response && response.success === false) {
            throw new Error(response.message || "Server rejected this row");
          }
          imported += 1;
        } catch (error) {
          if (error?.status === 401) {
            // Stop: every remaining request would fail the same way. Report what was saved.
            sessionExpired = true;
            notAttempted.push({ rowNumber: row.rowNumber, raw: row.raw, message: "Not imported — your session expired" });
            continue;
          }
          let message = error?.response?.data?.message || error?.message || "Server rejected this row";
          if (/timeout|network/i.test(message)) {
            message += " — this row may still have been saved; check the list before importing it again";
          }
          failures.push({ rowNumber: row.rowNumber, raw: row.raw, message });
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    };

    try {
      await runWithoutErrorToasts(() =>
        Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
      );
    } finally {
      runningRef.current = false;
    }
    if (sessionExpired) {
      queue.splice(0).forEach((row) =>
        notAttempted.push({ rowNumber: row.rowNumber, raw: row.raw, message: "Not imported — your session expired" })
      );
    }

    const skipped = parsed.invalidRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw, message: errorText(r.errors) }));
    const allProblems = [...skipped, ...failures, ...notAttempted].sort((a, b) => a.rowNumber - b.rowNumber);
    setResult({ imported, failures, skipped, notAttempted, sessionExpired, allProblems });
    setStage("done");

    if (imported > 0) {
      toast.success(`Imported ${plural(imported, "record")}.`);
      onImported?.();
    }
    if (failures.length) toast.error(`${plural(failures.length, "row")} could not be saved.`);
  };

  const downloadErrorReport = (rows) => {
    if (!rows?.length || !sheet) return;
    writeWorkbookFile(buildErrorWorkbook(sheet.headers, rows), `${slug(recordName)}-import-errors.xlsx`);
  };

  const preDownloadRows = parsed
    ? parsed.invalidRows.map((r) => ({ rowNumber: r.rowNumber, raw: r.raw, message: errorText(r.errors) }))
    : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={downloadTemplate}
          disabled={disabled || stage === "reading"}
        >
          <Download className="mr-2 h-4 w-4" />
          Download template
        </Button>
        <Button size={compact ? "sm" : "default"} onClick={triggerFilePicker} disabled={disabled || stage !== "idle"}>
          {stage === "reading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {stage === "reading" ? "Reading file…" : label}
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && stage !== "importing") reset();
        }}
      >
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"
          onInteractOutside={(e) => stage === "importing" && e.preventDefault()}
          onEscapeKeyDown={(e) => stage === "importing" && e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              {stage === "done" ? "Import finished" : `Import ${recordName}`}
            </DialogTitle>
            <DialogDescription className="truncate">
              {fileName}
              {sheet?.sheetName ? ` · sheet “${sheet.sheetName}”` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {parsed && stage === "preview" && (
              <PreviewBody parsed={parsed} />
            )}

            {stage === "importing" && (
              <div className="py-10 space-y-4 text-center" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none mx-auto text-primary" />
                <p className="text-sm font-medium">
                  Saving {progress.done} of {progress.total}…
                </p>
                <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} className="max-w-md mx-auto" />
                <p className="text-xs text-muted-foreground">Keep this window open until the import finishes.</p>
              </div>
            )}

            {stage === "done" && result && <ResultBody result={result} />}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2">
            {stage === "preview" && (
              <>
                {preDownloadRows.length > 0 && (
                  <Button variant="outline" onClick={() => downloadErrorReport(preDownloadRows)} className="sm:mr-auto">
                    <FileWarning className="mr-2 h-4 w-4" />
                    Download problem rows
                  </Button>
                )}
                <Button variant="ghost" onClick={reset}>
                  Cancel
                </Button>
                <Button
                  onClick={runImport}
                  disabled={!parsed?.validRows.length || parsed?.missingRequired.length > 0}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {parsed?.validRows.length
                    ? `Import ${plural(parsed.validRows.length, "valid row")}`
                    : "Nothing to import"}
                </Button>
              </>
            )}
            {stage === "done" && (
              <>
                {result?.allProblems.length > 0 && (
                  <Button variant="outline" onClick={() => downloadErrorReport(result.allProblems)} className="sm:mr-auto">
                    <FileWarning className="mr-2 h-4 w-4" />
                    Download error report
                  </Button>
                )}
                <Button onClick={reset}>Close</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Stat = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    ok: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    bad: "text-destructive bg-destructive/10",
    warn: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    neutral: "text-foreground bg-muted",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className={`rounded-md p-2 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-xl font-semibold leading-none tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
};

const PreviewBody = ({ parsed }) => {
  const { rows, validRows, invalidRows, missingRequired, unknownHeaders, duplicateHeaders, missingOptional } = parsed;
  const shown = rows.slice(0, PREVIEW_ROWS);
  const mappedCount = parsed.columns.filter((c) => c.field).length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={FileSpreadsheet} label="Rows found" value={rows.length} tone="neutral" />
        <Stat icon={CheckCircle2} label="Ready to import" value={validRows.length} tone="ok" />
        <Stat icon={XCircle} label="Need fixing" value={invalidRows.length} tone={invalidRows.length ? "bad" : "neutral"} />
      </div>

      {missingRequired.length > 0 && (
        <Notice tone="bad" title="Required columns are missing">
          Add these columns (use the Template button for the exact headers):{" "}
          <strong>{missingRequired.join(", ")}</strong>
        </Notice>
      )}
      {duplicateHeaders.length > 0 && (
        <Notice tone="warn" title="Columns appear more than once">
          Only the first one is used: {duplicateHeaders.join(", ")}
        </Notice>
      )}
      {unknownHeaders.length > 0 && (
        <Notice tone="warn" title={`${plural(unknownHeaders.length, "column")} will be ignored`}>
          These headers don't match any field: {unknownHeaders.join(", ")}
        </Notice>
      )}
      {missingRequired.length === 0 && missingOptional.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {mappedCount} column{mappedCount === 1 ? "" : "s"} matched. Optional columns not in this file: {missingOptional.length}.
        </p>
      )}

      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-16">Row</th>
                <th className="text-left font-medium px-3 py-2 w-28">Status</th>
                <th className="text-left font-medium px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const ok = row.errors.length === 0;
                const name =
                  row.payload.name || row.payload.studentName || row.payload.schoolName || row.payload.caseId ||
                  Object.values(row.payload).find((v) => typeof v === "string") || "";
                return (
                  <tr key={row.rowNumber} className="border-t align-top">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      {ok ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 /> Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          <XCircle /> {plural(row.errors.length, "issue")}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {ok ? (
                        <span className="text-muted-foreground">{String(name)}</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {row.errors.map((e, i) => (
                            <li key={i}>
                              <span className="font-medium">{e.label}</span>{" "}
                              <span className="text-muted-foreground">{e.message}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > PREVIEW_ROWS && (
          <p className="text-xs text-muted-foreground px-3 py-2 border-t">
            Showing the first {PREVIEW_ROWS} of {rows.length} rows.
          </p>
        )}
      </div>

      {invalidRows.length > 0 && validRows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Rows with issues are skipped. Download them, fix and upload again — the rest can be imported now.
        </p>
      )}
    </>
  );
};

const ResultBody = ({ result }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Stat icon={CheckCircle2} label="Imported" value={result.imported} tone="ok" />
      <Stat icon={XCircle} label="Rejected by server" value={result.failures.length} tone={result.failures.length ? "bad" : "neutral"} />
      <Stat icon={AlertTriangle} label="Skipped (invalid)" value={result.skipped.length} tone={result.skipped.length ? "warn" : "neutral"} />
    </div>
    {result.sessionExpired && (
      <Notice tone="bad" title="Your session expired during the import">
        {plural(result.imported, "row")} were saved. {plural(result.notAttempted.length, "row")} were not sent — sign in
        again, then upload the error report (it contains only the rows that still need importing).{" "}
        <a href="/signin" className="underline font-medium">Sign in again</a>
      </Notice>
    )}
    {result.failures.length > 0 && (
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-16">Row</th>
                <th className="text-left font-medium px-3 py-2">Server message</th>
              </tr>
            </thead>
            <tbody>
              {[...result.failures]
                .sort((a, b) => a.rowNumber - b.rowNumber)
                .map((f) => (
                  <tr key={f.rowNumber} className="border-t">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{f.rowNumber}</td>
                    <td className="px-3 py-2">{f.message}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    {result.imported > 0 && result.allProblems.length === 0 && (
      <p className="text-sm text-muted-foreground">Every row was imported successfully.</p>
    )}
  </>
);

const Notice = ({ tone, title, children }) => {
  const styles =
    tone === "bad"
      ? "border-destructive/40 bg-destructive/5 text-destructive"
      : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400";
  const Icon = tone === "bad" ? XCircle : AlertTriangle;
  return (
    <div className={`flex gap-3 rounded-lg border p-3 text-sm ${styles}`} role={tone === "bad" ? "alert" : "status"}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-foreground/80 mt-0.5">{children}</p>
      </div>
    </div>
  );
};

export default ExcelBulkImportButton;

import React from "react";
import { FileSpreadsheet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import ExcelBulkImportButton from "./ExcelBulkImportButton";

/**
 * Standard "Bulk import" card used on every module page.
 *
 * <ExcelImportPanel template={addictionImportTemplate} createRecord={addictionAPI.create} onImported={fetchRecords} />
 */
const ExcelImportPanel = ({ template, createRecord, onImported, title, description, className = "" }) => {
  const name = title || template?.title || "records";
  const requiredCount = (template?.fields || []).filter((f) => f.required).length;
  const totalCount = (template?.fields || []).length;

  return (
    <Card className={`mb-6 bg-card shadow-sm ${className}`}>
      <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-tight">Bulk import {name}</h3>
            <p className="text-sm text-muted-foreground">
              {description ||
                "Download the template, fill one record per row, then upload. You'll see a preview and can fix problems before anything is saved."}
            </p>
            {totalCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {totalCount} columns · {requiredCount} required (marked *) · dates as DD/MM/YYYY
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <ExcelBulkImportButton
            template={template}
            title={name}
            createRecord={createRecord}
            onImported={onImported}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelImportPanel;

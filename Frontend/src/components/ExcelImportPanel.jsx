import React from "react";
import { FileSpreadsheet } from "lucide-react";

import ExcelBulkImportButton from "./ExcelBulkImportButton";

/**
 * Standard "Add many at once" strip used on every module page.
 *
 * <ExcelImportPanel template={addictionImportTemplate} createRecord={addictionAPI.create} onImported={fetchRecords} />
 */
const ExcelImportPanel = ({ template, createRecord, onImported, title, description, className = "" }) => {
  const name = title || template?.title || "records";
  const requiredCount = (template?.fields || []).filter((f) => f.required).length;
  const totalCount = (template?.fields || []).length;

  return (
    <section
      aria-label={`Add many ${name} from Excel`}
      className={`mb-4 flex flex-col gap-3 rounded-lg border border-dashed border-input bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium text-foreground">Have a spreadsheet? Add many {name} at once</p>
          <p className="text-sm text-muted-foreground">
            {description ||
              `Download the template, fill one row per person, then upload it. You can check everything before it is saved.`}
            {totalCount > 0 && ` ${requiredCount} of ${totalCount} columns are required; write dates as DD/MM/YYYY.`}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <ExcelBulkImportButton template={template} title={name} createRecord={createRecord} onImported={onImported} />
      </div>
    </section>
  );
};

export default ExcelImportPanel;

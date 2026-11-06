import React, { useState, useMemo } from "react";
import { FilterBar, ModulePageHeader } from "@/components/module/ModuleKit";
import sevaLogo from "../assets/seva_logo.png";
import { buildReport, fetchAllRecords } from "@/lib/reportData";
import usePermissions from "../hooks/usePermissions";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  GraduationCap,
  RefreshCw,
  Activity,
  Heart,
  Menu,
  Scale,
  Printer,
  LineChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  educationReportsAPI,
  healthReportsAPI,
  entitlementsAPI,
  legalAidServiceAPI,
  workshopsAwarenessAPI,
  cbucboDetailsAPI,
} from "../services/api";

const ModuleReports = () => {
  const { hasModuleAccess, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState("bar");

  // Additional filters based on category
  const [wardNo, setWardNo] = useState("");
  const [habitation, setHabitation] = useState("");
  const [centerName, setCenterName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [examType, setExamType] = useState("");
  const [boardType, setBoardType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classStandard, setClassStandard] = useState("");
  const [patientName, setPatientName] = useState("");

  const allModules = [
    { value: "education", label: "Education", icon: GraduationCap, permissionKey: "education" },
    { value: "health", label: "Health", icon: Heart, permissionKey: "health" },
    { value: "social-justice", label: "Social Justice", icon: Scale, permissionKey: "socialJustice" },
  ];

  // Filter modules based on user's access permissions
  const modules = useMemo(() => {
    return allModules.filter(mod => hasModuleAccess(mod.permissionKey));
  }, [hasModuleAccess]);

  const educationCategories = [
    { value: "study-centers", label: "Study Centers" },
    { value: "sc-students", label: "SC Students" },
    { value: "dropouts", label: "Dropouts" },
    { value: "schools", label: "Schools" },
    { value: "competitive-exams", label: "Competitive Exams" },
    { value: "board-preparation", label: "Board Preparation" },
  ];

  const healthCategories = [
    { value: "health-camps", label: "Health Camps" },
    { value: "elderly", label: "Elderly Care" },
    { value: "mother-child", label: "Mother & Child" },
    { value: "pwd", label: "Persons with Disabilities" },
    { value: "adolescents", label: "Adolescents" },
    { value: "tuberculosis", label: "Tuberculosis" },
    { value: "hiv", label: "HIV/AIDS" },
    { value: "leprosy", label: "Leprosy" },
    { value: "addiction", label: "Addiction" },
    { value: "other-diseases", label: "Other Diseases" },
  ];

  const socialJusticeCategories = [
    { value: "cbucbo", label: "CBUCBO Details" },
    { value: "entitlements", label: "Entitlements" },
    { value: "legal-aid", label: "Legal Aid Services" },
    { value: "workshops", label: "Workshops & Awareness" },
  ];

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
  ];

  const examTypes = [
    { value: "all", label: "All" },
    { value: "upsc", label: "UPSC" },
    { value: "ssc", label: "SSC" },
    { value: "railway", label: "Railway" },
    { value: "banking", label: "Banking" },
    { value: "state-pcs", label: "State PCS" },
  ];

  const boardTypes = [
    { value: "all", label: "All" },
    { value: "cbse", label: "CBSE" },
    { value: "state", label: "State Board" },
    { value: "icse", label: "ICSE" },
  ];

  const classStandards = [
    { value: "all", label: "All" },
    { value: "10", label: "Class 10" },
    { value: "12", label: "Class 12" },
  ];

  const getCurrentCategories = () => {
    if (module === "education") return educationCategories;
    if (module === "health") return healthCategories;
    if (module === "social-justice") return socialJusticeCategories;
    return [];
  };

  // Get permission key for the currently selected module
  const getCurrentModulePermissionKey = () => {
    if (module === "education") return "education";
    if (module === "health") return "health";
    if (module === "social-justice") return "socialJustice";
    return null;
  };

  const generateSocialJusticeReport = async (params) => {
    const { category, startDate, endDate, wardNo, habitation, status } = params || {};
    const sources = {
      cbucbo: cbucboDetailsAPI,
      entitlements: entitlementsAPI,
      "legal-aid": legalAidServiceAPI,
      workshops: workshopsAwarenessAPI,
    };
    const source = sources[category];
    if (!source) throw new Error("Unknown category for report generation");
    const records = await fetchAllRecords((query) => source.getAll(query));
    return buildReport(category, records, { startDate, endDate, wardNo, habitation, status });
  };

  const getReportsAPI = () => {
    if (module === "education") return educationReportsAPI;
    if (module === "health") return healthReportsAPI;
    if (module === "social-justice")
      return {
        generate: generateSocialJusticeReport,
        exportPDF: () => {},
        exportExcel: () => {},
      };
    return null;
  };

  const handleModuleChange = (value) => {
    setModule(value);
    setCategory("");
    setReportData(null);
    setChartData(null);
    resetFilters();
  };

  const handleGenerateReport = async () => {
    if (!module) {
      toast.error("Please select a module");
      return;
    }

    if (!category) {
      toast.error("Please select category");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    try {
      const params = {
        category,
        startDate,
        endDate,
      };

      // Add module-specific filters
      if (module === "education") {
        if (wardNo) params.wardNo = wardNo;
        if (habitation) params.habitation = habitation;
        if (centerName) params.centerName = centerName;
        if (studentName) params.studentName = studentName;
        if (schoolName) params.schoolName = schoolName;
        if (examType && examType !== "all") params.examType = examType;
        if (boardType && boardType !== "all") params.boardType = boardType;
        if (statusFilter && statusFilter !== "all")
          params.status = statusFilter;
        if (classStandard && classStandard !== "all")
          params.class = classStandard;
      } else if (module === "health") {
        if (wardNo) params.wardNo = wardNo;
        if (habitation) params.habitation = habitation;
        if (patientName) params.patientName = patientName;
        if (statusFilter && statusFilter !== "all")
          params.status = statusFilter;
      } else if (module === "social-justice") {
        if (wardNo) params.wardNo = wardNo;
        if (habitation) params.habitation = habitation;
        if (statusFilter && statusFilter !== "all")
          params.status = statusFilter;
      }

      const reportsAPI = getReportsAPI();
      const response = await reportsAPI.generate(params);
      setReportData(response.report || response.data?.report);
      setChartData(response.chartData || response.data?.chartData);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast.error("Please generate a report first");
      return;
    }

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Header band
      const headerH = 26;
      doc.setFillColor(237, 243, 255);
      doc.rect(0, 0, pageWidth, headerH, "F");

      let y = 8;
      try {
        const logoImg = await fetch(sevaLogo);
        const blob = await logoImg.blob();
        const reader = new FileReader();
        const logoDataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const imgProps = doc.getImageProperties(logoDataUrl);
        const logoW = 18; // mm
        const logoH = (imgProps.height * logoW) / imgProps.width;
        doc.addImage(logoDataUrl, "PNG", margin, y - 2, logoW, logoH);
      } catch (err) {
        console.error('Logo load error:', err);
      }

      const categoryLabel = getCategoryLabel(category);
      const moduleLabel = module
        ? module.charAt(0).toUpperCase() + module.slice(1)
        : "Module";

      doc.setFontSize(15);
      doc.text(`${moduleLabel} - ${categoryLabel} Report`, pageWidth / 2, y + 4, {
        align: "center",
      });

      y = headerH + 4;
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 5;
      if (startDate || endDate) {
        doc.text(`Period: ${startDate || "N/A"} - ${endDate || "N/A"}`, margin, y);
        y += 6;
      }
      y += 4;
      doc.setDrawColor(215);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Summary
      doc.setFontSize(11);
      doc.text("Executive Summary", margin, y);
      y += 6;
      const sum = reportData.summary || {};
      const summaryLines = [
        [`Total Records`, sum.totalRecords || 0],
        [`Active`, sum.active || 0],
        [`Pending`, sum.pending || 0],
        [`Completed`, sum.completed || 0],
        [`Completion Rate`, `${sum.completionRate || 0}%`],
      ];
      doc.setFontSize(10);
      summaryLines.forEach((line) => {
        doc.text(`${line[0]}: ${line[1]}`, margin, y);
        y += 6;
      });
      y += 6;
      doc.setDrawColor(220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // Table of records using autoTable
      const head = [
        [
          "#",
          "Name",
          "Status",
          "Date",
          "Ward",
          "Habitation",
          "Class",
          "Treatment",
        ],
      ];
      const body = (reportData.records || []).map((record, idx) => {
        const name =
          record.centreName ||
          record.name ||
          record.studentName ||
          (record.firstName && record.lastName
            ? `${record.firstName} ${record.lastName}`
            : record.firstName ||
              record.schoolName ||
              record.patientName ||
              record.campName ||
              "N/A");
        const date =
          record.date || record.createdAt
            ? new Date(record.date || record.createdAt).toLocaleDateString()
            : "N/A";
        return [
          idx + 1,
          name,
          record.status || "N/A",
          date,
          record.wardNo || "",
          record.habitation || "",
          record.class || "",
          record.treatmentStatus || "",
        ];
      });

      autoTable(doc, {
        head,
        body,
        startY: y,
        margin: { left: margin, right: margin },
        theme: "striped",
        tableWidth: "auto",
        headStyles: {
          fillColor: [21, 101, 192],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 10 } },
        didDrawPage: () => {
          doc.setFontSize(8);
          const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
          doc.text(pageStr, pageWidth - margin, pageHeight - 8, {
            align: "right",
          });
        },
      });

      const fileName = `${moduleLabel}_${categoryLabel}_Report_${
        startDate || "start"
      }_to_${endDate || "end"}.pdf`;
      doc.save(fileName);
      toast.success(`PDF generated: ${fileName}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportExcel = () => {
    if (!reportData) {
      toast.error("Please generate a report first");
      return;
    }

    try {
      // Generate professional CSV content with Excel compatibility
      const categoryLabel = getCategoryLabel(category);
      const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
      const timestamp = new Date().toLocaleString();

      let csvContent = `"${moduleLabel} Module - ${categoryLabel} Report"\n`;
      csvContent += `"Generated: ${timestamp}"\n`;
      csvContent += `"Period: ${new Date(
        startDate
      ).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}"\n`;
      csvContent += `\n`;

      // Executive Summary Section
      csvContent += `"EXECUTIVE SUMMARY"\n`;
      csvContent += `"Metric","Value"\n`;
      csvContent += `"Total Records","${
        reportData.summary?.totalRecords || 0
      }"\n`;
      csvContent += `"Active Records","${reportData.summary?.active || 0}"\n`;
      csvContent += `"Pending Records","${reportData.summary?.pending || 0}"\n`;
      csvContent += `"Completed Records","${
        reportData.summary?.completed || 0
      }"\n`;
      csvContent += `"Completion Rate","${
        reportData.summary?.completionRate || 0
      }%"\n`;

      const activeRate = reportData.summary?.totalRecords
        ? (
            (reportData.summary.active / reportData.summary.totalRecords) *
            100
          ).toFixed(1)
        : 0;
      const pendingRate = reportData.summary?.totalRecords
        ? (
            (reportData.summary.pending / reportData.summary.totalRecords) *
            100
          ).toFixed(1)
        : 0;

      csvContent += `"Active Rate","${activeRate}%"\n`;
      csvContent += `"Pending Rate","${pendingRate}%"\n`;
      csvContent += `\n`;

      // Monthly Trend Data
      if (chartData && chartData.datasets && chartData.datasets[0]) {
        csvContent += `"MONTHLY TREND ANALYSIS"\n`;
        csvContent += `"Month","Records Count"\n`;
        chartData.labels.forEach((month, idx) => {
          const count = chartData.datasets[0].data[idx] || 0;
          csvContent += `"${month}","${count}"\n`;
        });
        csvContent += `\n`;
      }

      // Detailed Records Section
      csvContent += `"DETAILED RECORDS"\n`;
      csvContent += `"No.","Name","Module","Category","Status","Date","Ward No","Habitation","Class","Treatment Status","Additional Info"\n`;

      if (reportData.records && reportData.records.length > 0) {
        reportData.records.forEach((record, index) => {
          const name =
            record.centreName ||
            record.name ||
            record.studentName ||
            record.firstName ||
            record.schoolName ||
            record.patientName ||
            record.campName ||
            (record.firstName && record.lastName
              ? `${record.firstName} ${record.lastName}`
              : "N/A");
          const date =
            record.date || record.createdAt
              ? new Date(record.date || record.createdAt).toLocaleDateString()
              : "N/A";
          const wardNo = record.wardNo || "";
          const habitation = record.habitation || "";
          const classInfo = record.class || "";
          const treatment = record.treatmentStatus || "";

          let additionalInfo = [];
          if (record.examType) additionalInfo.push(`Exam: ${record.examType}`);
          if (record.boardType)
            additionalInfo.push(`Board: ${record.boardType}`);
          if (record.diseaseType)
            additionalInfo.push(`Disease: ${record.diseaseType}`);
          if (record.caseType) additionalInfo.push(`Case: ${record.caseType}`);
          if (record.groupType)
            additionalInfo.push(`Group: ${record.groupType}`);

          csvContent += `"${
            index + 1
          }","${name}","${moduleLabel}","${categoryLabel}","${
            record.status || "N/A"
          }","${date}","${wardNo}","${habitation}","${classInfo}","${treatment}","${additionalInfo.join(
            "; "
          )}"\n`;
        });
      } else {
        csvContent += `"No records available for the specified criteria"\n`;
      }

      csvContent += `\n`;
      csvContent += `"REPORT METADATA"\n`;
      csvContent += `"Generated By","Seva Kendra CRM"\n`;
      csvContent += `"Report Version","1.0"\n`;
      csvContent += `"Export Format","CSV (Excel Compatible)"\n`;

      // Create CSV file with BOM for Excel compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${moduleLabel}_${categoryLabel}_Report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Excel report exported successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error(error.message || "Failed to export Excel");
    }
  };

  const handlePrintReport = () => {
    if (!reportData) {
      toast.error("Please generate a report first");
      return;
    }

    const printWindow = window.open("", "_blank");
    const categoryLabel = getCategoryLabel(category);
    const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
    const timestamp = new Date().toLocaleString();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${moduleLabel} - ${categoryLabel} Report</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
          }
          .header h2 {
            color: #6b7280;
            margin: 5px 0;
            font-size: 18px;
            font-weight: normal;
          }
          .meta-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
          }
          th {
            background: #2563eb;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${moduleLabel} Module Report</h1>
          <h2>${categoryLabel}</h2>
        </div>
        
        <div class="meta-info">
          <strong>Report Generated:</strong> ${timestamp}<br>
          <strong>Reporting Period:</strong> ${new Date(
            startDate
          ).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}
        </div>
        
        <h2>Executive Summary</h2>
        <div class="summary">
          <div class="summary-card">
            <h3>Total Records</h3>
            <div class="value">${reportData.summary?.totalRecords || 0}</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <h3>Active</h3>
            <div class="value">${reportData.summary?.active || 0}</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <h3>Pending</h3>
            <div class="value">${reportData.summary?.pending || 0}</div>
          </div>
          <div class="summary-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <h3>Completion Rate</h3>
            <div class="value">${reportData.summary?.completionRate || 0}%</div>
          </div>
        </div>
        
        <h2>Detailed Records</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Date</th>
              <th>Ward No</th>
              <th>Habitation</th>
            </tr>
          </thead>
          <tbody>
            ${
              reportData.records && reportData.records.length > 0
                ? reportData.records
                    .map((record, index) => {
                      const name =
                        record.centreName ||
                        record.name ||
                        record.studentName ||
                        record.firstName ||
                        record.schoolName ||
                        record.patientName ||
                        record.campName ||
                        (record.firstName && record.lastName
                          ? `${record.firstName} ${record.lastName}`
                          : "N/A");
                      const date =
                        record.date || record.createdAt
                          ? new Date(
                              record.date || record.createdAt
                            ).toLocaleDateString()
                          : "N/A";
                      return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${name}</td>
                      <td>${record.status || "N/A"}</td>
                      <td>${date}</td>
                      <td>${record.wardNo || "-"}</td>
                      <td>${record.habitation || "-"}</td>
                    </tr>
                  `;
                    })
                    .join("")
                : '<tr><td colspan="6" style="text-align: center;">No records available</td></tr>'
            }
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated by Seva Kendra CRM | Confidential Report</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };

    toast.success("Print preview opened!");
  };

  const resetFilters = () => {
    setWardNo("");
    setHabitation("");
    setCenterName("");
    setStudentName("");
    setSchoolName("");
    setExamType("");
    setBoardType("");
    setStatusFilter("");
    setClassStandard("");
    setPatientName("");
  };

  const handleReset = () => {
    setModule("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    resetFilters();
    setReportData(null);
    setChartData(null);
  };

  const getCategoryLabel = (value) => {
    const allCategories = [...educationCategories, ...healthCategories];
    const cat = allCategories.find((c) => c.value === value);
    return cat ? cat.label : value;
  };

  const renderModuleSpecificFilters = () => {
    if (module === "education") {
      return renderEducationFilters();
    } else if (module === "health") {
      return renderHealthFilters();
    }
    return null;
  };

  const renderEducationFilters = () => {
    switch (category) {
      case "study-centers":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Ward No
              </label>
              <Input
                type="text"
                placeholder="Enter ward number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Habitation
              </label>
              <Input
                type="text"
                placeholder="Enter habitation"
                value={habitation}
                onChange={(e) => setHabitation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Center Name
              </label>
              <Input
                type="text"
                placeholder="Enter center name"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "sc-students":
      case "dropouts":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Student Name
              </label>
              <Input
                type="text"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Ward No
              </label>
              <Input
                type="text"
                placeholder="Enter ward number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Habitation
              </label>
              <Input
                type="text"
                placeholder="Enter habitation"
                value={habitation}
                onChange={(e) => setHabitation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "schools":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                School Name
              </label>
              <Input
                type="text"
                placeholder="Enter school name"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Ward No
              </label>
              <Input
                type="text"
                placeholder="Enter ward number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "competitive-exams":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Exam Type
              </label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Student Name
              </label>
              <Input
                type="text"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "board-preparation":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Board Type
              </label>
              <Select value={boardType} onValueChange={setBoardType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select board type" />
                </SelectTrigger>
                <SelectContent>
                  {boardTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Class</label>
              <Select value={classStandard} onValueChange={setClassStandard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classStandards.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Student Name
              </label>
              <Input
                type="text"
                placeholder="Enter student name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Ward No
              </label>
              <Input
                type="text"
                placeholder="Enter ward number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
    }
  };

  const renderHealthFilters = () => {
    return (
      <>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Patient Name
          </label>
          <Input
            type="text"
            placeholder="Enter patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ward No</label>
          <Input
            type="text"
            placeholder="Enter ward number"
            value={wardNo}
            onChange={(e) => setWardNo(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Habitation
          </label>
          <Input
            type="text"
            placeholder="Enter habitation"
            value={habitation}
            onChange={(e) => setHabitation(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </>
    );
  };

  const moduleLabel = module
    ? module.charAt(0).toUpperCase() + module.slice(1)
    : "Module";
  const categoryLabel = getCategoryLabel(category);

  return (
    <div className="min-h-full bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-0">
        <ModulePageHeader
          title="Reports"
          subtitle="Choose a programme, a section and dates, then create a report you can save as PDF or Excel."
          actions={
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw />
              Clear choices
            </Button>
          }
        />

        <main>
          {/* Filters Section */}
          <FilterBar>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Module Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Module *
                  </label>
                  <Select value={module} onValueChange={handleModuleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <SelectItem key={mod.value} value={mod.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {mod.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Category *
                  </label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    disabled={!module}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          module ? "Select category" : "Select module first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getCurrentCategories().map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Module-specific filters */}
                {module && category && renderModuleSpecificFilters()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading || !module || !category}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </Button>

                {canExport(getCurrentModulePermissionKey()) && (
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={!reportData}
                    className="flex items-center gap-2 border-2 hover:bg-destructive/10 hover:border-destructive transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                )}

                {canExport(getCurrentModulePermissionKey()) && (
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={!reportData}
                    className="flex items-center gap-2 border-2 hover:bg-success/10 hover:border-success transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                )}
              </div>
            </FilterBar>

          {/* Report Results */}
          <div id="module-report-content" className="space-y-6">
            {reportData && reportData.summary && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="border border-border shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-primary">
                        Total Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl sm:text-4xl font-bold text-foreground">
                          {reportData.summary.totalRecords || 0}
                        </div>
                        <div className="p-3 bg-primary/20 rounded-xl">
                          <Users className="w-7 h-7 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-success">
                        Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl sm:text-4xl font-bold text-foreground">
                          {reportData.summary.active || 0}
                        </div>
                        <div className="p-3 bg-success/20 rounded-xl">
                          <TrendingUp className="w-7 h-7 text-success" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-warning">
                        Pending
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl sm:text-4xl font-bold text-foreground">
                          {reportData.summary.pending || 0}
                        </div>
                        <div className="p-3 bg-warning/20 rounded-xl">
                          <Activity className="w-7 h-7 text-warning" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-info">
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl sm:text-4xl font-bold text-foreground">
                          {reportData.summary.completionRate || 0}%
                        </div>
                        <div className="p-3 bg-info/10 rounded-xl">
                          <PieChart className="w-7 h-7 text-info" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Data Table */}
                <Card className="border border-border shadow-lg">
                  <CardHeader className="border-b border-border bg-muted/70">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Detailed Report Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
                            <TableHead className="font-semibold text-foreground">#</TableHead>
                            <TableHead className="font-semibold text-foreground">Name</TableHead>
                            <TableHead className="font-semibold text-foreground">Module</TableHead>
                            <TableHead className="font-semibold text-foreground">Category</TableHead>
                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                            <TableHead className="font-semibold text-foreground">Date</TableHead>
                            <TableHead className="font-semibold text-foreground">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.records && reportData.records.length > 0 ? (
                            reportData.records.map((record, index) => {
                              const name =
                                record.centreName ||
                                record.name ||
                                record.studentName ||
                                (record.firstName && record.lastName
                                  ? `${record.firstName} ${record.lastName}`
                                  : record.firstName ||
                                    record.schoolName ||
                                    record.patientName ||
                                    record.campName ||
                                    "N/A");
                              const date = record.date || record.createdAt
                                ? new Date(record.date || record.createdAt).toLocaleDateString()
                                : "N/A";
                              const status = record.status || "N/A";
                              const statusClass =
                                status === "active"
                                  ? "bg-success/20 text-success"
                                  : status === "pending"
                                  ? "bg-warning/20 text-warning"
                                  : status === "completed"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-secondary text-foreground";

                              return (
                                <TableRow
                                  key={record._id || index}
                                  className={`${index % 2 === 0 ? "bg-card" : "bg-secondary/30"} text-foreground hover:bg-secondary/50 transition-colors`}
                                >
                                  <TableCell className="font-medium text-foreground">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="text-foreground">{name}</TableCell>
                                  <TableCell className="text-foreground">
                                    <Badge variant="secondary">{moduleLabel}</Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    <Badge variant="outline">{categoryLabel}</Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground">
                                    <Badge className={statusClass}>{status}</Badge>
                                  </TableCell>
                                  <TableCell className="text-foreground">{date}</TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {record.wardNo && `Ward: ${record.wardNo}`}
                                    {record.habitation && ` | ${record.habitation}`}
                                    {record.class && ` | Class: ${record.class}`}
                                    {record.treatmentStatus && ` | Treatment: ${record.treatmentStatus}`}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-8"
                              >
                                No data available for the selected filters
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart Visualization */}
                {chartData && (
                  <Card className="border border-border shadow-lg">
                    <CardHeader className="border-b border-border bg-muted/70">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Visual Analytics - Monthly Trend
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={
                              chartType === "bar" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setChartType("bar")}
                            className="flex items-center gap-1"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Bar
                          </Button>
                          <Button
                            variant={
                              chartType === "line" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setChartType("line")}
                            className="flex items-center gap-1"
                          >
                            <LineChart className="w-4 h-4" />
                            Line
                          </Button>
                          <Button
                            variant={
                              chartType === "area" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setChartType("area")}
                            className="flex items-center gap-1"
                          >
                            <Activity className="w-4 h-4" />
                            Area
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrintReport}
                            className="flex items-center gap-1"
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="w-full h-80">
                        {(() => {
                          // Transform chart data for Recharts
                          const transformedData =
                            chartData.labels?.map((label, index) => ({
                              month: label,
                              count:
                                chartData.datasets?.[0]?.data?.[index] || 0,
                            })) || [];

                          // Common chart props
                          const chartMargin = {
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          };
                          const tooltipStyle = {
                            backgroundColor: "hsl(222 47% 15%)",
                            border: "1px solid hsl(217 33% 23%)",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            color: "hsl(210 40% 98%)",
                          };

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              {chartType === "bar" ? (
                                <BarChart
                                  data={transformedData}
                                  margin={chartMargin}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(217 33% 23%)"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <YAxis
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                  />
                                  <Bar
                                    dataKey="count"
                                    fill="#3b82f6"
                                    radius={[8, 8, 0, 0]}
                                    name="Total Records"
                                  />
                                </BarChart>
                              ) : chartType === "line" ? (
                                <RechartsLineChart
                                  data={transformedData}
                                  margin={chartMargin}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(217 33% 23%)"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <YAxis
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: "#8b5cf6", r: 5 }}
                                    activeDot={{ r: 7 }}
                                    name="Total Records"
                                  />
                                </RechartsLineChart>
                              ) : (
                                <AreaChart
                                  data={transformedData}
                                  margin={chartMargin}
                                >
                                  <defs>
                                    <linearGradient
                                      id="colorCount"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor="#10b981"
                                        stopOpacity={0.8}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor="#10b981"
                                        stopOpacity={0.1}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(217 33% 23%)"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <YAxis
                                    stroke="hsl(215 20% 65%)"
                                    style={{ fontSize: "12px" }}
                                  />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    name="Total Records"
                                  />
                                </AreaChart>
                              )}
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                      <div className="mt-4 p-4 bg-secondary/50 rounded-lg border border-border">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">Insight:</span> This
                          chart shows the monthly distribution of records for{" "}
                          <span className="font-medium text-primary">
                            {category}
                          </span>{" "}
                          in the{" "}
                          <span className="font-medium text-accent">
                            {module}
                          </span>{" "}
                          module. Switch between Bar, Line, and Area chart types
                          to visualize the data differently.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Empty State */}
            {!reportData && (
              <Card className="border border-border shadow-lg">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-muted p-4">
                      <Calendar className="w-16 h-16 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      No Report Generated
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select the module, report parameters above and click
                      "Generate Report" to view comprehensive data and analytics
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModuleReports;




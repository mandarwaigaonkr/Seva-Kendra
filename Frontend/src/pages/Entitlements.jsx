import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { entitlementsAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import entitlementsImportTemplate, {
  ENTITLEMENT_GENDER,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_DOCUMENT_TYPES,
} from "../lib/excelImport/templates/entitlements";
import {
  ModulePageHeader,
  tableState,
  StatusBadge,
  formatWard,
  formatDate,
  toDateInput,
} from "../components/module/ModuleKit";
import { FilterBar } from "@/components/module/ModuleKit";

const WardCombobox = ({ id, value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectedWard = options.find((ward) => ward.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          className="h-9 w-full justify-between bg-input px-3 text-left text-sm font-normal text-foreground"
        >
          {selectedWard ? selectedWard.label : value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Type ward number..."
            autoFocus
            onKeyDown={(event) => event.stopPropagation()}
          />
          <CommandList
            id={`${id}-list`}
            className="max-h-56"
            onWheel={(event) => event.stopPropagation()}
          >
            <CommandEmpty>No ward found.</CommandEmpty>
            <CommandGroup>
              {options.map((ward) => (
                <CommandItem
                  key={ward.value}
                  value={`${ward.label} ${ward.numberValue}`}
                  onSelect={() => {
                    onChange(ward.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === ward.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {ward.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Suggestions for schemes.eligibleSchemes (free text in the model) and the type filter.
const ENTITLEMENT_TYPES = [
  "Pension",
  "Ration Card",
  "Voter ID",
  "Aadhaar Card",
  "PAN Card",
  "Disability Certificate",
  "Caste Certificate",
  "Income Certificate",
  "Birth Certificate",
  "Death Certificate",
  "Widow Pension",
  "Old Age Pension",
  "Disability Pension",
  "Labour Card",
  "Health Insurance",
  "Education Scholarship",
  "Housing Scheme",
  "Other",
];

// documentation.* and governmentSchemes.* boolean flags in entitlements.model.js
const DOCUMENT_FLAGS = [
  ["aadhaar", "Aadhaar"],
  ["voterId", "Voter ID"],
  ["rationCard", "Ration Card"],
  ["birthCertificate", "Birth Certificate"],
  ["casteCertificate", "Caste Certificate"],
  ["incomeCertificate", "Income Certificate"],
];
const SCHEME_FLAGS = [
  ["oldAgePension", "Old Age Pension"],
  ["widowPension", "Widow Pension"],
  ["disabilityPension", "Disability Pension"],
  ["healthScheme", "Health Scheme"],
  ["pdsFoodSecurity", "PDS / Food Security"],
  ["housingScheme", "Housing Scheme"],
];

const emptyForm = () => ({
  householdCode: "",
  idCode: "",
  status: "Applied",
  name: "",
  gender: "",
  age: "",
  headOfHousehold: "",
  contactNo: "",
  wardNo: "",
  habitation: "",
  projectResponsible: "",
  dateOfReporting: "",
  reportedBy: "",
  applicationDate: "",
  idProofAndDomicile: {
    typeOfDocument: "",
    natureOfIssue: "",
    status: "Pending",
    dateOfReporting: "",
  },
  schemes: {
    eligibleSchemes: "",
    natureOfIssue: "",
    status: "Pending",
  },
  documentation: {
    ...Object.fromEntries(DOCUMENT_FLAGS.map(([key]) => [key, false])),
    other: "",
  },
  governmentSchemes: {
    ...Object.fromEntries(SCHEME_FLAGS.map(([key]) => [key, false])),
    other: "",
  },
  progressReporting: {},
  remarks: "",
  followUpRequired: false,
  followUpDate: "",
});

const Entitlements = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const entitlementTypes = ENTITLEMENT_TYPES;
  const documentTypes = ENTITLEMENT_DOCUMENT_TYPES;
  const statusOptions = ENTITLEMENT_STATUS;
  const genderOptions = ENTITLEMENT_GENDER;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    entitlementType: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedEntitlement, setSelectedEntitlement] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const hasFilters =
    Boolean(searchTerm) ||
    filters.status !== "all" ||
    filters.entitlementType !== "all";

  const fetchEntitlements = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== "all")
        ),
      };

      const response = await entitlementsAPI.getAll(params);

      // Handle response data with fallbacks
      const entitlementsData =
        response.data.entitlements || response.data.data || response.data || [];
      setEntitlements(Array.isArray(entitlementsData) ? entitlementsData : []);

      // Handle pagination data - if not provided by API, create default pagination
      if (response.data.pagination) {
        // Backend sends { currentPage, totalPages, totalRecords, recordsPerPage }.
        const p = response.data.pagination;
        setPagination({
          page: p.page ?? p.currentPage ?? 1,
          limit: p.limit ?? p.recordsPerPage ?? 10,
          total: p.total ?? p.totalRecords ?? entitlementsData.length,
          pages: p.pages ?? p.totalPages ?? 1,
        });
      } else {
        // Create default pagination based on data length
        setPagination({
          page: 1,
          limit: 10,
          total: entitlementsData.length,
          pages: Math.ceil(entitlementsData.length / 10),
        });
      }
    } catch (error) {
      toast.error("Failed to fetch entitlements");
      console.error("Error fetching entitlements:", error);
      // Set empty array on error to prevent undefined errors
      setEntitlements([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchEntitlements();
  }, []);

  // Refetch when search or filters change
  useEffect(() => {
    fetchEntitlements();
  }, [searchTerm, filters]);

  // Form state mirrors the model; only strip blanks the schema would reject.
  const buildEntitlementPayload = () => {
    const payload = {
      ...formData,
      age: formData.age === "" ? "" : Number(formData.age),
      idProofAndDomicile: { ...formData.idProofAndDomicile },
      schemes: { ...formData.schemes },
    };
    if (!payload.contactNo || payload.contactNo.trim() === "") {
      delete payload.contactNo;
    }
    if (!payload.idProofAndDomicile.typeOfDocument) {
      delete payload.idProofAndDomicile.typeOfDocument;
    }
    if (!payload.idProofAndDomicile.dateOfReporting) {
      delete payload.idProofAndDomicile.dateOfReporting;
    }
    if (!payload.applicationDate) delete payload.applicationDate;
    if (!payload.followUpDate) delete payload.followUpDate;
    return payload;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gender || !formData.wardNo) {
      toast.error("Please select Gender and Ward");
      return;
    }
    try {
      const payload = buildEntitlementPayload();

      if (selectedEntitlement) {
        await entitlementsAPI.update(selectedEntitlement._id, payload);
        toast.success("Entitlement updated successfully");
        setIsEditModalOpen(false);
      } else {
        await entitlementsAPI.create(payload);
        toast.success("Entitlement created successfully");
        setIsCreateModalOpen(false);
      }
      fetchEntitlements();
      resetForm();
    } catch (error) {
      toast.error(
        selectedEntitlement
          ? "Failed to update entitlement"
          : "Failed to create entitlement"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm());
    setSelectedEntitlement(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await entitlementsAPI.delete(id);
      toast.success("Entitlement deleted successfully");
      fetchEntitlements();
    } catch (error) {
      toast.error("Failed to delete entitlement");
      console.error("Error deleting entitlement:", error);
    }
  };

  const openEdit = (entitlement) => {
    const base = emptyForm();
    setSelectedEntitlement(entitlement);
    setFormData({
      ...base,
      householdCode: entitlement.householdCode || "",
      idCode: entitlement.idCode || "",
      status: entitlement.status || "Applied",
      name: entitlement.name || "",
      gender: entitlement.gender || "",
      age: entitlement.age ?? "",
      headOfHousehold: entitlement.headOfHousehold || "",
      contactNo: entitlement.contactNo || "",
      wardNo: entitlement.wardNo || "",
      habitation: entitlement.habitation || "",
      projectResponsible: entitlement.projectResponsible || "",
      dateOfReporting: toDateInput(entitlement.dateOfReporting),
      reportedBy: entitlement.reportedBy || "",
      applicationDate: toDateInput(entitlement.applicationDate),
      idProofAndDomicile: {
        typeOfDocument: entitlement.idProofAndDomicile?.typeOfDocument || "",
        natureOfIssue: entitlement.idProofAndDomicile?.natureOfIssue || "",
        status: entitlement.idProofAndDomicile?.status || "Pending",
        dateOfReporting: toDateInput(
          entitlement.idProofAndDomicile?.dateOfReporting
        ),
      },
      schemes: {
        eligibleSchemes: entitlement.schemes?.eligibleSchemes || "",
        natureOfIssue: entitlement.schemes?.natureOfIssue || "",
        status: entitlement.schemes?.status || "Pending",
      },
      documentation: {
        ...base.documentation,
        ...(entitlement.documentation || {}),
      },
      governmentSchemes: {
        ...base.governmentSchemes,
        ...(entitlement.governmentSchemes || {}),
      },
      progressReporting: entitlement.progressReporting || {},
      remarks: entitlement.remarks || "",
      followUpRequired: entitlement.followUpRequired || false,
      followUpDate: toDateInput(entitlement.followUpDate),
    });
    setIsEditModalOpen(true);
  };

  const getEntitlementTypeLabel = (entitlement) =>
    entitlement?.schemes?.eligibleSchemes ||
    entitlement?.idProofAndDomicile?.typeOfDocument ||
    "N/A";

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const setNested = (group, key, value) =>
    setFormData((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));

  const renderSelect = (id, value, onChange, options, placeholder) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderFlags = (prefix, group, flags) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {flags.map(([key, label]) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox
            id={`${prefix}${group}-${key}`}
            checked={Boolean(formData[group]?.[key])}
            onCheckedChange={(checked) =>
              setNested(group, key, checked === true)
            }
          />
          <Label htmlFor={`${prefix}${group}-${key}`} className="font-normal">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );

  // Shared create / edit fields — mirror entitlements.model.js
  const renderFormFields = (prefix) => {
    const id = (name) => `${prefix}${name}`;
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Beneficiary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={id("householdCode")}>Household Code</Label>
              <Input
                id={id("householdCode")}
                value={formData.householdCode}
                onChange={setField("householdCode")}
                placeholder="Enter household code"
              />
            </div>
            <div>
              <Label htmlFor={id("idCode")}>ID Code</Label>
              <Input
                id={id("idCode")}
                value={formData.idCode}
                onChange={setField("idCode")}
                placeholder="Unique, e.g. ENT-001"
              />
            </div>
            <div>
              <Label htmlFor={id("name")}>Name *</Label>
              <Input
                id={id("name")}
                value={formData.name}
                onChange={setField("name")}
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <Label htmlFor={id("gender")}>Gender *</Label>
              {renderSelect(
                id("gender"),
                formData.gender,
                (value) => setFormData((prev) => ({ ...prev, gender: value })),
                genderOptions,
                "Select gender"
              )}
            </div>
            <div>
              <Label htmlFor={id("age")}>Age *</Label>
              <Input
                id={id("age")}
                type="number"
                min="0"
                max="120"
                step="1"
                value={formData.age}
                onChange={setField("age")}
                placeholder="Enter age"
                required
              />
            </div>
            <div>
              <Label htmlFor={id("headOfHousehold")}>Head of Household *</Label>
              <Input
                id={id("headOfHousehold")}
                value={formData.headOfHousehold}
                onChange={setField("headOfHousehold")}
                placeholder="Enter head of household"
                required
              />
            </div>
            <div>
              <Label htmlFor={id("contactNo")}>Contact Number</Label>
              <Input
                id={id("contactNo")}
                type="tel"
                value={formData.contactNo}
                onChange={setField("contactNo")}
                placeholder="10-digit mobile number"
                pattern="[6-9][0-9]{9}"
                title="10-digit mobile number starting with 6-9"
              />
            </div>
            <div>
              <Label htmlFor={id("wardNo")}>Ward Number *</Label>
              <WardCombobox
                id={id("wardNo")}
                value={formData.wardNo}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, wardNo: value }))
                }
                options={wardOptions}
                placeholder="Select ward"
              />
            </div>
            <div>
              <Label htmlFor={id("habitation")}>Habitation *</Label>
              <Input
                id={id("habitation")}
                value={formData.habitation}
                onChange={setField("habitation")}
                placeholder="Enter habitation"
                required
              />
            </div>
            <div>
              <Label htmlFor={id("projectResponsible")}>
                Project Responsible *
              </Label>
              <Input
                id={id("projectResponsible")}
                value={formData.projectResponsible}
                onChange={setField("projectResponsible")}
                placeholder="Enter project responsible"
                required
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Reporting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={id("dateOfReporting")}>Date of Reporting *</Label>
              <Input
                id={id("dateOfReporting")}
                type="date"
                value={formData.dateOfReporting}
                onChange={setField("dateOfReporting")}
                required
              />
            </div>
            <div>
              <Label htmlFor={id("reportedBy")}>Reported By *</Label>
              <Input
                id={id("reportedBy")}
                value={formData.reportedBy}
                onChange={setField("reportedBy")}
                placeholder="Enter reported by"
                required
              />
            </div>
            <div>
              <Label htmlFor={id("applicationDate")}>Application Date</Label>
              <Input
                id={id("applicationDate")}
                type="date"
                value={formData.applicationDate}
                onChange={setField("applicationDate")}
              />
            </div>
            <div>
              <Label htmlFor={id("status")}>Overall Status</Label>
              {renderSelect(
                id("status"),
                formData.status,
                (value) => setFormData((prev) => ({ ...prev, status: value })),
                statusOptions,
                "Select status"
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            ID Proof & Domicile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={id("idProofType")}>Type of Document</Label>
              {renderSelect(
                id("idProofType"),
                formData.idProofAndDomicile.typeOfDocument,
                (value) =>
                  setNested("idProofAndDomicile", "typeOfDocument", value),
                documentTypes,
                "Select document type"
              )}
            </div>
            <div>
              <Label htmlFor={id("idProofStatus")}>ID Proof Status</Label>
              {renderSelect(
                id("idProofStatus"),
                formData.idProofAndDomicile.status,
                (value) => setNested("idProofAndDomicile", "status", value),
                statusOptions,
                "Select status"
              )}
            </div>
            <div>
              <Label htmlFor={id("idProofDate")}>Date of Reporting</Label>
              <Input
                id={id("idProofDate")}
                type="date"
                value={formData.idProofAndDomicile.dateOfReporting}
                onChange={(e) =>
                  setNested(
                    "idProofAndDomicile",
                    "dateOfReporting",
                    e.target.value
                  )
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={id("idProofIssue")}>Nature of Issue</Label>
              <Textarea
                id={id("idProofIssue")}
                value={formData.idProofAndDomicile.natureOfIssue}
                onChange={(e) =>
                  setNested("idProofAndDomicile", "natureOfIssue", e.target.value)
                }
                placeholder="Describe the documentation issue"
                rows={2}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Schemes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={id("eligibleSchemes")}>
                Eligible Schemes / Entitlement Type
              </Label>
              <Input
                id={id("eligibleSchemes")}
                list={id("entitlementTypeList")}
                value={formData.schemes.eligibleSchemes}
                onChange={(e) =>
                  setNested("schemes", "eligibleSchemes", e.target.value)
                }
                placeholder="e.g. Old Age Pension"
              />
              <datalist id={id("entitlementTypeList")}>
                {entitlementTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor={id("schemeStatus")}>Scheme Status</Label>
              {renderSelect(
                id("schemeStatus"),
                formData.schemes.status,
                (value) => setNested("schemes", "status", value),
                statusOptions,
                "Select status"
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={id("schemeIssue")}>Nature of Issue</Label>
              <Textarea
                id={id("schemeIssue")}
                value={formData.schemes.natureOfIssue}
                onChange={(e) =>
                  setNested("schemes", "natureOfIssue", e.target.value)
                }
                placeholder="Describe the scheme-related issue"
                rows={2}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Documents Held
          </h3>
          {renderFlags(prefix, "documentation", DOCUMENT_FLAGS)}
          <div>
            <Label htmlFor={id("documentationOther")}>Other Documents</Label>
            <Input
              id={id("documentationOther")}
              value={formData.documentation.other}
              onChange={(e) =>
                setNested("documentation", "other", e.target.value)
              }
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Government Schemes Availed
          </h3>
          {renderFlags(prefix, "governmentSchemes", SCHEME_FLAGS)}
          <div>
            <Label htmlFor={id("governmentSchemesOther")}>
              Other Government Schemes
            </Label>
            <Input
              id={id("governmentSchemesOther")}
              value={formData.governmentSchemes.other}
              onChange={(e) =>
                setNested("governmentSchemes", "other", e.target.value)
              }
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Follow-up
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={id("followUpRequired")}
                checked={Boolean(formData.followUpRequired)}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    followUpRequired: checked === true,
                  }))
                }
              />
              <Label htmlFor={id("followUpRequired")}>Follow-up required</Label>
            </div>
            <div>
              <Label htmlFor={id("followUpDate")}>Follow-up Date</Label>
              <Input
                id={id("followUpDate")}
                type="date"
                value={formData.followUpDate}
                onChange={setField("followUpDate")}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor={id("remarks")}>Remarks</Label>
              <Textarea
                id={id("remarks")}
                value={formData.remarks}
                onChange={setField("remarks")}
                placeholder="Enter remarks"
                rows={2}
              />
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderFlagList = (record, group, flags) => {
    const held = flags
      .filter(([key]) => record?.[group]?.[key])
      .map(([, label]) => label);
    if (record?.[group]?.other) held.push(record[group].other);
    return held.length ? held.join(", ") : "None recorded";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="entitlements"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={Award}
          accent="text-purple-600"
          title="Entitlements"
          subtitle="ID proofs, documents and government scheme access for beneficiaries"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("socialJustice") && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entitlement
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">

            <GuidelinesCard
              title="Entitlement Guidelines"
              description="Follow these steps to keep entitlement records complete and consistent."
              items={[
                "Double-check the ID code and household code for consistency.",
                "Specify the exact scheme or entitlement being applied for (Pension, Ration Card, etc.).",
                "Update application status regularly (Applied, Under Verification, Approved).",
                "Keep the ID proof status accurate to track pending documentation.",
                "Tick the documents the beneficiary already holds and the schemes they already avail.",
              ]}
            />

            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search beneficiaries..."
                      aria-label="Search beneficiaries"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger aria-label="Filter by status">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.entitlementType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, entitlementType: value })
                    }
                  >
                    <SelectTrigger aria-label="Filter by entitlement type">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {entitlementTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FilterBar>

              {canCreate("socialJustice") && (
                <ExcelImportPanel
                  template={entitlementsImportTemplate}
                  createRecord={entitlementsAPI.create}
                  onImported={fetchEntitlements}
                />
              )}

            {/* Entitlements Table */}
            <Card>
              <CardHeader>
                <CardTitle>Entitlements ({pagination.total})</CardTitle>
                <CardDescription>
                  Track and manage government entitlements and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Code</TableHead>
                      <TableHead>Beneficiary Name</TableHead>
                      <TableHead>Entitlement Type</TableHead>
                      <TableHead>Application Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: entitlements.length,
                      colSpan: 7,
                      filtered: hasFilters,
                    }) ||
                      entitlements.map((entitlement) => (
                        <TableRow key={entitlement._id}>
                          <TableCell className="font-medium">
                            {entitlement.idCode || "—"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {entitlement.name || ""}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {entitlement.age} years, {entitlement.gender}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getEntitlementTypeLabel(entitlement)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(entitlement.applicationDate, "N/A")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-1 h-3 w-3" />
                              <span>
                                {formatWard(entitlement.wardNo)}
                                {entitlement.habitation
                                  ? `, ${entitlement.habitation}`
                                  : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={entitlement.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`View ${entitlement.name}`}
                                onClick={() => {
                                  setSelectedEntitlement(entitlement);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("socialJustice") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Edit ${entitlement.name}`}
                                  onClick={() => openEdit(entitlement)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("socialJustice") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Delete ${entitlement.name}`}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the entitlement record.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(entitlement._id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, prev.pages),
                        }))
                      }
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Modal */}
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Entitlement</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new entitlement record
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderFormFields("")}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Entitlement</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Entitlement</DialogTitle>
                  <DialogDescription>
                    Update the entitlement information
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderFormFields("edit-")}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Entitlement</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Entitlement Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this entitlement
                  </DialogDescription>
                </DialogHeader>
                {selectedEntitlement && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Household Code
                          </Label>
                          <p>{selectedEntitlement.householdCode || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">ID Code</Label>
                          <p>{selectedEntitlement.idCode || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Name</Label>
                          <p>{selectedEntitlement.name}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Gender</Label>
                          <div>
                            <Badge variant="outline">
                              {selectedEntitlement.gender}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">Age</Label>
                          <p>{selectedEntitlement.age} years</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Head of Household
                          </Label>
                          <p>{selectedEntitlement.headOfHousehold}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Contact Number
                          </Label>
                          <p>{selectedEntitlement.contactNo || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedEntitlement.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedEntitlement.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedEntitlement.projectResponsible}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Overall Status</Label>
                          <div>
                            <StatusBadge value={selectedEntitlement.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporting Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Reporting Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Date of Reporting
                          </Label>
                          <p>{formatDate(selectedEntitlement.dateOfReporting, "N/A")}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Reported By</Label>
                          <p>{selectedEntitlement.reportedBy}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Application Date
                          </Label>
                          <p>{formatDate(selectedEntitlement.applicationDate, "N/A")}</p>
                        </div>
                      </div>
                    </div>

                    {/* ID Proof & Domicile */}
                    {selectedEntitlement.idProofAndDomicile && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          ID Proof & Domicile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="font-semibold">
                              Type of Document
                            </Label>
                            <p>
                              {selectedEntitlement.idProofAndDomicile
                                .typeOfDocument || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Status</Label>
                            <div>
                              <StatusBadge
                                value={selectedEntitlement.idProofAndDomicile.status}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold">
                              Date of Reporting
                            </Label>
                            <p>
                              {formatDate(
                                selectedEntitlement.idProofAndDomicile
                                  .dateOfReporting,
                                "N/A"
                              )}
                            </p>
                          </div>
                        </div>
                        {selectedEntitlement.idProofAndDomicile
                          .natureOfIssue && (
                          <div>
                            <Label className="font-semibold">
                              Nature of Issue
                            </Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {
                                selectedEntitlement.idProofAndDomicile
                                  .natureOfIssue
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Schemes */}
                    {selectedEntitlement.schemes && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Schemes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">
                              Eligible Schemes
                            </Label>
                            <p>
                              {selectedEntitlement.schemes.eligibleSchemes ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Status</Label>
                            <div>
                              <StatusBadge
                                value={selectedEntitlement.schemes.status}
                              />
                            </div>
                          </div>
                        </div>
                        {selectedEntitlement.schemes.natureOfIssue && (
                          <div>
                            <Label className="font-semibold">
                              Nature of Issue
                            </Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {selectedEntitlement.schemes.natureOfIssue}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents & schemes held */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Documents & Schemes Availed
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Documents Held</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {renderFlagList(
                              selectedEntitlement,
                              "documentation",
                              DOCUMENT_FLAGS
                            )}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Government Schemes Availed
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {renderFlagList(
                              selectedEntitlement,
                              "governmentSchemes",
                              SCHEME_FLAGS
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Follow-up */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Follow-up
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Follow-up Required
                          </Label>
                          <div>
                            <Badge
                              variant={
                                selectedEntitlement.followUpRequired
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {selectedEntitlement.followUpRequired
                                ? "Yes"
                                : "No"}
                            </Badge>
                          </div>
                        </div>
                        {selectedEntitlement.followUpDate && (
                          <div>
                            <Label className="font-semibold">
                              Follow-up Date
                            </Label>
                            <p>{formatDate(selectedEntitlement.followUpDate)}</p>
                          </div>
                        )}
                      </div>
                      {selectedEntitlement.remarks && (
                        <div>
                          <Label className="font-semibold">Remarks</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedEntitlement.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entitlements;

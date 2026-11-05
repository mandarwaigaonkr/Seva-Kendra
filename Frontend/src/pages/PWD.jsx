import { FormSheet, FormSheetContent, FormSheetDescription, FormSheetFooter, FormSheetHeader, FormSheetTitle } from "@/components/module/FormSheet";
import React, { useState, useEffect } from "react";
import { normalizePagination } from "@/components/module/ModuleKit";
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
import { cn } from "@/lib/utils";
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
  DialogTrigger,
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
  Accessibility,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { pwdAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import pwdImportTemplate from "../lib/excelImport/templates/pwd";
import {
  ModulePageHeader,
  StatusBadge,
  tableState,
  formatDate,
  formatWard,
  toDateInput,
} from "../components/module/ModuleKit";
import { FilterBar } from "@/components/module/ModuleKit";

const DISABILITY_OPTIONS = [
  "Visual Impairment",
  "Hearing Impairment",
  "Locomotor Disability",
  "Intellectual Disability",
  "Mental Illness",
  "Multiple Disabilities",
  "Speech and Language Disability",
  "Autism Spectrum Disorder",
  "Cerebral Palsy",
  "Muscular Dystrophy",
  "Chronic Neurological Conditions",
  "Leprosy Cured",
  "Dwarfism",
  "Acid Attack Victim",
  "Other",
];

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
          {selectedWard ? selectedWard.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
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
                      "mr-2 h-4 w-4",
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

const PWD = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwd, setPwd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    typeOfDisability: "",
    wardNo: "",
    habitation: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    householdCode: "",
    name: "",
    uniqueId: "",
    gender: "",
    age: "",
    contactNo: "",
    headOfHousehold: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    district: "",
    state: "",
    typeOfDisability: [],
    percentageOfDisability: "",
    disabilityCertificate: "",
    dateOfReporting: "",
    reportedBy: "",
    dateOfAssessment: "",
    assessmentResults: "",
    assistiveDevicesProvided: "",
    therapyServices: "",
    rehabilitationServices: "",
    educationalSupport: "",
    vocationalTraining: "",
    beneficiaryOfGovernmentSchemes: "",
    udidCardStatus: "",
    institutionalCare: "",
    progressReporting: {},
  });

  // Fetch PWD records
  const fetchPwd = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      const response = await pwdAPI.getAll(params);
      setPwd(response.data.pwd);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch PWD records");
      console.error("Error fetching PWD records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPwd();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!Array.isArray(formData.typeOfDisability) || formData.typeOfDisability.length === 0) {
        toast.error("Please select at least one disability type");
        return;
      }

      const payload = {
        ...formData,
        typeOfDisability: Array.isArray(formData.typeOfDisability)
          ? formData.typeOfDisability
          : formData.typeOfDisability
          ? [formData.typeOfDisability]
          : [],
        rehabilitationServices:
          formData.institutionalCare || formData.rehabilitationServices || "",
        udidCardStatus: formData.udidCardStatus || undefined,
        employmentStatus: formData.employmentStatus || undefined,
        pensionStatus: formData.pensionStatus || undefined,
      };

      if (selectedRecord) {
        await pwdAPI.update(selectedRecord._id, payload);
        toast.success("PWD record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await pwdAPI.create(payload);
        toast.success("PWD record created successfully");
        setIsCreateModalOpen(false);
      }
      fetchPwd();
      resetForm();
    } catch (error) {
      toast.error(
        selectedRecord ? "Failed to update record" : "Failed to create record"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await pwdAPI.delete(id);
      toast.success("PWD record deleted successfully");
      fetchPwd();
    } catch (error) {
      toast.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      householdCode: "",
      name: "",
      uniqueId: "",
      gender: "",
      age: "",
      contactNo: "",
      headOfHousehold: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      district: "",
      state: "",
      typeOfDisability: [],
      percentageOfDisability: "",
      disabilityCertificate: "",
      dateOfReporting: "",
      reportedBy: "",
      dateOfAssessment: "",
      assessmentResults: "",
      assistiveDevicesProvided: "",
      therapyServices: "",
      rehabilitationServices: "",
      educationalSupport: "",
      vocationalTraining: "",
      beneficiaryOfGovernmentSchemes: "",
      udidCardStatus: "",
      institutionalCare: "",
      progressReporting: {},
    });
    setSelectedRecord(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Handle edit
  const handleEdit = (record) => {
    setSelectedRecord(record);
    const formFields = {
      householdCode: record.householdCode || "",
      name: record.name || "",
      uniqueId: record.uniqueId || "",
      gender: record.gender || "",
      age: record.age ?? "",
      contactNo: record.contactNo || "",
      headOfHousehold: record.headOfHousehold || "",
      wardNo: record.wardNo || "",
      habitation: record.habitation || "",
      projectResponsible: record.projectResponsible || "",
      district: record.district || "",
      state: record.state || "",
      typeOfDisability: Array.isArray(record.typeOfDisability)
        ? record.typeOfDisability
        : record.typeOfDisability
        ? [record.typeOfDisability]
        : [],
      percentageOfDisability: record.percentageOfDisability ?? "",
      disabilityCertificate: record.disabilityCertificate || "",
      dateOfReporting: toDateInput(record.dateOfReporting),
      reportedBy: record.reportedBy || "",
      dateOfAssessment: toDateInput(record.dateOfAssessment),
      assessmentResults: record.assessmentResults || "",
      assistiveDevicesProvided: record.assistiveDevicesProvided || "",
      therapyServices: record.therapyServices || "",
      rehabilitationServices: record.rehabilitationServices || "",
      educationalSupport: record.educationalSupport || "",
      vocationalTraining: record.vocationalTraining || "",
      beneficiaryOfGovernmentSchemes:
        record.beneficiaryOfGovernmentSchemes || "",
      udidCardStatus: record.udidCardStatus || "",
      institutionalCare:
        record.institutionalCare || record.rehabilitationServices || "",
      progressReporting: record.progressReporting || {},
    };
    // Only include optional enum fields if they have values
    if (record.employmentStatus) {
      formFields.employmentStatus = record.employmentStatus;
    }
    if (record.pensionStatus) {
      formFields.pensionStatus = record.pensionStatus;
    }
    setFormData(formFields);
    setIsEditModalOpen(true);
  };

  // Handle view
  const handleView = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDisabilityType = (disability) => {
    setFormData((prev) => {
      const selected = Array.isArray(prev.typeOfDisability)
        ? prev.typeOfDisability
        : [];

      return {
        ...prev,
        typeOfDisability: selected.includes(disability)
          ? selected.filter((item) => item !== disability)
          : [...selected, disability],
      };
    });
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      gender: "",
      typeOfDisability: "",
      wardNo: "",
      habitation: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModulePageHeader
          icon={Accessibility}
          title="Persons with Disabilities"
          subtitle="Disability type, certification, UDID and support services"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("health") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add PWD Record
              </Button>
            )
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="Disability Support Guidelines"
            description="Focus on accessibility and inclusive support for Persons with Disabilities (PWD)."
            items={[
              "Capture the type and percentage of disability accurately as per certificate.",
              "Track UDID card status and linkage with government schemes.",
              "Document assistive devices provided and their current usage status.",
              "Monitor participation in vocational training and employment status.",
              "Ensure all records are updated with latest assessment results.",
            ]}
          />
          {/* Filters */}
          <FilterBar>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={filters.gender} onValueChange={(value) => handleFilterChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-typeOfDisability">Disability Type</Label>
                  <Select
                    value={filters.typeOfDisability}
                    onValueChange={(value) =>
                      handleFilterChange("typeOfDisability", value)
                    }
                  >
                    <SelectTrigger id="filter-typeOfDisability">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {DISABILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="wardNo">Ward No</Label>
                  <WardCombobox
                    id="wardNo"
                    value={filters.wardNo}
                    onChange={(value) => handleFilterChange("wardNo", value)}
                    options={wardOptions}
                    placeholder="Filter by ward"
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </FilterBar>

          {/* Bulk Import */}
          {canCreate("health") && (
            <ExcelImportPanel
              template={pwdImportTemplate}
              createRecord={pwdAPI.create}
              onImported={fetchPwd}
            />
          )}

          {/* Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  PWD Records ({pagination.totalItems || 0})
                </CardTitle>
                <Button variant="outline" onClick={fetchPwd} disabled={loading}>
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Disability Type</TableHead>
                      <TableHead>Disability %</TableHead>
                      <TableHead>Ward/Habitation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: pwd.length,
                      colSpan: 8,
                      filtered:
                        Boolean(searchTerm) ||
                        Object.values(filters).some((v) => v && v !== "all"),
                    })}
                    {!loading &&
                      pwd.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.name}
                          </TableCell>
                          <TableCell>
                            {record.age}, {record.gender}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {Array.isArray(record.typeOfDisability)
                                ? record.typeOfDisability.join(", ")
                                : record.typeOfDisability}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {record.percentageOfDisability}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatWard(record.wardNo)}, {record.habitation}
                          </TableCell>
                          <TableCell>{record.contactNo}</TableCell>
                          <TableCell>
                            <StatusBadge value={record.disabilityCertificate} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(record)}
                                aria-label="View PWD record"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("health") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  aria-label="Edit PWD record"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("health") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Delete PWD record"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Record
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(record._id)}
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
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Modal */}
      <FormSheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <FormSheetContent>
          <FormSheetHeader>
            <FormSheetTitle>Add New PWD Record</FormSheetTitle>
          </FormSheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="householdCode">Household Code *</Label>
                <Input
                  id="householdCode"
                  name="householdCode"
                  value={formData.householdCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="uniqueId">Unique ID *</Label>
                <Input
                  id="uniqueId"
                  name="uniqueId"
                  value={formData.uniqueId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <Label htmlFor="headOfHousehold">Head of Household *</Label>
                <Input
                  id="headOfHousehold"
                  name="headOfHousehold"
                  value={formData.headOfHousehold}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="wardNo">Ward No *</Label>
                <WardCombobox
                  id="wardNo"
                  value={formData.wardNo}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, wardNo: value }))
                  }
                  options={wardOptions}
                  placeholder="Select ward"
                />
              </div>
              <div>
                <Label htmlFor="habitation">Habitation *</Label>
                <Input
                  id="habitation"
                  name="habitation"
                  value={formData.habitation}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectResponsible">
                  Project Responsible *
                </Label>
                <Input
                  id="projectResponsible"
                  name="projectResponsible"
                  value={formData.projectResponsible}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State name"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="typeOfDisability">Disability Type *</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border p-3">
                  {DISABILITY_OPTIONS.map((option) => {
                    const checked = (formData.typeOfDisability || []).includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleDisabilityType(option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="percentageOfDisability">
                  Percentage of Disability *
                </Label>
                <Input
                  id="percentageOfDisability"
                  name="percentageOfDisability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentageOfDisability}
                  onChange={handleInputChange}
                  placeholder="Enter percentage (1-100)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="disabilityCertificate">
                  Disability Certificate *
                </Label>
                <Select
                  value={formData.disabilityCertificate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      disabilityCertificate: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Certificate status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="In Process">In Process</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateOfReporting">Date of Reporting *</Label>
                <Input
                  id="dateOfReporting"
                  name="dateOfReporting"
                  type="date"
                  value={formData.dateOfReporting}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reportedBy">Reported By *</Label>
                <Input
                  id="reportedBy"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfAssessment">Date of Assessment</Label>
                <Input
                  id="dateOfAssessment"
                  name="dateOfAssessment"
                  type="date"
                  value={formData.dateOfAssessment}
                  onChange={handleInputChange}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="assessmentResults">Assessment Results</Label>
                <Textarea
                  id="assessmentResults"
                  name="assessmentResults"
                  value={formData.assessmentResults}
                  onChange={handleInputChange}
                  placeholder="Details about assessment results"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="assistiveDevicesProvided">
                  Assistive Devices Provided
                </Label>
                <Textarea
                  id="assistiveDevicesProvided"
                  name="assistiveDevicesProvided"
                  value={formData.assistiveDevicesProvided}
                  onChange={handleInputChange}
                  placeholder="Details about assistive devices provided"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="therapyServices">Therapy Services</Label>
                <Textarea
                  id="therapyServices"
                  name="therapyServices"
                  value={formData.therapyServices}
                  onChange={handleInputChange}
                  placeholder="Details about therapy services"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="institutionalCare">Institutional Care</Label>
                <Textarea
                  id="institutionalCare"
                  name="institutionalCare"
                  value={formData.institutionalCare || ""}
                  onChange={handleInputChange}
                  placeholder="Details about institutional care support"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="educationalSupport">Educational Support</Label>
                <Textarea
                  id="educationalSupport"
                  name="educationalSupport"
                  value={formData.educationalSupport}
                  onChange={handleInputChange}
                  placeholder="Details about educational support provided"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="vocationalTraining">Vocational Training</Label>
                <Textarea
                  id="vocationalTraining"
                  name="vocationalTraining"
                  value={formData.vocationalTraining}
                  onChange={handleInputChange}
                  placeholder="Details about vocational training"
                />
              </div>
              <div>
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  value={formData.employmentStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      employmentStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="udidCardStatus">UDID Card Status</Label>
                <Select
                  value={formData.udidCardStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, udidCardStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select UDID status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pensionStatus">Pension Status</Label>
                <Select
                  value={formData.pensionStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, pensionStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receiving">Receiving</SelectItem>
                    <SelectItem value="Not Receiving">Not Receiving</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="beneficiaryOfGovernmentSchemes">
                  Beneficiary of Government Schemes
                </Label>
                <Textarea
                  id="beneficiaryOfGovernmentSchemes"
                  name="beneficiaryOfGovernmentSchemes"
                  value={formData.beneficiaryOfGovernmentSchemes}
                  onChange={handleInputChange}
                  placeholder="Details about government schemes"
                  rows={2}
                />
              </div>
            </div>
            <FormSheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Record</Button>
            </FormSheetFooter>
          </form>
        </FormSheetContent>
      </FormSheet>

      {/* Edit and View modals similar to create */}
      <FormSheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <FormSheetContent>
          <FormSheetHeader>
            <FormSheetTitle>Edit PWD Record</FormSheetTitle>
          </FormSheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editHouseholdCode">Household Code *</Label>
                <Input
                  id="editHouseholdCode"
                  name="householdCode"
                  value={formData.householdCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editName">Name *</Label>
                <Input
                  id="editName"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editUniqueId">Unique ID *</Label>
                <Input
                  id="editUniqueId"
                  name="uniqueId"
                  value={formData.uniqueId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editGender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editAge">Age *</Label>
                <Input
                  id="editAge"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editContactNo">Contact Number</Label>
                <Input
                  id="editContactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <Label htmlFor="editHeadOfHousehold">Head of Household *</Label>
                <Input
                  id="editHeadOfHousehold"
                  name="headOfHousehold"
                  value={formData.headOfHousehold}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editWardNo">Ward No *</Label>
                <WardCombobox
                  id="editWardNo"
                  value={formData.wardNo}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, wardNo: value }))
                  }
                  options={wardOptions}
                  placeholder="Select ward"
                />
              </div>
              <div>
                <Label htmlFor="editHabitation">Habitation *</Label>
                <Input
                  id="editHabitation"
                  name="habitation"
                  value={formData.habitation}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editProjectResponsible">
                  Project Responsible *
                </Label>
                <Input
                  id="editProjectResponsible"
                  name="projectResponsible"
                  value={formData.projectResponsible}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDistrict">District *</Label>
                <Input
                  id="editDistrict"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editState">State *</Label>
                <Input
                  id="editState"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State name"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editTypeOfDisability">Disability Type *</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border p-3">
                  {DISABILITY_OPTIONS.map((option) => {
                    const checked = (formData.typeOfDisability || []).includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleDisabilityType(option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="editPercentageOfDisability">
                  Percentage of Disability *
                </Label>
                <Input
                  id="editPercentageOfDisability"
                  name="percentageOfDisability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentageOfDisability}
                  onChange={handleInputChange}
                  placeholder="Enter percentage (1-100)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDisabilityCertificate">
                  Disability Certificate *
                </Label>
                <Select
                  value={formData.disabilityCertificate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      disabilityCertificate: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Certificate status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="In Process">In Process</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDateOfReporting">Date of Reporting *</Label>
                <Input
                  id="editDateOfReporting"
                  name="dateOfReporting"
                  type="date"
                  value={formData.dateOfReporting}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editReportedBy">Reported By *</Label>
                <Input
                  id="editReportedBy"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDateOfAssessment">Date of Assessment</Label>
                <Input
                  id="editDateOfAssessment"
                  name="dateOfAssessment"
                  type="date"
                  value={formData.dateOfAssessment}
                  onChange={handleInputChange}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editAssessmentResults">
                  Assessment Results
                </Label>
                <Textarea
                  id="editAssessmentResults"
                  name="assessmentResults"
                  value={formData.assessmentResults}
                  onChange={handleInputChange}
                  placeholder="Details about assessment results"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editAssistiveDevicesProvided">
                  Assistive Devices Provided
                </Label>
                <Textarea
                  id="editAssistiveDevicesProvided"
                  name="assistiveDevicesProvided"
                  value={formData.assistiveDevicesProvided}
                  onChange={handleInputChange}
                  placeholder="Details about assistive devices provided"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editTherapyServices">Therapy Services</Label>
                <Textarea
                  id="editTherapyServices"
                  name="therapyServices"
                  value={formData.therapyServices}
                  onChange={handleInputChange}
                  placeholder="Details about therapy services"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editInstitutionalCare">Institutional Care</Label>
                <Textarea
                  id="editInstitutionalCare"
                  name="institutionalCare"
                  value={formData.institutionalCare || ""}
                  onChange={handleInputChange}
                  placeholder="Details about institutional care support"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editEducationalSupport">
                  Educational Support
                </Label>
                <Textarea
                  id="editEducationalSupport"
                  name="educationalSupport"
                  value={formData.educationalSupport}
                  onChange={handleInputChange}
                  placeholder="Details about educational support provided"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editVocationalTraining">
                  Vocational Training
                </Label>
                <Textarea
                  id="editVocationalTraining"
                  name="vocationalTraining"
                  value={formData.vocationalTraining}
                  onChange={handleInputChange}
                  placeholder="Details about vocational training"
                />
              </div>
              <div>
                <Label htmlFor="editEmploymentStatus">Employment Status</Label>
                <Select
                  value={formData.employmentStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      employmentStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editUdidCardStatus">UDID Card Status</Label>
                <Select
                  value={formData.udidCardStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, udidCardStatus: value }))
                  }
                >
                  <SelectTrigger id="editUdidCardStatus">
                    <SelectValue placeholder="Select UDID status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPensionStatus">Pension Status</Label>
                <Select
                  value={formData.pensionStatus || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, pensionStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receiving">Receiving</SelectItem>
                    <SelectItem value="Not Receiving">Not Receiving</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="editBeneficiaryOfGovernmentSchemes">
                  Beneficiary of Government Schemes
                </Label>
                <Textarea
                  id="editBeneficiaryOfGovernmentSchemes"
                  name="beneficiaryOfGovernmentSchemes"
                  value={formData.beneficiaryOfGovernmentSchemes}
                  onChange={handleInputChange}
                  placeholder="Details about government schemes"
                  rows={2}
                />
              </div>
            </div>
            <FormSheetFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">Update Record</Button>
            </FormSheetFooter>
          </form>
        </FormSheetContent>
      </FormSheet>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PWD Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Household Code</Label>
                    <p>{selectedRecord.householdCode}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Name</Label>
                    <p>{selectedRecord.name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Unique ID</Label>
                    <p>{selectedRecord.uniqueId}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Gender</Label>
                    <p>{selectedRecord.gender}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Age</Label>
                    <p>{selectedRecord.age}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Contact Number</Label>
                    <p>{selectedRecord.contactNo}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Head of Household</Label>
                    <p>{selectedRecord.headOfHousehold}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Ward No</Label>
                    <p>{formatWard(selectedRecord.wardNo)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Habitation</Label>
                    <p>{selectedRecord.habitation}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Project Responsible</Label>
                    <p>{selectedRecord.projectResponsible}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">District</Label>
                    <p>{selectedRecord.district}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">State</Label>
                    <p>{selectedRecord.state}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Disability Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Type of Disability</Label>
                    <Badge>
                      {Array.isArray(selectedRecord.typeOfDisability)
                        ? selectedRecord.typeOfDisability.join(", ")
                        : selectedRecord.typeOfDisability}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Percentage of Disability
                    </Label>
                    <Badge>{selectedRecord.percentageOfDisability}%</Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Disability Certificate
                    </Label>
                    <div>
                      <StatusBadge value={selectedRecord.disabilityCertificate} />
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">UDID Card Status</Label>
                    <p>{selectedRecord.udidCardStatus || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Reporting Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Date of Reporting</Label>
                    <p>
                      {formatDate(selectedRecord.dateOfReporting, "N/A")}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Reported By</Label>
                    <p>{selectedRecord.reportedBy}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Date of Assessment</Label>
                    <p>
                      {formatDate(selectedRecord.dateOfAssessment, "N/A")}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">Assessment Results</Label>
                    <p>{selectedRecord.assessmentResults || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Support Services</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="font-semibold">
                      Assistive Devices Provided
                    </Label>
                    <p>{selectedRecord.assistiveDevicesProvided || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Therapy Services</Label>
                    <p>{selectedRecord.therapyServices || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Institutional Care
                    </Label>
                    <p>
                      {selectedRecord.institutionalCare ||
                        selectedRecord.rehabilitationServices ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Educational Support</Label>
                    <p>{selectedRecord.educationalSupport || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Vocational Training</Label>
                    <p>{selectedRecord.vocationalTraining || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Employment & Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Employment Status</Label>
                    {selectedRecord.employmentStatus ? (
                      <Badge variant="outline">
                        {selectedRecord.employmentStatus}
                      </Badge>
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                  <div>
                    <Label className="font-semibold">Pension Status</Label>
                    {selectedRecord.pensionStatus ? (
                      <Badge variant="outline">
                        {selectedRecord.pensionStatus}
                      </Badge>
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">
                      Beneficiary of Government Schemes
                    </Label>
                    <p>
                      {selectedRecord.beneficiaryOfGovernmentSchemes || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PWD;




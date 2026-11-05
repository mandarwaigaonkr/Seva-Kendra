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
  Scale,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Phone,
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
import { legalAidServiceAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import legalAidImportTemplate, {
  LEGAL_AID_GENDER,
  LEGAL_AID_ISSUES,
  LEGAL_AID_STATUS,
  LEGAL_AID_PRIORITY,
} from "../lib/excelImport/templates/legalAidService";
import {
  ModulePageHeader,
  tableState,
  StatusBadge,
  formatWard,
  formatDate,
  toDateInput,
} from "../components/module/ModuleKit";

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

const emptyForm = () => ({
  householdCode: "",
  uniqueId: "",
  name: "",
  gender: "",
  age: "",
  contactNo: "",
  headOfHousehold: "",
  wardNo: "",
  habitation: "",
  projectResponsible: "",
  dateOfReporting: "",
  reportedBy: "",
  natureOfIssue: "",
  status: "Pending",
  priority: "Medium",
  actionPlan: "",
  progressReporting: {},
  photoDocumentation: [],
  remarks: "",
  followUpRequired: false,
  followUpDate: "",
});

const LegalAid = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [legalAidServices, setLegalAidServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    caseType: "all",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedService, setSelectedService] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const natureOfIssueOptions = LEGAL_AID_ISSUES;
  const genderOptions = LEGAL_AID_GENDER;
  const statusOptions = LEGAL_AID_STATUS;
  const priorityOptions = LEGAL_AID_PRIORITY;

  const hasFilters =
    Boolean(searchTerm) ||
    filters.status !== "all" ||
    filters.caseType !== "all";

  // Fetch legal aid services
  const fetchLegalAidServices = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      if (filters.status && filters.status !== "all") params.caseStatus = filters.status;
      if (filters.caseType && filters.caseType !== "all") params.caseType = filters.caseType;

      const response = await legalAidServiceAPI.getAll(params);

      // Handle different possible response structures
      const servicesData =
        response.data.legalAidServices ||
        response.data.data ||
        response.data ||
        [];
      const apiPagination = response.data.pagination;
      const paginationData = apiPagination
        ? {
            page: apiPagination.currentPage || apiPagination.page || 1,
            limit: apiPagination.recordsPerPage || apiPagination.limit || 10,
            total:
              apiPagination.totalRecords ||
              apiPagination.total ||
              (Array.isArray(servicesData) ? servicesData.length : 0),
            pages:
              apiPagination.totalPages ||
              apiPagination.pages ||
              Math.ceil(
                (apiPagination.totalRecords ||
                  (Array.isArray(servicesData) ? servicesData.length : 0)) /
                  (apiPagination.recordsPerPage || 10)
              ) ||
              1,
          }
        : {
            page: 1,
            limit: 10,
            total: Array.isArray(servicesData) ? servicesData.length : 0,
            pages: 1,
          };

      setLegalAidServices(Array.isArray(servicesData) ? servicesData : []);
      setPagination(paginationData);
    } catch (error) {
      toast.error("Failed to fetch legal aid services");
      console.error("Error fetching legal aid services:", error);
      setLegalAidServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLegalAidServices();
  }, []);

  // Handle page changes and search/filter changes
  useEffect(() => {
    if (pagination.page !== 1) {
      fetchLegalAidServices();
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchLegalAidServices();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.status, filters.caseType]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gender || !formData.wardNo || !formData.natureOfIssue) {
      toast.error("Please select Gender, Ward and Nature of Issue");
      return;
    }
    try {
      const payload = {
        ...formData,
        age: formData.age === "" ? "" : Number(formData.age),
      };
      if (!payload.contactNo || payload.contactNo.trim() === "") {
        delete payload.contactNo;
      }
      if (!payload.followUpDate) delete payload.followUpDate;

      if (selectedService) {
        await legalAidServiceAPI.update(selectedService._id, payload);
        toast.success("Legal aid service updated successfully");
        setIsEditModalOpen(false);
      } else {
        await legalAidServiceAPI.create(payload);
        toast.success("Legal aid service created successfully");
        setIsCreateModalOpen(false);
      }
      fetchLegalAidServices();
      resetForm();
    } catch (error) {
      toast.error(
        selectedService
          ? "Failed to update legal aid service"
          : "Failed to create legal aid service"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm());
    setSelectedService(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await legalAidServiceAPI.delete(id);
      toast.success("Legal aid service deleted successfully");
      fetchLegalAidServices();
    } catch (error) {
      toast.error("Failed to delete legal aid service");
      console.error("Error deleting legal aid service:", error);
    }
  };

  const openEdit = (service) => {
    setSelectedService(service);
    setFormData({
      householdCode: service.householdCode || "",
      uniqueId: service.uniqueId || "",
      name: service.name || "",
      gender: service.gender || "",
      age: service.age ?? "",
      contactNo: service.contactNo || "",
      headOfHousehold: service.headOfHousehold || "",
      wardNo: service.wardNo || "",
      habitation: service.habitation || "",
      projectResponsible: service.projectResponsible || "",
      dateOfReporting: toDateInput(service.dateOfReporting),
      reportedBy: service.reportedBy || "",
      natureOfIssue: service.natureOfIssue || "",
      status: service.status || "Pending",
      priority: service.priority || "Medium",
      actionPlan: service.actionPlan || "",
      remarks: service.remarks || "",
      followUpRequired: service.followUpRequired || false,
      followUpDate: toDateInput(service.followUpDate),
    });
    setIsEditModalOpen(true);
  };

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const renderSelect = (id, key, options, placeholder) => (
    <Select
      value={formData[key]}
      onValueChange={(value) =>
        setFormData((prev) => ({ ...prev, [key]: value }))
      }
    >
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

  // Shared create / edit fields — mirror legalAidService.model.js
  const renderFormFields = (prefix) => {
    const id = (name) => `${prefix}${name}`;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={id("householdCode")}>Household Code *</Label>
          <Input
            id={id("householdCode")}
            value={formData.householdCode}
            onChange={setField("householdCode")}
            placeholder="Enter household code"
            required
          />
        </div>
        <div>
          <Label htmlFor={id("uniqueId")}>Unique ID *</Label>
          <Input
            id={id("uniqueId")}
            value={formData.uniqueId}
            onChange={setField("uniqueId")}
            placeholder="e.g. LA-001"
            required
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
          {renderSelect(id("gender"), "gender", genderOptions, "Select gender")}
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
          <Label htmlFor={id("natureOfIssue")}>Nature of Issue *</Label>
          {renderSelect(
            id("natureOfIssue"),
            "natureOfIssue",
            natureOfIssueOptions,
            "Select nature of issue"
          )}
        </div>
        <div>
          <Label htmlFor={id("status")}>Case Status</Label>
          {renderSelect(id("status"), "status", statusOptions, "Select status")}
        </div>
        <div>
          <Label htmlFor={id("priority")}>Priority</Label>
          {renderSelect(
            id("priority"),
            "priority",
            priorityOptions,
            "Select priority"
          )}
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
        <div className="flex items-center gap-2 md:col-span-2">
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
          <Label htmlFor={id("followUpRequired")}>
            Follow-up required (date defaults to 7 days ahead if left blank)
          </Label>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={id("actionPlan")}>Action Plan *</Label>
          <Textarea
            id={id("actionPlan")}
            value={formData.actionPlan}
            onChange={setField("actionPlan")}
            placeholder="Enter action plan"
            rows={3}
            required
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
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="legalaid"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={Scale}
          accent="text-purple-600"
          title="Legal Aid Services"
          subtitle="Legal assistance cases: issue, priority, action plan and follow-up"
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
                Add Legal Case
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {canCreate("socialJustice") && (
              <ExcelImportPanel
                template={legalAidImportTemplate}
                createRecord={legalAidServiceAPI.create}
                onImported={fetchLegalAidServices}
              />
            )}

            <GuidelinesCard
              title="Legal Aid Case Guidelines"
              description="Ensure efficient tracking and resolution of legal assistance cases."
              items={[
                "Categorize cases accurately (Property, Family, Domestic Violence, etc.).",
                "Set priority levels based on urgency and legal timelines.",
                "Maintain clear records of action plans and latest case status.",
                "Track follow-up dates to ensure timely legal interventions.",
                "Document all counseling provided and referrals made to legal experts.",
              ]}
            />

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      aria-label="Search cases"
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
                    value={filters.caseType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, caseType: value })
                    }
                  >
                    <SelectTrigger aria-label="Filter by nature of issue">
                      <SelectValue placeholder="Filter by case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Case Types</SelectItem>
                      {natureOfIssueOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Legal Aid Services Table */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Aid Cases ({pagination.total})</CardTitle>
                <CardDescription>
                  Track and manage legal assistance cases and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Case Type</TableHead>
                      <TableHead>Date of Reporting</TableHead>
                      <TableHead>Follow-up</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: legalAidServices.length,
                      colSpan: 7,
                      filtered: hasFilters,
                    }) ||
                      legalAidServices.map((service) => (
                        <TableRow key={service._id}>
                          <TableCell className="font-medium">
                            {service.uniqueId || service.householdCode || "-"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="mr-1 h-3 w-3" />
                                {service.contactNo || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.natureOfIssue}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(service.dateOfReporting, "N/A")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(service.followUpDate, "Not scheduled")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <StatusBadge value={service.status || "Pending"} />
                              {service.priority && (
                                <StatusBadge
                                  value={`${service.priority} priority`}
                                  tone={
                                    service.priority === "Urgent" ||
                                    service.priority === "High"
                                      ? "danger"
                                      : service.priority === "Medium"
                                      ? "warning"
                                      : "neutral"
                                  }
                                  className="text-xs"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`View case ${service.uniqueId || service.name}`}
                                onClick={() => {
                                  setSelectedService(service);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("socialJustice") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Edit case ${service.uniqueId || service.name}`}
                                  onClick={() => openEdit(service)}
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
                                      aria-label={`Delete case ${service.uniqueId || service.name}`}
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
                                        permanently delete the legal aid case.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(service._id)
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
                  <DialogTitle>Add New Legal Case</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new legal aid case
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
                    <Button type="submit">Create Case</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Legal Case</DialogTitle>
                  <DialogDescription>
                    Update the case information
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
                    <Button type="submit">Update Case</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Legal Case Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this legal case
                  </DialogDescription>
                </DialogHeader>
                {selectedService && (
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
                          <p>{selectedService.householdCode}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Unique ID</Label>
                          <p>{selectedService.uniqueId}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Name</Label>
                          <p>{selectedService.name}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Gender</Label>
                          <div>
                            <Badge variant="outline">
                              {selectedService.gender}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">Age</Label>
                          <p>{selectedService.age} years</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Contact Number
                          </Label>
                          <p>{selectedService.contactNo || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Head of Household
                          </Label>
                          <p>{selectedService.headOfHousehold}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedService.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedService.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedService.projectResponsible}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reporting Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Reporting Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Date of Reporting
                          </Label>
                          <p>{formatDate(selectedService.dateOfReporting, "N/A")}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Reported By</Label>
                          <p>{selectedService.reportedBy}</p>
                        </div>
                      </div>
                    </div>

                    {/* Case Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Case Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Nature of Issue
                          </Label>
                          <p>{selectedService.natureOfIssue || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Case Status</Label>
                          <div>
                            <StatusBadge value={selectedService.status} />
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">Priority</Label>
                          <div>
                            <StatusBadge value={selectedService.priority} />
                          </div>
                        </div>
                      </div>
                      {selectedService.actionPlan && (
                        <div>
                          <Label className="font-semibold">Action Plan</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedService.actionPlan}
                          </p>
                        </div>
                      )}
                      {selectedService.remarks && (
                        <div>
                          <Label className="font-semibold">Remarks</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedService.remarks}
                          </p>
                        </div>
                      )}
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
                                selectedService.followUpRequired
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {selectedService.followUpRequired ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                        {selectedService.followUpDate && (
                          <div>
                            <Label className="font-semibold">
                              Follow-up Date
                            </Label>
                            <p>{formatDate(selectedService.followUpDate)}</p>
                          </div>
                        )}
                      </div>
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

export default LegalAid;

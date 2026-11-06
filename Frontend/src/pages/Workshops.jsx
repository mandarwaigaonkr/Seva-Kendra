import { FormSheet, FormSheetContent, FormSheetDescription, FormSheetFooter, FormSheetHeader, FormSheetTitle } from "@/components/module/FormSheet";
import React, { useState, useEffect, useRef } from "react";
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
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
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
import { workshopsAwarenessAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import workshopsImportTemplate, {
  WORKSHOP_GROUP_TYPES,
} from "../lib/excelImport/templates/workshopsAwareness";
import {
  ModulePageHeader,
  tableState,
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

const emptyForm = () => ({
  groupId: "",
  groupName: "",
  groupType: "",
  wardNo: "",
  habitation: "",
  projectResponsible: "",
  topic: "",
  dateOfTraining: "",
  resourcePerson: "",
  profileOfResourcePerson: "",
  agenda: "",
  totalParticipants: "",
  outcome: "",
});

const Workshops = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const groupTypes = WORKSHOP_GROUP_TYPES;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    groupType: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const hasFilters = Boolean(searchTerm) || filters.groupType !== "all";

  // Fetch workshops
  const latestRequest = useRef(0);
  const fetchWorkshops = async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      if (filters.groupType && filters.groupType !== "all") {
        params.groupType = filters.groupType;
      }

      const response = await workshopsAwarenessAPI.getAll(params);
      if (requestId !== latestRequest.current) return; // superseded by a newer request
      // Handle different response structures from backend
      const workshopsData =
        response.data.workshops ||
        response.data.data ||
        (Array.isArray(response.data) ? response.data : []);
      setWorkshops(workshopsData);

      // Handle pagination data - if not provided by API, create default pagination
      if (response.data.pagination) {
        const apiPagination = response.data.pagination;
        setPagination({
          page: apiPagination.currentPage || apiPagination.page || 1,
          limit: apiPagination.recordsPerPage || apiPagination.limit || 10,
          total: apiPagination.totalRecords || apiPagination.total || workshopsData.length,
          pages: apiPagination.totalPages || apiPagination.pages || Math.ceil((apiPagination.totalRecords || workshopsData.length) / (apiPagination.recordsPerPage || 10)) || 1,
        });
      } else {
        setPagination({
          page: 1,
          limit: 10,
          total: workshopsData.length,
          pages: Math.ceil(workshopsData.length / 10) || 1,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch workshops");
      console.error("Error fetching workshops:", error);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  // A new search or filter starts again from page 1.
  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchWorkshops();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupType || !formData.wardNo) {
      toast.error("Please select a Group Type and Ward");
      return;
    }
    try {
      const payload = {
        ...formData,
        totalParticipants:
          formData.totalParticipants === ""
            ? ""
            : Number(formData.totalParticipants),
      };
      if (selectedWorkshop) {
        await workshopsAwarenessAPI.update(selectedWorkshop._id, payload);
        toast.success("Workshop updated successfully");
        setIsEditModalOpen(false);
      } else {
        await workshopsAwarenessAPI.create(payload);
        toast.success("Workshop created successfully");
        setIsCreateModalOpen(false);
      }
      fetchWorkshops();
      resetForm();
    } catch (error) {
      toast.error(
        selectedWorkshop
          ? "Failed to update workshop"
          : "Failed to create workshop"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm());
    setSelectedWorkshop(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await workshopsAwarenessAPI.delete(id);
      toast.success("Workshop deleted successfully");
      fetchWorkshops();
    } catch (error) {
      toast.error("Failed to delete workshop");
      console.error("Error deleting workshop:", error);
    }
  };

  const openEdit = (workshop) => {
    setSelectedWorkshop(workshop);
    setFormData({
      groupId: workshop.groupId || "",
      groupName: workshop.groupName || "",
      groupType: workshop.groupType || "",
      wardNo: workshop.wardNo || "",
      habitation: workshop.habitation || "",
      projectResponsible: workshop.projectResponsible || "",
      topic: workshop.topic || "",
      dateOfTraining: toDateInput(workshop.dateOfTraining),
      resourcePerson: workshop.resourcePerson || "",
      profileOfResourcePerson: workshop.profileOfResourcePerson || "",
      agenda: workshop.agenda || "",
      totalParticipants: workshop.totalParticipants ?? "",
      outcome: workshop.outcome || "",
    });
    setIsEditModalOpen(true);
  };

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  // Shared create / edit fields — mirror workshopsAwareness.model.js (every field is required)
  const renderFormFields = (prefix) => {
    const id = (name) => `${prefix}${name}`;
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={id("groupId")}>Group ID *</Label>
            <Input
              id={id("groupId")}
              value={formData.groupId}
              onChange={setField("groupId")}
              placeholder="e.g. CBO-001"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("groupName")}>Group Name *</Label>
            <Input
              id={id("groupName")}
              value={formData.groupName}
              onChange={setField("groupName")}
              placeholder="Enter group name"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("groupType")}>Group Type *</Label>
            <Select
              value={formData.groupType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, groupType: value }))
              }
            >
              <SelectTrigger id={id("groupType")}>
                <SelectValue placeholder="Select group type" />
              </SelectTrigger>
              <SelectContent>
                {groupTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={id("wardNo")}>Ward No *</Label>
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
            <Label htmlFor={id("topic")}>Topic *</Label>
            <Input
              id={id("topic")}
              value={formData.topic}
              onChange={setField("topic")}
              placeholder="Enter training topic"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("dateOfTraining")}>Date of Training *</Label>
            <Input
              id={id("dateOfTraining")}
              type="date"
              value={formData.dateOfTraining}
              onChange={setField("dateOfTraining")}
              required
            />
          </div>
          <div>
            <Label htmlFor={id("resourcePerson")}>Resource Person *</Label>
            <Input
              id={id("resourcePerson")}
              value={formData.resourcePerson}
              onChange={setField("resourcePerson")}
              placeholder="Enter resource person name"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("profileOfResourcePerson")}>
              Profile of Resource Person *
            </Label>
            <Input
              id={id("profileOfResourcePerson")}
              value={formData.profileOfResourcePerson}
              onChange={setField("profileOfResourcePerson")}
              placeholder="Enter resource person profile"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("totalParticipants")}>
              Total Participants *
            </Label>
            <Input
              id={id("totalParticipants")}
              type="number"
              min="1"
              step="1"
              value={formData.totalParticipants}
              onChange={setField("totalParticipants")}
              placeholder="Enter total participants"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor={id("agenda")}>Agenda *</Label>
          <Textarea
            id={id("agenda")}
            value={formData.agenda}
            onChange={setField("agenda")}
            placeholder="Enter training agenda"
            rows={3}
            required
          />
        </div>

        <div>
          <Label htmlFor={id("outcome")}>Outcome *</Label>
          <Textarea
            id={id("outcome")}
            value={formData.outcome}
            onChange={setField("outcome")}
            placeholder="Enter training outcome"
            rows={3}
            required
          />
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="workshops"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={Users}
          title="Workshops & Awareness"
          subtitle="Trainings and awareness sessions delivered to community groups"
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
                Add Workshop
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6 space-y-6">

            <GuidelinesCard
              title="Workshop & Awareness Guidelines"
              description="Standardize documentation for community outreach and capacity building activities."
              items={[
                "Identify the target group correctly (SHG, Youth, CBUCBO, etc.).",
                "Ensure accurate reporting of the total number of participants.",
                "Document details of resource persons and the training agenda.",
                "Highlight key outcomes and takeaways from the session.",
                "Maintain group-wise records for longitudinal development tracking.",
              ]}
            />

            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workshops..."
                      aria-label="Search workshops"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={filters.groupType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, groupType: value })
                    }
                  >
                    <SelectTrigger aria-label="Filter by group type">
                      <SelectValue placeholder="Filter by group type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Group Types</SelectItem>
                      {groupTypes.map((type) => (
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
                  template={workshopsImportTemplate}
                  createRecord={workshopsAwarenessAPI.create}
                  onImported={fetchWorkshops}
                />
              )}

            {/* Workshops Table */}
            <Card>
              <CardHeader>
                <CardTitle>Workshops ({pagination.total})</CardTitle>
                <CardDescription>
                  Track and manage community workshops and awareness programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Group Type</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Resource Person</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: workshops.length,
                      colSpan: 7,
                      filtered: hasFilters,
                    }) ||
                      workshops.map((workshop) => (
                        <TableRow key={workshop._id}>
                          <TableCell>
                            <div className="font-medium">
                              {workshop.groupName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatWard(workshop.wardNo)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {workshop.groupType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{workshop.topic}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(workshop.dateOfTraining, "TBD")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <User className="mr-1 h-3 w-3" />
                              {workshop.resourcePerson || "TBA"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Users className="mr-1 h-3 w-3" />
                              {workshop.totalParticipants || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`View ${workshop.topic || "workshop"}`}
                                onClick={() => {
                                  setSelectedWorkshop(workshop);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("socialJustice") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Edit ${workshop.topic || "workshop"}`}
                                  onClick={() => openEdit(workshop)}
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
                                      aria-label={`Delete ${workshop.topic || "workshop"}`}
                                      className="text-destructive hover:text-destructive/80"
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
                                        permanently delete the workshop.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(workshop._id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <FormSheet
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Add New Workshop</FormSheetTitle>
                  <FormSheetDescription>
                    Fill in the details to schedule a new workshop or awareness
                    program
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderFormFields("")}
                  <FormSheetFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Workshop</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* Edit Modal */}
            <FormSheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Edit Workshop</FormSheetTitle>
                  <FormSheetDescription>
                    Update the workshop information
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderFormFields("edit-")}
                  <FormSheetFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Workshop</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Workshop Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this workshop
                  </DialogDescription>
                </DialogHeader>
                {selectedWorkshop && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Group ID</Label>
                          <p>{selectedWorkshop.groupId}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Group Name</Label>
                          <p>{selectedWorkshop.groupName}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Group Type</Label>
                          <div>
                            <Badge>{selectedWorkshop.groupType}</Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedWorkshop.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedWorkshop.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedWorkshop.projectResponsible}</p>
                        </div>
                      </div>
                    </div>

                    {/* Workshop Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Workshop Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Topic</Label>
                          <p>{selectedWorkshop.topic}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Date of Training
                          </Label>
                          <p>{formatDate(selectedWorkshop.dateOfTraining, "N/A")}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Resource Person
                          </Label>
                          <p>{selectedWorkshop.resourcePerson}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Total Participants
                          </Label>
                          <p>{selectedWorkshop.totalParticipants}</p>
                        </div>
                      </div>
                      {selectedWorkshop.profileOfResourcePerson && (
                        <div>
                          <Label className="font-semibold">
                            Profile of Resource Person
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedWorkshop.profileOfResourcePerson}
                          </p>
                        </div>
                      )}
                      {selectedWorkshop.agenda && (
                        <div>
                          <Label className="font-semibold">Agenda</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedWorkshop.agenda}
                          </p>
                        </div>
                      )}
                      {selectedWorkshop.outcome && (
                        <div>
                          <Label className="font-semibold">Outcome</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedWorkshop.outcome}
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

export default Workshops;

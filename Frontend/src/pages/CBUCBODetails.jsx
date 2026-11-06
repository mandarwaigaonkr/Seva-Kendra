import { FormSheet, FormSheetContent, FormSheetDescription, FormSheetFooter, FormSheetHeader, FormSheetTitle } from "@/components/module/FormSheet";
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
  Building2,
  Phone,
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
import { cbucboDetailsAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import cbucboImportTemplate, {
  CBUCBO_GROUP_TYPES,
} from "../lib/excelImport/templates/cbucboDetails";
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
  functionalArea: "",
  wardNo: "",
  habitation: "",
  projectResponsible: "",
  dateOfFormation: "",
  totalMembers: "",
  groupLeader: "",
  contactNo: "",
  groupMentor: "",
  listOfCapacityBuildingTrainings: "",
  trainingOutcomes: "",
  actionPlanForGroup: "",
  remarks: "",
  progressReporting: {},
  majorAchievements: "",
  photoDocumentation: {
    before: "",
    intermediate: "",
    after: "",
  },
});

const CBUCBODetails = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const groupTypes = CBUCBO_GROUP_TYPES;
  const today = new Date().toISOString().slice(0, 10);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cbucboDetails, setCbucboDetails] = useState([]);
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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const hasFilters = Boolean(searchTerm) || filters.groupType !== "all";

  // Fetch CBUCBO details
  const fetchCBUCBODetails = async () => {
    setLoading(true);
    try {
      // Remove noop filters like 'all' or empty before calling API
      const sanitizedFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v && v !== "all")
      );

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...sanitizedFilters,
      };

      const response = await cbucboDetailsAPI.getAll(params);

      // Handle response data - backend returns { data: [...], pagination: {...} }
      if (response.data && response.data.data) {
        setCbucboDetails(
          Array.isArray(response.data.data) ? response.data.data : []
        );

        // Map backend pagination format to frontend format
        const backendPagination = response.data.pagination;
        setPagination({
          page: backendPagination.currentPage || backendPagination.page || 1,
          limit:
            backendPagination.recordsPerPage || backendPagination.limit || 10,
          total: backendPagination.totalRecords || backendPagination.total || 0,
          pages: backendPagination.totalPages || backendPagination.pages || 0,
        });
      } else {
        // Fallback for unexpected structure
        const cbucboData = response.data?.cbucboDetails || response.data || [];
        setCbucboDetails(Array.isArray(cbucboData) ? cbucboData : []);
        setPagination({
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          pages: 0,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch CBUCBO details");
      console.error("Error fetching CBUCBO details:", error);
      setCbucboDetails([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchCBUCBODetails();
  }, [pagination.page, pagination.limit]);

  // Refetch when search or filters change
  useEffect(() => {
    // Reset to page 1 when search or filters change
    if (pagination.page !== 1) {
      setPagination({ ...pagination, page: 1 });
    } else {
      fetchCBUCBODetails();
    }
  }, [searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.groupType || !formData.wardNo) {
      toast.error("Please select a Group Type and Ward");
      return;
    }
    try {
      const payload = { ...formData };
      if (!payload.contactNo || payload.contactNo.trim() === "") {
        delete payload.contactNo;
      }
      if (payload.totalMembers !== "") {
        payload.totalMembers = Number(payload.totalMembers);
      }

      if (selectedGroup) {
        await cbucboDetailsAPI.update(selectedGroup._id, payload);
        toast.success("CBUCBO group updated successfully");
        setIsEditModalOpen(false);
      } else {
        await cbucboDetailsAPI.create(payload);
        toast.success("CBUCBO group created successfully");
        setIsCreateModalOpen(false);
      }
      fetchCBUCBODetails();
      resetForm();
    } catch (error) {
      toast.error(
        selectedGroup
          ? "Failed to update CBUCBO group"
          : "Failed to create CBUCBO group"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(emptyForm());
    setSelectedGroup(null);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await cbucboDetailsAPI.delete(id);
      toast.success("CBUCBO group deleted successfully");
      fetchCBUCBODetails();
    } catch (error) {
      toast.error("Failed to delete CBUCBO group");
      console.error("Error deleting CBUCBO group:", error);
    }
  };

  const openEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      groupId: group.groupId || "",
      groupName: group.groupName || "",
      groupType: group.groupType || "",
      functionalArea: group.functionalArea || "",
      wardNo: group.wardNo || "",
      habitation: group.habitation || "",
      projectResponsible: group.projectResponsible || "",
      dateOfFormation: toDateInput(group.dateOfFormation),
      totalMembers: group.totalMembers ?? "",
      groupLeader: group.groupLeader || "",
      contactNo: group.contactNo || "",
      groupMentor: group.groupMentor || "",
      listOfCapacityBuildingTrainings:
        group.listOfCapacityBuildingTrainings || "",
      trainingOutcomes: group.trainingOutcomes || "",
      actionPlanForGroup: group.actionPlanForGroup || "",
      remarks: group.remarks || "",
      progressReporting: group.progressReporting || {},
      majorAchievements: group.majorAchievements || "",
      photoDocumentation: group.photoDocumentation || {
        before: "",
        intermediate: "",
        after: "",
      },
    });
    setIsEditModalOpen(true);
  };

  const setField = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  // Shared create / edit fields — mirror cbucboDetails.model.js
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
            <Label htmlFor={id("functionalArea")}>Functional Area *</Label>
            <Input
              id={id("functionalArea")}
              value={formData.functionalArea}
              onChange={setField("functionalArea")}
              placeholder="Enter functional area"
              required
            />
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
            <Label htmlFor={id("dateOfFormation")}>Date of Formation *</Label>
            <Input
              id={id("dateOfFormation")}
              type="date"
              max={today}
              value={formData.dateOfFormation}
              onChange={setField("dateOfFormation")}
              required
            />
          </div>
          <div>
            <Label htmlFor={id("totalMembers")}>Total Members *</Label>
            <Input
              id={id("totalMembers")}
              type="number"
              min="1"
              step="1"
              value={formData.totalMembers}
              onChange={setField("totalMembers")}
              placeholder="Enter total members"
              required
            />
          </div>
          <div>
            <Label htmlFor={id("groupLeader")}>Group Leader *</Label>
            <Input
              id={id("groupLeader")}
              value={formData.groupLeader}
              onChange={setField("groupLeader")}
              placeholder="Enter group leader name"
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
            <Label htmlFor={id("groupMentor")}>Group Mentor</Label>
            <Input
              id={id("groupMentor")}
              value={formData.groupMentor}
              onChange={setField("groupMentor")}
              placeholder="Enter group mentor"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor={id("listOfCapacityBuildingTrainings")}>
              List of Capacity Building Trainings
            </Label>
            <Textarea
              id={id("listOfCapacityBuildingTrainings")}
              value={formData.listOfCapacityBuildingTrainings}
              onChange={setField("listOfCapacityBuildingTrainings")}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor={id("trainingOutcomes")}>Training Outcomes</Label>
            <Textarea
              id={id("trainingOutcomes")}
              value={formData.trainingOutcomes}
              onChange={setField("trainingOutcomes")}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor={id("actionPlanForGroup")}>
              Action Plan for Group
            </Label>
            <Textarea
              id={id("actionPlanForGroup")}
              value={formData.actionPlanForGroup}
              onChange={setField("actionPlanForGroup")}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor={id("majorAchievements")}>Major Achievements</Label>
            <Textarea
              id={id("majorAchievements")}
              value={formData.majorAchievements}
              onChange={setField("majorAchievements")}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor={id("remarks")}>Remarks</Label>
            <Textarea
              id={id("remarks")}
              value={formData.remarks}
              onChange={setField("remarks")}
              rows={2}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="cbucbo"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={Building2}
          title="CBU/CBO Details"
          subtitle="Community-based groups: membership, leadership and capacity building"
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
                Add CBUCBO Group
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">

            <GuidelinesCard
              title="Community Group Management Guidelines"
              description="Standardize the monitoring and capacity building of local community organizations."
              items={[
                "Specify the correct Group Type (CBUCBO, SHG, Youth Group, etc.) for accurate classification.",
                "Document all capacity building trainings provided with their specific outcomes.",
                "Maintain an updated list of total members and key contact persons (Leader/Mentor).",
                "Ensure the 'Action Plan' field contains clear, time-bound objectives for the group.",
                "Upload photo documentation (Before/Intermediate/After) to track physical progress.",
              ]}
            />

            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search groups..."
                      aria-label="Search groups"
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
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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
                  template={cbucboImportTemplate}
                  createRecord={cbucboDetailsAPI.create}
                  onImported={fetchCBUCBODetails}
                />
              )}

            {/* CBUCBO Groups Table */}
            <Card>
              <CardHeader>
                <CardTitle>CBUCBO Groups ({pagination.total})</CardTitle>
                <CardDescription>
                  Manage and track all Community Based Urban Cluster
                  Organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: cbucboDetails.length,
                      colSpan: 7,
                      filtered: hasFilters,
                    }) ||
                      cbucboDetails.map((group) => (
                        <TableRow key={group._id}>
                          <TableCell className="font-medium">
                            {group.groupId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {group.groupName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatWard(group.wardNo)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{group.groupType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <MapPin className="mr-1 h-3 w-3" />
                              {group.habitation}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Users className="mr-1 h-3 w-3" />
                              {group.totalMembers || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {group.groupLeader}
                              </div>
                              {group.contactNo && (
                                <div className="flex items-center text-muted-foreground">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {group.contactNo}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`View ${group.groupName}`}
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("socialJustice") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Edit ${group.groupName}`}
                                  onClick={() => openEdit(group)}
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
                                      aria-label={`Delete ${group.groupName}`}
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
                                        permanently delete the CBUCBO group.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(group._id)}
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
                  <FormSheetTitle>Add New CBUCBO Group</FormSheetTitle>
                  <FormSheetDescription>
                    Fill in the details to create a new CBUCBO group
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
                    <Button type="submit">Create Group</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* Edit Modal */}
            <FormSheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Edit CBUCBO Group</FormSheetTitle>
                  <FormSheetDescription>
                    Update the group information
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
                    <Button type="submit">Update Group</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>CBUCBO Group Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this group
                  </DialogDescription>
                </DialogHeader>
                {selectedGroup && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Group ID</Label>
                          <p>{selectedGroup.groupId}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Group Name</Label>
                          <p>{selectedGroup.groupName}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Group Type</Label>
                          <div>
                            <Badge>{selectedGroup.groupType}</Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Functional Area
                          </Label>
                          <p>{selectedGroup.functionalArea || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedGroup.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedGroup.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedGroup.projectResponsible}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Date of Formation
                          </Label>
                          <p>{formatDate(selectedGroup.dateOfFormation, "N/A")}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Total Members</Label>
                          <p>{selectedGroup.totalMembers}</p>
                        </div>
                      </div>
                    </div>

                    {/* Leadership */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Leadership
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Group Leader</Label>
                          <p>{selectedGroup.groupLeader}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Contact Number
                          </Label>
                          <p>{selectedGroup.contactNo || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Group Mentor</Label>
                          <p>{selectedGroup.groupMentor || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Building & Plans */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Capacity Building & Plans
                      </h3>
                      {selectedGroup.listOfCapacityBuildingTrainings && (
                        <div>
                          <Label className="font-semibold">
                            List of Capacity Building Trainings
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedGroup.listOfCapacityBuildingTrainings}
                          </p>
                        </div>
                      )}
                      {selectedGroup.trainingOutcomes && (
                        <div>
                          <Label className="font-semibold">
                            Training Outcomes
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedGroup.trainingOutcomes}
                          </p>
                        </div>
                      )}
                      {selectedGroup.actionPlanForGroup && (
                        <div>
                          <Label className="font-semibold">
                            Action Plan for Group
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedGroup.actionPlanForGroup}
                          </p>
                        </div>
                      )}
                      {selectedGroup.majorAchievements && (
                        <div>
                          <Label className="font-semibold">
                            Major Achievements
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedGroup.majorAchievements}
                          </p>
                        </div>
                      )}
                      {selectedGroup.remarks && (
                        <div>
                          <Label className="font-semibold">Remarks</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedGroup.remarks}
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

export default CBUCBODetails;

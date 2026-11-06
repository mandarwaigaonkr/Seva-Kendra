import { FormSheet, FormSheetContent, FormSheetDescription, FormSheetFooter, FormSheetHeader, FormSheetTitle } from "@/components/module/FormSheet";
import React, { useState, useEffect } from "react";
import { normalizePagination } from "@/components/module/ModuleKit";
import { FilterBar } from "@/components/module/ModuleKit";
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
import { TimeRangePicker } from "@/components/ui/time-range-picker";
import {
  School,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { schoolAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import schoolImportTemplate from "../lib/excelImport/templates/school";
import { ModulePageHeader, formatWard, tableState } from "../components/module/ModuleKit";

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

const Schools = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    wardNo: "all",
    educationLevel: "all",
    typeOfStudents: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolCode: "",
    wardNo: "",
    schoolName: "",
    educationLevel: "",
    schoolTimings: "",
    mediumOfInstruction: "",
    typeOfStudents: "",
    totalStudents: "",
    principalName: "",
    principalContact: "",
    projectResponsible: "",
    keyIssueIdentified: "",
    actionPlan: "",
    statusOfActionPlanImplementation: "Planned",
    progressReporting: {},
  });

  // Fetch schools
  const fetchSchools = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...(filters.wardNo !== "all" && { wardNo: filters.wardNo }),
        ...(filters.educationLevel !== "all" && {
          educationLevel: filters.educationLevel,
        }),
        ...(filters.typeOfStudents !== "all" && {
          typeOfStudents: filters.typeOfStudents,
        }),
      };

      const response = await schoolAPI.getAll(params);
      setSchools(response.data.data);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch schools");
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSchool) {
        await schoolAPI.update(selectedSchool._id, formData);
        toast.success("School updated successfully");
        setIsEditModalOpen(false);
      } else {
        await schoolAPI.create(formData);
        toast.success("School created successfully");
        setIsCreateModalOpen(false);
      }

      fetchSchools();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await schoolAPI.delete(id);
      toast.success("School deleted successfully");
      fetchSchools();
    } catch (error) {
      toast.error("Failed to delete school");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      schoolCode: "",
      wardNo: "",
      schoolName: "",
      educationLevel: "",
      schoolTimings: "",
      mediumOfInstruction: "",
      typeOfStudents: "",
      totalStudents: "",
      principalName: "",
      principalContact: "",
      projectResponsible: "",
      keyIssueIdentified: "",
      actionPlan: "",
      statusOfActionPlanImplementation: "Planned",
      progressReporting: {},
    });
    setSelectedSchool(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (school) => {
    setSelectedSchool(school);
    setFormData({
      ...school,
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (school) => {
    setSelectedSchool(school);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="schools"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={School}
          title="Schools"
          subtitle="Partner schools, their key issues and action plans"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("education") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add School
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School Entry Guidelines</CardTitle>
                <CardDescription>
                  Follow these steps to keep school records complete and consistent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Use the official school code and full school name.</li>
                  <li>Select the ward from the searchable ward dropdown.</li>
                  <li>Enter principal contact as a valid 10-digit mobile number.</li>
                  <li>Describe one clear issue and one actionable plan.</li>
                  <li>Keep action plan status aligned to Planned, Ongoing, or Completed.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <Select
                      value={filters.wardNo}
                      onValueChange={(value) =>
                        setFilters({ ...filters, wardNo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {wardOptions.map((ward) => (
                          <SelectItem key={ward.value} value={ward.value}>
                            {ward.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {/* <Select
                      value={filters.educationLevel}
                      onValueChange={(value) =>
                        setFilters({ ...filters, educationLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Education Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Upper Primary">
                          Upper Primary
                        </SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Higher Secondary">
                          Higher Secondary
                        </SelectItem>
                        <SelectItem value="All Levels">All Levels</SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                  <div>
                    {/* <Select
                      value={filters.typeOfStudents}
                      onValueChange={(value) =>
                        setFilters({ ...filters, typeOfStudents: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Boys">Boys</SelectItem>
                        <SelectItem value="Girls">Girls</SelectItem>
                        <SelectItem value="Co-educational">
                          Co-educational
                        </SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                </div>
              </FilterBar>

            {/* Bulk Import */}
            {canCreate("education") && (
              <ExcelImportPanel
                template={schoolImportTemplate}
                createRecord={schoolAPI.create}
                onImported={fetchSchools}
              />
            )}

            {/* Schools Table */}
            <Card>
              <CardHeader>
                <CardTitle>Schools ({pagination.total})</CardTitle>
                <CardDescription>
                  Manage and track all educational institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Code</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Ward No</TableHead>
                      <TableHead>Education Level</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: schools.length,
                      colSpan: 7,
                      filtered:
                        Boolean(searchTerm) ||
                        filters.wardNo !== "all" ||
                        filters.educationLevel !== "all" ||
                        filters.typeOfStudents !== "all",
                    })}
                    {!loading && schools.map((school) => (
                      <TableRow key={school._id}>
                        <TableCell className="font-medium">
                          {school.schoolCode}
                        </TableCell>
                        <TableCell>{school.schoolName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatWard(school.wardNo)}</Badge>
                        </TableCell>
                        <TableCell>{school.educationLevel}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              school.typeOfStudents === "Co-educational"
                                ? "default"
                                : school.typeOfStudents === "Boys"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {school.typeOfStudents}
                          </Badge>
                        </TableCell>
                        <TableCell>{school.totalStudents}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(school)}
                              aria-label="View school"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit("education") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(school)}
                                aria-label="Edit school"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete("education") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" aria-label="Delete school">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the school record.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(school._id)}
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
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        })
                      }
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        })
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Modal */}
            <FormSheet
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Add New School</FormSheetTitle>
                  <FormSheetDescription>
                    Create a new school record with all required information.
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolCode">School Code *</Label>
                      <Input
                        id="schoolCode"
                        value={formData.schoolCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schoolCode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="wardNo">Ward Number *</Label>
                      <WardCombobox
                        id="wardNo"
                        value={formData.wardNo}
                        onChange={(value) =>
                          setFormData({ ...formData, wardNo: value })
                        }
                        options={wardOptions}
                        placeholder="Select ward"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="schoolName">School Name *</Label>
                      <Input
                        id="schoolName"
                        value={formData.schoolName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schoolName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="educationLevel">Education Level *</Label>
                      <Select
                        value={formData.educationLevel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, educationLevel: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="Upper Primary">
                            Upper Primary
                          </SelectItem>
                          <SelectItem value="Secondary">Secondary</SelectItem>
                          <SelectItem value="Higher Secondary">
                            Higher Secondary
                          </SelectItem>
                          <SelectItem value="All Levels">All Levels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="typeOfStudents">Type of Students *</Label>
                      <Select
                        value={formData.typeOfStudents}
                        onValueChange={(value) =>
                          setFormData({ ...formData, typeOfStudents: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boys">Boys</SelectItem>
                          <SelectItem value="Girls">Girls</SelectItem>
                          <SelectItem value="Co-educational">
                            Co-educational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <TimeRangePicker
                        label="School Timings *"
                        id="schoolTimings"
                        value={formData.schoolTimings}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            schoolTimings: value,
                          })
                        }
                        startLabel="Opening Time"
                        endLabel="Closing Time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mediumOfInstruction">
                        Medium of Instruction *
                      </Label>
                      <Input
                        id="mediumOfInstruction"
                        value={formData.mediumOfInstruction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mediumOfInstruction: e.target.value,
                          })
                        }
                        placeholder="e.g., English, Hindi"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalStudents">Total Students *</Label>
                      <Input
                        id="totalStudents"
                        type="number"
                        value={formData.totalStudents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalStudents: e.target.value,
                          })
                        }
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="principalName">Principal Name *</Label>
                      <Input
                        id="principalName"
                        value={formData.principalName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="principalContact">
                        Principal Contact *
                      </Label>
                      <Input
                        id="principalContact"
                        value={formData.principalContact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalContact: e.target.value,
                          })
                        }
                        placeholder="10-digit mobile number"
                        type="tel"
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        title="10-digit mobile number starting with 6-9"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectResponsible">
                        Project Responsible *
                      </Label>
                      <Input
                        id="projectResponsible"
                        value={formData.projectResponsible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectResponsible: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="keyIssueIdentified">
                        Key Issue Identified *
                      </Label>
                      <Textarea
                        id="keyIssueIdentified"
                        value={formData.keyIssueIdentified}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            keyIssueIdentified: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="actionPlan">Action Plan *</Label>
                      <Textarea
                        id="actionPlan"
                        value={formData.actionPlan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            actionPlan: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="statusOfActionPlanImplementation">
                        Status of Action Plan Implementation
                      </Label>
                      <Select
                        value={formData.statusOfActionPlanImplementation}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            statusOfActionPlanImplementation: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <FormSheetFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create School</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* Edit Modal */}
            <FormSheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Edit School</FormSheetTitle>
                  <FormSheetDescription>
                    Update the school information.
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editSchoolCode">School Code *</Label>
                      <Input
                        id="editSchoolCode"
                        value={formData.schoolCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schoolCode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWardNo">Ward Number *</Label>
                      <WardCombobox
                        id="editWardNo"
                        value={formData.wardNo}
                        onChange={(value) =>
                          setFormData({ ...formData, wardNo: value })
                        }
                        options={wardOptions}
                        placeholder="Select ward"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="editSchoolName">School Name *</Label>
                      <Input
                        id="editSchoolName"
                        value={formData.schoolName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schoolName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editEducationLevel">
                        Education Level *
                      </Label>
                      <Select
                        value={formData.educationLevel}
                        onValueChange={(value) =>
                          setFormData({ ...formData, educationLevel: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="Upper Primary">
                            Upper Primary
                          </SelectItem>
                          <SelectItem value="Secondary">Secondary</SelectItem>
                          <SelectItem value="Higher Secondary">
                            Higher Secondary
                          </SelectItem>
                          <SelectItem value="All Levels">All Levels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editTypeOfStudents">
                        Type of Students *
                      </Label>
                      <Select
                        value={formData.typeOfStudents}
                        onValueChange={(value) =>
                          setFormData({ ...formData, typeOfStudents: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boys">Boys</SelectItem>
                          <SelectItem value="Girls">Girls</SelectItem>
                          <SelectItem value="Co-educational">
                            Co-educational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <TimeRangePicker
                        label="School Timings *"
                        id="editSchoolTimings"
                        value={formData.schoolTimings}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            schoolTimings: value,
                          })
                        }
                        startLabel="Opening Time"
                        endLabel="Closing Time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editMediumOfInstruction">
                        Medium of Instruction *
                      </Label>
                      <Input
                        id="editMediumOfInstruction"
                        value={formData.mediumOfInstruction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mediumOfInstruction: e.target.value,
                          })
                        }
                        placeholder="e.g., English, Hindi"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editTotalStudents">
                        Total Students *
                      </Label>
                      <Input
                        id="editTotalStudents"
                        type="number"
                        value={formData.totalStudents}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalStudents: e.target.value,
                          })
                        }
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editPrincipalName">
                        Principal Name *
                      </Label>
                      <Input
                        id="editPrincipalName"
                        value={formData.principalName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editPrincipalContact">
                        Principal Contact *
                      </Label>
                      <Input
                        id="editPrincipalContact"
                        value={formData.principalContact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalContact: e.target.value,
                          })
                        }
                        placeholder="10-digit mobile number"
                        type="tel"
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        title="10-digit mobile number starting with 6-9"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editProjectResponsible">
                        Project Responsible *
                      </Label>
                      <Input
                        id="editProjectResponsible"
                        value={formData.projectResponsible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectResponsible: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="editKeyIssueIdentified">
                        Key Issue Identified *
                      </Label>
                      <Textarea
                        id="editKeyIssueIdentified"
                        value={formData.keyIssueIdentified}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            keyIssueIdentified: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="editActionPlan">Action Plan *</Label>
                      <Textarea
                        id="editActionPlan"
                        value={formData.actionPlan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            actionPlan: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editStatusOfActionPlanImplementation">
                        Status of Action Plan Implementation
                      </Label>
                      <Select
                        value={formData.statusOfActionPlanImplementation}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            statusOfActionPlanImplementation: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <FormSheetFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Update School</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>School Details</DialogTitle>
                  <DialogDescription>
                    View complete information about this school.
                  </DialogDescription>
                </DialogHeader>
                {selectedSchool && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>School Code</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.schoolCode}
                        </p>
                      </div>
                      <div>
                        <Label>Ward Number</Label>
                        <p className="text-sm font-medium">
                          {formatWard(selectedSchool.wardNo)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label>School Name</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.schoolName}
                        </p>
                      </div>
                      <div>
                        <Label>Education Level</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.educationLevel}
                        </p>
                      </div>
                      <div>
                        <Label>Type of Students</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.typeOfStudents}
                        </p>
                      </div>
                      <div>
                        <Label>School Timings</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.schoolTimings}
                        </p>
                      </div>
                      <div>
                        <Label>Medium of Instruction</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.mediumOfInstruction}
                        </p>
                      </div>
                      <div>
                        <Label>Total Students</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.totalStudents}
                        </p>
                      </div>
                      <div>
                        <Label>Principal Name</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.principalName}
                        </p>
                      </div>
                      <div>
                        <Label>Principal Contact</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.principalContact}
                        </p>
                      </div>
                      <div>
                        <Label>Project Responsible</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.projectResponsible}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Key Issue Identified</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.keyIssueIdentified}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Action Plan</Label>
                        <p className="text-sm font-medium">
                          {selectedSchool.actionPlan}
                        </p>
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

export default Schools;




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
import {
  GraduationCap,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Menu,
  FileSpreadsheet,
} from "lucide-react";
import { boardPreparationAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import { ModulePageHeader, StatusBadge, formatDate, formatWard, tableState, toDateInput } from "../components/module/ModuleKit";
import boardPreparationImportTemplate from "../lib/excelImport/templates/boardPreparation";

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

const BoardPreparation = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [boardPreps, setBoardPreps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    wardNo: "all",
    educationalStandard: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedBoardPrep, setSelectedBoardPrep] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    householdCode: "",
    name: "",
    gender: "",
    age: "",
    contactNo: "",
    headOfHousehold: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    category: "",
    educationalStandard: "",
    educationBoard: "WBBSE",
    educationBoardOther: "",
    status: "Preparing",
    dateOfReporting: "",
    reportedBy: "",
    dateOfEducationalAssessment: "",
    educationalScreeningResults: "",
    dateOfCareerCounselling: "",
    counselingReport: "",
    individualCarePlan: "",
    progressReporting: {},
  });

  // Fetch board preparations
  const fetchBoardPreps = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...(filters.wardNo !== "all" && { wardNo: filters.wardNo }),
        ...(filters.educationalStandard !== "all" && {
          educationalStandard: filters.educationalStandard,
        }),
        ...(filters.status !== "all" && { status: filters.status }),
      };

      const response = await boardPreparationAPI.getAll(params);
      setBoardPreps(response.data.data);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch board preparation records");
      console.error("Error fetching board preparation records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardPreps();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBoardPrep) {
        await boardPreparationAPI.update(selectedBoardPrep._id, formData);
        toast.success("Board preparation record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await boardPreparationAPI.create(formData);
        toast.success("Board preparation record created successfully");
        setIsCreateModalOpen(false);
      }

      fetchBoardPreps();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await boardPreparationAPI.delete(id);
      toast.success("Board preparation record deleted successfully");
      fetchBoardPreps();
    } catch (error) {
      toast.error("Failed to delete board preparation record");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      householdCode: "",
      name: "",
      gender: "",
      age: "",
      contactNo: "",
      headOfHousehold: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      category: "",
      educationalStandard: "",
      educationBoard: "WBBSE",
      educationBoardOther: "",
      status: "Preparing",
      dateOfReporting: "",
      reportedBy: "",
      dateOfEducationalAssessment: "",
      educationalScreeningResults: "",
      dateOfCareerCounselling: "",
      counselingReport: "",
      individualCarePlan: "",
      progressReporting: {},
    });
    setSelectedBoardPrep(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (boardPrep) => {
    setSelectedBoardPrep(boardPrep);
    setFormData({
      ...boardPrep,
      educationBoard: boardPrep.educationBoard || "WBBSE",
      educationBoardOther: boardPrep.educationBoardOther || "",
      dateOfReporting: toDateInput(boardPrep.dateOfReporting),
      dateOfEducationalAssessment: toDateInput(boardPrep.dateOfEducationalAssessment),
      dateOfCareerCounselling: toDateInput(boardPrep.dateOfCareerCounselling),
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (boardPrep) => {
    setSelectedBoardPrep(boardPrep);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="board-preparation"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={GraduationCap}
          title="Board Preparation"
          subtitle="Students preparing for Class 10 / 12 board exams"
          onToggleSidebar={() => setSidebarOpen(true)}
          actions={
            canCreate("education") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add record
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 sm:p-6 space-y-6">

            <GuidelinesCard
              title="Board Exam Preparation Guidelines"
              description="Support students in their transition through critical educational milestones."
              items={[
                "Specify the education board (WBBSE, CBSE, etc.) and standard correctly.",
                "Track current preparation status (Preparing, Appeared, Passed).",
                "Document counseling results and individual career guidance provided.",
                "Monitor assessment scores and areas needing academic support.",
                "Capture contact details for regular follow-ups on exam progress.",
              ]}
            />

            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
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
                      value={filters.educationalStandard}
                      onValueChange={(value) =>
                        setFilters({ ...filters, educationalStandard: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Standard" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Standards</SelectItem>
                        <SelectItem value="Class 10">Class 10</SelectItem>
                        <SelectItem value="Class 12">Class 12</SelectItem>
                        <SelectItem value="Graduation">Graduation</SelectItem>
                        <SelectItem value="Post Graduation">
                          Post Graduation
                        </SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                  <div>
                    {/* <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Preparing">Preparing</SelectItem>
                        <SelectItem value="Appeared">Appeared</SelectItem>
                        <SelectItem value="Passed">Passed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Discontinued">
                          Discontinued
                        </SelectItem>
                      </SelectContent>
                    </Select> */}
                  </div>
                </div>
              </FilterBar>

            {/* Bulk Import */}
            {canCreate("education") && (
              <ExcelImportPanel
                template={boardPreparationImportTemplate}
                createRecord={boardPreparationAPI.create}
                onImported={fetchBoardPreps}
                className="mb-0"
              />
            )}

            {/* Board Preparation Table */}
            <Card>
              <CardHeader>
                <CardTitle>Board Preparation ({pagination.total})</CardTitle>
                <CardDescription>
                  Manage and track all board exam preparation records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Household Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Educational Standard</TableHead>
                        <TableHead>Board</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableState({
                        loading,
                        count: boardPreps.length,
                        colSpan: 8,
                        filtered:
                          Boolean(searchTerm) ||
                          Object.values(filters).some((v) => v && v !== "all"),
                      })}
                      {!loading && boardPreps.map((boardPrep) => (
                        <TableRow key={boardPrep._id}>
                          <TableCell className="font-medium">
                            {boardPrep.householdCode}
                          </TableCell>
                          <TableCell>{boardPrep.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {boardPrep.gender}
                            </Badge>
                          </TableCell>
                          <TableCell>{boardPrep.age}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {boardPrep.educationalStandard}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {boardPrep.educationBoard === "Other"
                                ? boardPrep.educationBoardOther || "Other"
                                : boardPrep.educationBoard || "WBBSE"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              value={boardPrep.status}
                              tone={
                                boardPrep.status === "Passed"
                                  ? "success"
                                  : boardPrep.status === "Appeared"
                                  ? "info"
                                  : boardPrep.status === "Preparing"
                                  ? "warning"
                                  : "danger"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(boardPrep)}
                                aria-label={`View ${boardPrep.name}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("education") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(boardPrep)}
                                  aria-label={`Edit ${boardPrep.name}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("education") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" aria-label={`Delete ${boardPrep.name}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete {boardPrep.name}'s record?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This permanently deletes the board preparation
                                        record for household {boardPrep.householdCode}.
                                        It can't be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Keep record
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(boardPrep._id)
                                        }
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                      >
                                        Delete record
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
                {pagination.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 py-4">
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
                  <DialogTitle>Add New Board Prep Record</DialogTitle>
                  <DialogDescription>
                    Create a new board preparation record with all required
                    information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="householdCode">Household Code *</Label>
                      <Input
                        id="householdCode"
                        value={formData.householdCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            householdCode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData({ ...formData, gender: value })
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
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        min="0"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactNo">Contact Number</Label>
                      <Input
                        id="contactNo"
                        value={formData.contactNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactNo: e.target.value,
                          })
                        }
                        placeholder="10-digit mobile number"
                        pattern="[6-9][0-9]{9}"
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
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="ST">ST</SelectItem>
                          <SelectItem value="OBC">OBC</SelectItem>
                          <SelectItem value="Muslim">Muslim</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="educationalStandard">
                        Educational Standard
                      </Label>
                      <Select
                        value={formData.educationalStandard}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            educationalStandard: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select standard" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Class 10">Class 10</SelectItem>
                          <SelectItem value="Class 12">Class 12</SelectItem>
                          <SelectItem value="Graduation">Graduation</SelectItem>
                          <SelectItem value="Post Graduation">
                            Post Graduation
                          </SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="educationBoard">Education Board *</Label>
                      <Select
                        value={formData.educationBoard}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            educationBoard: value,
                          })
                        }
                      >
                        <SelectTrigger id="educationBoard">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WBBSE">WBBSE</SelectItem>
                          <SelectItem value="CBSE">CBSE</SelectItem>
                          <SelectItem value="ICSE">ICSE</SelectItem>
                          <SelectItem value="NIOS">NIOS</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.educationBoard === "Other" && (
                      <div>
                        <Label htmlFor="educationBoardOther">Other Board</Label>
                        <Input
                          id="educationBoardOther"
                          value={formData.educationBoardOther}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              educationBoardOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="Appeared">Appeared</SelectItem>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                          <SelectItem value="Discontinued">
                            Discontinued
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfReporting">
                        Date of Reporting
                      </Label>
                      <Input
                        id="dateOfReporting"
                        type="date"
                        value={formData.dateOfReporting}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfReporting: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="reportedBy">Reported By</Label>
                      <Input
                        id="reportedBy"
                        value={formData.reportedBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reportedBy: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="headOfHousehold">
                        Head of Household
                      </Label>
                      <Input
                        id="headOfHousehold"
                        value={formData.headOfHousehold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            headOfHousehold: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="habitation">Habitation</Label>
                      <Input
                        id="habitation"
                        value={formData.habitation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            habitation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
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
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Board Prep Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Board Prep Record</DialogTitle>
                  <DialogDescription>
                    Update the board preparation record information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editHouseholdCode">
                        Household Code *
                      </Label>
                      <Input
                        id="editHouseholdCode"
                        value={formData.householdCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            householdCode: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editName">Name *</Label>
                      <Input
                        id="editName"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editGender">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData({ ...formData, gender: value })
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
                      <Label htmlFor="editAge">Age</Label>
                      <Input
                        id="editAge"
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        min="0"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editContactNo">Contact Number</Label>
                      <Input
                        id="editContactNo"
                        value={formData.contactNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactNo: e.target.value,
                          })
                        }
                        placeholder="10-digit mobile number"
                        pattern="[6-9][0-9]{9}"
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
                    <div>
                      <Label htmlFor="editCategory">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger id="editCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="ST">ST</SelectItem>
                          <SelectItem value="OBC">OBC</SelectItem>
                          <SelectItem value="Muslim">Muslim</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editEducationalStandard">
                        Educational Standard
                      </Label>
                      <Select
                        value={formData.educationalStandard}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            educationalStandard: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select standard" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Class 10">Class 10</SelectItem>
                          <SelectItem value="Class 12">Class 12</SelectItem>
                          <SelectItem value="Graduation">Graduation</SelectItem>
                          <SelectItem value="Post Graduation">
                            Post Graduation
                          </SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editEducationBoard">Education Board *</Label>
                      <Select
                        value={formData.educationBoard}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            educationBoard: value,
                          })
                        }
                      >
                        <SelectTrigger id="editEducationBoard">
                          <SelectValue placeholder="Select board" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WBBSE">WBBSE</SelectItem>
                          <SelectItem value="CBSE">CBSE</SelectItem>
                          <SelectItem value="ICSE">ICSE</SelectItem>
                          <SelectItem value="NIOS">NIOS</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.educationBoard === "Other" && (
                      <div>
                        <Label htmlFor="editEducationBoardOther">Other Board</Label>
                        <Input
                          id="editEducationBoardOther"
                          value={formData.educationBoardOther}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              educationBoardOther: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="editStatus">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="Appeared">Appeared</SelectItem>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                          <SelectItem value="Discontinued">
                            Discontinued
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editDateOfReporting">
                        Date of Reporting
                      </Label>
                      <Input
                        id="editDateOfReporting"
                        type="date"
                        value={formData.dateOfReporting}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfReporting: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editReportedBy">Reported By</Label>
                      <Input
                        id="editReportedBy"
                        value={formData.reportedBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reportedBy: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="editHeadOfHousehold">
                        Head of Household
                      </Label>
                      <Input
                        id="editHeadOfHousehold"
                        value={formData.headOfHousehold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            headOfHousehold: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="editHabitation">Habitation</Label>
                      <Input
                        id="editHabitation"
                        value={formData.habitation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            habitation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
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
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Board Prep Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Board Prep Record Details</DialogTitle>
                  <DialogDescription>
                    View complete information about this board preparation
                    record.
                  </DialogDescription>
                </DialogHeader>
                {selectedBoardPrep && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Household Code</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.householdCode}
                        </p>
                      </div>
                      <div>
                        <Label>Name</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.name}
                        </p>
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.gender}
                        </p>
                      </div>
                      <div>
                        <Label>Age</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.age}
                        </p>
                      </div>
                      <div>
                        <Label>Educational Standard</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.educationalStandard}
                        </p>
                      </div>
                      <div>
                        <Label>Education Board</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.educationBoard === "Other"
                            ? selectedBoardPrep.educationBoardOther || "Other"
                            : selectedBoardPrep.educationBoard || "WBBSE"}
                        </p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.status}
                        </p>
                      </div>
                      <div>
                        <Label>Contact Number</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.contactNo}
                        </p>
                      </div>
                      <div>
                        <Label>Ward Number</Label>
                        <p className="text-sm font-medium">
                          {formatWard(selectedBoardPrep.wardNo)}
                        </p>
                      </div>
                      <div>
                        <Label>Head of Household</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.headOfHousehold}
                        </p>
                      </div>
                      <div>
                        <Label>Habitation</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.habitation}
                        </p>
                      </div>
                      <div>
                        <Label>Project Responsible</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.projectResponsible}
                        </p>
                      </div>
                      <div>
                        <Label>Reported By</Label>
                        <p className="text-sm font-medium">
                          {selectedBoardPrep.reportedBy}
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

export default BoardPreparation;




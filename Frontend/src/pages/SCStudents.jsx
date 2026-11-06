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
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
} from "lucide-react";
import { scStudentAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import scStudentImportTemplate, {
  CLASS_GRADES,
} from "../lib/excelImport/templates/scStudent";
import {
  ModulePageHeader,
  tableState,
  StatusBadge,
  formatWard,
  formatDate,
  toDateInput,
} from "../components/module/ModuleKit";

// Mongoose rejects "" for enum / ObjectId fields: drop blanks on create, clear them on update.
const toApiPayload = (data, isUpdate) =>
  Object.fromEntries(
    Object.entries(data).flatMap(([key, value]) =>
      value === "" ? (isUpdate ? [[key, null]] : []) : [[key, value]]
    )
  );

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

const SCStudents = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scStudents, setScStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, schoolGoing: 0, dropouts: 0, attendees: 0 });
  const [filterOptions, setFilterOptions] = useState({
    studentStatuses: [],
    wardNumbers: [],
    genders: [],
    projectResponsibles: []
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    householdCode: "",
    name: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    classGrade: "",
    studentStatus: "",
    schoolName: "",
    contactNo: "",
    headOfHousehold: "",
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    category: "",
    dateOfReporting: "",
    reportedBy: "",
    natureOfIssue: "",
    dateOfEducationalAssessment: "",
    educationalScreeningResults: "",
    dateOfCareerCounselling: "",
    counselingReport: "",
    individualCarePlan: "",
    progressReporting: {},
    photoDocumentation: {},
  });

  const isValidMobileNumber = (value) => /^[6-9]\d{9}$/.test(value);

  // Fetch SC students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        studentStatus: statusFilter === "all" ? "" : statusFilter,
        wardNo: wardFilter === "all" ? "" : wardFilter,
      };

      const response = await scStudentAPI.getAll(params);
      setScStudents(response.data.data);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch SC students");
      console.error("Error fetching SC students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndOptions = async () => {
    try {
      const [statsRes, optionsRes] = await Promise.all([
        scStudentAPI.getStats(),
        scStudentAPI.getFilterOptions()
      ]);

      const statsData = statsRes.data.data;
      const byStatus = statsData.byStatus || [];

      setStats(prev => ({
        ...prev,
        total: statsData.total || 0,
        schoolGoing: byStatus.find(s => s._id === "School-Going")?.count || 0,
        dropouts: byStatus.find(s => s._id === "Dropout")?.count || 0,
        attendees: byStatus.find(s => s._id === "Study Centre Attendee")?.count || 0,
      }));

      setFilterOptions(optionsRes.data.data);
    } catch (error) {
      console.error("Error fetching student stats/options:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, wardFilter]);

  useEffect(() => {
    fetchStatsAndOptions();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.householdCode?.trim()) {
        toast.error("Household code is required");
        return;
      }

      if (!formData.name?.trim()) {
        toast.error("Name is required");
        return;
      }

      if (!formData.wardNo?.trim()) {
        toast.error("Ward number is required");
        return;
      }

      if (!formData.projectResponsible?.trim()) {
        toast.error("Project responsible is required");
        return;
      }

      if (formData.contactNo && !isValidMobileNumber(formData.contactNo)) {
        toast.error("Contact number must be a valid 10-digit mobile number");
        return;
      }

      if (formData.age && (Number(formData.age) < 0 || Number(formData.age) > 120)) {
        toast.error("Age must be between 0 and 120");
        return;
      }

      if (selectedStudent) {
        await scStudentAPI.update(
          selectedStudent._id,
          toApiPayload(formData, true)
        );
        toast.success("SC student updated successfully");
        setIsEditModalOpen(false);
      } else {
        await scStudentAPI.create(toApiPayload(formData, false));
        toast.success("SC student created successfully");
        setIsCreateModalOpen(false);
      }

      fetchStudents();
      resetForm();
    } catch (error) {
      toast.error(error?.message || "An error occurred");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await scStudentAPI.delete(id);
      toast.success("SC student deleted successfully");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to delete SC student");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      householdCode: "",
      name: "",
      gender: "",
      dateOfBirth: "",
      age: "",
      classGrade: "",
      studentStatus: "",
      schoolName: "",
      contactNo: "",
      headOfHousehold: "",
      fatherName: "",
      motherName: "",
      fatherOccupation: "",
      motherOccupation: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      category: "",
      dateOfReporting: "",
      reportedBy: "",
      natureOfIssue: "",
      dateOfEducationalAssessment: "",
      educationalScreeningResults: "",
      dateOfCareerCounselling: "",
      counselingReport: "",
      individualCarePlan: "",
      progressReporting: {},
      photoDocumentation: {},
    });
    setSelectedStudent(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      ...student,
      dateOfBirth: toDateInput(student.dateOfBirth),
      dateOfReporting: toDateInput(student.dateOfReporting),
      dateOfEducationalAssessment: toDateInput(
        student.dateOfEducationalAssessment
      ),
      dateOfCareerCounselling: toDateInput(student.dateOfCareerCounselling),
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="sc-students"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={GraduationCap}
          title={`SC Students (${pagination.total})`}
          subtitle="Track schooling, assessments and counselling of SC students"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("education") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add SC Student
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <GuidelinesCard
              title="SC Student Data Guidelines"
              description="Monitor the educational progress and welfare of SC students effectively."
              items={[
                "Verify student's current enrollment status (School-going/Dropout).",
                "Capture family background and occupational details accurately.",
                "Track results of medical, psychological, and educational assessments.",
                "Document individual care plans and counseling session reports.",
                "Maintain up-to-date documentation of academic progress and challenges.",
              ]}
            />


            {/* Search and Filters */}
            <FilterBar>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search SC students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => setStatusFilter(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {filterOptions.studentStatuses?.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={wardFilter}
                      onValueChange={(val) => setWardFilter(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {filterOptions.wardNumbers?.map((ward) => (
                          <SelectItem key={ward} value={ward}>
                            {formatWard(ward)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FilterBar>

            {/* Bulk Import Card */}
            {canCreate("education") && (
              <ExcelImportPanel
                template={scStudentImportTemplate}
                createRecord={scStudentAPI.create}
                onImported={fetchStudents}
              />
            )}

            {/* SC Students Table */}
            <Card>
              <CardHeader>
                <CardTitle>SC Students ({pagination.total})</CardTitle>
                <CardDescription>
                  Manage and track all SC student information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Household Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Ward No</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Class/Grade</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableState({
                        loading,
                        count: scStudents.length,
                        colSpan: 9,
                        filtered:
                          Boolean(searchTerm) ||
                          statusFilter !== "all" ||
                          wardFilter !== "all",
                      })}
                      {!loading && scStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">
                            {student.householdCode}
                          </TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>
                            {student.gender ? (
                              <Badge variant="secondary">{student.gender}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{student.age}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatWard(student.wardNo)}</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={student.studentStatus} />
                          </TableCell>
                          <TableCell>{student.classGrade || "-"}</TableCell>
                          <TableCell>{student.contactNo}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(student)}
                                aria-label={`View ${student.name}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("education") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(student)}
                                  aria-label={`Edit ${student.name}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("education") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label={`Delete ${student.name}`}
                                    >
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
                                        permanently delete the SC student record.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(student._id)}
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
                  <FormSheetTitle>Add New SC Student</FormSheetTitle>
                  <FormSheetDescription>
                    Create a new SC student record with all required
                    information.
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boy">Boy</SelectItem>
                          <SelectItem value="Girl">Girl</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                        }
                      />
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="classGrade">Class/Grade</Label>
                      <Select
                        value={formData.classGrade || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            classGrade: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger id="classGrade">
                          <SelectValue placeholder="Select class/grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {CLASS_GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="studentStatus">Status</Label>
                      <Select
                        value={formData.studentStatus || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            studentStatus: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger id="studentStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          <SelectItem value="Dropout">Dropout</SelectItem>
                          <SelectItem value="School-Going">School-Going</SelectItem>
                          <SelectItem value="Study Centre Attendee">
                            Study Centre Attendee
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input
                        id="schoolName"
                        value={formData.schoolName}
                        onChange={(e) =>
                          setFormData({ ...formData, schoolName: e.target.value })
                        }
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
                      />
                    </div>
                    <div>
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
                    <div>
                      <Label htmlFor="fatherName">Father Name</Label>
                      <Input
                        id="fatherName"
                        value={formData.fatherName}
                        onChange={(e) =>
                          setFormData({ ...formData, fatherName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="fatherOccupation">Father Occupation</Label>
                      <Input
                        id="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fatherOccupation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="motherName">Mother Name</Label>
                      <Input
                        id="motherName"
                        value={formData.motherName}
                        onChange={(e) =>
                          setFormData({ ...formData, motherName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="motherOccupation">Mother Occupation</Label>
                      <Input
                        id="motherOccupation"
                        value={formData.motherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motherOccupation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="wardNo">Ward No *</Label>
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
                    <div className="sm:col-span-2">
                      <Label htmlFor="natureOfIssue">Nature of Issue</Label>
                      <Textarea
                        id="natureOfIssue"
                        value={formData.natureOfIssue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            natureOfIssue: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfEducationalAssessment">
                        Date of Educational Assessment
                      </Label>
                      <Input
                        id="dateOfEducationalAssessment"
                        type="date"
                        value={formData.dateOfEducationalAssessment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfEducationalAssessment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="educationalScreeningResults">
                        Educational Screening Results
                      </Label>
                      <Input
                        id="educationalScreeningResults"
                        value={formData.educationalScreeningResults}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            educationalScreeningResults: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfCareerCounselling">
                        Date of Career Counselling
                      </Label>
                      <Input
                        id="dateOfCareerCounselling"
                        type="date"
                        value={formData.dateOfCareerCounselling}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfCareerCounselling: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="counselingReport">Counseling Report</Label>
                      <Input
                        id="counselingReport"
                        value={formData.counselingReport}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            counselingReport: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="individualCarePlan">Individual Care Plan</Label>
                      <Textarea
                        id="individualCarePlan"
                        value={formData.individualCarePlan || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            individualCarePlan: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <FormSheetFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create SC Student</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* Edit Modal - Similar structure to create modal */}
            <FormSheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <FormSheetContent>
                <FormSheetHeader>
                  <FormSheetTitle>Edit SC Student</FormSheetTitle>
                  <FormSheetDescription>
                    Update the SC student information.
                  </FormSheetDescription>
                </FormSheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <SelectTrigger id="editGender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boy">Boy</SelectItem>
                          <SelectItem value="Girl">Girl</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editDateOfBirth">Date of Birth</Label>
                      <Input
                        id="editDateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                        }
                      />
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="editClassGrade">Class/Grade</Label>
                      <Select
                        value={formData.classGrade || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            classGrade: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger id="editClassGrade">
                          <SelectValue placeholder="Select class/grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {CLASS_GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editStudentStatus">Status</Label>
                      <Select
                        value={formData.studentStatus || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            studentStatus: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger id="editStudentStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          <SelectItem value="Dropout">Dropout</SelectItem>
                          <SelectItem value="School-Going">School-Going</SelectItem>
                          <SelectItem value="Study Centre Attendee">
                            Study Centre Attendee
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editSchoolName">School Name</Label>
                      <Input
                        id="editSchoolName"
                        value={formData.schoolName}
                        onChange={(e) =>
                          setFormData({ ...formData, schoolName: e.target.value })
                        }
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
                      />
                    </div>
                    <div>
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
                    <div>
                      <Label htmlFor="editFatherName">Father Name</Label>
                      <Input
                        id="editFatherName"
                        value={formData.fatherName}
                        onChange={(e) =>
                          setFormData({ ...formData, fatherName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editFatherOccupation">
                        Father Occupation
                      </Label>
                      <Input
                        id="editFatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fatherOccupation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editMotherName">Mother Name</Label>
                      <Input
                        id="editMotherName"
                        value={formData.motherName}
                        onChange={(e) =>
                          setFormData({ ...formData, motherName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editMotherOccupation">
                        Mother Occupation
                      </Label>
                      <Input
                        id="editMotherOccupation"
                        value={formData.motherOccupation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motherOccupation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editWardNo">Ward No *</Label>
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
                    <div className="sm:col-span-2">
                      <Label htmlFor="editNatureOfIssue">
                        Nature of Issue
                      </Label>
                      <Textarea
                        id="editNatureOfIssue"
                        value={formData.natureOfIssue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            natureOfIssue: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editDateOfEducationalAssessment">
                        Date of Educational Assessment
                      </Label>
                      <Input
                        id="editDateOfEducationalAssessment"
                        type="date"
                        value={formData.dateOfEducationalAssessment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfEducationalAssessment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editEducationalScreeningResults">
                        Educational Screening Results
                      </Label>
                      <Input
                        id="editEducationalScreeningResults"
                        value={formData.educationalScreeningResults}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            educationalScreeningResults: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editDateOfCareerCounselling">
                        Date of Career Counselling
                      </Label>
                      <Input
                        id="editDateOfCareerCounselling"
                        type="date"
                        value={formData.dateOfCareerCounselling}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfCareerCounselling: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editCounselingReport">
                        Counseling Report
                      </Label>
                      <Input
                        id="editCounselingReport"
                        value={formData.counselingReport}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            counselingReport: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="editIndividualCarePlan">Individual Care Plan</Label>
                      <Textarea
                        id="editIndividualCarePlan"
                        value={formData.individualCarePlan || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            individualCarePlan: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <FormSheetFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Update SC Student</Button>
                  </FormSheetFooter>
                </form>
              </FormSheetContent>
            </FormSheet>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>SC Student Details</DialogTitle>
                  <DialogDescription>
                    View complete information about this SC student.
                  </DialogDescription>
                </DialogHeader>
                {selectedStudent && (
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
                          <p>{selectedStudent.householdCode}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Name</Label>
                          <p>{selectedStudent.name}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Gender</Label>
                          <Badge variant="outline">
                            {selectedStudent.gender}
                          </Badge>
                        </div>
                        <div>
                          <Label className="font-semibold">Age</Label>
                          <p>
                            {selectedStudent.age != null && selectedStudent.age !== ""
                              ? `${selectedStudent.age} years`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Date of Birth</Label>
                          <p>{formatDate(selectedStudent.dateOfBirth, "N/A")}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Contact Number
                          </Label>
                          <p>{selectedStudent.contactNo}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Head of Household
                          </Label>
                          <p>{selectedStudent.headOfHousehold}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedStudent.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Class/Grade</Label>
                          <p>{selectedStudent.classGrade || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Status</Label>
                          <p>{selectedStudent.studentStatus || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">School Name</Label>
                          <p>{selectedStudent.schoolName || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Father Name</Label>
                          <p>{selectedStudent.fatherName || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Father Occupation</Label>
                          <p>{selectedStudent.fatherOccupation || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Mother Name</Label>
                          <p>{selectedStudent.motherName || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Mother Occupation</Label>
                          <p>{selectedStudent.motherOccupation || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedStudent.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedStudent.projectResponsible}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Category</Label>
                          <p>{selectedStudent.category}</p>
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
                          <p>
                            {formatDate(selectedStudent.dateOfReporting, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Reported By</Label>
                          <p>{selectedStudent.reportedBy}</p>
                        </div>
                      </div>
                      {selectedStudent.natureOfIssue && (
                        <div>
                          <Label className="font-semibold">
                            Nature of Issue
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedStudent.natureOfIssue}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Assessments */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Assessments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Date of Educational Assessment
                          </Label>
                          <p>
                            {formatDate(selectedStudent.dateOfEducationalAssessment, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Date of Career Counselling
                          </Label>
                          <p>
                            {formatDate(selectedStudent.dateOfCareerCounselling, "N/A")}
                          </p>
                        </div>
                      </div>
                      {selectedStudent.educationalScreeningResults && (
                        <div>
                          <Label className="font-semibold">
                            Educational Screening Results
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedStudent.educationalScreeningResults}
                          </p>
                        </div>
                      )}
                      {selectedStudent.counselingReport && (
                        <div>
                          <Label className="font-semibold">
                            Counseling Report
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedStudent.counselingReport}
                          </p>
                        </div>
                      )}
                      {selectedStudent.individualCarePlan && (
                        <div>
                          <Label className="font-semibold">
                            Individual Care Plan
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedStudent.individualCarePlan}
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

export default SCStudents;




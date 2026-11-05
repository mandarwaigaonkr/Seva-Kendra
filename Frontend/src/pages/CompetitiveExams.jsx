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
  BookOpen,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { competitiveExamAPI, scStudentAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import { getWardOptions } from "../lib/formOptions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import competitiveExamImportTemplate, {
  CATEGORY,
  SOCIAL_STATUS,
  EXAM_TYPES,
  EXAM_STATUS,
  EXAM_RESULT,
} from "../lib/excelImport/templates/competitiveExam";
import {
  ModulePageHeader,
  tableState,
  StatusBadge,
  formatWard,
  formatDate,
  toDateInput,
} from "../components/module/ModuleKit";

const EXAM_TYPE_OPTIONS = EXAM_TYPES;

// One "Category / Social Status" picker feeds both schema fields (category has
// Muslim/Other, socialStatus has EWS) — each only receives values its enum allows.
const CATEGORY_SOCIAL_OPTIONS = [...new Set([...CATEGORY, ...SOCIAL_STATUS])];

// SC Student records use Boy/Girl; this model uses Male/Female.
const SC_GENDER_TO_EXAM = { Boy: "Male", Girl: "Female", Other: "Other" };

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

const StudentCombobox = ({ id, value, onSelectStudent, students, loading }) => {
  const [open, setOpen] = useState(false);
  const selectedStudent = students.find((student) => student._id === value);

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
          {selectedStudent
            ? `${selectedStudent.householdCode} - ${selectedStudent.name}`
            : "Select student from SC list"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search by household code or name..."
            autoFocus
            onKeyDown={(event) => event.stopPropagation()}
          />
          <CommandList
            id={`${id}-list`}
            className="max-h-64"
            onWheel={(event) => event.stopPropagation()}
          >
            <CommandEmpty>
              {loading ? "Loading SC students..." : "No SC student found."}
            </CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student._id}
                  value={`${student.householdCode || ""} ${student.name || ""}`}
                  onSelect={() => {
                    onSelectStudent(student);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === student._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {student.householdCode} - {student.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ExamTypeMultiSelect = ({ id, values, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedLabels = EXAM_TYPE_OPTIONS.filter((option) =>
    values.includes(option)
  );

  const toggleValue = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between bg-input px-3 text-left text-sm font-normal text-foreground"
        >
          {selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : "Select exam types"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search exam type..."
            autoFocus
            onKeyDown={(event) => event.stopPropagation()}
          />
          <CommandList className="max-h-64" onWheel={(event) => event.stopPropagation()}>
            <CommandEmpty>No exam type found.</CommandEmpty>
            <CommandGroup>
              {EXAM_TYPE_OPTIONS.map((option) => {
                const checked = values.includes(option);
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => toggleValue(option)}
                  >
                    <Checkbox
                      checked={checked}
                      className="mr-2"
                      onCheckedChange={() => toggleValue(option)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    {option}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CompetitiveExams = () => {
  const wardOptions = getWardOptions();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    wardNo: "all",
    typeOfExam: "all",
    status: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [scStudents, setScStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    scStudentId: "",
    householdCode: "",
    name: "",
    gender: "",
    age: "",
    contactNo: "",
    headOfHousehold: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    socialCategory: "",
    educationalStatus: "",
    typeOfExam: [],
    status: "Preparing",
    dateOfEnrollment: "",
    enrolledBy: "",
    dateOfEducationalAssessment: "",
    educationalScreeningResults: "",
    dateOfCareerCounselling: "",
    counselingReport: "",
    individualCarePlan: "",
    applicationDate: "",
    examDate: "",
    result: "Pending",
    progressReporting: {},
  });

  // Fetch exams
  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...(filters.wardNo !== "all" && { wardNo: filters.wardNo }),
        ...(filters.typeOfExam !== "all" && { typeOfExam: filters.typeOfExam }),
        ...(filters.status !== "all" && { status: filters.status }),
      };

      const response = await competitiveExamAPI.getAll(params);
      setExams(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch competitive exams");
      console.error("Error fetching competitive exams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  const fetchScStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await scStudentAPI.getAll({
        page: 1,
        limit: 500,
      });
      setScStudents(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch SC student list");
      console.error("Error fetching SC student list:", error);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchScStudents();
  }, []);

  useEffect(() => {
    if (isCreateModalOpen || isEditModalOpen) {
      fetchScStudents();
    }
  }, [isCreateModalOpen, isEditModalOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gender) {
      toast.error("Gender is required");
      return;
    }
    if (!formData.wardNo) {
      toast.error("Ward number is required");
      return;
    }
    if (!formData.typeOfExam?.length) {
      toast.error("Select at least one type of exam");
      return;
    }
    try {
      const { socialCategory, ...restFormData } = formData;
      const payload = toApiPayload(
        {
          ...restFormData,
          category: CATEGORY.includes(socialCategory) ? socialCategory : "",
          socialStatus: SOCIAL_STATUS.includes(socialCategory)
            ? socialCategory
            : "",
        },
        Boolean(selectedExam)
      );

      if (selectedExam) {
        await competitiveExamAPI.update(selectedExam._id, payload);
        toast.success("Competitive exam record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await competitiveExamAPI.create(payload);
        toast.success("Competitive exam record created successfully");
        setIsCreateModalOpen(false);
      }

      fetchExams();
      resetForm();
    } catch (error) {
      toast.error(error?.message || "An error occurred");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await competitiveExamAPI.delete(id);
      toast.success("Competitive exam record deleted successfully");
      fetchExams();
    } catch (error) {
      toast.error("Failed to delete competitive exam record");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      scStudentId: "",
      householdCode: "",
      name: "",
      gender: "",
      age: "",
      contactNo: "",
      headOfHousehold: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      socialCategory: "",
      educationalStatus: "",
      typeOfExam: [],
      status: "Preparing",
      dateOfEnrollment: "",
      enrolledBy: "",
      dateOfEducationalAssessment: "",
      educationalScreeningResults: "",
      dateOfCareerCounselling: "",
      counselingReport: "",
      individualCarePlan: "",
      applicationDate: "",
      examDate: "",
      result: "Pending",
      progressReporting: {},
    });
    setSelectedExam(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (exam) => {
    setSelectedExam(exam);
    setFormData({
      ...exam,
      scStudentId: exam.scStudentId?._id || exam.scStudentId || "",
      socialCategory: exam.socialStatus || exam.category || "",
      typeOfExam: Array.isArray(exam.typeOfExam)
        ? exam.typeOfExam
        : exam.typeOfExam
        ? [exam.typeOfExam]
        : [],
      dateOfEnrollment: toDateInput(exam.dateOfEnrollment),
      dateOfEducationalAssessment: toDateInput(exam.dateOfEducationalAssessment),
      dateOfCareerCounselling: toDateInput(exam.dateOfCareerCounselling),
      applicationDate: toDateInput(exam.applicationDate),
      examDate: toDateInput(exam.examDate),
    });
    setIsEditModalOpen(true);
  };

  const handleStudentSelect = (student) => {
    setFormData((prev) => ({
      ...prev,
      scStudentId: student._id,
      householdCode: student.householdCode || prev.householdCode,
      name: student.name || prev.name,
      gender: SC_GENDER_TO_EXAM[student.gender] || prev.gender,
      age: student.age?.toString() || prev.age,
      contactNo: student.contactNo || prev.contactNo,
      headOfHousehold: student.headOfHousehold || prev.headOfHousehold,
      wardNo: student.wardNo || prev.wardNo,
      habitation: student.habitation || prev.habitation,
      projectResponsible: student.projectResponsible || prev.projectResponsible,
      socialCategory: student.category || prev.socialCategory,
    }));
  };

  // Open view modal
  const openViewModal = (exam) => {
    setSelectedExam(exam);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeItem="competitive-exams"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          icon={BookOpen}
          title="Competitive Exams"
          subtitle="Support aspirants from enrolment and counselling to exam results"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("education") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Exam Record
              </Button>
            )
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <GuidelinesCard
              title="Competitive Exam Tracking Guidelines"
              description="Help aspirants navigate through various competitive exams effectively."
              items={[
                "Select all relevant exam types the student is preparing for.",
                "Track the current status (Preparing, Qualified, Not Qualified).",
                "Document enrollment dates and project-responsible staff.",
                "Record career counseling reports and individual care plans.",
                "Capture exam application dates and upcoming exam schedules.",
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
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
                      <SelectTrigger aria-label="Filter by ward">
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
                    <Select
                      value={filters.typeOfExam}
                      onValueChange={(value) =>
                        setFilters({ ...filters, typeOfExam: value })
                      }
                    >
                      <SelectTrigger aria-label="Filter by exam type">
                        <SelectValue placeholder="Filter by Exam Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Exams</SelectItem>
                        {EXAM_TYPES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value })
                      }
                    >
                      <SelectTrigger aria-label="Filter by status">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {EXAM_STATUS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Import Card */}
            {canCreate("education") && (
              <ExcelImportPanel
                template={competitiveExamImportTemplate}
                createRecord={competitiveExamAPI.create}
                onImported={fetchExams}
              />
            )}

            {/* Exams Table */}
            <Card>
              <CardHeader>
                <CardTitle>Competitive Exams ({pagination.total})</CardTitle>
                <CardDescription>
                  Manage and track all competitive exam aspirants
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
                        <TableHead>Ward</TableHead>
                        <TableHead>Exam Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableState({
                        loading,
                        count: exams.length,
                        colSpan: 8,
                        filtered:
                          Boolean(searchTerm) ||
                          Object.values(filters).some((v) => v !== "all"),
                      })}
                      {!loading && exams.map((exam) => (
                        <TableRow key={exam._id}>
                          <TableCell className="font-medium">
                            {exam.householdCode}
                          </TableCell>
                          <TableCell>{exam.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{exam.gender}</Badge>
                          </TableCell>
                          <TableCell>{exam.age}</TableCell>
                          <TableCell>{formatWard(exam.wardNo)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {Array.isArray(exam.typeOfExam)
                                ? exam.typeOfExam.join(", ")
                                : exam.typeOfExam}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={exam.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(exam)}
                                aria-label={`View ${exam.name}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("education") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(exam)}
                                  aria-label={`Edit ${exam.name}`}
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
                                      aria-label={`Delete ${exam.name}`}
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
                                        permanently delete the exam record.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(exam._id)}
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
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Exam Record</DialogTitle>
                  <DialogDescription>
                    Create a new competitive exam record with all required
                    information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="scStudentId">Select Student from SC List</Label>
                      <StudentCombobox
                        id="scStudentId"
                        value={formData.scStudentId}
                        onSelectStudent={handleStudentSelect}
                        students={scStudents}
                        loading={studentsLoading}
                      />
                    </div>
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
                      <Label htmlFor="gender">Gender *</Label>
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
                        type="number"
                        min={0}
                        max={120}
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        min="0"
                        max="120"
                        required
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
                        Head of Household *
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
                    <div>
                      <Label htmlFor="habitation">Habitation *</Label>
                      <Input
                        id="habitation"
                        value={formData.habitation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            habitation: e.target.value,
                          })
                        }
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
                    <div>
                      <Label htmlFor="socialCategory">
                        Category / Social Status
                      </Label>
                      <Select
                        value={formData.socialCategory}
                        onValueChange={(value) =>
                          setFormData({ ...formData, socialCategory: value })
                        }
                      >
                        <SelectTrigger id="socialCategory">
                          <SelectValue placeholder="Select category / social status" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_SOCIAL_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="typeOfExam">Type of Exam *</Label>
                      <ExamTypeMultiSelect
                        id="typeOfExam"
                        values={formData.typeOfExam}
                        onChange={(values) =>
                          setFormData({ ...formData, typeOfExam: values })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_STATUS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfEnrollment">
                        Date of Enrollment *
                      </Label>
                      <Input
                        id="dateOfEnrollment"
                        type="date"
                        value={formData.dateOfEnrollment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfEnrollment: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="enrolledBy">Enrolled By *</Label>
                      <Input
                        id="enrolledBy"
                        value={formData.enrolledBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enrolledBy: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="educationalStatus">
                        Educational Status *
                      </Label>
                      <Input
                        id="educationalStatus"
                        value={formData.educationalStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            educationalStatus: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicationDate">Application Date</Label>
                      <Input
                        id="applicationDate"
                        type="date"
                        value={formData.applicationDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, applicationDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="examDate">Exam Date</Label>
                      <Input
                        id="examDate"
                        type="date"
                        value={formData.examDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, examDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="result">Result</Label>
                      <Select
                        value={formData.result || "Pending"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, result: value })
                        }
                      >
                        <SelectTrigger id="result">
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_RESULT.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfEducationalAssessment">Date of Educational Assessment</Label>
                      <Input
                        id="dateOfEducationalAssessment"
                        type="date"
                        value={formData.dateOfEducationalAssessment || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfEducationalAssessment: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="educationalScreeningResults">Educational Screening Results</Label>
                      <Input
                        id="educationalScreeningResults"
                        value={formData.educationalScreeningResults || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, educationalScreeningResults: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfCareerCounselling">Date of Career Counselling</Label>
                      <Input
                        id="dateOfCareerCounselling"
                        type="date"
                        value={formData.dateOfCareerCounselling || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfCareerCounselling: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="counselingReport">Counselling Report</Label>
                      <Input
                        id="counselingReport"
                        value={formData.counselingReport || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, counselingReport: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="individualCarePlan">Individual Care Plan</Label>
                      <Textarea
                        id="individualCarePlan"
                        value={formData.individualCarePlan || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, individualCarePlan: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Exam Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Exam Record</DialogTitle>
                  <DialogDescription>
                    Update the competitive exam record information.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="editScStudentId">
                        Select Student from SC List
                      </Label>
                      <StudentCombobox
                        id="editScStudentId"
                        value={formData.scStudentId}
                        onSelectStudent={handleStudentSelect}
                        students={scStudents}
                        loading={studentsLoading}
                      />
                    </div>
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
                      <Label htmlFor="editGender">Gender *</Label>
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
                        type="number"
                        min={0}
                        max={120}
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                        min="0"
                        max="120"
                        required
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
                        Head of Household *
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
                    <div>
                      <Label htmlFor="editHabitation">Habitation *</Label>
                      <Input
                        id="editHabitation"
                        value={formData.habitation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            habitation: e.target.value,
                          })
                        }
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
                    <div>
                      <Label htmlFor="editSocialCategory">
                        Category / Social Status
                      </Label>
                      <Select
                        value={formData.socialCategory}
                        onValueChange={(value) =>
                          setFormData({ ...formData, socialCategory: value })
                        }
                      >
                        <SelectTrigger id="editSocialCategory">
                          <SelectValue placeholder="Select category / social status" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_SOCIAL_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editTypeOfExam">Type of Exam *</Label>
                      <ExamTypeMultiSelect
                        id="editTypeOfExam"
                        values={formData.typeOfExam}
                        onChange={(values) =>
                          setFormData({ ...formData, typeOfExam: values })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editStatus">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger id="editStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_STATUS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editDateOfEnrollment">
                        Date of Enrollment *
                      </Label>
                      <Input
                        id="editDateOfEnrollment"
                        type="date"
                        value={formData.dateOfEnrollment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfEnrollment: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editEnrolledBy">Enrolled By *</Label>
                      <Input
                        id="editEnrolledBy"
                        value={formData.enrolledBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enrolledBy: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="editEducationalStatus">
                        Educational Status *
                      </Label>
                      <Input
                        id="editEducationalStatus"
                        value={formData.educationalStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            educationalStatus: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editApplicationDate">Application Date</Label>
                      <Input
                        id="editApplicationDate"
                        type="date"
                        value={formData.applicationDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, applicationDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editExamDate">Exam Date</Label>
                      <Input
                        id="editExamDate"
                        type="date"
                        value={formData.examDate || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, examDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editResult">Result</Label>
                      <Select
                        value={formData.result || "Pending"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, result: value })
                        }
                      >
                        <SelectTrigger id="editResult">
                          <SelectValue placeholder="Select result" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXAM_RESULT.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="editDateOfEducationalAssessment">Date of Educational Assessment</Label>
                      <Input
                        id="editDateOfEducationalAssessment"
                        type="date"
                        value={formData.dateOfEducationalAssessment || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfEducationalAssessment: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editEducationalScreeningResults">Educational Screening Results</Label>
                      <Input
                        id="editEducationalScreeningResults"
                        value={formData.educationalScreeningResults || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, educationalScreeningResults: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editDateOfCareerCounselling">Date of Career Counselling</Label>
                      <Input
                        id="editDateOfCareerCounselling"
                        type="date"
                        value={formData.dateOfCareerCounselling || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfCareerCounselling: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="editCounselingReport">Counselling Report</Label>
                      <Input
                        id="editCounselingReport"
                        value={formData.counselingReport || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, counselingReport: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="editIndividualCarePlan">Individual Care Plan</Label>
                      <Textarea
                        id="editIndividualCarePlan"
                        value={formData.individualCarePlan || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, individualCarePlan: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Exam Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Exam Record Details</DialogTitle>
                  <DialogDescription>
                    View complete information about this competitive exam
                    record.
                  </DialogDescription>
                </DialogHeader>
                {selectedExam && (
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
                          <p>{selectedExam.householdCode}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Name</Label>
                          <p>{selectedExam.name}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Gender</Label>
                          <Badge variant="outline">{selectedExam.gender}</Badge>
                        </div>
                        <div>
                          <Label className="font-semibold">Age</Label>
                          <p>{selectedExam.age} years</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Contact Number
                          </Label>
                          <p>{selectedExam.contactNo}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Head of Household
                          </Label>
                          <p>{selectedExam.headOfHousehold}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Ward No</Label>
                          <p>{formatWard(selectedExam.wardNo)}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">Habitation</Label>
                          <p>{selectedExam.habitation}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Project Responsible
                          </Label>
                          <p>{selectedExam.projectResponsible}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Category / Social Status
                          </Label>
                          <p>{selectedExam.socialStatus || selectedExam.category || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Educational Status
                          </Label>
                          <p>{selectedExam.educationalStatus}</p>
                        </div>
                      </div>
                    </div>

                    {/* Exam Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Exam Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">Type of Exam</Label>
                          <Badge>
                            {Array.isArray(selectedExam.typeOfExam)
                              ? selectedExam.typeOfExam.join(", ")
                              : selectedExam.typeOfExam}
                          </Badge>
                        </div>
                        <div>
                          <Label className="font-semibold">Status</Label>
                          <div><StatusBadge value={selectedExam.status} /></div>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Date of Enrollment
                          </Label>
                          <p>
                            {formatDate(selectedExam.dateOfEnrollment, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Enrolled By</Label>
                          <p>{selectedExam.enrolledBy}</p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Application Date
                          </Label>
                          <p>
                            {formatDate(selectedExam.applicationDate, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Exam Date</Label>
                          <p>
                            {formatDate(selectedExam.examDate, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">Result</Label>
                          <div><StatusBadge value={selectedExam.result} /></div>
                        </div>
                      </div>
                    </div>

                    {/* Assessment & Counseling */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Assessment & Counseling
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">
                            Date of Educational Assessment
                          </Label>
                          <p>
                            {formatDate(selectedExam.dateOfEducationalAssessment, "N/A")}
                          </p>
                        </div>
                        <div>
                          <Label className="font-semibold">
                            Date of Career Counselling
                          </Label>
                          <p>
                            {formatDate(selectedExam.dateOfCareerCounselling, "N/A")}
                          </p>
                        </div>
                      </div>
                      {selectedExam.educationalScreeningResults && (
                        <div>
                          <Label className="font-semibold">
                            Educational Screening Results
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedExam.educationalScreeningResults}
                          </p>
                        </div>
                      )}
                      {selectedExam.counselingReport && (
                        <div>
                          <Label className="font-semibold">
                            Counseling Report
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedExam.counselingReport}
                          </p>
                        </div>
                      )}
                      {selectedExam.individualCarePlan && (
                        <div>
                          <Label className="font-semibold">
                            Individual Care Plan
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedExam.individualCarePlan}
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

export default CompetitiveExams;




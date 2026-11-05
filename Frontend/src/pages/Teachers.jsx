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
import { Plus, Search, Edit, Trash2, Eye, GraduationCap } from "lucide-react";
import { teacherAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import teacherImportTemplate from "../lib/excelImport/templates/teacher";
import { ModulePageHeader, StatusBadge, tableState } from "../components/module/ModuleKit";

const Teachers = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacherId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialization: [],
    experienceYears: "",
    qualifications: "",
    status: "Active",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, onLeave: 0 });
  const [filterOptions, setFilterOptions] = useState({ specializations: [], statuses: [] });

  // qualifications is a free-text string array in the model; the form edits it as "a, b, c".
  const parseQualifications = (value) =>
    String(value || "")
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const getSpecializationList = (specialization) => {
    if (Array.isArray(specialization)) {
      return specialization;
    }
    if (typeof specialization === "string" && specialization.trim()) {
      return [specialization.trim()];
    }
    return [];
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter === "all" ? "" : statusFilter,
        specialization: specializationFilter === "all" ? "" : specializationFilter,
      };

      const response = await teacherAPI.getAll(params);
      setTeachers(response.data.data);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch teachers");
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndOptions = async () => {
    try {
      const [statsRes, optionsRes] = await Promise.all([
        teacherAPI.getStats(),
        teacherAPI.getFilterOptions()
      ]);
      
      const statsData = statsRes.data.data;
      const byStatus = statsData.byStatus || [];
      
      setStats({
        total: statsData.total || 0,
        active: byStatus.find(s => s._id === "Active")?.count || 0,
        inactive: byStatus.find(s => s._id === "Inactive")?.count || 0,
        onLeave: byStatus.find(s => s._id === "On Leave")?.count || 0,
      });
      
      setFilterOptions(optionsRes.data.data);
    } catch (error) {
      console.error("Error fetching teacher stats/options:", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, specializationFilter]);

  useEffect(() => {
    fetchStatsAndOptions();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        specialization: getSpecializationList(formData.specialization),
        experience: Number(formData.experienceYears) || 0,
        qualifications: parseQualifications(formData.qualifications),
      };
      delete submitData.experienceYears;

      if (!submitData.teacherId?.trim()) {
        delete submitData.teacherId;
      } else {
        submitData.teacherId = submitData.teacherId.trim();
      }

      if (selectedTeacher) {
        await teacherAPI.update(selectedTeacher._id, submitData);
        toast.success("Teacher updated successfully");
        setIsEditModalOpen(false);
      } else {
        await teacherAPI.create(submitData);
        toast.success("Teacher created successfully");
        setIsCreateModalOpen(false);
      }

      fetchTeachers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await teacherAPI.delete(id);
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to delete teacher");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      teacherId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      specialization: [],
      experienceYears: "",
      qualifications: "",
      status: "Active",
    });
    setSelectedTeacher(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      specialization: getSpecializationList(teacher.specialization),
      experienceYears: teacher.experience?.toString() || "",
      qualifications: Array.isArray(teacher.qualifications)
        ? teacher.qualifications.join(", ")
        : teacher.qualifications || "",
      status: teacher.status,
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const specializations = [
    "Mathematics",
    "Science",
    "English",
    "Social Studies",
    "Physical Education",
    "Computer Science",
    "Arts",
    "Vocational",
    "General",
    "Other",
  ];

  const statuses = ["Active", "Inactive", "On Leave"];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ModulePageHeader
          icon={GraduationCap}
          title="Teachers"
          subtitle="Teaching faculty working across study centers"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("education") && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Teacher
              </Button>
            )
          }
        />

        {/* Content Area */}
        <div className="p-6 space-y-6">
          <GuidelinesCard
            title="Teaching Faculty Guidelines"
            description="Manage profiles of educators across different project centers and specializations."
            items={[
              "Select all applicable subjects in the 'Specialization' list.",
              "Document teaching experience in years and specify domain expertise.",
              "Ensure contact information is valid for center-level coordination.",
              "Update status promptly if a teacher is on leave or becomes inactive.",
              "Verify qualification details against submitted documentation.",
            ]}
          />



          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="w-[180px]">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[200px]">
                  <Select
                    value={specializationFilter}
                    onValueChange={(val) => {
                      setSpecializationFilter(val);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {canCreate("education") && (
                  <Dialog
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                  >
              <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Enter teacher details to add a new teacher to the system.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teacherId">Teacher ID</Label>
                      <Input
                        id="teacherId"
                        value={formData.teacherId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teacherId: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lastName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        title="10-digit mobile number starting with 6-9"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="10 digit number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-2 p-3 border rounded-md">
                        {specializations.map((spec) => {
                          const checked = formData.specialization.includes(spec);
                          return (
                            <div key={spec} className="flex items-start gap-2 min-w-0">
                              <Checkbox
                                id={`specialization-${spec}`}
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  if (isChecked) {
                                    setFormData({
                                      ...formData,
                                      specialization: [...formData.specialization, spec],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      specialization: formData.specialization.filter(
                                        (item) => item !== spec
                                      ),
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`specialization-${spec}`}
                                className="text-sm leading-5 break-words cursor-pointer"
                              >
                                {spec}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="experienceYears">Experience (years)</Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experienceYears: e.target.value,
                          })
                        }
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input
                      id="qualifications"
                      value={formData.qualifications}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualifications: e.target.value,
                        })
                      }
                      placeholder="e.g. B.Ed, M.Sc Mathematics (comma-separated)"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Teacher</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>
            </div>
          </div>

          {/* Bulk Import */}
          {canCreate("education") && (
            <ExcelImportPanel
              template={teacherImportTemplate}
              createRecord={teacherAPI.create}
              onImported={() => {
                fetchTeachers();
                fetchStatsAndOptions();
              }}
            />
          )}

          {/* Teachers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Teachers List</CardTitle>
              <CardDescription>
                Manage all teachers in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: teachers.length,
                      colSpan: 8,
                      filtered: Boolean(searchTerm) || statusFilter !== "all" || specializationFilter !== "all",
                    })}
                    {!loading && teachers.map((teacher) => (
                      <TableRow key={teacher._id}>
                        <TableCell className="font-medium">
                          {teacher.teacherId}
                        </TableCell>
                        <TableCell>
                          {teacher.firstName} {teacher.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {teacher.email}
                        </TableCell>
                        <TableCell>{teacher.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSpecializationList(teacher.specialization).join(", ") || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>{teacher.experience || 0} years</TableCell>
                        <TableCell>
                          <StatusBadge value={teacher.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openViewModal(teacher)}
                              className="p-1 hover:bg-secondary rounded"
                              title="View"
                              aria-label="View teacher"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </button>
                            {canEdit("education") && (
                              <button
                                onClick={() => openEditModal(teacher)}
                                className="p-1 hover:bg-secondary rounded"
                                title="Edit"
                                aria-label="Edit teacher"
                              >
                                <Edit className="h-4 w-4 text-green-600" />
                              </button>
                            )}
                            {canDelete("education") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="p-1 hover:bg-secondary rounded"
                                    title="Delete"
                                    aria-label="Delete teacher"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Teacher
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      teacher? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(teacher._id)}
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
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} (Total:{" "}
                    {pagination.total})
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          page: Math.max(1, p.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          page: Math.min(p.pages, p.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editTeacherId">Teacher ID</Label>
                <Input
                  id="editTeacherId"
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      teacherId: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      firstName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editPhoneNumber">Phone Number *</Label>
                <Input
                  id="editPhoneNumber"
                  type="tel"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit mobile number starting with 6-9"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phoneNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="editSpecialization">Specialization</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-2 p-3 border rounded-md">
                  {specializations.map((spec) => {
                    const checked = formData.specialization.includes(spec);
                    return (
                      <div key={spec} className="flex items-start gap-2 min-w-0">
                        <Checkbox
                          id={`edit-specialization-${spec}`}
                          checked={checked}
                          onCheckedChange={(isChecked) => {
                            if (isChecked) {
                              setFormData({
                                ...formData,
                                specialization: [...formData.specialization, spec],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                specialization: formData.specialization.filter(
                                  (item) => item !== spec
                                ),
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-specialization-${spec}`}
                          className="text-sm leading-5 break-words cursor-pointer"
                        >
                          {spec}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="editExperience">Experience (years)</Label>
                <Input
                  id="editExperience"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experienceYears: e.target.value,
                    })
                  }
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editQualifications">Qualifications</Label>
              <Input
                id="editQualifications"
                value={formData.qualifications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    qualifications: e.target.value,
                  })
                }
                placeholder="e.g. B.Ed, M.Sc Mathematics (comma-separated)"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Teacher</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teacher ID
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedTeacher.teacherId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{selectedTeacher.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg">{selectedTeacher.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Specialization
                  </p>
                  <p className="text-lg">
                    {getSpecializationList(selectedTeacher.specialization).join(", ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Experience
                  </p>
                  <p className="text-lg">
                    {selectedTeacher.experience || 0} years
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge value={selectedTeacher.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Qualifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.qualifications &&
                    selectedTeacher.qualifications.length > 0 ? (
                      selectedTeacher.qualifications.map((qual) => (
                        <Badge key={qual} variant="outline">
                          {qual}
                        </Badge>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;




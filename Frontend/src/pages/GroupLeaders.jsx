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
import { Plus, Search, Edit, Trash2, Eye, UserCheck } from "lucide-react";
import { groupLeaderAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import groupLeaderImportTemplate from "../lib/excelImport/templates/groupLeader";
import { ModulePageHeader, StatusBadge, tableState } from "../components/module/ModuleKit";

const GroupLeaders = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groupLeaders, setGroupLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaderId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    experienceYears: "",
    experienceDomain: "",
    qualifications: "Other",
    status: "Active",
  });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, onLeave: 0 });

  const getExperienceYears = (leader) => {
    if (typeof leader?.experience === "number") {
      return leader.experience;
    }
    return leader?.experience?.years || 0;
  };

  const getExperienceDisplay = (leader) => {
    const years = getExperienceYears(leader);
    const field = leader?.experience?.domain?.trim() || "Not specified";
    return `${years} years / ${field}`;
  };

  const getQualificationsList = (qualifications) => {
    if (Array.isArray(qualifications)) {
      return qualifications;
    }
    if (typeof qualifications === "string" && qualifications.trim()) {
      return [qualifications.trim()];
    }
    return [];
  };

  // Fetch group leaders
  const fetchGroupLeaders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      const response = await groupLeaderAPI.getAll(params);
      setGroupLeaders(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch group leaders");
      console.error("Error fetching group leaders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupLeaders();
  }, [pagination.page, pagination.limit, searchTerm]);

  const fetchStats = async () => {
    try {
      const res = await groupLeaderAPI.getStats();
      const statsData = res.data.data;
      const byStatus = statsData.byStatus || [];
      setStats({
        total: statsData.total || 0,
        active: byStatus.find(s => s._id === "Active")?.count || 0,
        inactive: byStatus.find(s => s._id === "Inactive")?.count || 0,
        onLeave: byStatus.find(s => s._id === "On Leave")?.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch group leader stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!/^[6-9]\d{9}$/.test(formData.phoneNumber || "")) {
        toast.error("Please enter a valid 10 digit mobile number");
        return;
      }

      const submitData = {
        ...formData,
        experience: {
          years: Number(formData.experienceYears) || 0,
          domain: formData.experienceDomain || "",
        },
      };

      if (!submitData.leaderId?.trim()) {
        delete submitData.leaderId;
      } else {
        submitData.leaderId = submitData.leaderId.trim();
      }

      if (!submitData.email?.trim()) {
        delete submitData.email;
      } else {
        submitData.email = submitData.email.trim();
      }

      delete submitData.experienceYears;
      delete submitData.experienceDomain;

      if (selectedLeader) {
        await groupLeaderAPI.update(selectedLeader._id, submitData);
        toast.success("Group leader updated successfully");
        setIsEditModalOpen(false);
      } else {
        await groupLeaderAPI.create(submitData);
        toast.success("Group leader created successfully");
        setIsCreateModalOpen(false);
      }

      fetchGroupLeaders();
      resetForm();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        "An error occurred";
      toast.error(message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await groupLeaderAPI.delete(id);
      toast.success("Group leader deleted successfully");
      fetchGroupLeaders();
    } catch (error) {
      toast.error("Failed to delete group leader");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      leaderId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      experienceYears: "",
      experienceDomain: "",
      qualifications: "Other",
      status: "Active",
    });
    setSelectedLeader(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Open edit modal
  const openEditModal = (leader) => {
    setSelectedLeader(leader);
    setFormData({
      leaderId: leader.leaderId,
      firstName: leader.firstName,
      lastName: leader.lastName,
      email: leader.email || "",
      phoneNumber: leader.phoneNumber,
      experienceYears: leader.experience?.years?.toString() || "",
      experienceDomain: leader.experience?.domain || "",
      qualifications: leader.qualifications || "Other",
      status: leader.status,
    });
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (leader) => {
    setSelectedLeader(leader);
    setIsViewModalOpen(true);
  };

  const statuses = ["Active", "Inactive", "On Leave"];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ModulePageHeader
          icon={UserCheck}
          title="Group Leaders"
          subtitle="Community leaders who run study center groups"
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
                Add Group Leader
              </Button>
            )
          }
        />

        {/* Content Area */}
        <div className="p-6 space-y-6">
          <GuidelinesCard
            title="Group Leader Management Guidelines"
            description="Maintain accurate records of personnel leading various community groups and initiatives."
            items={[
              "Verify contact details (Phone/Email) to ensure seamless communication.",
              "Document educational qualifications and domain-specific experience accurately.",
              "Update leader status (Active/Inactive) based on their current engagement.",
              "Track professional development and certifications relevant to their role.",
              "Ensure each leader is correctly mapped to their respective groups.",
            ]}
          />

          {/* Controls */}
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
            {canCreate("education") && (
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
              <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Group Leader</DialogTitle>
                  <DialogDescription>
                    Enter group leader details to add a new group leader to the
                    system.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leaderId">Leader ID</Label>
                      <Input
                        id="leaderId"
                        value={formData.leaderId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            leaderId: e.target.value,
                          })
                        }
                        placeholder="Optional"
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
                      <Label htmlFor="email">Email</Label>
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
                        placeholder="Optional"
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
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="10 digit number"
                        required
                      />
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
                      <Label htmlFor="experienceDomain">Experience Domain</Label>
                      <Input
                        id="experienceDomain"
                        value={formData.experienceDomain}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experienceDomain: e.target.value,
                          })
                        }
                        placeholder="Field (e.g., Education, Community Work)"
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
                    <Label htmlFor="qualifications">Qualification</Label>
                    <Select
                      value={formData.qualifications}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          qualifications: value,
                        })
                      }
                    >
                      <SelectTrigger id="qualifications">
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Illiterate">Illiterate</SelectItem>
                        <SelectItem value="Neo-literate">Neo-literate</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                        <SelectItem value="Graduate">Graduate</SelectItem>
                        <SelectItem value="Post-Graduate">Post-Graduate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Group Leader</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            )}
          </div>

          {/* Bulk Import */}
          {canCreate("education") && (
            <ExcelImportPanel
              template={groupLeaderImportTemplate}
              createRecord={groupLeaderAPI.create}
              onImported={() => {
                fetchGroupLeaders();
                fetchStats();
              }}
            />
          )}

          {/* Group Leaders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Group Leaders List</CardTitle>
              <CardDescription>
                Manage all group leaders in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leader ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: groupLeaders.length,
                      colSpan: 7,
                      filtered: Boolean(searchTerm),
                    })}
                    {!loading && groupLeaders.map((leader) => (
                      <TableRow key={leader._id}>
                        <TableCell className="font-medium">
                          {leader.leaderId}
                        </TableCell>
                        <TableCell>
                          {leader.firstName} {leader.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {leader.email}
                        </TableCell>
                        <TableCell>{leader.phoneNumber}</TableCell>
                        <TableCell>{getExperienceDisplay(leader)}</TableCell>
                        <TableCell>
                          <StatusBadge value={leader.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openViewModal(leader)}
                              className="p-1 hover:bg-secondary rounded"
                              title="View"
                              aria-label="View group leader"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </button>
                            {canEdit("education") && (
                              <button
                                onClick={() => openEditModal(leader)}
                                className="p-1 hover:bg-secondary rounded"
                                title="Edit"
                                aria-label="Edit group leader"
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
                                    aria-label="Delete group leader"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Group Leader
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this group
                                      leader? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(leader._id)}
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
            <DialogTitle>Edit Group Leader</DialogTitle>
            <DialogDescription>
              Update group leader information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editLeaderId">Leader ID</Label>
                <Input
                  id="editLeaderId"
                  value={formData.leaderId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leaderId: e.target.value,
                    })
                  }
                  placeholder="Optional"
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
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Optional"
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
                <Label htmlFor="editExperienceDomain">Experience Domain</Label>
                <Input
                  id="editExperienceDomain"
                  value={formData.experienceDomain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experienceDomain: e.target.value,
                    })
                  }
                  placeholder="Field (e.g., Education, Community Work)"
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
              <Label htmlFor="editQualifications">Qualification</Label>
              <Select
                value={formData.qualifications}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    qualifications: value,
                  })
                }
              >
                <SelectTrigger id="editQualifications">
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Illiterate">Illiterate</SelectItem>
                  <SelectItem value="Neo-literate">Neo-literate</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Secondary">Secondary</SelectItem>
                  <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Post-Graduate">Post-Graduate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Group Leader</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Leader Details</DialogTitle>
          </DialogHeader>

          {selectedLeader && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Leader ID</p>
                  <p className="text-lg font-semibold">
                    {selectedLeader.leaderId}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">
                    {selectedLeader.firstName} {selectedLeader.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{selectedLeader.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg">{selectedLeader.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Experience
                  </p>
                  <p className="text-lg">{getExperienceDisplay(selectedLeader)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge value={selectedLeader.status} />
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Qualifications
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getQualificationsList(selectedLeader.qualifications).length > 0 ? (
                      getQualificationsList(selectedLeader.qualifications).map((qual) => (
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

export default GroupLeaders;




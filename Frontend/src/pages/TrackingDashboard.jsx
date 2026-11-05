import React, { useState, useEffect } from "react";
import { ModulePageHeader } from "@/components/module/ModuleKit";
import {
  Calendar,
  Filter,
  Search,
  AlertCircle,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackingAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TrackingDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Error modal
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form states for new/edit tracking
  const [formData, setFormData] = useState({
    recordType: "",
    recordId: "",
    recordName: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    followUpDate: "",
    nextFollowUpDate: "",
    module: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    assignedTo: "",
    tags: "",
  });

  // Update form state
  const [updateData, setUpdateData] = useState({
    date: new Date().toISOString().split("T")[0],
    notes: "",
    status: "Pending",
  });

  const modules = ["Health", "Education", "Social Justice"];

  const recordTypes = [
    "Adolescents",
    "Elderly",
    "HealthCamps",
    "Tuberculosis",
    "HIV",
    "Leprosy",
    "OtherDiseases",
    "Addiction",
    "PWD",
    "MotherChild",
    "BoardPreparation",
    "CompetitiveExams",
    "Dropouts",
    "Schools",
    "SCStudents",
    "StudyCenters",
    "CBUCBODetails",
    "Entitlements",
    "LegalAidService",
    "WorkshopsAwareness",
  ];

  const priorities = ["Low", "Medium", "High", "Urgent"];
  const statuses = [
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled",
    "On Hold",
  ];

  useEffect(() => {
    fetchTrackingRecords();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trackingRecords, searchTerm, moduleFilter, statusFilter, priorityFilter]);

  const fetchTrackingRecords = async () => {
    try {
      setLoading(true);
      const response = await trackingAPI.getAll({
        sort: "-followUpDate",
        populate: "createdBy assignedTo",
        limit: 500, // Increased limit to show more records
      });
      console.log("Tracking API Response:", response);
      console.log("Response data:", response.data);
      // Handle both response.data.data and response.data formats
      const records =
        response.data.data || response.data.trackings || response.data || [];
      console.log("Setting tracking records:", records);
      setTrackingRecords(records);
    } catch (error) {
      console.error("Error fetching tracking records:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Pass moduleFilter to stats API if we want global stats for that module
      const params = moduleFilter !== "all" ? { module: moduleFilter } : {};
      const response = await trackingAPI.getStats(params);
      console.log("Stats API Response:", response);
      console.log("Stats data:", response.data);
      const statsData = response.data.data || response.data || {};
      console.log("Setting stats to:", statsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...trackingRecords];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.recordName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Module filter
    if (moduleFilter !== "all") {
      filtered = filtered.filter((record) => record.module === moduleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    setFilteredRecords(filtered);

    // Calculate stats from the filtered records
    // We use case-insensitive matching here too
    const newStats = {
      total: filtered.length,
      overdue: filtered.filter((r) => isOverdue(r)).length,
      inProgress: filtered.filter((r) => r.status?.toLowerCase() === "in progress").length,
      completedThisMonth: filtered.filter((r) => r.status?.toLowerCase() === "completed").length,
    };
    setStats(newStats);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      recordType: record.recordType || "",
      recordId: record.recordId || "",
      recordName: record.recordName || "",
      title: record.title || "",
      description: record.description || "",
      priority: record.priority || "Medium",
      status: record.status || "Pending",
      followUpDate: record.followUpDate
        ? new Date(record.followUpDate).toISOString().split("T")[0]
        : "",
      nextFollowUpDate: record.nextFollowUpDate
        ? new Date(record.nextFollowUpDate).toISOString().split("T")[0]
        : "",
      module: record.module || "",
      wardNo: record.wardNo || "",
      habitation: record.habitation || "",
      projectResponsible: record.projectResponsible || "",
      assignedTo: record.assignedTo?._id || "",
      tags: record.tags?.join(", ") || "",
    });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await trackingAPI.delete(recordToDelete._id);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      fetchTrackingRecords();
      fetchStats();
    } catch (error) {
      console.error("Error deleting tracking record:", error);
      setErrorMessage("Failed to delete tracking record. Please try again.");
      setErrorModalOpen(true);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleAddUpdate = (record) => {
    setSelectedRecord(record);
    setUpdateData({
      date: new Date().toISOString().split("T")[0],
      notes: "",
      status: record.status || "Pending",
    });
    setUpdateModalOpen(true);
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // Remove empty string fields that should be ObjectIds or omitted
      if (!payload.assignedTo || payload.assignedTo === "") {
        delete payload.assignedTo;
      }

      // Remove empty optional fields
      if (!payload.nextFollowUpDate) delete payload.nextFollowUpDate;
      if (!payload.wardNo) delete payload.wardNo;
      if (!payload.habitation) delete payload.habitation;
      if (!payload.projectResponsible) delete payload.projectResponsible;

      await trackingAPI.create(payload);
      setAddModalOpen(false);
      setFormData({
        recordType: "",
        recordId: "",
        recordName: "",
        title: "",
        description: "",
        priority: "Medium",
        status: "Pending",
        followUpDate: "",
        nextFollowUpDate: "",
        module: "",
        wardNo: "",
        habitation: "",
        projectResponsible: "",
        assignedTo: "",
        tags: "",
      });
      fetchTrackingRecords();
      fetchStats();
    } catch (error) {
      console.error("Error creating tracking record:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to create tracking record. Please try again."
      );
      setErrorModalOpen(true);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // Remove empty string fields that should be ObjectIds or omitted
      if (!payload.assignedTo || payload.assignedTo === "") {
        delete payload.assignedTo;
      }

      // Remove empty optional fields
      if (!payload.nextFollowUpDate) delete payload.nextFollowUpDate;
      if (!payload.wardNo) delete payload.wardNo;
      if (!payload.habitation) delete payload.habitation;
      if (!payload.projectResponsible) delete payload.projectResponsible;

      await trackingAPI.update(selectedRecord._id, payload);
      setEditModalOpen(false);
      setSelectedRecord(null);
      fetchTrackingRecords();
      fetchStats();
    } catch (error) {
      console.error("Error updating tracking record:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update tracking record. Please try again."
      );
      setErrorModalOpen(true);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    try {
      await trackingAPI.addMonthlyUpdate(selectedRecord._id, updateData);
      setUpdateModalOpen(false);
      setSelectedRecord(null);
      setUpdateData({
        date: new Date().toISOString().split("T")[0],
        notes: "",
        status: "Pending",
      });
      fetchTrackingRecords();
      fetchStats();
    } catch (error) {
      console.error("Error adding monthly update:", error);
      setErrorMessage("Failed to add monthly update. Please try again.");
      setErrorModalOpen(true);
    }
  };

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [recordToComplete, setRecordToComplete] = useState(null);

  const handleCompleteClick = (record) => {
    setRecordToComplete(record);
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (!recordToComplete) return;

    try {
      await trackingAPI.complete(recordToComplete._id, {
        notes: "Completed",
      });
      setCompleteDialogOpen(false);
      setRecordToComplete(null);
      fetchTrackingRecords();
      fetchStats();
    } catch (error) {
      console.error("Error completing tracking record:", error);
      setErrorMessage("Failed to complete tracking record. Please try again.");
      setErrorModalOpen(true);
      setCompleteDialogOpen(false);
      setRecordToComplete(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
        return "success";
      case "in progress":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "destructive";
      case "on hold":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "Urgent":
        return "destructive";
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in progress":
        return <Activity className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "on hold":
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (record) => {
    if (!record.followUpDate || record.status?.toLowerCase() === "completed") return false;
    return new Date(record.followUpDate) < new Date();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModulePageHeader
          title="Follow-ups"
          subtitle={`Monthly visits and check-ins across every programme · ${filteredRecords.length} shown`}
        />

        <main className="flex-1 overflow-y-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Follow-ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {stats.overdue || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">
                  {stats.inProgress || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {stats.completedThisMonth || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title, record..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Module</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Records</CardTitle>
              <CardDescription>
                {filteredRecords.length} record(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="space-y-4">
                    <div className="text-6xl">📋</div>
                    <h3 className="text-lg font-semibold text-foreground">
                      No Follow-up Records Yet
                    </h3>
                    <p className="text-sm max-w-md mx-auto">
                      Follow-ups are created automatically when you add new
                      records (Adolescents, Elderly, Schools, etc.). A monthly
                      follow-up will be scheduled for the next month.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Try adding a new record in any module to see automatic
                      tracking in action!
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title / Record</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Follow-up Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow
                        key={record._id}
                        className={`transition-colors duration-150 ${
                          isOverdue(record)
                            ? "bg-destructive/10 hover:bg-destructive/20"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.recordType} - {record.recordName}
                            </div>
                            {isOverdue(record) && (
                              <Badge variant="destructive" className="mt-1">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.module}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(record.status)}
                              {record.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getPriorityBadgeVariant(record.priority)}
                          >
                            {record.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatDate(record.followUpDate)}</div>
                            {record.nextFollowUpDate && (
                              <div className="text-xs text-muted-foreground">
                                Next: {formatDate(record.nextFollowUpDate)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.assignedTo?.firstName || "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddUpdate(record)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {record.status !== "Completed" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCompleteClick(record)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(record)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* View Modal */}
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Follow-up Details</DialogTitle>
              </DialogHeader>
              {selectedRecord && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Title</Label>
                      <p className="font-medium">{selectedRecord.title}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Record</Label>
                      <p className="font-medium">
                        {selectedRecord.recordType} -{" "}
                        {selectedRecord.recordName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Module</Label>
                      <Badge variant="outline">{selectedRecord.module}</Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge
                        variant={getStatusBadgeVariant(selectedRecord.status)}
                      >
                        {selectedRecord.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Priority</Label>
                      <Badge
                        variant={getPriorityBadgeVariant(
                          selectedRecord.priority
                        )}
                      >
                        {selectedRecord.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Follow-up Date</Label>
                      <p>{formatDate(selectedRecord.followUpDate)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{selectedRecord.description}</p>
                  </div>

                  {selectedRecord.monthlyUpdates &&
                    selectedRecord.monthlyUpdates.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-lg">
                          Monthly Updates
                        </Label>
                        <div className="mt-2 space-y-2">
                          {selectedRecord.monthlyUpdates.map(
                            (update, index) => (
                              <Card key={index}>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          variant={getStatusBadgeVariant(
                                            update.status
                                          )}
                                        >
                                          {update.status}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {formatDate(update.date)}
                                        </span>
                                      </div>
                                      <p className="text-sm">{update.notes}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add/Edit Modals */}
          <Dialog
            open={addModalOpen || editModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                setAddModalOpen(false);
                setEditModalOpen(false);
                setSelectedRecord(null);
              }
            }}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editModalOpen ? "Edit Follow-up" : "Add Follow-up"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={editModalOpen ? handleSubmitEdit : handleSubmitNew}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Record Type *</Label>
                      <Select
                        value={formData.recordType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, recordType: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {recordTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Module *</Label>
                      <Select
                        value={formData.module}
                        onValueChange={(value) =>
                          setFormData({ ...formData, module: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module} value={module}>
                              {module}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Record ID *</Label>
                    <Input
                      value={formData.recordId}
                      onChange={(e) =>
                        setFormData({ ...formData, recordId: e.target.value })
                      }
                      placeholder="Enter valid MongoDB ObjectId (24 hex characters)"
                      required
                      pattern="^[a-fA-F0-9]{24}$"
                      title="Must be a valid MongoDB ObjectId (24 hexadecimal characters)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be a valid MongoDB ObjectId from an existing record
                    </p>
                  </div>

                  <div>
                    <Label>Record Name *</Label>
                    <Input
                      value={formData.recordName}
                      onChange={(e) =>
                        setFormData({ ...formData, recordName: e.target.value })
                      }
                      placeholder="Enter record name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Enter follow-up title"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority *</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          setFormData({ ...formData, priority: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                        required
                      >
                        <SelectTrigger>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Follow-up Date *</Label>
                      <Input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            followUpDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Next Follow-up Date</Label>
                      <Input
                        type="date"
                        value={formData.nextFollowUpDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nextFollowUpDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ward No</Label>
                      <Input
                        value={formData.wardNo}
                        onChange={(e) =>
                          setFormData({ ...formData, wardNo: e.target.value })
                        }
                        placeholder="Enter ward"
                      />
                    </div>
                    <div>
                      <Label>Habitation</Label>
                      <Input
                        value={formData.habitation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            habitation: e.target.value,
                          })
                        }
                        placeholder="Enter habitation"
                      />
                    </div>
                    <div>
                      <Label>Project Responsible</Label>
                      <Input
                        value={formData.projectResponsible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectResponsible: e.target.value,
                          })
                        }
                        placeholder="Enter project"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddModalOpen(false);
                      setEditModalOpen(false);
                      setSelectedRecord(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editModalOpen ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Monthly Update Modal */}
          <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monthly Update</DialogTitle>
                <DialogDescription>
                  {selectedRecord?.title} - {selectedRecord?.recordName}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitUpdate}>
                <div className="space-y-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={updateData.date}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Status *</Label>
                    <Select
                      value={updateData.status}
                      onValueChange={(value) =>
                        setUpdateData({ ...updateData, status: value })
                      }
                      required
                    >
                      <SelectTrigger>
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

                  <div>
                    <Label>Notes *</Label>
                    <Textarea
                      value={updateData.notes}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, notes: e.target.value })
                      }
                      placeholder="Enter update notes"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUpdateModalOpen(false);
                      setSelectedRecord(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Update</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Follow-up</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this tracking record? This
                  action cannot be undone.
                  {recordToDelete && (
                    <div className="mt-2 p-2 bg-secondary/50 rounded">
                      <strong>{recordToDelete.title}</strong>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Complete Confirmation Dialog */}
          <AlertDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Follow-up</AlertDialogTitle>
                <AlertDialogDescription>
                  Mark this tracking record as completed?
                  {recordToComplete && (
                    <div className="mt-2 p-2 bg-secondary/50 rounded">
                      <strong>{recordToComplete.title}</strong>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteConfirm}>
                  Complete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Error Modal */}
          <AlertDialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Error</AlertDialogTitle>
                <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default TrackingDashboard;




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
  DialogTrigger,
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
  Heart,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { healthCampAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import healthCampImportTemplate from "../lib/excelImport/templates/healthCamp";
import {
  ModulePageHeader,
  tableState,
  formatDate,
  formatWard,
  toDateInput,
} from "../components/module/ModuleKit";
import { getWardOptions } from "../lib/formOptions";

const WARD_OPTIONS = getWardOptions();

const HealthCamps = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthCamps, setHealthCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    targetGroup: "",
    medicineType: "",
    specialisation: "",
    wardNo: "",
    habitation: "",
    village: "",
    typeOfHealthCamp: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dateOfCamp: "",
    targetGroup: "",
    wardNo: "",
    habitation: "",
    village: "",
    projectResponsible: "",
    typeOfHealthCamp: "",
    medicineType: "",
    specialisation: "",
    organiser: "",
    numberOfDoctors: "",
    numberOfGDA: "",
    totalBeneficiaries: "",
    majorFindings: "",
    followUpDate: "",
    progressReporting: {},
  });

  // Fetch health camps
  const fetchHealthCamps = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      const response = await healthCampAPI.getAll(params);
      setHealthCamps(response.data.healthCamps);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch health camps");
      console.error("Error fetching health camps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCamps();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCamp) {
        await healthCampAPI.update(selectedCamp._id, formData);
        toast.success("Health camp updated successfully");
        setIsEditModalOpen(false);
      } else {
        await healthCampAPI.create(formData);
        toast.success("Health camp created successfully");
        setIsCreateModalOpen(false);
      }
      fetchHealthCamps();
      resetForm();
    } catch (error) {
      toast.error(
        selectedCamp
          ? "Failed to update health camp"
          : "Failed to create health camp"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await healthCampAPI.delete(id);
      toast.success("Health camp deleted successfully");
      fetchHealthCamps();
    } catch (error) {
      toast.error("Failed to delete health camp");
      console.error("Error deleting health camp:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      dateOfCamp: "",
      targetGroup: "",
      wardNo: "",
      habitation: "",
      village: "",
      projectResponsible: "",
      typeOfHealthCamp: "",
      medicineType: "",
      specialisation: "",
      organiser: "",
      numberOfDoctors: "",
      numberOfGDA: "",
      totalBeneficiaries: "",
      majorFindings: "",
      followUpDate: "",
      progressReporting: {},
    });
    setSelectedCamp(null);
  };

  // Handle edit
  const handleEdit = (camp) => {
    setSelectedCamp(camp);
    setFormData({
      dateOfCamp: toDateInput(camp.dateOfCamp),
      targetGroup: camp.targetGroup || "",
      wardNo: camp.wardNo || "",
      habitation: camp.habitation || "",
      village: camp.village || "",
      projectResponsible: camp.projectResponsible || "",
      typeOfHealthCamp: camp.typeOfHealthCamp || "",
      medicineType: camp.medicineType || "",
      specialisation: camp.specialisation || "",
      organiser: camp.organiser || "",
      numberOfDoctors: camp.numberOfDoctors ?? "",
      numberOfGDA: camp.numberOfGDA ?? "",
      totalBeneficiaries: camp.totalBeneficiaries ?? "",
      majorFindings: camp.majorFindings || "",
      followUpDate: toDateInput(camp.followUpDate),
      progressReporting: camp.progressReporting || {},
    });
    setIsEditModalOpen(true);
  };

  // Handle view
  const handleView = (camp) => {
    setSelectedCamp(camp);
    setIsViewModalOpen(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      targetGroup: "",
      medicineType: "",
      specialisation: "",
      wardNo: "",
      habitation: "",
      village: "",
      typeOfHealthCamp: "",
    });
    setSearchTerm("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModulePageHeader
          icon={Heart}
          accent="text-red-600"
          title="Health Camps"
          subtitle="Community health camps, services delivered and beneficiaries reached"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("health") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Health Camp
              </Button>
            )
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="Health Camp Guidelines"
            description="Follow these steps to ensure accurate recording of health camp data."
            items={[
              "Use accurate dates and target group categories.",
              "Ensure the ward and habitation details are correctly specified.",
              "Record the total number of beneficiaries for accurate reporting.",
              "Document major medical findings and specialisations involved.",
              "Set follow-up dates for critical cases identified during the camp.",
            ]}
          />
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search health camps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="targetGroup">Target Group</Label>
                  <Select
                    value={filters.targetGroup}
                    onValueChange={(value) =>
                      handleFilterChange("targetGroup", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Target Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Target Groups</SelectItem>
                      <SelectItem value="Children">Children</SelectItem>
                      <SelectItem value="Women">Women</SelectItem>
                      <SelectItem value="Elderly">Elderly</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Pregnant Women">
                        Pregnant Women
                      </SelectItem>
                      <SelectItem value="Adolescents">Adolescents</SelectItem>
                      <SelectItem value="PwD">PwD</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="typeOfHealthCamp">Type of Health Camp</Label>
                  <Select
                    value={filters.typeOfHealthCamp}
                    onValueChange={(value) =>
                      handleFilterChange("typeOfHealthCamp", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="General Health Checkup">
                        General Health Checkup
                      </SelectItem>
                      <SelectItem value="Eye Checkup">Eye Checkup</SelectItem>
                      <SelectItem value="Dental Checkup">
                        Dental Checkup
                      </SelectItem>
                      <SelectItem value="Maternal Health">
                        Maternal Health
                      </SelectItem>
                      <SelectItem value="Child Health">Child Health</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Mental Health">
                        Mental Health
                      </SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                      <SelectItem value="Chronic Disease">
                        Chronic Disease
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="medicineType">Medicine Type</Label>
                  <Select
                    value={filters.medicineType}
                    onValueChange={(value) =>
                      handleFilterChange("medicineType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Medicine Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Allopathic">Allopathic</SelectItem>
                      <SelectItem value="Ayurvedic">Ayurvedic</SelectItem>
                      <SelectItem value="Homeopathic">Homeopathic</SelectItem>
                      <SelectItem value="Unani">Unani</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    placeholder="Filter by village"
                    value={filters.village}
                    onChange={(e) =>
                      handleFilterChange("village", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="filter-wardNo">Ward No</Label>
                  <Select
                    value={filters.wardNo}
                    onValueChange={(value) =>
                      handleFilterChange("wardNo", value)
                    }
                  >
                    <SelectTrigger id="filter-wardNo">
                      <SelectValue placeholder="All Wards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {WARD_OPTIONS.map((ward) => (
                        <SelectItem key={ward.value} value={ward.value}>
                          {ward.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="habitation">Habitation</Label>
                  <Input
                    id="habitation"
                    placeholder="Filter by habitation"
                    value={filters.habitation}
                    onChange={(e) =>
                      handleFilterChange("habitation", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Import */}
          {canCreate("health") && (
            <ExcelImportPanel
              template={healthCampImportTemplate}
              createRecord={healthCampAPI.create}
              onImported={fetchHealthCamps}
            />
          )}

          {/* Health Camps Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Health Camps ({pagination.totalItems || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={fetchHealthCamps}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Target Group</TableHead>
                      <TableHead>Type of Camp</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead>Ward/Habitation</TableHead>
                      <TableHead>Medicine Type</TableHead>
                      <TableHead>Beneficiaries</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: healthCamps.length,
                      colSpan: 8,
                      filtered:
                        Boolean(searchTerm) ||
                        Object.values(filters).some((v) => v && v !== "all"),
                    })}
                    {!loading &&
                      healthCamps.map((camp) => (
                        <TableRow key={camp._id}>
                          <TableCell>
                            {formatDate(camp.dateOfCamp)}
                          </TableCell>
                          <TableCell>{camp.targetGroup}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {camp.typeOfHealthCamp}
                            </Badge>
                          </TableCell>
                          <TableCell>{camp.village}</TableCell>
                          <TableCell>
                            {formatWard(camp.wardNo)}, {camp.habitation}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{camp.medicineType}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {camp.totalBeneficiaries}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(camp)}
                                aria-label="View health camp"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("health") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(camp)}
                                  aria-label="Edit health camp"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("health") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Delete health camp"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Health Camp
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(camp._id)}
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
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.itemsPerPage,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Health Camp</DialogTitle>
            <DialogDescription>
              Fill in the details for the new health camp.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfCamp">Date of Camp *</Label>
                <Input
                  id="dateOfCamp"
                  name="dateOfCamp"
                  type="date"
                  value={formData.dateOfCamp}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="targetGroup">Target Group *</Label>
                <Select
                  value={formData.targetGroup}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, targetGroup: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Children">Children</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Elderly">Elderly</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Pregnant Women">
                      Pregnant Women
                    </SelectItem>
                    <SelectItem value="Adolescents">Adolescents</SelectItem>
                    <SelectItem value="PwD">PwD</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wardNo">Ward No *</Label>
                <Select
                  value={formData.wardNo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, wardNo: value }))
                  }
                >
                  <SelectTrigger id="wardNo">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARD_OPTIONS.map((ward) => (
                      <SelectItem key={ward.value} value={ward.value}>
                        {ward.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="habitation">Habitation *</Label>
                <Input
                  id="habitation"
                  name="habitation"
                  value={formData.habitation}
                  onChange={handleInputChange}
                  placeholder="Habitation name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="village">Village *</Label>
                <Input
                  id="village"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  placeholder="Village name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectResponsible">
                  Project Responsible *
                </Label>
                <Input
                  id="projectResponsible"
                  name="projectResponsible"
                  value={formData.projectResponsible}
                  onChange={handleInputChange}
                  placeholder="Person responsible for project"
                  required
                />
              </div>
              <div>
                <Label htmlFor="typeOfHealthCamp">Type of Health Camp *</Label>
                <Select
                  value={formData.typeOfHealthCamp}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      typeOfHealthCamp: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type of health camp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Health Checkup">
                      General Health Checkup
                    </SelectItem>
                    <SelectItem value="Eye Checkup">Eye Checkup</SelectItem>
                    <SelectItem value="Dental Checkup">
                      Dental Checkup
                    </SelectItem>
                    <SelectItem value="Maternal Health">
                      Maternal Health
                    </SelectItem>
                    <SelectItem value="Child Health">Child Health</SelectItem>
                    <SelectItem value="Vaccination">Vaccination</SelectItem>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Nutrition">Nutrition</SelectItem>
                    <SelectItem value="Chronic Disease">
                      Chronic Disease
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="medicineType">Medicine Type *</Label>
                <Select
                  value={formData.medicineType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, medicineType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Allopathic">Allopathic</SelectItem>
                    <SelectItem value="Ayurvedic">Ayurvedic</SelectItem>
                    <SelectItem value="Homeopathic">Homeopathic</SelectItem>
                    <SelectItem value="Unani">Unani</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specialisation">Specialisation *</Label>
                <Input
                  id="specialisation"
                  name="specialisation"
                  value={formData.specialisation}
                  onChange={handleInputChange}
                  placeholder="Medical specialisation"
                  required
                />
              </div>
              <div>
                <Label htmlFor="organiser">Organiser *</Label>
                <Input
                  id="organiser"
                  name="organiser"
                  value={formData.organiser}
                  onChange={handleInputChange}
                  placeholder="Camp organiser"
                  required
                />
              </div>
              <div>
                <Label htmlFor="numberOfDoctors">Number of Doctors *</Label>
                <Input
                  id="numberOfDoctors"
                  name="numberOfDoctors"
                  type="number"
                  min="0"
                  value={formData.numberOfDoctors}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="numberOfGDA">Number of GDA *</Label>
                <Input
                  id="numberOfGDA"
                  name="numberOfGDA"
                  type="number"
                  min="0"
                  value={formData.numberOfGDA}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalBeneficiaries">
                  Total Beneficiaries *
                </Label>
                <Input
                  id="totalBeneficiaries"
                  name="totalBeneficiaries"
                  type="number"
                  min="0"
                  value={formData.totalBeneficiaries}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="majorFindings">Major Findings *</Label>
              <Textarea
                id="majorFindings"
                name="majorFindings"
                value={formData.majorFindings}
                onChange={handleInputChange}
                required
                placeholder="Describe major findings from the health camp"
              />
            </div>
            <div>
              <Label htmlFor="followUpDate">Follow Up Date</Label>
              <Input
                id="followUpDate"
                name="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={handleInputChange}
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
              <Button type="submit">Create Health Camp</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Health Camp</DialogTitle>
            <DialogDescription>
              Update the health camp details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-dateOfCamp">Date of Camp *</Label>
                <Input
                  id="edit-dateOfCamp"
                  name="dateOfCamp"
                  type="date"
                  value={formData.dateOfCamp}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-targetGroup">Target Group *</Label>
                <Select
                  value={formData.targetGroup}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, targetGroup: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Children">Children</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Elderly">Elderly</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Pregnant Women">
                      Pregnant Women
                    </SelectItem>
                    <SelectItem value="Adolescents">Adolescents</SelectItem>
                    <SelectItem value="PwD">PwD</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-wardNo">Ward No *</Label>
                <Select
                  value={formData.wardNo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, wardNo: value }))
                  }
                >
                  <SelectTrigger id="edit-wardNo">
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARD_OPTIONS.map((ward) => (
                      <SelectItem key={ward.value} value={ward.value}>
                        {ward.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-habitation">Habitation *</Label>
                <Input
                  id="edit-habitation"
                  name="habitation"
                  value={formData.habitation}
                  onChange={handleInputChange}
                  placeholder="Habitation name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-village">Village *</Label>
                <Input
                  id="edit-village"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  placeholder="Village name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-projectResponsible">
                  Project Responsible *
                </Label>
                <Input
                  id="edit-projectResponsible"
                  name="projectResponsible"
                  value={formData.projectResponsible}
                  onChange={handleInputChange}
                  placeholder="Person responsible for project"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-typeOfHealthCamp">
                  Type of Health Camp *
                </Label>
                <Select
                  value={formData.typeOfHealthCamp}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      typeOfHealthCamp: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type of health camp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Health Checkup">
                      General Health Checkup
                    </SelectItem>
                    <SelectItem value="Eye Checkup">Eye Checkup</SelectItem>
                    <SelectItem value="Dental Checkup">
                      Dental Checkup
                    </SelectItem>
                    <SelectItem value="Maternal Health">
                      Maternal Health
                    </SelectItem>
                    <SelectItem value="Child Health">Child Health</SelectItem>
                    <SelectItem value="Vaccination">Vaccination</SelectItem>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Nutrition">Nutrition</SelectItem>
                    <SelectItem value="Chronic Disease">
                      Chronic Disease
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-medicineType">Medicine Type *</Label>
                <Select
                  value={formData.medicineType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, medicineType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Allopathic">Allopathic</SelectItem>
                    <SelectItem value="Ayurvedic">Ayurvedic</SelectItem>
                    <SelectItem value="Homeopathic">Homeopathic</SelectItem>
                    <SelectItem value="Unani">Unani</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-specialisation">Specialisation *</Label>
                <Input
                  id="edit-specialisation"
                  name="specialisation"
                  value={formData.specialisation}
                  onChange={handleInputChange}
                  placeholder="Medical specialisation"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-organiser">Organiser *</Label>
                <Input
                  id="edit-organiser"
                  name="organiser"
                  value={formData.organiser}
                  onChange={handleInputChange}
                  placeholder="Camp organiser"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-numberOfDoctors">
                  Number of Doctors *
                </Label>
                <Input
                  id="edit-numberOfDoctors"
                  name="numberOfDoctors"
                  type="number"
                  min="0"
                  value={formData.numberOfDoctors}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-numberOfGDA">Number of GDA *</Label>
                <Input
                  id="edit-numberOfGDA"
                  name="numberOfGDA"
                  type="number"
                  min="0"
                  value={formData.numberOfGDA}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-totalBeneficiaries">
                  Total Beneficiaries *
                </Label>
                <Input
                  id="edit-totalBeneficiaries"
                  name="totalBeneficiaries"
                  type="number"
                  min="0"
                  value={formData.totalBeneficiaries}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-majorFindings">Major Findings *</Label>
              <Textarea
                id="edit-majorFindings"
                name="majorFindings"
                value={formData.majorFindings}
                onChange={handleInputChange}
                required
                placeholder="Describe major findings from the health camp"
              />
            </div>
            <div>
              <Label htmlFor="edit-followUpDate">Follow Up Date</Label>
              <Input
                id="edit-followUpDate"
                name="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={handleInputChange}
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
              <Button type="submit">Update Health Camp</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Health Camp Details</DialogTitle>
          </DialogHeader>
          {selectedCamp && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Date of Camp</Label>
                  <p>
                    {formatDate(selectedCamp.dateOfCamp)}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Target Group</Label>
                  <p>{selectedCamp.targetGroup}</p>
                </div>
                <div>
                  <Label className="font-semibold">Ward No</Label>
                  <p>{formatWard(selectedCamp.wardNo)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Habitation</Label>
                  <p>{selectedCamp.habitation}</p>
                </div>
                <div>
                  <Label className="font-semibold">Village</Label>
                  <p>{selectedCamp.village}</p>
                </div>
                <div>
                  <Label className="font-semibold">Project Responsible</Label>
                  <p>{selectedCamp.projectResponsible}</p>
                </div>
                <div>
                  <Label className="font-semibold">Type of Health Camp</Label>
                  <Badge variant="outline">
                    {selectedCamp.typeOfHealthCamp}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Medicine Type</Label>
                  <Badge variant="outline">{selectedCamp.medicineType}</Badge>
                </div>
                <div>
                  <Label className="font-semibold">Specialisation</Label>
                  <p>{selectedCamp.specialisation}</p>
                </div>
                <div>
                  <Label className="font-semibold">Organiser</Label>
                  <p>{selectedCamp.organiser}</p>
                </div>
                <div>
                  <Label className="font-semibold">Number of Doctors</Label>
                  <p>{selectedCamp.numberOfDoctors}</p>
                </div>
                <div>
                  <Label className="font-semibold">Number of GDA</Label>
                  <p>{selectedCamp.numberOfGDA}</p>
                </div>
                <div>
                  <Label className="font-semibold">Total Beneficiaries</Label>
                  <p>{selectedCamp.totalBeneficiaries}</p>
                </div>
              </div>
              {selectedCamp.majorFindings && (
                <div>
                  <Label className="font-semibold">Major Findings</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedCamp.majorFindings}
                  </p>
                </div>
              )}
              {selectedCamp.followUpDate && (
                <div>
                  <Label className="font-semibold">Follow Up Date</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(selectedCamp.followUpDate)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthCamps;




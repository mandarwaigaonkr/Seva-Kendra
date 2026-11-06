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
  Activity,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Menu,
} from "lucide-react";
import { tbhivAddictAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import GuidelinesCard from "../components/GuidelinesCard";

const TBHIVAddict = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tbhivAddict, setTbhivAddict] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    conditionType: "",
    treatmentStatus: "",
    wardNo: "",
    habitation: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    householdCode: "",
    nameOfPatient: "",
    uniqueId: "",
    gender: "",
    age: "",
    contactNo: "",
    headOfHousehold: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    conditionType: "",
    diagnosisDate: "",
    treatmentStatus: "",
    treatmentStartDate: "",
    treatmentCentre: "",
    dateOfReporting: "",
    reportedBy: "",
    medicalHistory: "",
    currentMedication: "",
    adherenceStatus: "",
    sideEffects: "",
    socialSupport: "",
    counselingProvided: "",
    servicesProvided: "",
    referralsGiven: "",
    progressReporting: {},
  });

  // Fetch TBHIVAddict records
  const fetchTbhivAddict = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      const response = await tbhivAddictAPI.getAll(params);
      setTbhivAddict(response.data.tbhivAddict);
      setPagination(normalizePagination(response.data.pagination));
    } catch (error) {
      toast.error("Failed to fetch TB/HIV/Addict records");
      console.error("Error fetching TB/HIV/Addict records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTbhivAddict();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await tbhivAddictAPI.update(selectedRecord._id, formData);
        toast.success("TB/HIV/Addict record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await tbhivAddictAPI.create(formData);
        toast.success("TB/HIV/Addict record created successfully");
        setIsCreateModalOpen(false);
      }
      fetchTbhivAddict();
      resetForm();
    } catch (error) {
      toast.error(
        selectedRecord ? "Failed to update record" : "Failed to create record"
      );
      console.error("Error submitting form:", error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await tbhivAddictAPI.delete(id);
      toast.success("TB/HIV/Addict record deleted successfully");
      fetchTbhivAddict();
    } catch (error) {
      toast.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      householdCode: "",
      nameOfPatient: "",
      uniqueId: "",
      gender: "",
      age: "",
      contactNo: "",
      headOfHousehold: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      conditionType: "",
      diagnosisDate: "",
      treatmentStatus: "",
      treatmentStartDate: "",
      treatmentCentre: "",
      dateOfReporting: "",
      reportedBy: "",
      medicalHistory: "",
      currentMedication: "",
      adherenceStatus: "",
      sideEffects: "",
      socialSupport: "",
      counselingProvided: "",
      servicesProvided: "",
      referralsGiven: "",
      progressReporting: {},
    });
    setSelectedRecord(null);
  };

  // Handle edit
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      householdCode: record.householdCode || "",
      nameOfPatient: record.nameOfPatient || "",
      uniqueId: record.uniqueId || "",
      gender: record.gender || "",
      age: record.age || "",
      contactNo: record.contactNo || "",
      headOfHousehold: record.headOfHousehold || "",
      wardNo: record.wardNo || "",
      habitation: record.habitation || "",
      projectResponsible: record.projectResponsible || "",
      conditionType: record.conditionType || "",
      diagnosisDate: record.diagnosisDate
        ? new Date(record.diagnosisDate).toISOString().split("T")[0]
        : "",
      treatmentStatus: record.treatmentStatus || "",
      treatmentStartDate: record.treatmentStartDate
        ? new Date(record.treatmentStartDate).toISOString().split("T")[0]
        : "",
      treatmentCentre: record.treatmentCentre || "",
      dateOfReporting: record.dateOfReporting
        ? new Date(record.dateOfReporting).toISOString().split("T")[0]
        : "",
      reportedBy: record.reportedBy || "",
      medicalHistory: record.medicalHistory || "",
      currentMedication: record.currentMedication || "",
      adherenceStatus: record.adherenceStatus || "",
      sideEffects: record.sideEffects || "",
      socialSupport: record.socialSupport || "",
      counselingProvided: record.counselingProvided || "",
      servicesProvided: record.servicesProvided || "",
      referralsGiven: record.referralsGiven || "",
      progressReporting: record.progressReporting || {},
    });
    setIsEditModalOpen(true);
  };

  // Handle view
  const handleView = (record) => {
    setSelectedRecord(record);
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
      gender: "",
      conditionType: "",
      treatmentStatus: "",
      wardNo: "",
      habitation: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background shadow-md border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold text-foreground">
                  TB/HIV/Addiction
                </h1>
              </div>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add TB/HIV/Addict Record
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="TB/HIV/Addiction Care Guidelines"
            description="Manage care and tracking for beneficiaries with specialized health needs."
            items={[
              "Ensure accurate condition type (TB, HIV, Addiction, or TB-HIV) is selected.",
              "Track treatment start dates and associated medical centers for continuity of care.",
              "Document adherence status and any reported side effects of medications.",
              "Track social support provided and counseling sessions conducted.",
              "Ensure referrals to specialized centers are documented with follow-up status.",
            ]}
          />
          {/* Filters */}
          <FilterBar>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  {/* <Label htmlFor="gender">Gender</Label>
                  <Select value={filters.gender} onValueChange={(value) => handleFilterChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
                <div>
                  {/* <Label htmlFor="conditionType">Condition Type</Label>
                  <Select value={filters.conditionType} onValueChange={(value) => handleFilterChange("conditionType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      <SelectItem value="TB">Tuberculosis</SelectItem>
                      <SelectItem value="HIV">HIV/AIDS</SelectItem>
                      <SelectItem value="Addiction">Addiction</SelectItem>
                      <SelectItem value="TB-HIV">TB-HIV Co-infection</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
                <div>
                  {/* <Label htmlFor="treatmentStatus">Treatment Status</Label>
                  <Select value={filters.treatmentStatus} onValueChange={(value) => handleFilterChange("treatmentStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="On Treatment">On Treatment</SelectItem>
                      <SelectItem value="Treatment Completed">Treatment Completed</SelectItem>
                      <SelectItem value="Treatment Defaulted">Treatment Defaulted</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
                <div>
                  {/* <Label htmlFor="wardNo">Ward No</Label>
                  <Input
                    id="wardNo"
                    placeholder="Filter by ward"
                    value={filters.wardNo}
                    onChange={(e) => handleFilterChange("wardNo", e.target.value)}
                  /> */}
                </div>
                <div className="flex items-end">
                  {/* <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button> */}
                </div>
              </div>
            </FilterBar>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  TB/HIV/Addiction Records ({pagination.totalItems || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={fetchTbhivAddict}
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
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Treatment Status</TableHead>
                      <TableHead>Treatment Centre</TableHead>
                      <TableHead>Ward/Habitation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : tbhivAddict.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No TB/HIV/Addiction records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tbhivAddict.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.nameOfPatient}
                          </TableCell>
                          <TableCell>
                            {record.age}, {record.gender}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.conditionType === "TB"
                                  ? "destructive"
                                  : record.conditionType === "HIV"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {record.conditionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.treatmentStatus === "On Treatment"
                                  ? "default"
                                  : record.treatmentStatus ===
                                    "Treatment Completed"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {record.treatmentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.treatmentCentre}</TableCell>
                          <TableCell>
                            Ward {record.wardNo}, {record.habitation}
                          </TableCell>
                          <TableCell>{record.contactNo}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(record)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Record
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
                                      onClick={() => handleDelete(record._id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New TB/HIV/Addiction Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="householdCode">Household Code *</Label>
                <Input
                  id="householdCode"
                  name="householdCode"
                  value={formData.householdCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameOfPatient">Patient Name *</Label>
                <Input
                  id="nameOfPatient"
                  name="nameOfPatient"
                  value={formData.nameOfPatient}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="uniqueId">Unique ID *</Label>
                <Input
                  id="uniqueId"
                  name="uniqueId"
                  value={formData.uniqueId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
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
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input
                  id="contactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <Label htmlFor="headOfHousehold">Head of Household *</Label>
                <Input
                  id="headOfHousehold"
                  name="headOfHousehold"
                  value={formData.headOfHousehold}
                  onChange={handleInputChange}
                  required
                />
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
                    <SelectItem value="Ward 1">Ward 1</SelectItem>
                    <SelectItem value="Ward 2">Ward 2</SelectItem>
                    <SelectItem value="Ward 3">Ward 3</SelectItem>
                    <SelectItem value="Ward 4">Ward 4</SelectItem>
                    <SelectItem value="Ward 5">Ward 5</SelectItem>
                    <SelectItem value="Ward 6">Ward 6</SelectItem>
                    <SelectItem value="Ward 7">Ward 7</SelectItem>
                    <SelectItem value="Ward 8">Ward 8</SelectItem>
                    <SelectItem value="Ward 9">Ward 9</SelectItem>
                    <SelectItem value="Ward 10">Ward 10</SelectItem>
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="conditionType">Condition Type *</Label>
                <Select
                  value={formData.conditionType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, conditionType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TB">Tuberculosis</SelectItem>
                    <SelectItem value="HIV">HIV/AIDS</SelectItem>
                    <SelectItem value="Addiction">Addiction</SelectItem>
                    <SelectItem value="TB-HIV">TB-HIV Co-infection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="treatmentStatus">Treatment Status</Label>
                <Select
                  value={formData.treatmentStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, treatmentStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Treatment">On Treatment</SelectItem>
                    <SelectItem value="Treatment Completed">
                      Treatment Completed
                    </SelectItem>
                    <SelectItem value="Treatment Defaulted">
                      Treatment Defaulted
                    </SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="treatmentCentre">Treatment Centre</Label>
                <Input
                  id="treatmentCentre"
                  name="treatmentCentre"
                  value={formData.treatmentCentre}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                <Input
                  id="diagnosisDate"
                  name="diagnosisDate"
                  type="date"
                  value={formData.diagnosisDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="dateOfReporting">Date of Reporting *</Label>
                <Input
                  id="dateOfReporting"
                  name="dateOfReporting"
                  type="date"
                  value={formData.dateOfReporting}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reportedBy">Reported By *</Label>
                <Input
                  id="reportedBy"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit and View modals similar to create */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit TB/HIV/Addiction Record</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsEditModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>TB/HIV/Addiction Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Patient Name</Label>
                  <p>{selectedRecord.nameOfPatient}</p>
                </div>
                <div>
                  <Label className="font-semibold">Condition Type</Label>
                  <Badge>{selectedRecord.conditionType}</Badge>
                </div>
              </div>
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

export default TBHIVAddict;




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
  Baby,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { motherChildAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import motherChildImportTemplate from "../lib/excelImport/templates/motherChild";
import {
  ModulePageHeader,
  StatusBadge,
  tableState,
  formatDate,
  formatWard,
  toDateInput,
} from "../components/module/ModuleKit";
import { getWardOptions } from "../lib/formOptions";

const WARD_OPTIONS = getWardOptions();

const MotherChild = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [motherChild, setMotherChild] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    wardNo: "",
    habitation: "",
    immunizationStatus: "",
    nutritionalStatus: "",
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
    nameOfMother: "",
    uniqueId: "",
    gender: "",
    ageOfMother: "",
    contactNo: "",
    headOfHousehold: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    district: "",
    state: "",
    nameOfChild: "",
    ageOfChild: "",
    dateOfReporting: "",
    reportedBy: "",
    pregnantOrLactatingMother: "",
    antenatalCareDetails: "",
    deliveryDetails: "",
    deliveryArea: "",
    birthCertificate: "",
    postnatalCareDetails: "",
    immunizationStatus: "",
    nutritionalStatus: "",
    healthCheckups: "",
    childImmunizationStatus: "",
    childNutritionalStatus: "",
    childDevelopmentMilestones: "",
    servicesProvided: "",
    referralsGiven: "",
    governmentSchemes: "",
    progressReporting: {},
  });

  // Fetch mother child records
  const fetchMotherChild = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      const response = await motherChildAPI.getAll(params);
      setMotherChild(response.data.motherChild);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch mother child records");
      console.error("Error fetching mother child records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotherChild();
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Optional enums: Mongoose rejects "" as a value, so omit them when unset.
      const payload = { ...formData };
      [
        "deliveryArea",
        "birthCertificate",
        "immunizationStatus",
        "nutritionalStatus",
        "childImmunizationStatus",
        "childNutritionalStatus",
      ].forEach((key) => {
        if (!payload[key]) payload[key] = undefined;
      });

      if (selectedRecord) {
        await motherChildAPI.update(selectedRecord._id, payload);
        toast.success("Mother child record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await motherChildAPI.create(payload);
        toast.success("Mother child record created successfully");
        setIsCreateModalOpen(false);
      }
      fetchMotherChild();
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
      await motherChildAPI.delete(id);
      toast.success("Mother child record deleted successfully");
      fetchMotherChild();
    } catch (error) {
      toast.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      householdCode: "",
      nameOfMother: "",
      uniqueId: "",
      gender: "",
      ageOfMother: "",
      contactNo: "",
      headOfHousehold: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      district: "",
      state: "",
      nameOfChild: "",
      ageOfChild: "",
      dateOfReporting: "",
      reportedBy: "",
      pregnantOrLactatingMother: "",
      antenatalCareDetails: "",
      deliveryDetails: "",
      deliveryArea: "",
      birthCertificate: "",
      postnatalCareDetails: "",
      immunizationStatus: "",
      nutritionalStatus: "",
      healthCheckups: "",
      childImmunizationStatus: "",
      childNutritionalStatus: "",
      childDevelopmentMilestones: "",
      servicesProvided: "",
      referralsGiven: "",
      governmentSchemes: "",
      progressReporting: {},
    });
    setSelectedRecord(null);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Handle edit
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      householdCode: record.householdCode || "",
      nameOfMother: record.nameOfMother || "",
      uniqueId: record.uniqueId || "",
      gender: record.gender || "",
      ageOfMother: record.ageOfMother ?? "",
      contactNo: record.contactNo || "",
      headOfHousehold: record.headOfHousehold || "",
      wardNo: record.wardNo || "",
      habitation: record.habitation || "",
      projectResponsible: record.projectResponsible || "",
      district: record.district || "",
      state: record.state || "",
      nameOfChild: record.nameOfChild || "",
      ageOfChild: record.ageOfChild ?? "",
      dateOfReporting: toDateInput(record.dateOfReporting),
      reportedBy: record.reportedBy || "",
      pregnantOrLactatingMother: record.pregnantOrLactatingMother || "",
      antenatalCareDetails: record.antenatalCareDetails || "",
      deliveryDetails: record.deliveryDetails || "",
      deliveryArea: record.deliveryArea || "",
      birthCertificate: record.birthCertificate || "",
      postnatalCareDetails: record.postnatalCareDetails || "",
      immunizationStatus: record.immunizationStatus || "",
      nutritionalStatus: record.nutritionalStatus || "",
      healthCheckups: record.healthCheckups || "",
      childImmunizationStatus: record.childImmunizationStatus || "",
      childNutritionalStatus: record.childNutritionalStatus || "",
      childDevelopmentMilestones: record.childDevelopmentMilestones || "",
      servicesProvided: record.servicesProvided || "",
      referralsGiven: record.referralsGiven || "",
      governmentSchemes: record.governmentSchemes || "",
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
      wardNo: "",
      habitation: "",
      immunizationStatus: "",
      nutritionalStatus: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModulePageHeader
          icon={Baby}
          accent="text-pink-600"
          title="Mother & Child"
          subtitle="Maternal and child health: ANC/PNC, immunization and nutrition"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("health") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mother & Child Record
              </Button>
            )
          }
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="Mother & Child Care Guidelines"
            description="Ensure comprehensive tracking of health indicators for both mother and child."
            items={[
              "Capture accurate antenatal (ANC) and postnatal (PNC) care visit details.",
              "Track immunization schedules for both mother (TT) and child.",
              "Monitor nutritional status and growth milestones of the child.",
              "Document linkage with ICDS (Anganwadi) and government health schemes.",
              "Ensure delivery details include location (Institutional/Home) and certificate status.",
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
                  <Label htmlFor="filter-gender">Gender</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) => handleFilterChange("gender", value)}
                  >
                    <SelectTrigger id="filter-gender">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-immunizationStatus">Immunization (Mother)</Label>
                  <Select
                    value={filters.immunizationStatus}
                    onValueChange={(value) => handleFilterChange("immunizationStatus", value)}
                  >
                    <SelectTrigger id="filter-immunizationStatus">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                      <SelectItem value="Incomplete">Incomplete</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-nutritionalStatus">Nutrition (Mother)</Label>
                  <Select
                    value={filters.nutritionalStatus}
                    onValueChange={(value) => handleFilterChange("nutritionalStatus", value)}
                  >
                    <SelectTrigger id="filter-nutritionalStatus">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Underweight">Underweight</SelectItem>
                      <SelectItem value="Overweight">Overweight</SelectItem>
                      <SelectItem value="Malnourished">Malnourished</SelectItem>
                      <SelectItem value="Severely Malnourished">Severely Malnourished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-wardNo">Ward No</Label>
                  <Select
                    value={filters.wardNo}
                    onValueChange={(value) => handleFilterChange("wardNo", value)}
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
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Import */}
          {canCreate("health") && (
            <ExcelImportPanel
              template={motherChildImportTemplate}
              createRecord={motherChildAPI.create}
              onImported={fetchMotherChild}
            />
          )}

          {/* Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Mother & Child Records ({pagination.totalItems || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={fetchMotherChild}
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
                      <TableHead>Mother Name</TableHead>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Ages</TableHead>
                      <TableHead>Ward/Habitation</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Immunization</TableHead>
                      <TableHead>Nutrition</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: motherChild.length,
                      colSpan: 8,
                      filtered:
                        Boolean(searchTerm) ||
                        Object.values(filters).some((v) => v && v !== "all"),
                    })}
                    {!loading &&
                      motherChild.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.nameOfMother}
                          </TableCell>
                          <TableCell>{record.nameOfChild}</TableCell>
                          <TableCell>
                            M: {record.ageOfMother}, C: {record.ageOfChild}
                          </TableCell>
                          <TableCell>
                            {formatWard(record.wardNo)}, {record.habitation}
                          </TableCell>
                          <TableCell>{record.contactNo}</TableCell>
                          <TableCell>
                            <StatusBadge value={record.immunizationStatus} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={record.nutritionalStatus} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(record)}
                                aria-label="View record"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("health") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  aria-label="Edit record"
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
                                      aria-label="Delete record"
                                    >
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

      {/* Create/Edit Modal Form would go here - abbreviated for space */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Mother & Child Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Information */}
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
                <Label htmlFor="nameOfMother">Mother Name *</Label>
                <Input
                  id="nameOfMother"
                  name="nameOfMother"
                  value={formData.nameOfMother}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameOfChild">Child Name *</Label>
                <Input
                  id="nameOfChild"
                  name="nameOfChild"
                  value={formData.nameOfChild}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ageOfMother">Mother Age *</Label>
                <Input
                  id="ageOfMother"
                  name="ageOfMother"
                  type="number"
                  min="15"
                  max="50"
                  value={formData.ageOfMother}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ageOfChild">Child Age *</Label>
                <Input
                  id="ageOfChild"
                  name="ageOfChild"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.ageOfChild}
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
                    setFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }))
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
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State name"
                  required
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
              <div>
                <Label htmlFor="pregnantOrLactatingMother">
                  Pregnant or Lactating Mother *
                </Label>
                <Select
                  value={formData.pregnantOrLactatingMother}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      pregnantOrLactatingMother: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pregnant">Pregnant</SelectItem>
                    <SelectItem value="Lactating">Lactating</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                    <SelectItem value="Neither">Neither</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="antenatalCareDetails">Antenatal Care Details</Label>
                <Textarea
                  id="antenatalCareDetails"
                  name="antenatalCareDetails"
                  value={formData.antenatalCareDetails}
                  onChange={handleInputChange}
                  placeholder="Details about antenatal care"
                />
              </div>
              <div>
                <Label htmlFor="deliveryDetails">Delivery Details</Label>
                <Textarea
                  id="deliveryDetails"
                  name="deliveryDetails"
                  value={formData.deliveryDetails}
                  onChange={handleInputChange}
                  placeholder="Details about delivery"
                />
              </div>
              <div>
                <Label htmlFor="deliveryArea">Delivery Area</Label>
                <Select
                  value={formData.deliveryArea}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryArea: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Primary Health Center">
                      Primary Health Center
                    </SelectItem>
                    <SelectItem value="Community Health Center">
                      Community Health Center
                    </SelectItem>
                    <SelectItem value="Private Clinic">
                      Private Clinic
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthCertificate">Birth Certificate</Label>
                <Select
                  value={formData.birthCertificate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      birthCertificate: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="In Process">In Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postnatalCareDetails">Postnatal Care Details</Label>
                <Textarea
                  id="postnatalCareDetails"
                  name="postnatalCareDetails"
                  value={formData.postnatalCareDetails}
                  onChange={handleInputChange}
                  placeholder="Details about postnatal care"
                />
              </div>
              <div>
                <Label htmlFor="healthCheckups">Health Checkups</Label>
                <Textarea
                  id="healthCheckups"
                  name="healthCheckups"
                  value={formData.healthCheckups}
                  onChange={handleInputChange}
                  placeholder="Details about health checkups"
                />
              </div>
              <div>
                <Label htmlFor="governmentSchemes">Government Schemes</Label>
                <Textarea
                  id="governmentSchemes"
                  name="governmentSchemes"
                  value={formData.governmentSchemes}
                  onChange={handleInputChange}
                  placeholder="Details about government schemes enrolled"
                />
              </div>
              <div>
                <Label htmlFor="immunizationStatus">Immunization Status</Label>
                <Select
                  value={formData.immunizationStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      immunizationStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nutritionalStatus">Nutritional Status</Label>
                <Select
                  value={formData.nutritionalStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutritionalStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Underweight">Underweight</SelectItem>
                    <SelectItem value="Overweight">Overweight</SelectItem>
                    <SelectItem value="Malnourished">Malnourished</SelectItem>
                    <SelectItem value="Severely Malnourished">
                      Severely Malnourished
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="childImmunizationStatus">
                  Child Immunization Status
                </Label>
                <Select
                  value={formData.childImmunizationStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      childImmunizationStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="childNutritionalStatus">
                  Child Nutritional Status
                </Label>
                <Select
                  value={formData.childNutritionalStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      childNutritionalStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Underweight">Underweight</SelectItem>
                    <SelectItem value="Overweight">Overweight</SelectItem>
                    <SelectItem value="Malnourished">Malnourished</SelectItem>
                    <SelectItem value="Severely Malnourished">
                      Severely Malnourished
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="childDevelopmentMilestones">Child Development Milestones</Label>
                <Textarea
                  id="childDevelopmentMilestones"
                  name="childDevelopmentMilestones"
                  value={formData.childDevelopmentMilestones}
                  onChange={handleInputChange}
                  placeholder="Details about child development milestones"
                />
              </div>
              <div>
                <Label htmlFor="servicesProvided">Services Provided</Label>
                <Textarea
                  id="servicesProvided"
                  name="servicesProvided"
                  value={formData.servicesProvided}
                  onChange={handleInputChange}
                  placeholder="Details about services provided"
                />
              </div>
              <div>
                <Label htmlFor="referralsGiven">Referrals Given</Label>
                <Textarea
                  id="referralsGiven"
                  name="referralsGiven"
                  value={formData.referralsGiven}
                  onChange={handleInputChange}
                  placeholder="Details about referrals given"
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

      {/* Similar patterns for Edit and View modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Mother & Child Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Information */}
              <div>
                <Label htmlFor="editHouseholdCode">Household Code *</Label>
                <Input
                  id="editHouseholdCode"
                  name="householdCode"
                  value={formData.householdCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editNameOfMother">Mother Name *</Label>
                <Input
                  id="editNameOfMother"
                  name="nameOfMother"
                  value={formData.nameOfMother}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editNameOfChild">Child Name *</Label>
                <Input
                  id="editNameOfChild"
                  name="nameOfChild"
                  value={formData.nameOfChild}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAgeOfMother">Mother Age *</Label>
                <Input
                  id="editAgeOfMother"
                  name="ageOfMother"
                  type="number"
                  min="15"
                  max="50"
                  value={formData.ageOfMother}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAgeOfChild">Child Age *</Label>
                <Input
                  id="editAgeOfChild"
                  name="ageOfChild"
                  type="number"
                  min="0"
                  max="18"
                  value={formData.ageOfChild}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editUniqueId">Unique ID *</Label>
                <Input
                  id="editUniqueId"
                  name="uniqueId"
                  value={formData.uniqueId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editGender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }))
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
                <Label htmlFor="editContactNo">Contact Number</Label>
                <Input
                  id="editContactNo"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  pattern="[6-9][0-9]{9}"
                />
              </div>
              <div>
                <Label htmlFor="editHeadOfHousehold">Head of Household *</Label>
                <Input
                  id="editHeadOfHousehold"
                  name="headOfHousehold"
                  value={formData.headOfHousehold}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editWardNo">Ward No *</Label>
                <Select
                  value={formData.wardNo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, wardNo: value }))
                  }
                >
                  <SelectTrigger id="editWardNo">
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
                <Label htmlFor="editHabitation">Habitation *</Label>
                <Input
                  id="editHabitation"
                  name="habitation"
                  value={formData.habitation}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editProjectResponsible">
                  Project Responsible *
                </Label>
                <Input
                  id="editProjectResponsible"
                  name="projectResponsible"
                  value={formData.projectResponsible}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDistrict">District *</Label>
                <Input
                  id="editDistrict"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editState">State *</Label>
                <Input
                  id="editState"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDateOfReporting">Date of Reporting *</Label>
                <Input
                  id="editDateOfReporting"
                  name="dateOfReporting"
                  type="date"
                  value={formData.dateOfReporting}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editReportedBy">Reported By *</Label>
                <Input
                  id="editReportedBy"
                  name="reportedBy"
                  value={formData.reportedBy}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editPregnantOrLactatingMother">
                  Pregnant or Lactating Mother *
                </Label>
                <Select
                  value={formData.pregnantOrLactatingMother}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      pregnantOrLactatingMother: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pregnant">Pregnant</SelectItem>
                    <SelectItem value="Lactating">Lactating</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                    <SelectItem value="Neither">Neither</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editAntenatalCareDetails">
                  Antenatal Care Details
                </Label>
                <Textarea
                  id="editAntenatalCareDetails"
                  name="antenatalCareDetails"
                  value={formData.antenatalCareDetails}
                  onChange={handleInputChange}
                  placeholder="Details about antenatal care"
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryDetails">Delivery Details</Label>
                <Textarea
                  id="editDeliveryDetails"
                  name="deliveryDetails"
                  value={formData.deliveryDetails}
                  onChange={handleInputChange}
                  placeholder="Details about delivery"
                />
              </div>
              <div>
                <Label htmlFor="editDeliveryArea">Delivery Area</Label>
                <Select
                  value={formData.deliveryArea}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryArea: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Primary Health Center">
                      Primary Health Center
                    </SelectItem>
                    <SelectItem value="Community Health Center">
                      Community Health Center
                    </SelectItem>
                    <SelectItem value="Private Clinic">
                      Private Clinic
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editBirthCertificate">Birth Certificate</Label>
                <Select
                  value={formData.birthCertificate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      birthCertificate: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="In Process">In Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPostnatalCareDetails">
                  Postnatal Care Details
                </Label>
                <Textarea
                  id="editPostnatalCareDetails"
                  name="postnatalCareDetails"
                  value={formData.postnatalCareDetails}
                  onChange={handleInputChange}
                  placeholder="Details about postnatal care"
                />
              </div>
              <div>
                <Label htmlFor="editHealthCheckups">Health Checkups</Label>
                <Textarea
                  id="editHealthCheckups"
                  name="healthCheckups"
                  value={formData.healthCheckups}
                  onChange={handleInputChange}
                  placeholder="Details about health checkups"
                />
              </div>
              <div>
                <Label htmlFor="editImmunizationStatus">
                  Immunization Status
                </Label>
                <Select
                  value={formData.immunizationStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      immunizationStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editNutritionalStatus">
                  Nutritional Status
                </Label>
                <Select
                  value={formData.nutritionalStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      nutritionalStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Underweight">Underweight</SelectItem>
                    <SelectItem value="Overweight">Overweight</SelectItem>
                    <SelectItem value="Malnourished">Malnourished</SelectItem>
                    <SelectItem value="Severely Malnourished">
                      Severely Malnourished
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editChildImmunizationStatus">
                  Child Immunization Status
                </Label>
                <Select
                  value={formData.childImmunizationStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      childImmunizationStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editChildNutritionalStatus">
                  Child Nutritional Status
                </Label>
                <Select
                  value={formData.childNutritionalStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      childNutritionalStatus: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Underweight">Underweight</SelectItem>
                    <SelectItem value="Overweight">Overweight</SelectItem>
                    <SelectItem value="Malnourished">Malnourished</SelectItem>
                    <SelectItem value="Severely Malnourished">
                      Severely Malnourished
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editChildDevelopmentMilestones">
                  Child Development Milestones
                </Label>
                <Textarea
                  id="editChildDevelopmentMilestones"
                  name="childDevelopmentMilestones"
                  value={formData.childDevelopmentMilestones}
                  onChange={handleInputChange}
                  placeholder="Details about child development milestones"
                />
              </div>
              <div>
                <Label htmlFor="editServicesProvided">Services Provided</Label>
                <Textarea
                  id="editServicesProvided"
                  name="servicesProvided"
                  value={formData.servicesProvided}
                  onChange={handleInputChange}
                  placeholder="Details about services provided"
                />
              </div>
              <div>
                <Label htmlFor="editReferralsGiven">Referrals Given</Label>
                <Textarea
                  id="editReferralsGiven"
                  name="referralsGiven"
                  value={formData.referralsGiven}
                  onChange={handleInputChange}
                  placeholder="Details about referrals given"
                />
              </div>
              <div>
                <Label htmlFor="editGovernmentSchemes">
                  Government Schemes
                </Label>
                <Textarea
                  id="editGovernmentSchemes"
                  name="governmentSchemes"
                  value={formData.governmentSchemes}
                  onChange={handleInputChange}
                  placeholder="Details about government schemes enrolled"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">Update Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mother & Child Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Mother Name</Label>
                  <p>{selectedRecord.nameOfMother}</p>
                </div>
                <div>
                  <Label className="font-semibold">Child Name</Label>
                  <p>{selectedRecord.nameOfChild}</p>
                </div>
                <div>
                  <Label className="font-semibold">Mother Age</Label>
                  <p>{selectedRecord.ageOfMother}</p>
                </div>
                <div>
                  <Label className="font-semibold">Child Age</Label>
                  <p>{selectedRecord.ageOfChild}</p>
                </div>
                <div>
                  <Label className="font-semibold">Ward / Habitation</Label>
                  <p>
                    {formatWard(selectedRecord.wardNo)},{" "}
                    {selectedRecord.habitation}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Date of Reporting</Label>
                  <p>{formatDate(selectedRecord.dateOfReporting)}</p>
                </div>
                <div>
                  <Label className="font-semibold">
                    Pregnant or Lactating Mother
                  </Label>
                  <p>{selectedRecord.pregnantOrLactatingMother || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Delivery Area</Label>
                  <p>{selectedRecord.deliveryArea || "—"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Immunization Status</Label>
                  <div>
                    <StatusBadge value={selectedRecord.immunizationStatus} />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Nutritional Status</Label>
                  <div>
                    <StatusBadge value={selectedRecord.nutritionalStatus} />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">
                    Child Immunization Status
                  </Label>
                  <div>
                    <StatusBadge
                      value={selectedRecord.childImmunizationStatus}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">
                    Child Nutritional Status
                  </Label>
                  <div>
                    <StatusBadge value={selectedRecord.childNutritionalStatus} />
                  </div>
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

export default MotherChild;




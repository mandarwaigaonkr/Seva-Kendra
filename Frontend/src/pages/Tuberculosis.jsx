import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Activity,
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { tuberculosisAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import tuberculosisImportTemplate from "../lib/excelImport/templates/tuberculosis";
import { getWardOptions } from "../lib/formOptions";
import {
  ModulePageHeader,
  tableState,
  StatusBadge,
  formatWard,
  formatDate,
  toDateInput,
} from "../components/module/ModuleKit";

const WARD_OPTIONS = getWardOptions();

const Tuberculosis = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    typeOfTB: "",
    overallStatus: "",
    wardNo: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nikshaiId: "",
    name: "",
    gender: "",
    age: "",
    contactNo: "",
    occupation: "",
    householdCode: "",
    headOfHousehold: "",
    nameOfRespondant: "",
    contactNoOfRespondant: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    dateOfReporting: "",
    reportedBy: "",
    typeOfTB: "",
    dateOfMedicalScreening: "",
    treatmentForTB: "",
    expectedDateOfTreatmentCompletion: "",
    diagnosticDetails: "",
    comorbidities: "",
    nutritionStatus: "",
    individualCarePlan: "",
    dateOfLinkageWithDOTS: "",
    overallStatus: "",
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        name: searchTerm,
        ...filters,
      };

      const response = await tuberculosisAPI.getAll(params);
      setRecords(response.data.tuberculosis);
      setPagination({
        page: response.data.page,
        limit: pagination.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      toast.error("Failed to fetch tuberculosis records");
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [pagination.page, searchTerm, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await tuberculosisAPI.update(selectedRecord._id, formData);
        toast.success("Tuberculosis record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await tuberculosisAPI.create(formData);
        toast.success("Tuberculosis record created successfully");
        setIsCreateModalOpen(false);
      }
      fetchRecords();
      resetForm();
    } catch (error) {
      toast.error(
        selectedRecord ? "Failed to update record" : "Failed to create record"
      );
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tuberculosisAPI.delete(id);
      toast.success("Tuberculosis record deleted successfully");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      nikshaiId: "",
      name: "",
      gender: "",
      age: "",
      contactNo: "",
      occupation: "",
      householdCode: "",
      headOfHousehold: "",
      nameOfRespondant: "",
      contactNoOfRespondant: "",
      wardNo: "",
      habitation: "",
      projectResponsible: "",
      dateOfReporting: "",
      reportedBy: "",
      typeOfTB: "",
      dateOfMedicalScreening: "",
      treatmentForTB: "",
      expectedDateOfTreatmentCompletion: "",
      diagnosticDetails: "",
      comorbidities: "",
      nutritionStatus: "",
      individualCarePlan: "",
      dateOfLinkageWithDOTS: "",
      overallStatus: "",
    });
    setSelectedRecord(null);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      nikshaiId: record.nikshaiId || "",
      name: record.name || "",
      gender: record.gender || "",
      age: record.age || "",
      contactNo: record.contactNo || "",
      occupation: record.occupation || "",
      householdCode: record.householdCode || "",
      headOfHousehold: record.headOfHousehold || "",
      nameOfRespondant: record.nameOfRespondant || "",
      contactNoOfRespondant: record.contactNoOfRespondant || "",
      wardNo: record.wardNo || "",
      habitation: record.habitation || "",
      projectResponsible: record.projectResponsible || "",
      dateOfReporting: toDateInput(record.dateOfReporting),
      reportedBy: record.reportedBy || "",
      typeOfTB: record.typeOfTB || "",
      dateOfMedicalScreening: toDateInput(record.dateOfMedicalScreening),
      treatmentForTB: record.treatmentForTB || "",
      expectedDateOfTreatmentCompletion:
        toDateInput(record.expectedDateOfTreatmentCompletion),
      diagnosticDetails: record.diagnosticDetails || "",
      comorbidities: record.comorbidities || "",
      nutritionStatus: record.nutritionStatus || "",
      individualCarePlan: record.individualCarePlan || "",
      dateOfLinkageWithDOTS: toDateInput(record.dateOfLinkageWithDOTS),
      overallStatus: record.overallStatus || "",
    });
    setIsEditModalOpen(true);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ModulePageHeader
          icon={Activity}
          title="Tuberculosis"
          subtitle="TB cases, DOTS linkage and treatment outcomes"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("health") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add TB Record
              </Button>
            )
          }
        />

        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="Tuberculosis Tracking Guidelines"
            description="Accurate TB records help in monitoring treatment adherence and preventing spread."
            items={[
              "Ensure TB unit details and treatment start dates are accurate.",
              "Monitor medication adherence and regular sputum test results.",
              "Record nutritional support and government benefits received.",
              "Track family screening status to prevent further spread.",
              "Update treatment outcomes (Cured, Treatment Completed, etc.) promptly.",
            ]}
          />
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search by Name/NIKSHAI ID</Label>
                  <Input
                    id="search"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="genderFilter">Gender</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) =>
                      handleFilterChange("gender", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger id="genderFilter">
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
                  <Label htmlFor="typeOfTBFilter">Type of TB</Label>
                  <Select
                    value={filters.typeOfTB}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "typeOfTB",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger id="typeOfTBFilter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Pulmonary TB">Pulmonary TB</SelectItem>
                      <SelectItem value="Extra-pulmonary TB">
                        Extra-pulmonary TB
                      </SelectItem>
                      <SelectItem value="MDR TB">MDR TB</SelectItem>
                      <SelectItem value="XDR TB">XDR TB</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="overallStatusFilter">Overall Status</Label>
                  <Select
                    value={filters.overallStatus}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "overallStatus",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger id="overallStatusFilter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Treatment">On Treatment</SelectItem>
                      <SelectItem value="Treatment Completed">
                        Treatment Completed
                      </SelectItem>
                      <SelectItem value="Lost to Follow-up">
                        Lost to Follow-up
                      </SelectItem>
                      <SelectItem value="Died">Died</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        gender: "",
                        typeOfTB: "",
                        overallStatus: "",
                        wardNo: "",
                      });
                      setSearchTerm("");
                    }}
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
              template={tuberculosisImportTemplate}
              createRecord={tuberculosisAPI.create}
              onImported={fetchRecords}
            />
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Tuberculosis Records ({pagination.total || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={fetchRecords}
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
                      <TableHead>NIKSHAI ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Type of TB</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ward/Habitation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableState({
                      loading,
                      count: records.length,
                      colSpan: 7,
                      filtered: Boolean(searchTerm || Object.values(filters).some(Boolean)),
                    }) ||
                      records.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.nikshaiId}
                          </TableCell>
                          <TableCell>{record.name}</TableCell>
                          <TableCell>
                            {record.age}, {record.gender}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {record.typeOfTB || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={record.overallStatus} />
                          </TableCell>
                          <TableCell>
                            {formatWard(record.wardNo)}, {record.habitation}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(record)}
                                aria-label={`View ${record.name}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEdit("health") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  aria-label={`Edit ${record.name}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("health") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" aria-label={`Delete ${record.name}`}>
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

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
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
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
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
                      disabled={pagination.page === pagination.totalPages}
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

      {/* Create/Edit Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? "Edit" : "Add New"} Tuberculosis Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nikshaiId">NIKSHAI ID *</Label>
                <Input
                  id="nikshaiId"
                  name="nikshaiId"
                  value={formData.nikshaiId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
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
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                />
              </div>
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
                <Label htmlFor="nameOfRespondant">Name of Respondent</Label>
                <Input
                  id="nameOfRespondant"
                  name="nameOfRespondant"
                  value={formData.nameOfRespondant}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="contactNoOfRespondant">
                  Contact of Respondent
                </Label>
                <Input
                  id="contactNoOfRespondant"
                  name="contactNoOfRespondant"
                  value={formData.contactNoOfRespondant}
                  onChange={handleInputChange}
                  pattern="[6-9][0-9]{9}"
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
                <Label htmlFor="typeOfTB">Type of TB</Label>
                <Select
                  value={formData.typeOfTB}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, typeOfTB: value }))
                  }
                >
                  <SelectTrigger id="typeOfTB">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pulmonary TB">Pulmonary TB</SelectItem>
                    <SelectItem value="Extra-pulmonary TB">
                      Extra-pulmonary TB
                    </SelectItem>
                    <SelectItem value="MDR TB">MDR TB</SelectItem>
                    <SelectItem value="XDR TB">XDR TB</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateOfMedicalScreening">
                  Date of Medical Screening
                </Label>
                <Input
                  id="dateOfMedicalScreening"
                  name="dateOfMedicalScreening"
                  type="date"
                  value={formData.dateOfMedicalScreening}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="dateOfLinkageWithDOTS">
                  Date of Linkage with DOTS
                </Label>
                <Input
                  id="dateOfLinkageWithDOTS"
                  name="dateOfLinkageWithDOTS"
                  type="date"
                  value={formData.dateOfLinkageWithDOTS}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="expectedDateOfTreatmentCompletion">
                  Expected Treatment Completion
                </Label>
                <Input
                  id="expectedDateOfTreatmentCompletion"
                  name="expectedDateOfTreatmentCompletion"
                  type="date"
                  value={formData.expectedDateOfTreatmentCompletion}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="nutritionStatus">Nutrition Status</Label>
                <Select
                  value={formData.nutritionStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, nutritionStatus: value }))
                  }
                >
                  <SelectTrigger id="nutritionStatus">
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
                <Label htmlFor="overallStatus">Overall Status</Label>
                <Select
                  value={formData.overallStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, overallStatus: value }))
                  }
                >
                  <SelectTrigger id="overallStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Treatment">On Treatment</SelectItem>
                    <SelectItem value="Treatment Completed">
                      Treatment Completed
                    </SelectItem>
                    <SelectItem value="Lost to Follow-up">
                      Lost to Follow-up
                    </SelectItem>
                    <SelectItem value="Died">Died</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="treatmentForTB">Treatment for TB</Label>
                <Textarea
                  id="treatmentForTB"
                  name="treatmentForTB"
                  value={formData.treatmentForTB}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="diagnosticDetails">Diagnostic Details</Label>
                <Textarea
                  id="diagnosticDetails"
                  name="diagnosticDetails"
                  value={formData.diagnosticDetails}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="comorbidities">Comorbidities</Label>
                <Textarea
                  id="comorbidities"
                  name="comorbidities"
                  value={formData.comorbidities}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="individualCarePlan">Individual Care Plan</Label>
                <Textarea
                  id="individualCarePlan"
                  name="individualCarePlan"
                  value={formData.individualCarePlan}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedRecord ? "Update" : "Create"} Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tuberculosis Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">NIKSHAY ID</Label>
                    <p>{selectedRecord.nikshaiId || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Name</Label>
                    <p>{selectedRecord.name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Gender</Label>
                    <Badge variant="outline">{selectedRecord.gender}</Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Age</Label>
                    <p>{selectedRecord.age} years</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Contact Number</Label>
                    <p>{selectedRecord.contactNo}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Occupation</Label>
                    <p>{selectedRecord.occupation || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Household Code</Label>
                    <p>{selectedRecord.householdCode}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Head of Household</Label>
                    <p>{selectedRecord.headOfHousehold}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Name of Respondent</Label>
                    <p>{selectedRecord.nameOfRespondant || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Contact No of Respondent
                    </Label>
                    <p>{selectedRecord.contactNoOfRespondant || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Ward No</Label>
                    <p>{formatWard(selectedRecord.wardNo)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Habitation</Label>
                    <p>{selectedRecord.habitation}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Project Responsible</Label>
                    <p>{selectedRecord.projectResponsible}</p>
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
                    <Label className="font-semibold">Date of Reporting</Label>
                    <p>
                      {formatDate(selectedRecord.dateOfReporting)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Reported By</Label>
                    <p>{selectedRecord.reportedBy}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Medical Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Type of TB</Label>
                    <Badge>{selectedRecord.typeOfTB || "N/A"}</Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Date of Medical Screening
                    </Label>
                    <p>
                      {formatDate(selectedRecord.dateOfMedicalScreening)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Treatment for TB</Label>
                    <p>{selectedRecord.treatmentForTB || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Expected Treatment Completion
                    </Label>
                    <p>
                      {formatDate(selectedRecord.expectedDateOfTreatmentCompletion)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">
                      Date of Linkage with DOTS
                    </Label>
                    <p>
                      {formatDate(selectedRecord.dateOfLinkageWithDOTS)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Overall Status</Label>
                    <StatusBadge value={selectedRecord.overallStatus} />
                  </div>
                </div>
                {selectedRecord.diagnosticDetails && (
                  <div>
                    <Label className="font-semibold">Diagnostic Details</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRecord.diagnosticDetails}
                    </p>
                  </div>
                )}
                {selectedRecord.comorbidities && (
                  <div>
                    <Label className="font-semibold">Comorbidities</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRecord.comorbidities}
                    </p>
                  </div>
                )}
                {selectedRecord.nutritionStatus && (
                  <div>
                    <Label className="font-semibold">Nutrition Status</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRecord.nutritionStatus}
                    </p>
                  </div>
                )}
                {selectedRecord.individualCarePlan && (
                  <div>
                    <Label className="font-semibold">
                      Individual Care Plan
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedRecord.individualCarePlan}
                    </p>
                  </div>
                )}
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

export default Tuberculosis;




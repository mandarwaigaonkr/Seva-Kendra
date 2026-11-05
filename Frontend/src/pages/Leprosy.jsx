import React, { useState, useEffect } from "react";
import { FilterBar } from "@/components/module/ModuleKit";
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
import { leprosyAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import usePermissions from "../hooks/usePermissions";
import GuidelinesCard from "../components/GuidelinesCard";
import ExcelImportPanel from "../components/ExcelImportPanel";
import leprosyImportTemplate from "../lib/excelImport/templates/leprosy";
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

const Leprosy = () => {
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    typeOfLeprosy: "",
    statusOfTreatment: "",
    overallStatus: "",
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
    typeOfLeprosy: "",
    durationOfIllness: "",
    diagnosticDetails: "",
    comorbidities: "",
    nutritionStatus: "",
    individualCarePlan: "",
    statusOfTreatment: "",
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
      const response = await leprosyAPI.getAll(params);
      setRecords(response.data.leprosy);
      setPagination({
        page: response.data.page,
        limit: pagination.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      toast.error("Failed to fetch leprosy records");
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
        await leprosyAPI.update(selectedRecord._id, formData);
        toast.success("Leprosy record updated successfully");
        setIsEditModalOpen(false);
      } else {
        await leprosyAPI.create(formData);
        toast.success("Leprosy record created successfully");
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
      await leprosyAPI.delete(id);
      toast.success("Leprosy record deleted successfully");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to delete record");
      console.error("Error deleting record:", error);
    }
  };

  const resetForm = () => {
    setFormData({
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
      typeOfLeprosy: "",
      durationOfIllness: "",
      diagnosticDetails: "",
      comorbidities: "",
      nutritionStatus: "",
      individualCarePlan: "",
      statusOfTreatment: "",
      overallStatus: "",
    });
    setSelectedRecord(null);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
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
      typeOfLeprosy: record.typeOfLeprosy || "",
      durationOfIllness: record.durationOfIllness || "",
      diagnosticDetails: record.diagnosticDetails || "",
      comorbidities: record.comorbidities || "",
      nutritionStatus: record.nutritionStatus || "",
      individualCarePlan: record.individualCarePlan || "",
      statusOfTreatment: record.statusOfTreatment || "",
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
          title="Leprosy"
          subtitle="Leprosy cases, MDT treatment and follow-up"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          actions={
            canCreate("health") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leprosy Record
              </Button>
            )
          }
        />

        <main className="flex-1 overflow-auto p-6">
          <GuidelinesCard
            title="Leprosy Care Guidelines"
            description="Ensure timely treatment and support for leprosy-affected individuals."
            items={[
              "Record the type of leprosy (MB or PB) and treatment duration.",
              "Monitor physical disability status and physiotherapy sessions.",
              "Track medication supply and adherence to MDT (Multi-Drug Therapy).",
              "Document family awareness and stigma reduction efforts.",
              "Ensure regular follow-ups to prevent secondary complications.",
            ]}
          />
          <FilterBar>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search by Name</Label>
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
                  <Label htmlFor="typeOfLeprosyFilter">Type of Leprosy</Label>
                  <Select
                    value={filters.typeOfLeprosy}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "typeOfLeprosy",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger id="typeOfLeprosyFilter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Paucibacillary (PB)">
                        Paucibacillary (PB)
                      </SelectItem>
                      <SelectItem value="Multibacillary (MB)">
                        Multibacillary (MB)
                      </SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusOfTreatmentFilter">Treatment Status</Label>
                  <Select
                    value={filters.statusOfTreatment}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "statusOfTreatment",
                        value === "all" ? "" : value
                      )
                    }
                  >
                    <SelectTrigger id="statusOfTreatmentFilter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="On MDT">On MDT</SelectItem>
                      <SelectItem value="Treatment Completed">
                        Treatment Completed
                      </SelectItem>
                      <SelectItem value="Treatment Interrupted">
                        Treatment Interrupted
                      </SelectItem>
                      <SelectItem value="Defaulter">Defaulter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        gender: "",
                        typeOfLeprosy: "",
                        statusOfTreatment: "",
                        overallStatus: "",
                      });
                      setSearchTerm("");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </FilterBar>

          {/* Bulk Import */}
          {canCreate("health") && (
            <ExcelImportPanel
              template={leprosyImportTemplate}
              createRecord={leprosyAPI.create}
              onImported={fetchRecords}
            />
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leprosy Records ({pagination.total || 0})</CardTitle>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Type of Leprosy</TableHead>
                      <TableHead>Treatment Status</TableHead>
                      <TableHead>Overall Status</TableHead>
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
                            {record.name}
                          </TableCell>
                          <TableCell>
                            {record.age}, {record.gender}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {record.typeOfLeprosy || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={record.statusOfTreatment} />
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
              {selectedRecord ? "Edit" : "Add New"} Leprosy Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="typeOfLeprosy">Type of Leprosy</Label>
                <Select
                  value={formData.typeOfLeprosy}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, typeOfLeprosy: value }))
                  }
                >
                  <SelectTrigger id="typeOfLeprosy">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paucibacillary (PB)">
                      Paucibacillary (PB)
                    </SelectItem>
                    <SelectItem value="Multibacillary (MB)">
                      Multibacillary (MB)
                    </SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="durationOfIllness">
                  Duration of Illness (months)
                </Label>
                <Input
                  id="durationOfIllness"
                  name="durationOfIllness"
                  type="number"
                  min="0"
                  value={formData.durationOfIllness}
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
                <Label htmlFor="statusOfTreatment">Status of Treatment</Label>
                <Select
                  value={formData.statusOfTreatment}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      statusOfTreatment: value,
                    }))
                  }
                >
                  <SelectTrigger id="statusOfTreatment">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="On MDT">On MDT</SelectItem>
                    <SelectItem value="Treatment Completed">
                      Treatment Completed
                    </SelectItem>
                    <SelectItem value="Treatment Interrupted">
                      Treatment Interrupted
                    </SelectItem>
                    <SelectItem value="Defaulter">Defaulter</SelectItem>
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
            <DialogTitle>Leprosy Record Details</DialogTitle>
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
                    <Label className="font-semibold">Type of Leprosy</Label>
                    <Badge>{selectedRecord.typeOfLeprosy || "N/A"}</Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Duration of Illness</Label>
                    <p>
                      {selectedRecord.durationOfIllness || selectedRecord.durationOfIllness === 0
                        ? `${selectedRecord.durationOfIllness} months`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status of Treatment</Label>
                    <StatusBadge value={selectedRecord.statusOfTreatment} />
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

export default Leprosy;




import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Save,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { beneficiaryAPI } from "../services/api";
import GuidelinesCard from "../components/GuidelinesCard";

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    annualIncome: "",
    maritalStatus: "",
    dependents: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    notes: "",
  });

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const response = await beneficiaryAPI.getAll();
      setBeneficiaries(response.data.beneficiaries || []);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    if (term.trim()) {
      try {
        const response = await beneficiaryAPI.search(term);
        setBeneficiaries(response.data.beneficiaries || []);
      } catch (error) {
        console.error("Error searching beneficiaries:", error);
      }
    } else {
      fetchBeneficiaries();
    }
  };

  const handleView = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setIsViewModalOpen(true);
  };

  const handleEdit = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setFormData({
      firstName: beneficiary.firstName || "",
      lastName: beneficiary.lastName || "",
      email: beneficiary.email || "",
      phone: beneficiary.phone || "",
      address: beneficiary.address || "",
      dateOfBirth: beneficiary.dateOfBirth
        ? new Date(beneficiary.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: beneficiary.gender || "",
      occupation: beneficiary.occupation || "",
      annualIncome: beneficiary.annualIncome || "",
      maritalStatus: beneficiary.maritalStatus || "",
      dependents: beneficiary.dependents || "",
      emergencyContact: {
        name: beneficiary.emergencyContact?.name || "",
        phone: beneficiary.emergencyContact?.phone || "",
        relationship: beneficiary.emergencyContact?.relationship || "",
      },
      notes: beneficiary.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      occupation: "",
      annualIncome: "",
      maritalStatus: "",
      dependents: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedBeneficiary) {
        await beneficiaryAPI.update(selectedBeneficiary._id, formData);
      } else {
        await beneficiaryAPI.create(formData);
      }
      fetchBeneficiaries();
      setIsEditModalOpen(false);
      setIsAddModalOpen(false);
      setSelectedBeneficiary(null);
    } catch (error) {
      console.error("Error saving beneficiary:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this beneficiary?")) {
      try {
        await beneficiaryAPI.delete(id);
        fetchBeneficiaries();
      } catch (error) {
        console.error("Error deleting beneficiary:", error);
      }
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    const matchesSearch =
      searchTerm === "" ||
      beneficiary.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || beneficiary.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const BeneficiaryForm = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
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
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
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
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">
                Prefer not to say
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            value={formData.maritalStatus}
            onValueChange={(value) =>
              setFormData({ ...formData, maritalStatus: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={formData.occupation}
            onChange={(e) =>
              setFormData({ ...formData, occupation: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="annualIncome">Annual Income</Label>
          <Input
            id="annualIncome"
            type="number"
            value={formData.annualIncome}
            onChange={(e) =>
              setFormData({ ...formData, annualIncome: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="dependents">Dependents</Label>
          <Input
            id="dependents"
            type="number"
            value={formData.dependents}
            onChange={(e) =>
              setFormData({ ...formData, dependents: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Emergency Contact</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="Name"
            value={formData.emergencyContact.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  name: e.target.value,
                },
              })
            }
          />
          <Input
            placeholder="Phone"
            value={formData.emergencyContact.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  phone: e.target.value,
                },
              })
            }
          />
          <Input
            placeholder="Relationship"
            value={formData.emergencyContact.relationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  relationship: e.target.value,
                },
              })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beneficiaries</h1>
          <p className="text-muted-foreground">
            Manage beneficiary information and records
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="shadow-md transition-colors duration-150"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Beneficiary
        </Button>
      </div>

      <GuidelinesCard
        title="Beneficiary Data Entry Guidelines"
        description="Ensure all beneficiary records are complete and accurate to maintain data quality."
        items={[
          "Create unique ID codes for each new beneficiary.",
          "Capture primary contact details and detailed address.",
          "Map beneficiaries to their respective wards and habitations.",
          "Categorize beneficiaries by program (Health, Education, Social Justice).",
          "Update status regularly to reflect current active participation.",
        ]}
      />

      {/* Filters */}
      <Card className="mb-6 shadow-md transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search beneficiaries..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries List */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficiaries ({filteredBeneficiaries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No beneficiaries found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new beneficiary.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBeneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {beneficiary.firstName} {beneficiary.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {beneficiary.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {beneficiary.phone}
                          </div>
                        )}
                        {beneficiary.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {beneficiary.email}
                          </div>
                        )}
                        {beneficiary.address && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {beneficiary.address.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        beneficiary.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {beneficiary.status || "active"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(beneficiary)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(beneficiary)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(beneficiary._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Beneficiary Details</DialogTitle>
          </DialogHeader>
          {selectedBeneficiary && (
            <Tabs defaultValue="personal" className="mt-4">
              <TabsList>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="cases">Cases</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeneficiary.firstName}{" "}
                      {selectedBeneficiary.lastName}
                    </p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeneficiary.phone}
                    </p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeneficiary.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeneficiary.gender || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeneficiary.address || "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="cases">
                <p className="text-sm text-muted-foreground">
                  Associated cases will be displayed here.
                </p>
              </TabsContent>
              <TabsContent value="notes">
                <p className="text-sm text-muted-foreground">
                  {selectedBeneficiary.notes || "No notes available."}
                </p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Beneficiary</DialogTitle>
            <DialogDescription>
              Enter the beneficiary's information below.
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryForm />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Beneficiary
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Beneficiary</DialogTitle>
            <DialogDescription>
              Update the beneficiary's information.
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryForm />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Update Beneficiary
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




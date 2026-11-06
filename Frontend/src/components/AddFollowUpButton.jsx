import React, { useState } from "react";
import { Plus, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackingAPI } from "@/services/api";

const AddFollowUpButton = ({
  recordType,
  recordId,
  recordName,
  module,
  onSuccess,
  variant = "default",
  size = "sm",
  buttonText = "Add Follow-up",
  showIcon = true,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Pending",
    followUpDate: "",
    nextFollowUpDate: "",
    wardNo: "",
    habitation: "",
    projectResponsible: "",
    tags: "",
    isUrgent: false,
  });

  const priorities = ["Low", "Medium", "High", "Urgent"];
  const statuses = [
    "Pending",
    "In Progress",
    "On Hold",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        recordType,
        recordId,
        recordName,
        module,
        ...formData,
        priority: formData.isUrgent ? "Urgent" : formData.priority,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await trackingAPI.create(payload);
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        status: "Pending",
        followUpDate: "",
        nextFollowUpDate: "",
        wardNo: "",
        habitation: "",
        projectResponsible: "",
        tags: "",
        isUrgent: false,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      alert("Failed to create follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {showIcon && <ClipboardCheck className="h-4 w-4 mr-2" />}
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl">
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
            <DialogDescription>
              Create a follow-up tracker for {recordName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Record Info (read-only display) */}
              <div className="p-3 bg-slate-50 rounded-md space-y-1 border border-slate-200 shadow-sm">
                <div className="text-sm">
                  <span className="font-medium">Record:</span> {recordName}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Type:</span> {recordType}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Module:</span> {module}
                </div>
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
                    setFormData({ ...formData, description: e.target.value })
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
                      setFormData({ ...formData, followUpDate: e.target.value })
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
                      setFormData({ ...formData, habitation: e.target.value })
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

              <div className="flex items-center gap-2">
                <input
                  id="isUrgent"
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) =>
                    setFormData({ ...formData, isUrgent: e.target.checked })
                  }
                />
                <Label htmlFor="isUrgent">Flag this case as Urgent</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Follow-up"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddFollowUpButton;

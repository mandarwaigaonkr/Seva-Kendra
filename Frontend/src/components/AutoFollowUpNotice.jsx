import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AutoFollowUpNotice = ({ recordName, module, followUpDate }) => {
  return (
    <Alert className="mt-4 bg-info/10 border-info/30 shadow-md transition-shadow duration-300">
      <CheckCircle2 className="h-4 w-4 text-info" />
      <AlertTitle className="text-foreground">
        Automatic Follow-up Created
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <div className="mt-1 space-y-1">
          <p>
            A monthly follow-up has been automatically scheduled for{" "}
            <strong>{recordName}</strong> in the {module} module.
          </p>
          <div className="flex items-center gap-2 text-sm mt-2">
            <Clock className="h-3 w-3" />
            <span>
              Next follow-up: {new Date(followUpDate).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs mt-2">
            You can view and manage all follow-ups in the Tracking Dashboard.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AutoFollowUpNotice;

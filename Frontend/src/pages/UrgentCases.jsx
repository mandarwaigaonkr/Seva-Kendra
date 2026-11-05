import React, { useEffect, useState } from "react";
import { ModulePageHeader } from "@/components/module/ModuleKit";
import { AlertTriangle, RefreshCw, Menu } from "lucide-react";
import { trackingAPI } from "../services/api";
import Sidebar from "../components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const UrgentCases = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const fetchUrgentCases = async () => {
    setLoading(true);
    try {
      const [casesResponse, alertsResponse] = await Promise.all([
        trackingAPI.getUrgentCases(),
        trackingAPI.getUrgentCaseAlerts(2),
      ]);
      setCases(casesResponse.data.data || []);
      setAlerts(alertsResponse.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrgentCases();
  }, []);

  const statusVariant = (status) => {
    if (status === "Completed") return "default";
    if (status === "In Progress") return "secondary";
    if (status === "Pending") return "outline";
    return "destructive";
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <ModulePageHeader
          title="Urgent cases"
          subtitle="High-priority cases that are still open. Update these first."
          actions={
            <Button onClick={fetchUrgentCases} variant="outline" disabled={loading}>
              <RefreshCw className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
              Refresh
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="shell-main space-y-6">
            {alerts.length > 0 && (
              <Card className="border-red-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Update Alerts
                  </CardTitle>
                  <CardDescription>
                    {alerts.length} urgent case(s) were not updated within 2 days.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="text-sm">
                      <span className="font-semibold">{alert.recordName}</span> - last updated {alert.staleDays} day(s) ago
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Urgent Cases ({cases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Issue Description</TableHead>
                      <TableHead>Actions Taken</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Coordinator</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item._id}</TableCell>
                        <TableCell>{item.recordName}</TableCell>
                        <TableCell>{item.description || "-"}</TableCell>
                        <TableCell>{item.monthlyUpdates?.length ? item.monthlyUpdates[item.monthlyUpdates.length - 1]?.notes : "No updates"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.assignedTo
                            ? `${item.assignedTo.firstName || ""} ${item.assignedTo.lastName || ""}`.trim()
                            : "Unassigned"}
                        </TableCell>
                        <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentCases;




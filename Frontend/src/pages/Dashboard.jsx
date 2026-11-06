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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  GraduationCap,
  Scale,
  Activity,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Menu,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
  Eye,
  UserCheck,
  Building,
  BookOpen,
  Stethoscope,
  Briefcase,
  Award,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Home,
  Pill,
  Info,
  MapPin,
  Mail,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ModulePageHeader, formatDate } from "@/components/module/ModuleKit";
import { DOMAINS, DOMAIN_TONE, canSeeDomain } from "@/components/shell/navigation";
import {
  analyticsAPI,
  healthCampAPI,
  elderlyAPI,
  motherChildAPI,
  adolescentsAPI,
  tuberculosisAPI,
  hivAPI,
  leprosyAPI,
  addictionAPI,
  otherDiseasesAPI,
  pwdAPI,
  studyCenterAPI,
  scStudentAPI,
  dropoutAPI,
  schoolAPI,
  competitiveExamAPI,
  boardPreparationAPI,
  cbucboDetailsAPI,
  entitlementsAPI,
  legalAidServiceAPI,
  trackingAPI,
} from "../services/api";


// Format number
const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
};

// Status Badge Component
const StatusBadge = ({ status, label }) => {
  const statusConfig = {
    active: {
      bg: "bg-green-900/30",
      text: "text-green-400",
      icon: "✓",
    },
    pending: {
      bg: "bg-orange-900/30",
      text: "text-orange-400",
      icon: "⏱",
    },
    completed: {
      bg: "bg-blue-900/30",
      text: "text-blue-400",
      icon: "✓",
    },
    urgent: {
      bg: "bg-red-900/30",
      text: "text-red-400",
      icon: "!",
    },
  };
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge className={`${config.bg} ${config.text} border-0`}>
      {label || status.toUpperCase()}
    </Badge>
  );
};

// KPI Card Component
const KPICard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel = "from last month",
  bgColor,
}) => (
  <Card className="shadow-elevated transition-colors duration-150 border border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-2 leading-tight">
            {formatNumber(value)}
          </p>
          {trend && (
            <div className="flex items-center mt-3 pt-3 border-t border-border">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400 mr-1" />
              )}
              <span
                className={`text-sm font-semibold ${
                  trend === "up" ? "text-green-400" : "text-red-400"
                }`}
              >
                {trendValue}%
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${bgColor} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Module Card Component
const ModuleCard = ({ title, icon: Icon, stats, color, module, isExpanded, onToggle }) => {
  const total = stats.totalCases || stats.totalStudents || 0;
  
  const categoryEntries = Object.entries(stats).filter(
    ([key]) => key !== "totalCases" && key !== "totalStudents"
  );

  return (
    <Card
      className={`border-l-4 shadow-elevated transition-colors duration-150 ${
        color === "health"
          ? "border-l-red-500"
          : color === "education"
          ? "border-l-blue-500"
          : "border-l-purple-500"
      }`}
    >
      <CardHeader
        className="pb-3 cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg"
        onClick={() => onToggle(module)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl shadow-md ${
                color === "health"
                  ? "bg-red-900/40 text-red-400"
                  : color === "education"
                  ? "bg-blue-900/40 text-blue-400"
                  : "bg-purple-900/40 text-purple-400"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {categoryEntries.length} categories
              </CardDescription>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total Cases</p>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 mt-2">
            {categoryEntries.map(([key, value]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  color === "health"
                    ? "border-red-500/30 bg-red-500/10"
                    : color === "education"
                    ? "border-blue-500/30 bg-blue-500/10"
                    : "border-purple-500/30 bg-purple-500/10"
                }`}
              >
                <p className="text-xs font-medium text-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Performance Table Component
const PerformanceTable = ({
  performanceData,
  isEditingTargets,
  setIsEditingTargets,
  targetInputs,
  onSaveTargets,
}) => {
  const [localTargets, setLocalTargets] = useState(targetInputs);

  // Sync local targets when the dialog opens
  useEffect(() => {
    if (isEditingTargets) {
      setLocalTargets(targetInputs);
    }
  }, [isEditingTargets, targetInputs]);

  const handleSave = () => {
    onSaveTargets(localTargets);
  };

  return (
    <Card className="shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Overview
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingTargets(true)}
          >
            Edit Targets
          </Button>
        </CardTitle>
        <CardDescription>
          Target vs. Completed across key programs
        </CardDescription>
      </CardHeader>

      <Dialog open={isEditingTargets} onOpenChange={setIsEditingTargets}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Performance Targets</DialogTitle>
            <DialogDescription>
              Set new targets for the key programs. Changes will be saved
              locally.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="health" className="text-right">
                Health
              </Label>
              <Input
                id="health"
                type="number"
                className="col-span-3"
                value={localTargets.health}
                onChange={(e) =>
                  setLocalTargets({ ...localTargets, health: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="education" className="text-right">
                Education
              </Label>
              <Input
                id="education"
                type="number"
                className="col-span-3"
                value={localTargets.education}
                onChange={(e) =>
                  setLocalTargets({
                    ...localTargets,
                    education: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="socialJustice" className="text-right text-xs">
                Social Justice
              </Label>
              <Input
                id="socialJustice"
                type="number"
                className="col-span-3"
                value={localTargets.socialJustice}
                onChange={(e) =>
                  setLocalTargets({
                    ...localTargets,
                    socialJustice: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary">
              <th className="text-left py-3 px-4 font-semibold">Program</th>
              <th className="text-center py-3 px-4 font-semibold">Target</th>
              <th className="text-center py-3 px-4 font-semibold">
                Completed
              </th>
              <th className="text-center py-3 px-4 font-semibold">
                Progress
              </th>
              <th className="text-center py-3 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map((row) => {
              const percentage = row.target > 0 ? Math.round((row.completed / row.target) * 100) : 0;
              const isComplete = percentage >= 100;
              return (
                <tr
                  key={row.category}
                  className="border-b hover:bg-secondary"
                >
                  <td className="py-3 px-4 font-medium">{row.category}</td>
                  <td className="text-center py-3 px-4">
                    {row.target}
                  </td>
                  <td className="text-center py-3 px-4 font-semibold">
                    {row.completed}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isComplete ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8">
                        {percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <StatusBadge
                      status={
                        isComplete
                          ? "completed"
                          : percentage >= 75
                          ? "active"
                          : "pending"
                      }
                      label={`${percentage}%`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [activeView, setActiveView] = useState("overview");

  // Custom targets state
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [targetInputs, setTargetInputs] = useState({
    health: 100,
    education: 150,
    socialJustice: 80,
  });

  // Dashboard data states
  const [overviewStats, setOverviewStats] = useState({
    totalBeneficiaries: 0,
    activeCases: 0,
    pendingLegalAid: 0,
    completedThisMonth: 0,
    recentBeneficiaries: 0,
    urgentCases: 0,
  });

  const [moduleStats, setModuleStats] = useState({
    health: {
      totalCases: 0,
      healthCamps: 0,
      elderlySupport: 0,
      motherChildCare: 0,
      adolescentPrograms: 0,
      tuberculosis: 0,
      hiv: 0,
      leprosy: 0,
      addiction: 0,
      otherDiseases: 0,
      pwdSupport: 0,
    },
    education: {
      totalStudents: 0,
      studyCenters: 0,
      scStudents: 0,
      dropoutRecovery: 0,
      schools: 0,
      competitiveExams: 0,
      boardPreparation: 0,
    },
    socialJustice: {
      totalCases: 0,
      cbucboDetails: 0,
      entitlements: 0,
      legalAidServices: 0,
      workshops: 0,
    },
  });

  const [chartData, setChartData] = useState({
    monthlyTrends: [],
    moduleDistribution: [],
    genderDistribution: [],
    ageDistribution: [],
    statusDistribution: [],
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [quickInsights, setQuickInsights] = useState([]);
  const [expandedModules, setExpandedModules] = useState({
    health: false,
    education: false,
    socialJustice: false,
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [urgentAlerts, setUrgentAlerts] = useState([]);

  // Colors for charts - optimized for dark theme
  const COLORS = {
    primary: "rgb(56, 189, 248)", // sky-400 - bright for dark bg
    secondary: "rgb(96, 165, 250)", // blue-400
    accent: "rgb(34, 211, 238)", // cyan-400
    lightGray: "rgb(71, 85, 105)", // slate-600
    darkPrimary: "rgb(14, 165, 233)", // sky-500
    mediumLight: "rgb(148, 163, 184)", // slate-400
    lightMuted: "rgb(203, 213, 225)", // slate-300
    accentLight: "rgb(125, 211, 252)", // sky-300
    health: "rgb(248, 113, 113)", // red-400 - softer for dark
    education: "rgb(96, 165, 250)", // blue-400
    socialJustice: "rgb(167, 139, 250)", // violet-400
    warning: "rgb(251, 146, 60)", // orange-400
    success: "rgb(74, 222, 128)", // green-400
  };

  // Utility to toggle module expansion
  const toggleModuleExpanded = (module) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const PIE_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.accent,
    COLORS.darkPrimary,
    COLORS.mediumLight,
    COLORS.accentLight,
    COLORS.lightMuted,
    COLORS.lightGray,
  ];

  // Normalize totals from various module responses (supports different shapes)
  const extractTotal = (settled) => {
    if (!settled || settled.status !== "fulfilled") return 0;
    const result = settled.value;
    
    // Handle different API response structures
    if (!result) return 0;
    
    // Structure 1: { data: { pagination: { total, count, totalRecords } } }
    if (result.data?.pagination) {
      return result.data.pagination.total ?? result.data.pagination.totalRecords ?? result.data.pagination.count ?? 0;
    }
    
    // Structure 2: { data: { data: [], pagination: {} } }
    if (result.data?.data?.pagination) {
      return result.data.data.pagination.total ?? result.data.data.pagination.count ?? 0;
    }
    
    // Structure 3: Direct array in data
    if (Array.isArray(result.data?.data)) return result.data.data.length;
    if (Array.isArray(result.data)) return result.data.length;
    
    // Structure 4: Legacy empty or single item
    return 0;
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use the new analytics API to get all dashboard data and stale urgent reminders
      const [dashboardResult, urgentAlertsResult] = await Promise.allSettled([
        analyticsAPI.getCompleteDashboard(dateRange),
        trackingAPI.getUrgentCaseAlerts(2),
      ]);

      if (dashboardResult.status !== "fulfilled") {
        throw dashboardResult.reason;
      }

      const data = dashboardResult.value.data;

      if (urgentAlertsResult.status === "fulfilled") {
        setUrgentAlerts(urgentAlertsResult.value.data || []);
      } else {
        setUrgentAlerts([]);
      }

      console.log("Complete Dashboard Data:", data);

      // Set overview stats from real data
      setOverviewStats({
        totalBeneficiaries: data.overview.totalBeneficiaries || 0,
        activeCases: data.overview.activeCases || 0,
        pendingLegalAid: data.overview.pendingLegalAid || 0,
        completedThisMonth: data.overview.completedCases || 0,
        recentBeneficiaries: data.overview.recentBeneficiaries || 0,
        urgentCases: data.overview.urgentCases || 0,
        previousPeriod: data.overview.previousPeriod || {
          totalBeneficiaries: 0,
          activeCases: 0,
          completedCases: 0,
          urgentCases: 0
        }
      });

      // Set module stats directly from analytics data
      const moduleBreakdown = data.overview.moduleBreakdown || { health: 0, education: 0, socialJustice: 0 };
      const moduleDetails = data.overview.moduleDetails || {};
      
      const healthStats = {
        totalCases: moduleBreakdown.health || 0,
        healthCamps: moduleDetails.healthCamps || 0,
        elderlySupport: moduleDetails.elderly || 0,
        motherChildCare: moduleDetails.motherChild || 0,
        adolescentPrograms: moduleDetails.adolescents || 0,
        tuberculosis: moduleDetails.tuberculosis || 0,
        hiv: moduleDetails.hiv || 0,
        leprosy: moduleDetails.leprosy || 0,
        addiction: moduleDetails.addiction || 0,
        otherDiseases: moduleDetails.otherDiseases || 0,
        pwdSupport: moduleDetails.pwd || 0,
      };

      const educationStats = {
        totalStudents: moduleBreakdown.education || 0,
        studyCenters: moduleDetails.studyCenters || 0,
        scStudents: moduleDetails.scStudents || 0,
        dropoutRecovery: moduleDetails.dropouts || 0,
        schools: moduleDetails.schools || 0,
        competitiveExams: moduleDetails.competitiveExams || 0,
        boardPreparation: moduleDetails.boardPreparation || 0,
      };

      const socialJusticeStats = {
        totalCases: moduleBreakdown.socialJustice || 0,
        cbucboDetails: moduleDetails.cbucbo || 0,
        entitlements: moduleDetails.entitlements || 0,
        legalAidServices: moduleDetails.legalAid || 0,
        workshops: moduleDetails.workshops || 0,
      };

      setModuleStats({
        health: healthStats,
        education: educationStats,
        socialJustice: socialJusticeStats,
      });

      // Set chart data from real analytics
      setChartData({
        monthlyTrends: data.charts.monthlyTrends || [],
        moduleDistribution: (data.charts.moduleDistribution || []).map((item, index) => ({
          ...item,
          color: index === 0 ? COLORS.health : index === 1 ? COLORS.education : COLORS.socialJustice
        })),
        genderDistribution: (data.charts.genderDistribution || []).map((item, index) => ({
          ...item,
          color: index === 0 ? COLORS.accentLight : COLORS.primary
        })),
        ageDistribution: data.charts.ageDistribution || [],
        statusDistribution: (data.charts.statusDistribution || []).map((item, index) => ({
          ...item,
          color: [COLORS.secondary, COLORS.accent, COLORS.primary, COLORS.mediumLight][index] || COLORS.primary
        })),
      });

      // Set recent activities
      setRecentActivities(data.recentActivities || []);

      // Set quick insights
      // Set quick insights
      setQuickInsights(data.quickInsights || []);

      // Load saved targets from localStorage
      const savedTargets = JSON.parse(localStorage.getItem("performance_targets") || "{}");
      const healthTarget = savedTargets.health || Math.max(100, healthStats.totalCases * 1.2);
      const educationTarget = savedTargets.education || Math.max(150, educationStats.totalStudents * 1.2);
      const socialJusticeTarget = savedTargets.socialJustice || Math.max(80, socialJusticeStats.totalCases * 1.2);

      setTargetInputs({
        health: Math.round(healthTarget),
        education: Math.round(educationTarget),
        socialJustice: Math.round(socialJusticeTarget),
      });

      // Generate performance data for comparison using actual module totals
      setPerformanceData([
        {
          id: "health",
          category: "Health Module Total",
          target: Math.round(healthTarget),
          completed: healthStats.totalCases,
          pending: Math.max(0, Math.round(healthTarget) - healthStats.totalCases),
        },
        {
          id: "education",
          category: "Education Module Total",
          target: Math.round(educationTarget),
          completed: educationStats.totalStudents,
          pending: Math.max(0, Math.round(educationTarget) - educationStats.totalStudents),
        },
        {
          id: "socialJustice",
          category: "Social Justice Total",
          target: Math.round(socialJusticeTarget),
          completed: socialJusticeStats.totalCases,
          pending: Math.max(0, Math.round(socialJusticeTarget) - socialJusticeStats.totalCases),
        },
      ]);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Handler for saving targets
  const handleSaveTargets = (newTargets) => {
    const formattedTargets = {
      health: parseInt(newTargets.health) || 0,
      education: parseInt(newTargets.education) || 0,
      socialJustice: parseInt(newTargets.socialJustice) || 0,
    };
    setTargetInputs(formattedTargets);
    localStorage.setItem(
      "performance_targets",
      JSON.stringify(formattedTargets)
    );
    fetchDashboardData();
    setIsEditingTargets(false);
    toast.success("Targets updated successfully");
  };

  // Get trend direction
  const getTrendDirection = (value) => {
    if (value > 0)
      return {
        icon: TrendingUp,
        color: "text-health-primary",
        bg: "bg-health-light",
      };
    if (value < 0)
      return { icon: TrendingDown, color: "text-red-600", bg: "bg-red-100" };
    return {
      icon: Activity,
      color: "text-health-accent",
      bg: "bg-health-light",
    };
  };

  const getDynamicTrend = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { direction: 'up', value: 100 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      value: Math.abs(Math.round(change))
    };
  };

  const trendLabel = dateRange === "last_7_days" ? "from last 7 days" 
                   : dateRange === "last_30_days" ? "from last 30 days" 
                   : dateRange === "last_90_days" ? "from last 90 days" 
                   : dateRange === "last_year" ? "from previous year"
                   : dateRange === "today" ? "from yesterday"
                   : dateRange === "this_month" ? "from last month"
                   : dateRange === "last_month" ? "from month prior"
                   : "from previous period";

  const totalBeneficiariesTrend = getDynamicTrend(overviewStats.totalBeneficiaries, overviewStats.previousPeriod?.totalBeneficiaries);
  const activeCasesTrend = getDynamicTrend(overviewStats.activeCases, overviewStats.previousPeriod?.activeCases);
  const completedCasesTrend = getDynamicTrend(overviewStats.completedThisMonth, overviewStats.previousPeriod?.completedCases);
  const urgentCasesTrend = getDynamicTrend(overviewStats.urgentCases, overviewStats.previousPeriod?.urgentCases);

  const firstName = user?.firstName || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const rangeLabel = { last_7_days: "last 7 days", last_30_days: "last 30 days", last_90_days: "last 90 days", last_year: "last year" }[dateRange];

  // Records added to each section in the selected period (the backend applies the date range), keyed by route.
  const sectionCounts = {
    "/health/health-camps": moduleStats.health.healthCamps,
    "/health/elderly": moduleStats.health.elderlySupport,
    "/health/mother-child": moduleStats.health.motherChildCare,
    "/health/pwd": moduleStats.health.pwdSupport,
    "/health/adolescents": moduleStats.health.adolescentPrograms,
    "/health/tuberculosis": moduleStats.health.tuberculosis,
    "/health/hiv": moduleStats.health.hiv,
    "/health/leprosy": moduleStats.health.leprosy,
    "/health/addiction": moduleStats.health.addiction,
    "/health/other-diseases": moduleStats.health.otherDiseases,
    "/education/study-centers": moduleStats.education.studyCenters,
    "/education/sc-students": moduleStats.education.scStudents,
    "/education/dropouts": moduleStats.education.dropoutRecovery,
    "/education/schools": moduleStats.education.schools,
    "/education/competitive-exams": moduleStats.education.competitiveExams,
    "/education/board-preparation": moduleStats.education.boardPreparation,
    "/social-justice/cbucbo-details": moduleStats.socialJustice.cbucboDetails,
    "/social-justice/entitlements": moduleStats.socialJustice.entitlements,
    "/social-justice/legal-aid": moduleStats.socialJustice.legalAidServices,
    "/social-justice/workshops": moduleStats.socialJustice.workshops,
  };
  const domainTotal = (d) => d.modules.reduce((sum, m) => sum + (Number(sectionCounts[m.path]) || 0), 0);
  const domains = DOMAINS.filter((d) => canSeeDomain(user, d));
  const chartTone = { health: "hsl(0 64% 46%)", education: "hsl(227 62% 50%)", socialJustice: "hsl(36 100% 30%)" };

  const kpis = [
    { label: "People supported", value: overviewStats.totalBeneficiaries, trend: totalBeneficiariesTrend },
    { label: "Open cases", value: overviewStats.activeCases, trend: activeCasesTrend },
    { label: "Cases closed", value: overviewStats.completedThisMonth, trend: completedCasesTrend },
    { label: "Urgent cases", value: overviewStats.urgentCases, trend: urgentCasesTrend, to: "/tracking/urgent-cases", urgent: true },
  ];

  return (
    <div className="min-h-full bg-background">
      <ModulePageHeader
        title={`${greeting}, ${firstName}`}
        subtitle="Here is how Seva Kendra's programmes are doing. Pick a section below to add or find records."
        actions={
          <>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-44" aria-label="Time period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_90_days">Last 90 days</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
              Refresh
            </Button>
          </>
        }
      />

      <main className="space-y-8">
        {urgentAlerts.length > 0 && (
          <Link
            to="/tracking/urgent-cases"
            className="flex items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 transition-colors duration-100 hover:bg-destructive/10"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-foreground">
                {urgentAlerts.length} urgent {urgentAlerts.length === 1 ? "case has" : "cases have"} had no update for 2 days
              </span>
              <span className="block truncate text-sm text-muted-foreground">
                {urgentAlerts.slice(0, 3).map((a) => a.recordName).join(", ")}
                {urgentAlerts.length > 3 ? ` and ${urgentAlerts.length - 3} more` : ""}
              </span>
            </span>
            <span className="hidden shrink-0 text-sm font-medium text-destructive sm:inline">Open urgent cases</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
          </Link>
        )}

        {/* Key numbers */}
        <section aria-label={`Key numbers for the ${rangeLabel}`}>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:grid-cols-4">
            {kpis.map((k, i) => {
              const body = (
                <>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className={cn("mt-1 text-[2rem] font-semibold leading-none", k.urgent && Number(k.value) > 0 ? "text-destructive" : "text-foreground")}>
                    {loading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted motion-reduce:animate-none" /> : (k.value ?? 0).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {k.trend ? (
                      <>
                        <span className={k.trend.direction === "up" ? "text-success" : k.trend.direction === "down" ? "text-destructive" : ""}>
                          {k.trend.direction === "up" ? "▲" : k.trend.direction === "down" ? "▼" : "•"} {k.trend.value}
                        </span>{" "}
                        vs previous {rangeLabel}
                      </>
                    ) : (
                      `In the ${rangeLabel}`
                    )}
                  </p>
                </>
              );
              const cls = cn(
                "block p-5",
                i % 2 === 1 && "border-l border-border",
                i >= 2 && "border-t border-border lg:border-t-0",
                i >= 1 && "lg:border-l lg:border-border"
              );
              return k.to ? (
                <Link key={k.label} to={k.to} className={cn(cls, "transition-colors duration-100 hover:bg-accent/60")}>
                  {body}
                </Link>
              ) : (
                <div key={k.label} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>
        </section>

        {/* Programmes launcher: every section, with how many records were added in the selected period */}
        <section aria-labelledby="programmes-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="programmes-heading" className="text-xl font-semibold text-foreground">Programmes</h2>
            <p className="hidden text-sm text-muted-foreground sm:block">Counts are records added in the {rangeLabel ?? "selected period"}. Open a section to add, find or update records.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {domains.map((d) => {
              const tone = DOMAIN_TONE[d.tone];
              return (
                <div key={d.key} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", tone.soft, tone.text)}>
                      <d.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight text-foreground">{d.name}</h3>
                      <p className="text-sm leading-snug text-muted-foreground">{d.blurb}</p>
                    </div>
                    <span className="text-right">
                      <span className="block text-lg font-semibold leading-none text-foreground">{domainTotal(d).toLocaleString("en-IN")}</span>
                      <span className="text-xs text-muted-foreground">{rangeLabel ? `added, ${rangeLabel}` : "records"}</span>
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {d.modules.map((m) => (
                      <li key={m.path}>
                        <Link to={m.path} className="group flex min-h-11 items-center gap-3 px-4 py-2 transition-colors duration-100 hover:bg-accent/60">
                          <m.icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-foreground">{m.name}</span>
                          {sectionCounts[m.path] !== undefined && (
                            <span className="text-sm text-muted-foreground">{Number(sectionCounts[m.path] || 0).toLocaleString("en-IN")}</span>
                          )}
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-foreground" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trend + recent activity */}
        <section className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Records added each month</CardTitle>
              <CardDescription>New records per programme</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.monthlyTrends.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData.monthlyTrends} barGap={2}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 13 }} />
                    <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} tick={{ fontSize: 13 }} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 14 }} />
                    <Bar dataKey="education" name="Education" fill={chartTone.education} radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="health" name="Health" fill={chartTone.health} radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="socialJustice" name="Social justice" fill={chartTone.socialJustice} radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] flex-col items-center justify-center gap-1 text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
                  <p className="font-medium text-foreground">No records in the {rangeLabel}</p>
                  <p className="text-sm text-muted-foreground">Bars appear here as records are added.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest changes by your team</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length ? (
                <ul className="divide-y divide-border">
                  {recentActivities.slice(0, 6).map((a) => {
                    const tone = a.type?.includes("health") ? "health" : a.type?.includes("education") ? "education" : "social";
                    return (
                      <li key={a._id} className="flex gap-3 py-3">
                        <span aria-hidden className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", DOMAIN_TONE[tone].bg)} />
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] text-foreground">{a.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(a.timestamp)}
                            {a.user ? ` by ${a.user}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-[260px] flex-col items-center justify-center gap-1 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} aria-hidden />
                  <p className="font-medium text-foreground">Nothing yet</p>
                  <p className="max-w-[28ch] text-sm text-muted-foreground">New and updated records will show up here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <PerformanceTable
          performanceData={performanceData}
          isEditingTargets={isEditingTargets}
          setIsEditingTargets={setIsEditingTargets}
          targetInputs={targetInputs}
          onSaveTargets={handleSaveTargets}
        />
      </main>
    </div>
  );
};

export default Dashboard;

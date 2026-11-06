import api from "../lib/api";
import { buildReport, fetchAllRecords } from "../lib/reportData";

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  verifyToken: () => api.get("/auth/verify"),
};

// User API calls
export const userAPI = {
  getAll: (params) => api.get("/user", { params }),
  getById: (id) => api.get(`/user/${id}`),
  create: (data) => api.post("/user", data),
  update: (id, data) => api.put(`/user/${id}`, data),
  delete: (id) => api.delete(`/user/${id}`),
};

// Dashboard API calls
export const dashboardAPI = {
  getOverview: (dateRange) => api.get("/analytics/overview", { params: { dateRange } }),
  getChartData: (type, period) => api.get("/analytics/monthly-trends", { params: { type, period } }),
  getRecentActivity: (limit) => api.get("/analytics/recent-activities", { params: { limit } }),
  getCompleteDashboard: (dateRange) => api.get("/analytics/dashboard", { params: { dateRange } }),
};

// Analytics API - New real data endpoints
export const analyticsAPI = {
  getDashboardOverview: (dateRange) => api.get("/analytics/overview", { params: { dateRange } }),
  getMonthlyTrends: (moduleType) => api.get("/analytics/monthly-trends", { params: { moduleType } }),
  getGenderDistribution: () => api.get("/analytics/gender-distribution"),
  getAgeDistribution: () => api.get("/analytics/age-distribution"),
  getModuleDistribution: () => api.get("/analytics/module-distribution"),
  getStatusDistribution: () => api.get("/analytics/status-distribution"),
  getRecentActivities: (limit) => api.get("/analytics/recent-activities", { params: { limit } }),
  getQuickInsights: () => api.get("/analytics/quick-insights"),
  getCompleteDashboard: (dateRange) => api.get("/analytics/dashboard", { params: { dateRange } }),
};

// Education Module API calls

// Study Center API
export const studyCenterAPI = {
  getAll: (params) => api.get("/education/study-centers", { params }),
  getById: (id) => api.get(`/education/study-centers/${id}`),
  create: (data) => api.post("/education/study-centers", data),
  update: (id, data) => api.put(`/education/study-centers/${id}`, data),
  delete: (id) => api.delete(`/education/study-centers/${id}`),
  getStats: () => api.get("/education/study-centers/stats"),
  getFilterOptions: () => api.get("/education/study-centers/filter-options"),
};

// Teacher API
export const teacherAPI = {
  getAll: (params) => api.get("/education/teachers", { params }),
  getById: (id) => api.get(`/education/teachers/${id}`),
  create: (data) => api.post("/education/teachers", data),
  update: (id, data) => api.put(`/education/teachers/${id}`, data),
  delete: (id) => api.delete(`/education/teachers/${id}`),
  getDropdown: () => api.get("/education/teachers/dropdown"),
  getStats: () => api.get("/education/teachers/stats"),
  getFilterOptions: () => api.get("/education/teachers/filter-options"),
};

// Group Leader API
export const groupLeaderAPI = {
  getAll: (params) => api.get("/education/group-leaders", { params }),
  getById: (id) => api.get(`/education/group-leaders/${id}`),
  create: (data) => api.post("/education/group-leaders", data),
  update: (id, data) => api.put(`/education/group-leaders/${id}`, data),
  delete: (id) => api.delete(`/education/group-leaders/${id}`),
  getDropdown: () => api.get("/education/group-leaders/dropdown"),
  getStats: () => api.get("/education/group-leaders/stats"),
  getFilterOptions: () => api.get("/education/group-leaders/filter-options"),
};

// SC Students API
export const scStudentAPI = {
  getAll: (params) => api.get("/education/sc-students", { params }),
  getById: (id) => api.get(`/education/sc-students/${id}`),
  create: (data) => api.post("/education/sc-students", data),
  update: (id, data) => api.put(`/education/sc-students/${id}`, data),
  delete: (id) => api.delete(`/education/sc-students/${id}`),
  getStats: () => api.get("/education/sc-students/stats"),
  getFilterOptions: () => api.get("/education/sc-students/filter-options"),
};

// Dropouts API
export const dropoutAPI = {
  getAll: (params) => api.get("/education/dropouts", { params }),
  getById: (id) => api.get(`/education/dropouts/${id}`),
  create: (data) => api.post("/education/dropouts", data),
  update: (id, data) => api.put(`/education/dropouts/${id}`, data),
  delete: (id) => api.delete(`/education/dropouts/${id}`),
  getStats: () => api.get("/education/dropouts/stats"),
  getFilterOptions: () => api.get("/education/dropouts/filter-options"),
};

// Schools API
export const schoolAPI = {
  getAll: (params) => api.get("/education/schools", { params }),
  getById: (id) => api.get(`/education/schools/${id}`),
  create: (data) => api.post("/education/schools", data),
  update: (id, data) => api.put(`/education/schools/${id}`, data),
  delete: (id) => api.delete(`/education/schools/${id}`),
  getStats: () => api.get("/education/schools/stats"),
  getFilterOptions: () => api.get("/education/schools/filter-options"),
};

// Competitive Exams API
export const competitiveExamAPI = {
  getAll: (params) => api.get("/education/competitive-exams", { params }),
  getById: (id) => api.get(`/education/competitive-exams/${id}`),
  create: (data) => api.post("/education/competitive-exams", data),
  update: (id, data) => api.put(`/education/competitive-exams/${id}`, data),
  delete: (id) => api.delete(`/education/competitive-exams/${id}`),
  getStats: () => api.get("/education/competitive-exams/stats"),
  getFilterOptions: () =>
    api.get("/education/competitive-exams/filter-options"),
};

// Board Preparation API
export const boardPreparationAPI = {
  getAll: (params) => api.get("/education/board-preparations", { params }),
  getById: (id) => api.get(`/education/board-preparations/${id}`),
  create: (data) => api.post("/education/board-preparations", data),
  update: (id, data) => api.put(`/education/board-preparations/${id}`, data),
  delete: (id) => api.delete(`/education/board-preparations/${id}`),
  getStats: () => api.get("/education/board-preparations/stats"),
  getFilterOptions: () =>
    api.get("/education/board-preparations/filter-options"),
};

// Health Module API calls

// Health Camps API
export const healthCampAPI = {
  getAll: (params) => api.get("/health/health-camps", { params }),
  getById: (id) => api.get(`/health/health-camps/${id}`),
  create: (data) => api.post("/health/health-camps", data),
  update: (id, data) => api.put(`/health/health-camps/${id}`, data),
  delete: (id) => api.delete(`/health/health-camps/${id}`),
  getStats: () => api.get("/health/health-camps/stats"),
  getFilterOptions: () => api.get("/health/health-camps/filter-options"),
};

// Elderly API
export const elderlyAPI = {
  getAll: (params) => api.get("/health/elderly", { params }),
  getById: (id) => api.get(`/health/elderly/${id}`),
  create: (data) => api.post("/health/elderly", data),
  update: (id, data) => api.put(`/health/elderly/${id}`, data),
  delete: (id) => api.delete(`/health/elderly/${id}`),
  getStats: () => api.get("/health/elderly/stats"),
  getFilterOptions: () => api.get("/health/elderly/filter-options"),
};

// Mother Child API
export const motherChildAPI = {
  getAll: (params) => api.get("/health/mother-child", { params }),
  getById: (id) => api.get(`/health/mother-child/${id}`),
  create: (data) => api.post("/health/mother-child", data),
  update: (id, data) => api.put(`/health/mother-child/${id}`, data),
  delete: (id) => api.delete(`/health/mother-child/${id}`),
  getStats: () => api.get("/health/mother-child/stats"),
  getFilterOptions: () => api.get("/health/mother-child/filter-options"),
};

// PWD API
export const pwdAPI = {
  getAll: (params) => api.get("/health/pwd", { params }),
  getById: (id) => api.get(`/health/pwd/${id}`),
  create: (data) => api.post("/health/pwd", data),
  update: (id, data) => api.put(`/health/pwd/${id}`, data),
  delete: (id) => api.delete(`/health/pwd/${id}`),
  getStats: () => api.get("/health/pwd/stats"),
  getFilterOptions: () => api.get("/health/pwd/filter-options"),
};

// Adolescents API
export const adolescentsAPI = {
  getAll: (params) => api.get("/health/adolescents", { params }),
  getById: (id) => api.get(`/health/adolescents/${id}`),
  create: (data) => api.post("/health/adolescents", data),
  update: (id, data) => api.put(`/health/adolescents/${id}`, data),
  delete: (id) => api.delete(`/health/adolescents/${id}`),
  getStats: () => api.get("/health/adolescents/stats"),
  getFilterOptions: () => api.get("/health/adolescents/filter-options"),
};

// Tuberculosis API
export const tuberculosisAPI = {
  getAll: (params) => api.get("/health/tuberculosis", { params }),
  getById: (id) => api.get(`/health/tuberculosis/${id}`),
  create: (data) => api.post("/health/tuberculosis", data),
  update: (id, data) => api.put(`/health/tuberculosis/${id}`, data),
  delete: (id) => api.delete(`/health/tuberculosis/${id}`),
  getStats: () => api.get("/health/tuberculosis/stats"),
};

// HIV API
export const hivAPI = {
  getAll: (params) => api.get("/health/hiv", { params }),
  getById: (id) => api.get(`/health/hiv/${id}`),
  create: (data) => api.post("/health/hiv", data),
  update: (id, data) => api.put(`/health/hiv/${id}`, data),
  delete: (id) => api.delete(`/health/hiv/${id}`),
  getStats: () => api.get("/health/hiv/stats"),
};

// Leprosy API
export const leprosyAPI = {
  getAll: (params) => api.get("/health/leprosy", { params }),
  getById: (id) => api.get(`/health/leprosy/${id}`),
  create: (data) => api.post("/health/leprosy", data),
  update: (id, data) => api.put(`/health/leprosy/${id}`, data),
  delete: (id) => api.delete(`/health/leprosy/${id}`),
  getStats: () => api.get("/health/leprosy/stats"),
};

// Addiction API
export const addictionAPI = {
  getAll: (params) => api.get("/health/addiction", { params }),
  getById: (id) => api.get(`/health/addiction/${id}`),
  create: (data) => api.post("/health/addiction", data),
  update: (id, data) => api.put(`/health/addiction/${id}`, data),
  delete: (id) => api.delete(`/health/addiction/${id}`),
  getStats: () => api.get("/health/addiction/stats"),
};

// Other Diseases API
export const otherDiseasesAPI = {
  getAll: (params) => api.get("/health/other-diseases", { params }),
  getById: (id) => api.get(`/health/other-diseases/${id}`),
  create: (data) => api.post("/health/other-diseases", data),
  update: (id, data) => api.put(`/health/other-diseases/${id}`, data),
  delete: (id) => api.delete(`/health/other-diseases/${id}`),
  getStats: () => api.get("/health/other-diseases/stats"),
};

// Social Justice Module APIs

// CBUCBO Details API
export const cbucboDetailsAPI = {
  getAll: (params) => api.get("/social-justice/cbucbo-details", { params }),
  getById: (id) => api.get(`/social-justice/cbucbo-details/${id}`),
  create: (data) => api.post("/social-justice/cbucbo-details", data),
  update: (id, data) => api.put(`/social-justice/cbucbo-details/${id}`, data),
  delete: (id) => api.delete(`/social-justice/cbucbo-details/${id}`),
  getStats: () => api.get("/social-justice/cbucbo-details/stats"),
  getByWard: (wardNo) =>
    api.get(`/social-justice/cbucbo-details/ward/${wardNo}`),
  getByHabitation: (habitation) =>
    api.get(`/social-justice/cbucbo-details/habitation/${habitation}`),
  getByGroupType: (groupType) =>
    api.get(`/social-justice/cbucbo-details/group-type/${groupType}`),
  getByStatus: (status) =>
    api.get(`/social-justice/cbucbo-details/status/${status}`),
};

// Entitlements API
export const entitlementsAPI = {
  getAll: (params) => api.get("/social-justice/entitlements", { params }),
  getById: (id) => api.get(`/social-justice/entitlements/${id}`),
  create: (data) => api.post("/social-justice/entitlements", data),
  update: (id, data) => api.put(`/social-justice/entitlements/${id}`, data),
  delete: (id) => api.delete(`/social-justice/entitlements/${id}`),
  getStats: () => api.get("/social-justice/entitlements/stats"),
  getByWard: (wardNo) => api.get(`/social-justice/entitlements/ward/${wardNo}`),
  getByHabitation: (habitation) =>
    api.get(`/social-justice/entitlements/habitation/${habitation}`),
  getByStatus: (status) =>
    api.get(`/social-justice/entitlements/status/${status}`),
  getByIdProofType: (idProofType) =>
    api.get(`/social-justice/entitlements/id-proof/${idProofType}`),
  getByScheme: (schemeName) =>
    api.get(`/social-justice/entitlements/scheme/${schemeName}`),
};

// Legal Aid Service API
export const legalAidServiceAPI = {
  getAll: (params) => api.get("/social-justice/legal-aid-service", { params }),
  getById: (id) => api.get(`/social-justice/legal-aid-service/${id}`),
  create: (data) =>
    api.post("/social-justice/legal-aid-service", data, {
      timeout: 45000,
    }),
  update: (id, data) =>
    api.put(`/social-justice/legal-aid-service/${id}`, data),
  delete: (id) => api.delete(`/social-justice/legal-aid-service/${id}`),
  getStats: () => api.get("/social-justice/legal-aid-service/stats"),
  getByWard: (wardNo) =>
    api.get(`/social-justice/legal-aid-service/ward/${wardNo}`),
  getByHabitation: (habitation) =>
    api.get(`/social-justice/legal-aid-service/habitation/${habitation}`),
  getByCaseType: (caseType) =>
    api.get(`/social-justice/legal-aid-service/case-type/${caseType}`),
  getByCaseStatus: (caseStatus) =>
    api.get(`/social-justice/legal-aid-service/case-status/${caseStatus}`),
  getByPriority: (priority) =>
    api.get(`/social-justice/legal-aid-service/priority/${priority}`),
  getFollowUpCases: () =>
    api.get("/social-justice/legal-aid-service/follow-up"),
  getCaseTimeline: (id) =>
    api.get(`/social-justice/legal-aid-service/${id}/timeline`),
  generateReport: (params) =>
    api.get("/social-justice/legal-aid-service/report", { params }),
  updateCaseStatus: (id, caseStatus) =>
    api.put(`/social-justice/legal-aid-service/${id}/status`, { caseStatus }),
};

// Workshops & Awareness API
export const workshopsAwarenessAPI = {
  getAll: (params) =>
    api.get("/social-justice/workshops-awareness", { params }),
  getById: (id) => api.get(`/social-justice/workshops-awareness/${id}`),
  create: (data) => api.post("/social-justice/workshops-awareness", data),
  update: (id, data) =>
    api.put(`/social-justice/workshops-awareness/${id}`, data),
  delete: (id) => api.delete(`/social-justice/workshops-awareness/${id}`),
  getStats: () => api.get("/social-justice/workshops-awareness/stats"),
  getByWard: (wardNo) =>
    api.get(`/social-justice/workshops-awareness/ward/${wardNo}`),
  getByHabitation: (habitation) =>
    api.get(`/social-justice/workshops-awareness/habitation/${habitation}`),
  getByGroupType: (groupType) =>
    api.get(`/social-justice/workshops-awareness/group-type/${groupType}`),
  getByCategory: (category) =>
    api.get(`/social-justice/workshops-awareness/category/${category}`),
  getFollowUpWorkshops: () =>
    api.get("/social-justice/workshops-awareness/follow-up"),
  getUpcomingWorkshops: (days) =>
    api.get("/social-justice/workshops-awareness/upcoming", {
      params: { days },
    }),
  generateEffectivenessReport: (params) =>
    api.get("/social-justice/workshops-awareness/effectiveness-report", {
      params,
    }),
};

// Tracking System API
export const trackingAPI = {
  // Create new tracking record
  create: (data) => api.post("/tracking", data),

  // Get all tracking records with filters and pagination
  getAll: (params) => api.get("/tracking", { params }),

  // Get tracking record by ID
  getById: (id) => api.get(`/tracking/${id}`),

  // Get all tracking records for a specific record (by recordType and recordId)
  getByRecord: (recordType, recordId) =>
    api.get(`/tracking/record/${recordType}/${recordId}`),

  // Update tracking record
  update: (id, data) => api.patch(`/tracking/${id}`, data),

  // Delete tracking record (soft delete)
  delete: (id) => api.delete(`/tracking/${id}`),

  // Add monthly update to tracking record
  addMonthlyUpdate: (id, updateData) =>
    api.post(`/tracking/${id}/monthly-update`, updateData),

  // Mark tracking as completed
  complete: (id, data) => api.post(`/tracking/${id}/complete`, data),

  // Cancel tracking record
  cancel: (id, data) => api.post(`/tracking/${id}/cancel`, data),

  // Get overdue tracking records
  getOverdue: () => api.get("/tracking/overdue"),

  // Get upcoming tracking records (within specified days)
  getUpcoming: (days = 7) =>
    api.get("/tracking/upcoming", { params: { days } }),

  // Get tracking statistics
  getStats: (params) => api.get("/tracking/stats", { params }),

  // Urgent case APIs
  getUrgentCases: (params) => api.get("/tracking/urgent-cases", { params }),
  getUrgentCaseAlerts: (staleAfterDays = 2) =>
    api.get("/tracking/urgent-cases/alerts", { params: { staleAfterDays } }),

  // Get monthly update history for a specific record
  getHistory: (recordType, recordId) =>
    api.get(`/tracking/history/${recordType}/${recordId}`),
};

// Education Reports API
export const educationReportsAPI = {
  // Generate education report with filters
  generate: async (params) => {
    const { category, startDate, endDate, ...filters } = params || {};

    try {
      let data = null;

      switch (category) {
        case "study-centers":
          data = await studyCenterAPI.getAll({
            startDate,
            endDate,
            ...filters,
          });
          break;
        case "sc-students":
          data = await scStudentAPI.getAll({ startDate, endDate, ...filters });
          break;
        case "dropouts":
          data = await dropoutAPI.getAll({ startDate, endDate, ...filters });
          break;
        case "schools":
          data = await schoolAPI.getAll({ startDate, endDate, ...filters });
          break;
        case "competitive-exams":
          data = await competitiveExamAPI.getAll({
            startDate,
            endDate,
            ...filters,
          });
          break;
        case "board-preparation":
          data = await boardPreparationAPI.getAll({
            startDate,
            endDate,
            ...filters,
          });
          break;
        default:
          throw new Error("Unknown category for report generation");
      }

      // Normalize records (some endpoints may return arrays or objects)
      // The API returns { data: {...}, success: true, message: "..." }
      let records = [];
      if (!data) {
        records = [];
      } else if (data.data) {
        // data.data can be the service response with { data: [], pagination: {} }
        if (data.data.data && Array.isArray(data.data.data)) {
          records = data.data.data;
        } else if (data.data.records) {
          records = data.data.records;
        } else if (Array.isArray(data.data)) {
          records = data.data;
        } else {
          records = [];
        }
      } else if (Array.isArray(data)) {
        records = data;
      } else if (data.records) {
        records = data.records;
      } else {
        records = [];
      }

      // Build simple summary
      const totalRecords = records.length;
      const active = records.filter((r) => r.status === "active").length;
      const pending = records.filter((r) => r.status === "pending").length;
      const completed = records.filter((r) => r.status === "completed").length;
      const completionRate = totalRecords
        ? Math.round((completed / totalRecords) * 100)
        : 0;

      // Build basic monthly chart data between startDate and endDate (if provided)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthCounts = new Array(12).fill(0);
      records.forEach((rec) => {
        const d = new Date(rec.date || rec.createdAt || null);
        if (!isNaN(d)) monthCounts[d.getMonth()] += 1;
      });

      const chartData = {
        labels: months,
        datasets: [{ label: "Records", data: monthCounts }],
      };

      return {
        report: {
          summary: { totalRecords, active, pending, completed, completionRate },
          records,
        },
        chartData,
      };
    } catch (err) {
      // Re-throw to be handled by caller
      throw err;
    }
  },

  // Export report as PDF
  exportPDF: (params) =>
    api.get("/education/reports/export/pdf", {
      params,
      responseType: "blob",
    }),

  // Export report as Excel
  exportExcel: (params) =>
    api.get("/education/reports/export/excel", {
      params,
      responseType: "blob",
    }),

  // Get report statistics
  getStats: (category, params) =>
    api.get(`/education/reports/${category}/stats`, { params }),

  // Get historical data for charts
  getHistoricalData: (category, params) =>
    api.get(`/education/reports/${category}/historical`, { params }),
};

// Health Reports API
export const healthReportsAPI = {
  // Generate health report with filters
  // Generate a health report: fetch every page of the category, filter on real model fields.
  generate: async (params) => {
    const { category, startDate, endDate, patientName, wardNo, habitation, status } = params || {};
    const sources = {
      "health-camps": healthCampAPI,
      elderly: elderlyAPI,
      "mother-child": motherChildAPI,
      pwd: pwdAPI,
      adolescents: adolescentsAPI,
      tuberculosis: tuberculosisAPI,
      hiv: hivAPI,
      leprosy: leprosyAPI,
      addiction: addictionAPI,
      "other-diseases": otherDiseasesAPI,
    };
    const source = sources[category];
    if (!source) throw new Error("Unknown category for report generation");
    const records = await fetchAllRecords((query) => source.getAll(query));
    return buildReport(category, records, { startDate, endDate, name: patientName, wardNo, habitation, status });
  },

  // Export report as PDF
  exportPDF: (params) =>
    api.get("/health/reports/export/pdf", {
      params,
      responseType: "blob",
    }),

  // Export report as Excel
  exportExcel: (params) =>
    api.get("/health/reports/export/excel", {
      params,
      responseType: "blob",
    }),

  // Get report statistics
  getStats: (category, params) =>
    api.get(`/health/reports/${category}/stats`, { params }),

  // Get historical data for charts
  getHistoricalData: (category, params) =>
    api.get(`/health/reports/${category}/historical`, { params }),
};

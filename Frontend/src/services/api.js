import api from "../lib/api";
import { buildReport, fetchAllRecords } from "../lib/reportData";

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  verifyToken: () => api.get("/auth/verify"),
};

// Dummy data for beneficiaries
const dummyBeneficiaries = [
  {
    _id: "1",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@email.com",
    phone: "+91-9876543210",
    address: "Mumbai, Maharashtra",
    dateOfBirth: "1985-03-15",
    gender: "female",
    occupation: "Domestic Worker",
    maritalStatus: "married",
    dependents: 2,
    status: "active",
    emergencyContact: {
      name: "Raj Sharma",
      phone: "+91-9876543211",
      relationship: "Husband",
    },
  },
  {
    _id: "2",
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@email.com",
    phone: "+91-9876543212",
    address: "Delhi, India",
    dateOfBirth: "1978-07-22",
    gender: "male",
    occupation: "Construction Worker",
    maritalStatus: "single",
    dependents: 0,
    status: "active",
  },
];

// Beneficiary API calls with dummy data
export const beneficiaryAPI = {
  getAll: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { beneficiaries: dummyBeneficiaries } };
  },
  getById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const beneficiary = dummyBeneficiaries.find((b) => b._id === id);
    return { data: { beneficiary } };
  },
  create: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newBeneficiary = {
      ...data,
      _id: Math.random().toString(36).substr(2, 9),
      status: "active",
    };
    dummyBeneficiaries.push(newBeneficiary);
    return { data: { beneficiary: newBeneficiary } };
  },
  update: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = dummyBeneficiaries.findIndex((b) => b._id === id);
    if (index !== -1) {
      dummyBeneficiaries[index] = { ...dummyBeneficiaries[index], ...data };
    }
    return { data: { beneficiary: dummyBeneficiaries[index] } };
  },
  delete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = dummyBeneficiaries.findIndex((b) => b._id === id);
    if (index !== -1) {
      dummyBeneficiaries.splice(index, 1);
    }
    return { data: { success: true } };
  },
  search: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { beneficiaries: dummyBeneficiaries } };
  },
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        totalBeneficiaries: dummyBeneficiaries.length,
        activeBeneficiaries: dummyBeneficiaries.filter(
          (b) => b.status === "active"
        ).length,
      },
    };
  },
  addNote: async (id, note) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
};

// Dummy data for cases
const dummyCases = [
  {
    _id: "1",
    caseNumber: "SJ-2024-001",
    title: "Domestic Violence Case - Priya Sharma",
    description:
      "Domestic violence case involving financial and physical abuse",
    caseType: "domestic_violence",
    priority: "high",
    status: "active",
    beneficiary: {
      _id: "1",
      firstName: "Priya",
      lastName: "Sharma",
    },
    assignedLawyer: "Advocate Sarah Johnson",
    dateOpened: "2024-01-15",
    nextHearing: "2024-02-15",
    court: "Family Court, Mumbai",
    updates: [
      {
        _id: "u1",
        date: "2024-01-15",
        update: "Case filed and initial documentation completed",
        updatedBy: "Legal Team",
      },
    ],
  },
  {
    _id: "2",
    caseNumber: "SJ-2024-002",
    title: "Labor Rights Violation - Rajesh Kumar",
    description: "Unpaid wages and unsafe working conditions",
    caseType: "labor_rights",
    priority: "medium",
    status: "pending",
    beneficiary: {
      _id: "2",
      firstName: "Rajesh",
      lastName: "Kumar",
    },
    assignedLawyer: "Advocate Ravi Patel",
    dateOpened: "2024-01-20",
    nextHearing: "2024-02-20",
    court: "Labor Court, Delhi",
    updates: [],
  },
];

// Cases API calls with dummy data
export const casesAPI = {
  getAll: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { cases: dummyCases } };
  },
  getById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const case_ = dummyCases.find((c) => c._id === id);
    return { data: { case: case_ } };
  },
  create: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newCase = {
      ...data,
      _id: Math.random().toString(36).substr(2, 9),
      caseNumber: `SJ-2024-${String(dummyCases.length + 1).padStart(3, "0")}`,
      dateOpened: new Date().toISOString().substr(0, 10),
      status: "active",
      updates: [],
    };
    dummyCases.push(newCase);
    return { data: { case: newCase } };
  },
  update: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = dummyCases.findIndex((c) => c._id === id);
    if (index !== -1) {
      dummyCases[index] = { ...dummyCases[index], ...data };
    }
    return { data: { case: dummyCases[index] } };
  },
  delete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = dummyCases.findIndex((c) => c._id === id);
    if (index !== -1) {
      dummyCases.splice(index, 1);
    }
    return { data: { success: true } };
  },
  search: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { cases: dummyCases } };
  },
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        totalCases: dummyCases.length,
        activeCases: dummyCases.filter((c) => c.status === "active").length,
        pendingCases: dummyCases.filter((c) => c.status === "pending").length,
        closedCases: dummyCases.filter((c) => c.status === "closed").length,
      },
    };
  },
  getMyAssigned: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { cases: dummyCases } };
  },
  addProgress: async (id, progress) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
  updateProgress: async (caseId, progressId, progress) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
  assignCase: async (id, assignment) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
  addNote: async (id, note) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const caseIndex = dummyCases.findIndex((c) => c._id === id);
    if (caseIndex !== -1) {
      if (!dummyCases[caseIndex].updates) {
        dummyCases[caseIndex].updates = [];
      }
      dummyCases[caseIndex].updates.push({
        _id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().substr(0, 10),
        update: note,
        updatedBy: "Admin User",
      });
    }
    return { data: { success: true } };
  },
};

// Dummy data for legal aid
const dummyLegalAid = [
  {
    _id: "1",
    caseNumber: "LA-2024-001",
    title: "Property Rights Legal Aid - Priya Sharma",
    description: "Legal assistance for property rights and documentation",
    aidType: "property_rights",
    priority: "medium",
    status: "active",
    beneficiary: {
      _id: "1",
      firstName: "Priya",
      lastName: "Sharma",
    },
    assignedLawyer: "Advocate Sarah Johnson",
    dateRequested: "2024-01-10",
    dateAssigned: "2024-01-12",
    expectedCompletion: "2024-03-15",
    documents: [
      {
        _id: "d1",
        name: "Property Documents.pdf",
        uploadDate: "2024-01-12",
      },
    ],
    hearings: [
      {
        _id: "h1",
        date: "2024-02-10",
        time: "10:00 AM",
        court: "District Court, Mumbai",
        status: "scheduled",
      },
    ],
    progress: [
      {
        _id: "p1",
        date: "2024-01-12",
        description: "Initial consultation completed",
        status: "completed",
      },
    ],
  },
  {
    _id: "2",
    caseNumber: "LA-2024-002",
    title: "Employment Rights Legal Aid - Rajesh Kumar",
    description: "Legal assistance for employment rights violation",
    aidType: "employment_rights",
    priority: "high",
    status: "pending",
    beneficiary: {
      _id: "2",
      firstName: "Rajesh",
      lastName: "Kumar",
    },
    assignedLawyer: "Advocate Ravi Patel",
    dateRequested: "2024-01-18",
    expectedCompletion: "2024-04-18",
    documents: [],
    hearings: [],
    progress: [],
  },
];

// Legal Aid API calls with dummy data
export const legalAidAPI = {
  getAll: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { legalAids: dummyLegalAid } };
  },
  getById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const legalAid = dummyLegalAid.find((la) => la._id === id);
    return { data: { legalAid } };
  },
  create: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newLegalAid = {
      ...data,
      _id: Math.random().toString(36).substr(2, 9),
      caseNumber: `LA-2024-${String(dummyLegalAid.length + 1).padStart(
        3,
        "0"
      )}`,
      dateRequested: new Date().toISOString().substr(0, 10),
      status: "pending",
      documents: [],
      hearings: [],
      progress: [],
    };
    dummyLegalAid.push(newLegalAid);
    return { data: { legalAid: newLegalAid } };
  },
  update: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = dummyLegalAid.findIndex((la) => la._id === id);
    if (index !== -1) {
      dummyLegalAid[index] = { ...dummyLegalAid[index], ...data };
    }
    return { data: { legalAid: dummyLegalAid[index] } };
  },
  delete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = dummyLegalAid.findIndex((la) => la._id === id);
    if (index !== -1) {
      dummyLegalAid.splice(index, 1);
    }
    return { data: { success: true } };
  },
  search: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { legalAids: dummyLegalAid } };
  },
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        totalLegalAids: dummyLegalAid.length,
        activeLegalAids: dummyLegalAid.filter((la) => la.status === "active")
          .length,
        pendingLegalAids: dummyLegalAid.filter((la) => la.status === "pending")
          .length,
        completedLegalAids: dummyLegalAid.filter(
          (la) => la.status === "completed"
        ).length,
      },
    };
  },
  getMyAssigned: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { legalAids: dummyLegalAid } };
  },
  addProgress: async (id, progress) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const legalAidIndex = dummyLegalAid.findIndex((la) => la._id === id);
    if (legalAidIndex !== -1) {
      if (!dummyLegalAid[legalAidIndex].progress) {
        dummyLegalAid[legalAidIndex].progress = [];
      }
      dummyLegalAid[legalAidIndex].progress.push({
        _id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().substr(0, 10),
        ...progress,
      });
    }
    return { data: { success: true } };
  },
  updateProgress: async (legalAidId, progressId, progress) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
  addDocument: async (id, document) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const legalAidIndex = dummyLegalAid.findIndex((la) => la._id === id);
    if (legalAidIndex !== -1) {
      if (!dummyLegalAid[legalAidIndex].documents) {
        dummyLegalAid[legalAidIndex].documents = [];
      }
      dummyLegalAid[legalAidIndex].documents.push({
        _id: Math.random().toString(36).substr(2, 9),
        uploadDate: new Date().toISOString().substr(0, 10),
        ...document,
      });
    }
    return { data: { success: true } };
  },
  addHearing: async (id, hearing) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const legalAidIndex = dummyLegalAid.findIndex((la) => la._id === id);
    if (legalAidIndex !== -1) {
      if (!dummyLegalAid[legalAidIndex].hearings) {
        dummyLegalAid[legalAidIndex].hearings = [];
      }
      dummyLegalAid[legalAidIndex].hearings.push({
        _id: Math.random().toString(36).substr(2, 9),
        ...hearing,
      });
    }
    return { data: { success: true } };
  },
  assignLawyer: async (id, lawyer) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const legalAidIndex = dummyLegalAid.findIndex((la) => la._id === id);
    if (legalAidIndex !== -1) {
      dummyLegalAid[legalAidIndex].assignedLawyer = lawyer.name;
      dummyLegalAid[legalAidIndex].dateAssigned = new Date()
        .toISOString()
        .substr(0, 10);
    }
    return { data: { success: true } };
  },
  addNote: async (id, note) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } };
  },
};

// Dummy data for workshops
const dummyWorkshops = [
  {
    _id: "1",
    title: "Legal Rights Awareness Workshop",
    description:
      "Workshop on understanding basic legal rights and procedures for domestic violence cases",
    category: "legal_awareness",
    type: "in_person",
    status: "completed",
    startDate: "2024-01-15",
    endDate: "2024-01-15",
    startTime: "10:00",
    endTime: "16:00",
    venue: "Community Center, Mumbai",
    facilitator: "Advocate Sarah Johnson",
    maxParticipants: 50,
    registeredParticipants: 45,
    actualAttendees: 42,
    targetAudience: "Women from underprivileged communities",
    objectives: [
      "Understanding legal rights in domestic violence cases",
      "Knowledge of legal procedures and documentation",
      "Information about available legal aid services",
    ],
    materials: [
      "Legal rights handbook",
      "Contact list of legal aid centers",
      "Emergency contact numbers",
    ],
    participants: [
      {
        _id: "p1",
        beneficiaryId: "1",
        name: "Priya Sharma",
        attended: true,
        feedback: "Very informative and helpful",
        rating: 5,
      },
      {
        _id: "p2",
        beneficiaryId: "2",
        name: "Rajesh Kumar",
        attended: true,
        feedback: "Good workshop, learned a lot",
        rating: 4,
      },
    ],
    outcomes: {
      totalAttendees: 42,
      completionRate: 93.3,
      averageRating: 4.5,
      followUpCases: 8,
      certificationProvided: true,
    },
    feedback: {
      positive: 38,
      neutral: 4,
      negative: 0,
      suggestions: [
        "More practical examples needed",
        "Provide materials in local language",
      ],
    },
  },
  {
    _id: "2",
    title: "Financial Literacy for Women",
    description:
      "Workshop on financial planning, banking services, and micro-finance opportunities",
    category: "financial_literacy",
    type: "hybrid",
    status: "scheduled",
    startDate: "2024-02-20",
    endDate: "2024-02-20",
    startTime: "14:00",
    endTime: "17:00",
    venue: "NGO Office, Delhi",
    facilitator: "Mrs. Meera Gupta, Financial Expert",
    maxParticipants: 30,
    registeredParticipants: 25,
    actualAttendees: 0,
    targetAudience: "Women entrepreneurs and homemakers",
    objectives: [
      "Basic financial planning skills",
      "Understanding banking services",
      "Knowledge of micro-finance opportunities",
    ],
    materials: [
      "Financial planning workbook",
      "Banking services guide",
      "Micro-finance application forms",
    ],
    participants: [
      {
        _id: "p3",
        beneficiaryId: "1",
        name: "Priya Sharma",
        attended: false,
        feedback: null,
        rating: null,
      },
    ],
    outcomes: null,
    feedback: null,
  },
  {
    _id: "3",
    title: "Digital Literacy Training",
    description:
      "Basic computer and internet skills training for beneficiaries",
    category: "digital_literacy",
    type: "in_person",
    status: "ongoing",
    startDate: "2024-01-22",
    endDate: "2024-02-05",
    startTime: "11:00",
    endTime: "13:00",
    venue: "Computer Lab, Community Center",
    facilitator: "Tech Volunteers Team",
    maxParticipants: 20,
    registeredParticipants: 18,
    actualAttendees: 16,
    targetAudience: "Youth and adults with limited digital exposure",
    objectives: [
      "Basic computer operation skills",
      "Internet browsing and email usage",
      "Online government services awareness",
    ],
    materials: [
      "Computer practice workbook",
      "Online services guide",
      "Practice exercises",
    ],
    participants: [
      {
        _id: "p4",
        beneficiaryId: "2",
        name: "Rajesh Kumar",
        attended: true,
        feedback: "Very helpful for job applications",
        rating: 5,
      },
    ],
    outcomes: {
      totalAttendees: 16,
      completionRate: 88.9,
      averageRating: 4.2,
      followUpCases: 3,
      certificationProvided: false,
    },
    feedback: {
      positive: 14,
      neutral: 2,
      negative: 0,
      suggestions: ["More practice time needed", "Provide take-home materials"],
    },
  },
];

// Workshop API calls with dummy data
export const workshopAPI = {
  getAll: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { workshops: dummyWorkshops } };
  },
  getById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const workshop = dummyWorkshops.find((w) => w._id === id);
    return { data: { workshop } };
  },
  create: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newWorkshop = {
      ...data,
      _id: Math.random().toString(36).substr(2, 9),
      registeredParticipants: 0,
      actualAttendees: 0,
      status: "scheduled",
      participants: [],
    };
    dummyWorkshops.push(newWorkshop);
    return { data: { workshop: newWorkshop } };
  },
  update: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const index = dummyWorkshops.findIndex((w) => w._id === id);
    if (index !== -1) {
      dummyWorkshops[index] = { ...dummyWorkshops[index], ...data };
    }
    return { data: { workshop: dummyWorkshops[index] } };
  },
  delete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = dummyWorkshops.findIndex((w) => w._id === id);
    if (index !== -1) {
      dummyWorkshops.splice(index, 1);
    }
    return { data: { success: true } };
  },
  search: async (params) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { workshops: dummyWorkshops } };
  },
  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      data: {
        totalWorkshops: dummyWorkshops.length,
        completedWorkshops: dummyWorkshops.filter(
          (w) => w.status === "completed"
        ).length,
        ongoingWorkshops: dummyWorkshops.filter((w) => w.status === "ongoing")
          .length,
        scheduledWorkshops: dummyWorkshops.filter(
          (w) => w.status === "scheduled"
        ).length,
        totalParticipants: dummyWorkshops.reduce(
          (sum, w) => sum + (w.actualAttendees || 0),
          0
        ),
        averageRating: 4.3,
      },
    };
  },
  addParticipant: async (id, participant) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const workshopIndex = dummyWorkshops.findIndex((w) => w._id === id);
    if (workshopIndex !== -1) {
      if (!dummyWorkshops[workshopIndex].participants) {
        dummyWorkshops[workshopIndex].participants = [];
      }
      dummyWorkshops[workshopIndex].participants.push({
        _id: Math.random().toString(36).substr(2, 9),
        ...participant,
        attended: false,
      });
      dummyWorkshops[workshopIndex].registeredParticipants += 1;
    }
    return { data: { success: true } };
  },
  removeParticipant: async (workshopId, participantId) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const workshopIndex = dummyWorkshops.findIndex((w) => w._id === workshopId);
    if (workshopIndex !== -1) {
      const participantIndex = dummyWorkshops[
        workshopIndex
      ].participants.findIndex((p) => p._id === participantId);
      if (participantIndex !== -1) {
        dummyWorkshops[workshopIndex].participants.splice(participantIndex, 1);
        dummyWorkshops[workshopIndex].registeredParticipants -= 1;
      }
    }
    return { data: { success: true } };
  },
  markAttendance: async (workshopId, participantId, attended) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const workshopIndex = dummyWorkshops.findIndex((w) => w._id === workshopId);
    if (workshopIndex !== -1) {
      const participantIndex = dummyWorkshops[
        workshopIndex
      ].participants.findIndex((p) => p._id === participantId);
      if (participantIndex !== -1) {
        dummyWorkshops[workshopIndex].participants[participantIndex].attended =
          attended;
        // Recalculate actual attendees
        dummyWorkshops[workshopIndex].actualAttendees = dummyWorkshops[
          workshopIndex
        ].participants.filter((p) => p.attended).length;
      }
    }
    return { data: { success: true } };
  },
  addFeedback: async (workshopId, participantId, feedback, rating) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const workshopIndex = dummyWorkshops.findIndex((w) => w._id === workshopId);
    if (workshopIndex !== -1) {
      const participantIndex = dummyWorkshops[
        workshopIndex
      ].participants.findIndex((p) => p._id === participantId);
      if (participantIndex !== -1) {
        dummyWorkshops[workshopIndex].participants[participantIndex].feedback =
          feedback;
        dummyWorkshops[workshopIndex].participants[participantIndex].rating =
          rating;
      }
    }
    return { data: { success: true } };
  },
};

// Export workshopAndAwarenessAPI as an alias to workshopAPI for consistency with backend naming
export const workshopAndAwarenessAPI = workshopAPI;

// User API calls
export const userAPI = {
  getAll: (params) => api.get("/user", { params }),
  getById: (id) => api.get(`/user/${id}`),
  create: (data) => api.post("/user", data),
  update: (id, data) => api.put(`/user/${id}`, data),
  delete: (id) => api.delete(`/user/${id}`),
};

// Dashboard API calls with dummy data
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

// Reports API calls with dummy data
export const reportsAPI = {
  getOverviewReport: async (dateRange) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      data: {
        period: dateRange || "last_30_days",
        summary: {
          totalBeneficiaries: 125,
          newBeneficiaries: 18,
          totalCases: 45,
          newCases: 8,
          closedCases: 12,
          totalLegalAid: 28,
          completedLegalAid: 15,
          totalWorkshops: 6,
          completedWorkshops: 3,
          workshopParticipants: 156,
          impactScore: 87.5,
        },
        trends: {
          beneficiaryGrowth: 15.2,
          caseResolutionRate: 73.3,
          legalAidSuccessRate: 82.1,
          workshopAttendanceRate: 89.7,
        },
        demographics: {
          genderDistribution: {
            female: 68,
            male: 32,
          },
          ageGroups: {
            "18-25": 22,
            "26-35": 35,
            "36-45": 28,
            "46-55": 12,
            "55+": 3,
          },
          locations: {
            Mumbai: 45,
            Delhi: 32,
            Bangalore: 25,
            Chennai: 18,
            Others: 5,
          },
        },
      },
    };
  },

  getBeneficiaryReport: async (filters) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: {
        totalBeneficiaries: 125,
        activeStatus: 118,
        inactiveStatus: 7,
        byGender: {
          female: 85,
          male: 40,
        },
        byAge: {
          "18-25": 28,
          "26-35": 44,
          "36-45": 35,
          "46-55": 15,
          "55+": 3,
        },
        byLocation: {
          Mumbai: 45,
          Delhi: 32,
          Bangalore: 25,
          Chennai: 18,
          Others: 5,
        },
        byOccupation: {
          "Domestic Worker": 32,
          "Construction Worker": 28,
          "Street Vendor": 22,
          "Factory Worker": 18,
          Others: 25,
        },
        monthlyGrowth: [
          { month: "Jan", count: 8 },
          { month: "Feb", count: 12 },
          { month: "Mar", count: 15 },
          { month: "Apr", count: 18 },
          { month: "May", count: 22 },
          { month: "Jun", count: 18 },
        ],
      },
    };
  },

  getCaseReport: async (filters) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: {
        totalCases: 45,
        activeCases: 28,
        pendingCases: 12,
        closedCases: 5,
        byCaseType: {
          domestic_violence: 18,
          labor_rights: 12,
          property_rights: 8,
          child_welfare: 5,
          others: 2,
        },
        byPriority: {
          high: 15,
          medium: 22,
          low: 8,
        },
        resolutionRate: 73.3,
        averageResolutionTime: 45, // days
        monthlyTrend: [
          { month: "Jan", filed: 8, resolved: 5 },
          { month: "Feb", filed: 12, resolved: 8 },
          { month: "Mar", filed: 10, resolved: 12 },
          { month: "Apr", filed: 15, resolved: 10 },
          { month: "May", filed: 18, resolved: 15 },
          { month: "Jun", filed: 14, resolved: 18 },
        ],
        successRate: {
          domestic_violence: 85.2,
          labor_rights: 78.6,
          property_rights: 92.1,
          child_welfare: 88.9,
        },
      },
    };
  },

  getLegalAidReport: async (filters) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: {
        totalLegalAid: 28,
        activeLegalAid: 18,
        pendingLegalAid: 7,
        completedLegalAid: 3,
        byAidType: {
          property_rights: 12,
          employment_rights: 8,
          family_law: 5,
          consumer_rights: 3,
        },
        byPriority: {
          high: 8,
          medium: 15,
          low: 5,
        },
        completionRate: 82.1,
        averageCompletionTime: 68, // days
        lawyerAssignments: {
          "Advocate Sarah Johnson": 12,
          "Advocate Ravi Patel": 8,
          "Advocate Meera Sharma": 5,
          Others: 3,
        },
        monthlyProgress: [
          { month: "Jan", requested: 5, assigned: 4, completed: 2 },
          { month: "Feb", requested: 8, assigned: 6, completed: 4 },
          { month: "Mar", requested: 6, assigned: 8, completed: 5 },
          { month: "Apr", requested: 9, assigned: 7, completed: 3 },
          { month: "May", requested: 7, assigned: 9, completed: 6 },
          { month: "Jun", requested: 4, assigned: 5, completed: 8 },
        ],
      },
    };
  },

  getWorkshopReport: async (filters) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      data: {
        totalWorkshops: 6,
        completedWorkshops: 3,
        ongoingWorkshops: 1,
        scheduledWorkshops: 2,
        totalParticipants: 156,
        averageAttendance: 89.7,
        averageRating: 4.3,
        byCategory: {
          legal_awareness: 2,
          financial_literacy: 2,
          digital_literacy: 1,
          skill_development: 1,
        },
        byType: {
          in_person: 4,
          online: 1,
          hybrid: 1,
        },
        participantFeedback: {
          excellent: 45,
          good: 32,
          average: 8,
          poor: 2,
        },
        impactMetrics: {
          followUpCases: 15,
          skillsCertified: 89,
          employmentAssisted: 23,
          legalAidRequested: 12,
        },
        monthlyStats: [
          { month: "Jan", workshops: 2, participants: 87, rating: 4.5 },
          { month: "Feb", workshops: 1, participants: 25, rating: 4.2 },
          { month: "Mar", workshops: 1, participants: 16, rating: 4.2 },
          { month: "Apr", workshops: 1, participants: 28, rating: 4.4 },
          { month: "May", workshops: 0, participants: 0, rating: 0 },
          { month: "Jun", workshops: 1, participants: 0, rating: 0 },
        ],
      },
    };
  },

  getImpactReport: async (dateRange) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      data: {
        period: dateRange || "last_12_months",
        overallImpact: {
          livesImpacted: 125,
          casesResolved: 38,
          legalAidProvided: 28,
          skillsTraining: 156,
          employmentAssisted: 23,
          familiesSupported: 89,
        },
        socialJusticeMetrics: {
          domesticViolenceCasesResolved: 15,
          laborRightsViolationsAddressed: 12,
          childWelfareCasesHandled: 5,
          propertyRightsSecured: 8,
          legalAwarenessPrograms: 3,
          communityOutreachEvents: 8,
        },
        financialImpact: {
          totalBudget: 2500000, // INR
          utilized: 1875000,
          utilizationRate: 75,
          costPerBeneficiary: 15000,
          costPerCase: 41667,
          costPerWorkshop: 125000,
        },
        geographicalReach: {
          states: 4,
          districts: 12,
          communities: 25,
          ruralBeneficiaries: 78,
          urbanBeneficiaries: 47,
        },
        sustainabilityMetrics: {
          followUpRate: 85.6,
          longTermSupport: 67.2,
          communityEngagement: 78.9,
          volunteerParticipation: 45.3,
        },
      },
    };
  },

  getCustomReport: async (reportConfig) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Simulate custom report generation based on config
    return {
      data: {
        reportId: Math.random().toString(36).substr(2, 9),
        title: reportConfig.title || "Custom Report",
        generatedAt: new Date().toISOString(),
        parameters: reportConfig,
        data: {
          // Simulated custom data based on report configuration
          records: Math.floor(Math.random() * 100) + 50,
          summary:
            "Custom report generated successfully with specified parameters",
        },
      },
    };
  },

  exportReport: async (reportType, format, filters) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulate export functionality
    return {
      data: {
        downloadUrl: `/reports/export/${reportType}.${format}`,
        fileName: `${reportType}_report_${new Date()
          .toISOString()
          .substr(0, 10)}.${format}`,
        fileSize: "2.5 MB",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      },
    };
  },
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

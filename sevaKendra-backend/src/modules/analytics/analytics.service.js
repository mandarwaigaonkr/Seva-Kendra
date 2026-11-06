import HealthCamp from "../health/models/healthCamp.model.js";
import Elderly from "../health/models/elderly.model.js";
import MotherChild from "../health/models/motherChild.model.js";
import Adolescent from "../health/models/adolescents.model.js";
import Tuberculosis from "../health/models/tuberculosis.model.js";
import HIV from "../health/models/hiv.model.js";
import Leprosy from "../health/models/leprosy.model.js";
import Addiction from "../health/models/addiction.model.js";
import OtherDisease from "../health/models/otherDiseases.model.js";
import PWD from "../health/models/pwd.model.js";
import StudyCenter from "../education/models/studyCenter.model.js";
import SCStudent from "../education/models/scStudent.model.js";
import Dropout from "../education/models/dropout.model.js";
import School from "../education/models/school.model.js";
import CompetitiveExam from "../education/models/competitiveExam.model.js";
import BoardPreparation from "../education/models/boardPreparation.model.js";
import CBUCBODetails from "../socialJustice/models/cbucboDetails.model.js";
import Entitlement from "../socialJustice/models/entitlements.model.js";
import LegalAidService from "../socialJustice/models/legalAidService.model.js";
import WorkshopAndAwareness from "../socialJustice/models/workshopsAwareness.model.js";
import Tracking from "../tracking/tracking.model.js";

class AnalyticsService {
  constructor() {
    // In-memory cache with 30-second TTL
    this.cache = new Map();
    this.CACHE_TTL = 30000; // 30 seconds
  }

  // Cache helper methods
  _getCacheKey(prefix, params = {}) {
    return `${prefix}_${JSON.stringify(params)}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) this.cache.delete(key);
    return null;
  }

  _setInCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get complete dashboard payload with top-level caching
   */
  async getCompleteDashboard(dateRange = "all") {
    const cacheKey = this._getCacheKey("complete_dashboard", { dateRange });
    const cachedResult = this._getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const [
      overview,
      monthlyTrends,
      genderDistribution,
      ageDistribution,
      moduleDistribution,
      statusDistribution,
      recentActivities,
      quickInsights,
    ] = await Promise.all([
      this.getDashboardOverview(dateRange),
      this.getMonthlyTrends(),
      this.getGenderDistribution(),
      this.getAgeDistribution(),
      this.getModuleDistribution(),
      this.getStatusDistribution(),
      this.getRecentActivities(10),
      this.getQuickInsights(),
    ]);

    const result = {
      overview,
      charts: {
        monthlyTrends,
        genderDistribution,
        ageDistribution,
        moduleDistribution,
        statusDistribution,
      },
      recentActivities,
      quickInsights,
    };

    this._setInCache(cacheKey, result);
    return result;
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview(dateRange = "all") {
    try {
      const cacheKey = this._getCacheKey("dashboard_overview", { dateRange });
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const dateFilter = this._getDateFilter(dateRange);
      const prevDateFilter = this._getPreviousDateFilter(dateRange);

      const [
        dashboardStats,
        trackingStats,
        prevDashboardStats,
        prevTrackingStats,
        urgentCases,
        prevUrgentCases,
        recentBeneficiaries,
      ] = await Promise.all([
        this._getAllModuleCountsAggregated(dateFilter),
        Tracking.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        prevDateFilter
          ? this._getAllModuleCountsAggregated(prevDateFilter)
          : Promise.resolve(null),
        prevDateFilter
          ? Tracking.aggregate([
              { $match: prevDateFilter },
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ])
          : Promise.resolve([]),
        this._getUrgentCasesCount(dateFilter),
        prevDateFilter
          ? this._getUrgentCasesCount(prevDateFilter)
          : Promise.resolve(0),
        this._getRecentBeneficiariesCount(),
      ]);

      const calculateTotal = (stats) => {
        if (!stats) return 0;
        const {
          healthCamps,
          elderly,
          motherChild,
          adolescents,
          tuberculosis,
          hiv,
          leprosy,
          addiction,
          otherDiseases,
          pwd,
          studyCenters,
          scStudents,
          dropouts,
          schools,
          competitiveExams,
          boardPreparation,
          cbucbo,
          entitlements,
          legalAid,
          workshops,
        } = stats;

        return (
          healthCamps +
          elderly +
          motherChild +
          adolescents +
          tuberculosis +
          hiv +
          leprosy +
          addiction +
          otherDiseases +
          pwd +
          studyCenters +
          scStudents +
          dropouts +
          schools +
          competitiveExams +
          boardPreparation +
          cbucbo +
          entitlements +
          legalAid +
          workshops
        );
      };

      const totalBeneficiaries = calculateTotal(dashboardStats);
      const prevTotalBeneficiaries = calculateTotal(prevDashboardStats);

      const trackingStatsMap = trackingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const prevTrackingStatsMap = prevTrackingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const activeCases = trackingStatsMap["In Progress"] || 0;
      const completedCases = trackingStatsMap["Completed"] || 0;
      const pendingCases = trackingStatsMap["Pending"] || 0;
      const onHoldCases = trackingStatsMap["On Hold"] || 0;

      const prevActiveCases = prevTrackingStatsMap["In Progress"] || 0;
      const prevCompletedCases = prevTrackingStatsMap["Completed"] || 0;

      const result = {
        totalBeneficiaries,
        activeCases,
        completedCases,
        pendingCases,
        onHoldCases,
        pendingLegalAid:
          dashboardStats.pendingLegalAid !== undefined
            ? dashboardStats.pendingLegalAid
            : 0,
        urgentCases,
        previousPeriod: {
          totalBeneficiaries: prevTotalBeneficiaries,
          activeCases: prevActiveCases,
          completedCases: prevCompletedCases,
          urgentCases: prevUrgentCases,
        },
        moduleBreakdown: {
          health:
            dashboardStats.healthCamps +
            dashboardStats.elderly +
            dashboardStats.motherChild +
            dashboardStats.adolescents +
            dashboardStats.tuberculosis +
            dashboardStats.hiv +
            dashboardStats.leprosy +
            dashboardStats.addiction +
            dashboardStats.otherDiseases +
            dashboardStats.pwd,
          education:
            dashboardStats.studyCenters +
            dashboardStats.scStudents +
            dashboardStats.dropouts +
            dashboardStats.schools +
            dashboardStats.competitiveExams +
            dashboardStats.boardPreparation,
          socialJustice:
            dashboardStats.cbucbo +
            dashboardStats.entitlements +
            dashboardStats.legalAid +
            dashboardStats.workshops,
        },
        moduleDetails: dashboardStats,
        recentBeneficiaries,
      };

      this._setInCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error getting dashboard overview:", error);
      throw error;
    }
  }

  /**
   * Get monthly trends data for the charts (Optimized using aggregation)
   */
  async getMonthlyTrends(moduleType = null) {
    try {
      const cacheKey = this._getCacheKey("monthly_trends", { moduleType });
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const months = this._getLast6Months();
      const sixMonthsAgo = months[0].start;

      const healthModels = [
        HealthCamp,
        Elderly,
        MotherChild,
        Adolescent,
        Tuberculosis,
        HIV,
        Leprosy,
        Addiction,
        OtherDisease,
        PWD,
      ];
      const educationModels = [
        StudyCenter,
        SCStudent,
        Dropout,
        School,
        CompetitiveExam,
        BoardPreparation,
      ];
      const socialJusticeModels = [
        CBUCBODetails,
        Entitlement,
        LegalAidService,
        WorkshopAndAwareness,
      ];

      const getMonthlyAggregatesForModels = async (models) => {
        const results = await Promise.all(
          models.map((Model) =>
            Model.aggregate([
              { $match: { createdAt: { $gte: sixMonthsAgo } } },
              {
                $group: {
                  _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                  },
                  count: { $sum: 1 },
                },
              },
            ]).catch(() => [])
          )
        );

        const monthCountMap = {};
        results.forEach((modelResults) => {
          modelResults.forEach((r) => {
            if (r._id && r._id.year && r._id.month) {
              const key = `${r._id.year}-${r._id.month}`;
              monthCountMap[key] = (monthCountMap[key] || 0) + r.count;
            }
          });
        });
        return monthCountMap;
      };

      const [healthMap, educationMap, socialJusticeMap] = await Promise.all([
        getMonthlyAggregatesForModels(healthModels),
        getMonthlyAggregatesForModels(educationModels),
        getMonthlyAggregatesForModels(socialJusticeModels),
      ]);

      const trendData = months.map((m) => {
        const year = m.start.getFullYear();
        const monthNum = m.start.getMonth() + 1;
        const key = `${year}-${monthNum}`;

        const health = healthMap[key] || 0;
        const education = educationMap[key] || 0;
        const socialJustice = socialJusticeMap[key] || 0;

        return {
          month: m.label,
          health,
          education,
          socialJustice,
          total: health + education + socialJustice,
        };
      });

      this._setInCache(cacheKey, trendData);
      return trendData;
    } catch (error) {
      console.error("Error getting monthly trends:", error);
      throw error;
    }
  }

  /**
   * Get gender distribution across all modules (Parallelized)
   */
  async getGenderDistribution() {
    try {
      const cacheKey = this._getCacheKey("gender_distribution");
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const models = await this._getAllModelsWithGender();
      const genderData = { male: 0, female: 0, other: 0, total: 0 };

      const allResults = await Promise.all(
        models.map((Model) =>
          Model.aggregate([
            {
              $group: {
                _id: "$gender",
                count: { $sum: 1 },
              },
            },
          ]).catch(() => [])
        )
      );

      allResults.forEach((results) => {
        results.forEach((result) => {
          const gender = (result._id || "other").toLowerCase();
          if (gender === "male" || gender === "m") {
            genderData.male += result.count;
          } else if (gender === "female" || gender === "f") {
            genderData.female += result.count;
          } else {
            genderData.other += result.count;
          }
          genderData.total += result.count;
        });
      });

      const result = [
        {
          name: "Female",
          value: genderData.female,
          percentage:
            genderData.total > 0
              ? Math.round((genderData.female / genderData.total) * 100)
              : 0,
        },
        {
          name: "Male",
          value: genderData.male,
          percentage:
            genderData.total > 0
              ? Math.round((genderData.male / genderData.total) * 100)
              : 0,
        },
        ...(genderData.other > 0
          ? [
              {
                name: "Other",
                value: genderData.other,
                percentage: Math.round(
                  (genderData.other / genderData.total) * 100
                ),
              },
            ]
          : []),
      ];

      this._setInCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error getting gender distribution:", error);
      throw error;
    }
  }

  /**
   * Get age distribution across all modules (Parallelized)
   */
  async getAgeDistribution() {
    try {
      const cacheKey = this._getCacheKey("age_distribution");
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const ageLabels = {
        "0-17": "Children (0-17)",
        "18-25": "Youth (18-25)",
        "26-35": "Young Adult (26-35)",
        "36-45": "Adult (36-45)",
        "46-55": "Middle Aged (46-55)",
        "55+": "Seniors (55+)",
      };

      const ageGroups = {
        "0-17": { name: ageLabels["0-17"], health: 0, education: 0, socialJustice: 0, total: 0 },
        "18-25": { name: ageLabels["18-25"], health: 0, education: 0, socialJustice: 0, total: 0 },
        "26-35": { name: ageLabels["26-35"], health: 0, education: 0, socialJustice: 0, total: 0 },
        "36-45": { name: ageLabels["36-45"], health: 0, education: 0, socialJustice: 0, total: 0 },
        "46-55": { name: ageLabels["46-55"], health: 0, education: 0, socialJustice: 0, total: 0 },
        "55+": { name: ageLabels["55+"], health: 0, education: 0, socialJustice: 0, total: 0 },
      };

      const healthModels = [Elderly, MotherChild, Adolescent, Tuberculosis, HIV, Leprosy, Addiction, OtherDisease, PWD];
      const educationModels = [SCStudent, Dropout];

      const aggregateModels = (models) =>
        Promise.all(
          models.map((Model) =>
            Model.aggregate([
              {
                $project: {
                  resolvedAge: {
                    $ifNull: [
                      "$age",
                      "$ageOfChild",
                      "$ageOfMother",
                      {
                        $cond: {
                          if: {
                            $and: [
                              { $gt: ["$dateOfBirth", null] },
                              { $ne: ["$dateOfBirth", ""] },
                            ],
                          },
                          then: {
                            $floor: {
                              $divide: [
                                { $subtract: [new Date(), "$dateOfBirth"] },
                                365.25 * 24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          else: null,
                        },
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: {
                    $switch: {
                      branches: [
                        { case: { $lt: ["$resolvedAge", 18] }, then: "0-17" },
                        { case: { $lt: ["$resolvedAge", 26] }, then: "18-25" },
                        { case: { $lt: ["$resolvedAge", 36] }, then: "26-35" },
                        { case: { $lt: ["$resolvedAge", 46] }, then: "36-45" },
                        { case: { $lt: ["$resolvedAge", 56] }, then: "46-55" },
                      ],
                      default: "55+",
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ]).catch(() => [])
          )
        );

      const [healthResults, educationResults] = await Promise.all([
        aggregateModels(healthModels),
        aggregateModels(educationModels),
      ]);

      healthResults.forEach((modelRes) => {
        modelRes.forEach((r) => {
          if (r._id && ageGroups[r._id]) {
            ageGroups[r._id].health += r.count;
            ageGroups[r._id].total += r.count;
          }
        });
      });

      educationResults.forEach((modelRes) => {
        modelRes.forEach((r) => {
          if (r._id && ageGroups[r._id]) {
            ageGroups[r._id].education += r.count;
            ageGroups[r._id].total += r.count;
          }
        });
      });

      const result = Object.values(ageGroups)
        .filter((group) => group.total > 0)
        .map((group) => ({
          name: group.name,
          health: group.health,
          education: group.education,
          socialJustice: group.socialJustice,
          total: group.total,
          value: group.total,
        }));

      this._setInCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error getting age distribution:", error);
      throw error;
    }
  }

  /**
   * Get module distribution for pie chart
   */
  async getModuleDistribution() {
    try {
      const cacheKey = this._getCacheKey("module_distribution");
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const [healthCount, educationCount, socialJusticeCount] = await Promise.all([
        this._getHealthModuleCount({}),
        this._getEducationModuleCount({}),
        this._getSocialJusticeModuleCount({}),
      ]);

      const total = healthCount + educationCount + socialJusticeCount;

      const result = [
        {
          name: "Health",
          value: healthCount,
          percentage: total > 0 ? Math.round((healthCount / total) * 100) : 0,
        },
        {
          name: "Education",
          value: educationCount,
          percentage: total > 0 ? Math.round((educationCount / total) * 100) : 0,
        },
        {
          name: "Social Justice",
          value: socialJusticeCount,
          percentage: total > 0 ? Math.round((socialJusticeCount / total) * 100) : 0,
        },
      ].filter((item) => item.value > 0);

      this._setInCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error getting module distribution:", error);
      throw error;
    }
  }

  /**
   * Get case status distribution
   */
  async getStatusDistribution() {
    try {
      const cacheKey = this._getCacheKey("status_distribution");
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const trackingStats = await Tracking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statusMap = trackingStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      const result = [
        { name: "In Progress", value: statusMap["In Progress"] || 0 },
        { name: "Pending", value: statusMap["Pending"] || 0 },
        { name: "Completed", value: statusMap["Completed"] || 0 },
        { name: "On Hold", value: statusMap["On Hold"] || 0 },
      ].filter((item) => item.value > 0);

      this._setInCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error getting status distribution:", error);
      throw error;
    }
  }

  /**
   * Get recent activities with lean query for better performance
   */
  async getRecentActivities(limit = 10) {
    try {
      const trackings = await Tracking.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("_id status module createdAt createdBy recordType")
        .populate("createdBy", "firstName lastName", null, { lean: true })
        .lean()
        .exec();

      return trackings.map((tracking) => ({
        _id: tracking._id,
        type: this._getActivityType(tracking),
        description: this._getActivityDescription(tracking),
        timestamp: tracking.createdAt,
        user:
          tracking.createdBy && tracking.createdBy.firstName
            ? `${tracking.createdBy.firstName} ${tracking.createdBy.lastName}`
            : "System",
        status: tracking.status,
        module: tracking.module,
      }));
    } catch (error) {
      console.error("Error getting recent activities:", error);
      return [];
    }
  }

  /**
   * Get quick insights
   */
  async getQuickInsights() {
    try {
      const cacheKey = this._getCacheKey("quick_insights");
      const cachedResult = this._getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const [
        totalTracking,
        completedTracking,
        overdueTracking,
        moduleLeader,
        focusArea,
      ] = await Promise.all([
        Tracking.countDocuments(),
        Tracking.countDocuments({ status: "Completed" }),
        Tracking.countDocuments({
          status: { $in: ["In Progress", "Pending"] },
          followUpDate: { $lt: new Date() },
        }),
        this._getLeadingModule(),
        this._getFocusArea(),
      ]);

      const completionRate =
        totalTracking > 0
          ? Math.round((completedTracking / totalTracking) * 100)
          : 0;

      const insights = [];

      if (moduleLeader.module && moduleLeader.count > 0) {
        insights.push({
          type: "info",
          title: `${moduleLeader.module} Module Leading`,
          description: `${moduleLeader.module} programs show highest engagement with ${moduleLeader.count} total cases`,
        });
      }

      if (completionRate >= 50) {
        insights.push({
          type: "success",
          title: "Case Completion Rate",
          description: `${completionRate}% of cases completed this period`,
        });
      } else if (totalTracking > 0) {
        insights.push({
          type: "warning",
          title: "Case Completion Rate",
          description: `Only ${completionRate}% of cases completed - needs attention`,
        });
      }

      if (overdueTracking > 0) {
        insights.push({
          type: "error",
          title: "Urgent Cases",
          description: `${overdueTracking} urgent cases require immediate attention`,
        });
      } else {
        insights.push({
          type: "success",
          title: "Urgent Cases",
          description: "0 urgent cases require immediate attention",
        });
      }

      if (focusArea) {
        insights.push({
          type: "info",
          title: `Focus Area: ${focusArea.name}`,
          description: `${focusArea.name} module requires attention for growth - currently ${focusArea.count} beneficiaries`,
        });
      }

      this._setInCache(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error("Error getting quick insights:", error);
      throw error;
    }
  }

  // Helper methods
  _getDateFilter(dateRange) {
    const now = new Date();
    let startDate;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "last_7_days":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "last_30_days":
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "last_90_days":
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case "last_year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        // The whole previous calendar month only, not "since the start of last month".
        return {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            $lt: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        };
      default:
        return {};
    }

    return { createdAt: { $gte: startDate } };
  }

  _getPreviousDateFilter(dateRange) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000);
        endDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "last_7_days":
        startDate = new Date(now.setDate(now.getDate() - 14));
        endDate = new Date(new Date().setDate(new Date().getDate() - 7));
        break;
      case "last_30_days":
        startDate = new Date(now.setDate(now.getDate() - 60));
        endDate = new Date(new Date().setDate(new Date().getDate() - 30));
        break;
      case "last_90_days":
        startDate = new Date(now.setDate(now.getDate() - 180));
        endDate = new Date(new Date().setDate(new Date().getDate() - 90));
        break;
      case "last_year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 2));
        endDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
        break;
      default:
        return null;
    }

    return { createdAt: { $gte: startDate, $lte: endDate } };
  }

  _getLast6Months() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      months.push({
        label: date.toLocaleString("en-US", { month: "short" }),
        start: date,
        end: endDate,
      });
    }

    return months;
  }

  async _getHealthModuleCount(filter) {
    const [
      healthCamps,
      elderly,
      motherChild,
      adolescents,
      tuberculosis,
      hiv,
      leprosy,
      addiction,
      otherDiseases,
      pwd,
    ] = await Promise.all([
      HealthCamp.countDocuments(filter),
      Elderly.countDocuments(filter),
      MotherChild.countDocuments(filter),
      Adolescent.countDocuments(filter),
      Tuberculosis.countDocuments(filter),
      HIV.countDocuments(filter),
      Leprosy.countDocuments(filter),
      Addiction.countDocuments(filter),
      OtherDisease.countDocuments(filter),
      PWD.countDocuments(filter),
    ]);

    return (
      healthCamps +
      elderly +
      motherChild +
      adolescents +
      tuberculosis +
      hiv +
      leprosy +
      addiction +
      otherDiseases +
      pwd
    );
  }

  async _getEducationModuleCount(filter) {
    const [
      studyCenters,
      scStudents,
      dropouts,
      schools,
      competitiveExams,
      boardPreparation,
    ] = await Promise.all([
      StudyCenter.countDocuments(filter),
      SCStudent.countDocuments(filter),
      Dropout.countDocuments(filter),
      School.countDocuments(filter),
      CompetitiveExam.countDocuments(filter),
      BoardPreparation.countDocuments(filter),
    ]);

    return (
      studyCenters +
      scStudents +
      dropouts +
      schools +
      competitiveExams +
      boardPreparation
    );
  }

  async _getSocialJusticeModuleCount(filter) {
    const [cbucbo, entitlements, legalAid, workshops] = await Promise.all([
      CBUCBODetails.countDocuments(filter),
      Entitlement.countDocuments(filter),
      LegalAidService.countDocuments(filter),
      WorkshopAndAwareness.countDocuments(filter),
    ]);

    return cbucbo + entitlements + legalAid + workshops;
  }

  async _getAllModelsWithGender() {
    return [
      Elderly,
      MotherChild,
      Adolescent,
      Tuberculosis,
      HIV,
      Leprosy,
      Addiction,
      OtherDisease,
      PWD,
      SCStudent,
      Dropout,
    ];
  }

  async _getAllModelsWithAge() {
    return [
      Elderly,
      MotherChild,
      Adolescent,
      Tuberculosis,
      HIV,
      Leprosy,
      Addiction,
      OtherDisease,
      PWD,
      SCStudent,
      Dropout,
    ];
  }

  async _getUrgentCasesCount(dateFilter = {}) {
    try {
      const match = {
        status: { $in: ["In Progress", "Pending"] },
        priority: { $regex: /^high$|^urgent$/i },
        followUpDate: { $lt: new Date() },
        ...dateFilter,
      };
      return await Tracking.countDocuments(match);
    } catch (error) {
      return 0;
    }
  }

  async _getRecentBeneficiariesCount() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filter = { createdAt: { $gte: thirtyDaysAgo } };

      const [healthCount, educationCount, socialJusticeCount] = await Promise.all([
        this._getHealthModuleCount(filter),
        this._getEducationModuleCount(filter),
        this._getSocialJusticeModuleCount(filter),
      ]);

      return healthCount + educationCount + socialJusticeCount;
    } catch (error) {
      return 0;
    }
  }

  async _getAllModuleCountsAggregated(dateFilter = {}) {
    try {
      const [
        healthCampsResult,
        elderlyResult,
        motherChildResult,
        adolescentsResult,
        tuberculosisResult,
        hivResult,
        leprosyResult,
        addictionResult,
        otherDiseasesResult,
        pwdResult,
        studyCentersResult,
        scStudentsResult,
        dropoutsResult,
        schoolsResult,
        competitiveExamsResult,
        boardPreparationResult,
        cbucboResult,
        entitlementsResult,
        legalAidResult,
        workshopsResult,
        pendingLegalAidResult,
      ] = await Promise.all([
        HealthCamp.countDocuments(dateFilter),
        Elderly.countDocuments(dateFilter),
        MotherChild.countDocuments(dateFilter),
        Adolescent.countDocuments(dateFilter),
        Tuberculosis.countDocuments(dateFilter),
        HIV.countDocuments(dateFilter),
        Leprosy.countDocuments(dateFilter),
        Addiction.countDocuments(dateFilter),
        OtherDisease.countDocuments(dateFilter),
        PWD.countDocuments(dateFilter),
        StudyCenter.countDocuments(dateFilter),
        SCStudent.countDocuments(dateFilter),
        Dropout.countDocuments(dateFilter),
        School.countDocuments(dateFilter),
        CompetitiveExam.countDocuments(dateFilter),
        BoardPreparation.countDocuments(dateFilter),
        CBUCBODetails.countDocuments(dateFilter),
        Entitlement.countDocuments(dateFilter),
        LegalAidService.countDocuments(dateFilter),
        WorkshopAndAwareness.countDocuments(dateFilter),
        LegalAidService.countDocuments({ ...dateFilter, status: "Pending" }),
      ]);

      return {
        healthCamps: healthCampsResult,
        elderly: elderlyResult,
        motherChild: motherChildResult,
        adolescents: adolescentsResult,
        tuberculosis: tuberculosisResult,
        hiv: hivResult,
        leprosy: leprosyResult,
        addiction: addictionResult,
        otherDiseases: otherDiseasesResult,
        pwd: pwdResult,
        studyCenters: studyCentersResult,
        scStudents: scStudentsResult,
        dropouts: dropoutsResult,
        schools: schoolsResult,
        competitiveExams: competitiveExamsResult,
        boardPreparation: boardPreparationResult,
        cbucbo: cbucboResult,
        entitlements: entitlementsResult,
        legalAid: legalAidResult,
        workshops: workshopsResult,
        pendingLegalAid: pendingLegalAidResult,
      };
    } catch (error) {
      console.error("Error in _getAllModuleCountsAggregated:", error);
      throw error;
    }
  }

  async _getLeadingModule() {
    try {
      const [healthCount, educationCount, socialJusticeCount] = await Promise.all([
        this._getHealthModuleCount({}),
        this._getEducationModuleCount({}),
        this._getSocialJusticeModuleCount({}),
      ]);

      const modules = [
        { module: "Health", count: healthCount },
        { module: "Education", count: educationCount },
        { module: "Social Justice", count: socialJusticeCount },
      ];

      return modules.reduce(
        (max, current) => (current.count > max.count ? current : max),
        modules[0]
      );
    } catch (error) {
      return { module: null, count: 0 };
    }
  }

  async _getFocusArea() {
    try {
      const [healthCount, educationCount, socialJusticeCount] = await Promise.all([
        this._getHealthModuleCount({}),
        this._getEducationModuleCount({}),
        this._getSocialJusticeModuleCount({}),
      ]);

      const modules = [
        { name: "Health", count: healthCount },
        { name: "Education", count: educationCount },
        { name: "Social Justice", count: socialJusticeCount },
      ];

      return modules.reduce(
        (min, current) => (current.count < min.count ? current : min),
        modules[0]
      );
    } catch (error) {
      return null;
    }
  }

  _getActivityType(tracking) {
    const statusTypes = {
      completed: "case_completed",
      active: "case_active",
      pending: "case_pending",
      on_hold: "case_on_hold",
    };

    return statusTypes[tracking.status] || "case_created";
  }

  _getActivityDescription(tracking) {
    const moduleNames = {
      health: "Health",
      education: "Education",
      socialJustice: "Social Justice",
    };

    const moduleName = moduleNames[tracking.module] || tracking.module;
    const statusText = tracking.status === "completed" ? "completed" : "filed";

    return `New ${moduleName.toLowerCase()} case ${statusText} for ${
      tracking.recordType || "beneficiary"
    }`;
  }
}

export default new AnalyticsService();

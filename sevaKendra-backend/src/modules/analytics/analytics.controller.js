import analyticsService from "./analytics.service.js";

class AnalyticsController {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview(req, res) {
    try {
      const { dateRange } = req.query;
      const overview = await analyticsService.getDashboardOverview(dateRange);

      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error("Error getting dashboard overview:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard overview"
      });
    }
  }

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(req, res) {
    try {
      const { moduleType } = req.query;
      const trends = await analyticsService.getMonthlyTrends(moduleType);

      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error("Error getting monthly trends:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch monthly trends"
      });
    }
  }

  /**
   * Get gender distribution
   */
  async getGenderDistribution(req, res) {
    try {
      const distribution = await analyticsService.getGenderDistribution();

      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error("Error getting gender distribution:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch gender distribution"
      });
    }
  }

  /**
   * Get age distribution
   */
  async getAgeDistribution(req, res) {
    try {
      const distribution = await analyticsService.getAgeDistribution();

      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error("Error getting age distribution:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch age distribution"
      });
    }
  }

  /**
   * Get module distribution
   */
  async getModuleDistribution(req, res) {
    try {
      const distribution = await analyticsService.getModuleDistribution();

      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error("Error getting module distribution:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch module distribution"
      });
    }
  }

  /**
   * Get status distribution
   */
  async getStatusDistribution(req, res) {
    try {
      const distribution = await analyticsService.getStatusDistribution();

      res.status(200).json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error("Error getting status distribution:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch status distribution"
      });
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(req, res) {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const activities = await analyticsService.getRecentActivities(limit);

      res.status(200).json({
        success: true,
        data: {
          activities
        }
      });
    } catch (error) {
      console.error("Error getting recent activities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent activities"
      });
    }
  }

  /**
   * Get quick insights
   */
  async getQuickInsights(req, res) {
    try {
      const insights = await analyticsService.getQuickInsights();

      res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error("Error getting quick insights:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quick insights"
      });
    }
  }

  /**
   * Get complete dashboard data
   */
  async getCompleteDashboard(req, res) {
    try {
      const { dateRange } = req.query;
      const dashboardData = await analyticsService.getCompleteDashboard(dateRange);

      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error("Error getting complete dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data"
      });
    }
  }
}

export default new AnalyticsController();

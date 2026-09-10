(function (global) {
  "use strict";

  const DASHBOARDS_KEY = "farmerDashboards";
  const LEGACY_DASHBOARD_KEY = "farmerDashboard";
  const STATUSES = ["Submitted", "Acknowledged", "Under Observation", "Referred", "Resolved"];

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function farmerIdFromDashboard(dashboard) {
    return dashboard?.farmerId || dashboard?.farmerCode || dashboard?.ownerCode || "";
  }

  function canonicalStatus(report) {
    const value = String(report?.status || "").trim().toLowerCase();
    const collectorStatus = String(report?.collectorStatus || "").trim().toLowerCase();

    if (value === "resolved" || collectorStatus === "resolved") return "Resolved";
    if (value === "referred") return "Referred";
    if (value === "under observation" || value === "under_observation") return "Under Observation";
    if (value === "acknowledged") return "Acknowledged";
    if (["visited", "notified", "scheduled"].includes(collectorStatus)) return "Acknowledged";
    return "Submitted";
  }

  function eventTime(report) {
    const parsed = Date.parse(report?.createdAt || report?.time || "");
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    if (report?.observed) return `${report.observed}T08:00:00`;
    return new Date().toISOString();
  }

  function normalizeReport(report, farmerId, farmerName) {
    const normalized = { ...report };
    normalized.status = canonicalStatus(report);
    normalized.farmerId = normalized.farmerId || farmerId || "";
    normalized.farmerName = normalized.farmerName || farmerName || normalized.farmerId || "Farmer";
    normalized.assignedCollectorId = normalized.assignedCollectorId || null;
    normalized.followUpDate = normalized.followUpDate || normalized.follow_up_date || normalized.visitDate || null;
    normalized.resolvedAt = normalized.resolvedAt || normalized.resolved_at || null;
    normalized.assessments = Array.isArray(normalized.assessments) ? normalized.assessments : [];
    normalized.activityHistory = Array.isArray(normalized.activityHistory) ? normalized.activityHistory : [];

    if (!normalized.activityHistory.length) {
      normalized.activityHistory.push({
        id: `activity-${normalized.id || Date.now()}-submitted`,
        healthReportId: normalized.id || "",
        userId: normalized.farmerId,
        userRole: "Farmer",
        action: "Farmer submitted the health report.",
        oldStatus: null,
        newStatus: "Submitted",
        createdAt: eventTime(normalized)
      });
    }

    return normalized;
  }

  function mergeLegacyDashboard(dashboards) {
    const legacy = read(LEGACY_DASHBOARD_KEY, null);
    const legacyId = farmerIdFromDashboard(legacy);
    if (!legacy || !legacyId) return dashboards;

    const stored = dashboards[legacyId] || {};
    const reports = new Map((legacy.reports || []).map((report) => [report.id, report]));
    (stored.reports || []).forEach((report) => {
      reports.set(report.id, { ...(reports.get(report.id) || {}), ...report });
    });
    dashboards[legacyId] = { ...legacy, ...stored, farmerId: legacyId, reports: [...reports.values()] };
    return dashboards;
  }

  function getDashboards() {
    const dashboards = mergeLegacyDashboard(read(DASHBOARDS_KEY, {}));
    Object.entries(dashboards).forEach(([farmerId, dashboard]) => {
      const farmerName = dashboard.ownerName || dashboard.owner || dashboard.name || farmerId;
      dashboard.reports = (Array.isArray(dashboard.reports) ? dashboard.reports : []).map((report) =>
        normalizeReport(report, farmerId, farmerName)
      );
    });
    write(DASHBOARDS_KEY, dashboards);
    syncLegacy(dashboards);
    return dashboards;
  }

  function syncLegacy(dashboards) {
    const legacy = read(LEGACY_DASHBOARD_KEY, null);
    const legacyId = farmerIdFromDashboard(legacy);
    if (legacyId && dashboards[legacyId]) write(LEGACY_DASHBOARD_KEY, dashboards[legacyId]);
  }

  function saveDashboard(farmerId, dashboard) {
    const dashboards = read(DASHBOARDS_KEY, {});
    dashboards[farmerId] = dashboard;
    write(DASHBOARDS_KEY, dashboards);
    syncLegacy(dashboards);
  }

  function getReports() {
    const dashboards = getDashboards();
    const reports = [];
    Object.entries(dashboards).forEach(([farmerId, dashboard]) => {
      const farmerName = dashboard.ownerName || dashboard.owner || dashboard.name || farmerId;
      (dashboard.reports || []).forEach((report) => {
        reports.push(normalizeReport(report, farmerId, farmerName));
      });
    });
    return reports.sort((a, b) => Date.parse(b.createdAt || b.time || b.observed || 0) - Date.parse(a.createdAt || a.time || a.observed || 0));
  }

  function updateReport(farmerId, reportId, updater) {
    const dashboards = getDashboards();
    const dashboard = dashboards[farmerId];
    if (!dashboard || !Array.isArray(dashboard.reports)) return null;
    const index = dashboard.reports.findIndex((report) => report.id === reportId);
    if (index < 0) return null;

    const farmerName = dashboard.ownerName || dashboard.owner || dashboard.name || farmerId;
    const report = normalizeReport(dashboard.reports[index], farmerId, farmerName);
    updater(report, dashboard);
    dashboard.reports[index] = normalizeReport(report, farmerId, farmerName);
    dashboards[farmerId] = dashboard;
    write(DASHBOARDS_KEY, dashboards);
    syncLegacy(dashboards);
    return dashboard.reports[index];
  }

  function addActivity(report, details) {
    report.activityHistory = Array.isArray(report.activityHistory) ? report.activityHistory : [];
    const createdAt = details.createdAt || new Date().toISOString();
    report.activityHistory.push({
      id: details.id || `activity-${Date.now()}-${report.activityHistory.length + 1}`,
      healthReportId: report.id,
      userId: details.userId || "",
      userRole: details.userRole || "System",
      action: details.action,
      oldStatus: details.oldStatus || null,
      newStatus: details.newStatus || null,
      createdAt
    });
  }

  function acknowledge(farmerId, reportId, actor) {
    return updateReport(farmerId, reportId, (report) => {
      if (report.status !== "Submitted") return;
      const oldStatus = report.status;
      report.status = "Acknowledged";
      report.assignedCollectorId = report.assignedCollectorId || actor.id || null;
      report.assignedCollectorName = report.assignedCollectorName || actor.name || "Collector";
      report.acknowledgedAt = new Date().toISOString();
      addActivity(report, {
        userId: actor.id,
        userRole: actor.role || "Collector",
        action: "Collector acknowledged the health report.",
        oldStatus,
        newStatus: report.status
      });
    });
  }

  function addAssessment(farmerId, reportId, assessment, actor) {
    return updateReport(farmerId, reportId, (report) => {
      const oldStatus = report.status;
      const newStatus = STATUSES.includes(assessment.status) ? assessment.status : oldStatus;
      const now = new Date().toISOString();
      const entry = {
        id: `assessment-${Date.now()}-${report.assessments.length + 1}`,
        healthReportId: report.id,
        collectorId: actor.id || "",
        collectorName: actor.name || "Collector",
        observation: assessment.observation.trim(),
        actionTaken: assessment.actionTaken.trim(),
        followUpRequired: Boolean(assessment.followUpRequired),
        followUpDate: assessment.followUpRequired ? assessment.followUpDate || null : null,
        statusAfterAssessment: newStatus,
        assessmentType: assessment.assessmentType === "FOLLOW_UP" ? "FOLLOW_UP" : "INITIAL_ASSESSMENT",
        createdAt: now,
        updatedAt: now
      };

      report.assessments.push(entry);
      report.assignedCollectorId = report.assignedCollectorId || actor.id || null;
      report.assignedCollectorName = report.assignedCollectorName || actor.name || "Collector";
      report.followUpDate = entry.followUpDate;
      report.status = newStatus;
      report.collectorStatus = newStatus === "Resolved" ? "resolved" : "visited";
      if (newStatus === "Resolved") report.resolvedAt = now;

      addActivity(report, {
        userId: actor.id,
        userRole: actor.role || "Collector",
        action: entry.assessmentType === "FOLLOW_UP" ? "Collector added a follow-up assessment." : "Collector added an assessment.",
        createdAt: now
      });
      if (oldStatus !== newStatus) {
        addActivity(report, {
          userId: actor.id,
          userRole: actor.role || "Collector",
          action: `Status changed from ${oldStatus} to ${newStatus}.`,
          oldStatus,
          newStatus,
          createdAt: now
        });
      }
    });
  }

  function nextReportId() {
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^HR-${year}-(\\d+)$`);
    const highest = getReports().reduce((max, report) => {
      const match = String(report.id || "").match(pattern);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `HR-${year}-${String(highest + 1).padStart(3, "0")}`;
  }

  function statusClass(status) {
    return String(status || "submitted").toLowerCase().replaceAll(" ", "-");
  }

  function formatDate(value, includeTime) {
    if (!value) return "—";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T00:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-US", includeTime
      ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  global.CaraTraceHealth = {
    STATUSES,
    read,
    write,
    canonicalStatus,
    normalizeReport,
    getDashboards,
    saveDashboard,
    getReports,
    updateReport,
    addActivity,
    acknowledge,
    addAssessment,
    nextReportId,
    statusClass,
    formatDate,
    escapeHtml
  };
})(window);

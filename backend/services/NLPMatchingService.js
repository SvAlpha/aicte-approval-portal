'use strict';

const IEvaluatorMatcher = require('./IEvaluatorMatcher');

/**
 * NLPMatchingService implements IEvaluatorMatcher (Strategy Design Pattern)
 * Ranks eligible evaluators by NLP domain expertise alignment and dynamically computed active workload.
 */
class NLPMatchingService extends IEvaluatorMatcher {
  constructor() {
    super();
    this.strategyName = 'TFIDF-Domain-Workload-Matcher';
  }

  /**
   * Suggests ranked evaluators for an application (SRS 3.5 REQ-1 to REQ-4).
   * @param {object} application - Target Application object
   * @param {Array<object>} evaluators - All Evaluator instances
   * @param {Array<object>} allApplications - All Application instances to compute dynamic workload
   * @returns {Array<object>} Ranked list of eligible evaluators with suitability scores
   */
  suggestEvaluator(application, evaluators = [], allApplications = []) {
    if (!application) {
      throw new Error('Application is required for evaluator matching');
    }

    const tokenize = (text) =>
      String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);

    const appTokens = new Set(
      tokenize(`${application.subject_applied_for} ${application.application_details || ''}`)
    );

    // SRS 3.5 REQ-3: Exclude inactive, unverified, or unavailable evaluators
    const eligible = evaluators.filter(
      (ev) => ev.is_active === true && ev.is_verified === true && ev.availability === 'Available'
    );

    const scored = eligible.map((ev) => {
      const evTokens = tokenize(ev.expertise);
      const matched = evTokens.filter((token) => appTokens.has(token));
      const expertiseScore = Math.min(
        100,
        Math.round((matched.length / Math.max(1, Math.min(evTokens.length, 4))) * 100)
      );

      // SRS 3.5 REQ-2: Compute workload dynamically by counting active assigned applications
      const activeWorkload = allApplications.filter(
        (app) =>
          app.assigned_evaluator_id === ev.evaluator_id &&
          ['Under Review', 'Clarification Requested'].includes(app.status)
      ).length;

      const workloadScore = Math.max(10, 100 - activeWorkload * 25);
      const suitabilityScore = Math.round(expertiseScore * 0.65 + workloadScore * 0.35);

      return {
        evaluator_id: ev.evaluator_id,
        evaluator_name: ev.evaluator_name,
        expertise: ev.expertise,
        active_workload: activeWorkload,
        expertise_score: expertiseScore,
        workload_score: workloadScore,
        suitability_score: suitabilityScore,
        matched_keywords: matched
      };
    });

    return scored.sort((a, b) => b.suitability_score - a.suitability_score);
  }
}

module.exports = NLPMatchingService;

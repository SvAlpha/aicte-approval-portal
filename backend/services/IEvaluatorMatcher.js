'use strict';

/**
 * <<interface>> IEvaluatorMatcher
 * Formal interface contract for AI Module 2 (AI-Assisted Evaluator Matching).
 * Enforces Dependency Inversion Principle (SOLID).
 */
class IEvaluatorMatcher {
  /**
   * Computes ranked evaluator suggestions for a given application.
   * @param {object} _application
   * @param {Array} _evaluators
   * @param {Array} _allApplications
   * @returns {Array}
   */
  suggestEvaluator(_application, _evaluators, _allApplications) {
    throw new Error('NotImplementedError: IEvaluatorMatcher.suggestEvaluator(application) must be implemented by concrete strategy.');
  }
}

module.exports = IEvaluatorMatcher;

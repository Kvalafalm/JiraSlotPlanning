/* const jiraConnections = require('../externalConnections/jiraConnections'); */
import ApiError from '../../utils/exceptions/api_error';
import issueServices from './issue-services.js';

class issueController {


  async updateIssue(req, res, next) {
    try {
      const fields = req?.body;
      const { id } = req?.params;
      if (!id) {
        throw ApiError.BadRequest('no req parameters');
      }

      const result = await issueServices.updateIssue(id, fields);
      await res.status(200).json({
        result
      });
    } catch (e) {
      next(e);
    }
  }

  async getPlanOnDate(req, res, next) {
    try {
      const { keys, params } = req?.body;
      if (!keys) {
        throw ApiError.BadRequest('no req parameters');
      }

      const result = await issueServices.getPlanOnDate(keys, params);
      await res.status(200).json({
        result
      });
    } catch (e) {
      next(e);
    }
  }

  async getBlockersLink(req, res, next) {
    try {
      const { keys, params } = req?.body;
      if (!keys) {
        throw ApiError.BadRequest('no req parameters');
      }

      const { planView, WIPTimeLine } = await issueServices.calculatePlan(keys, params);
      await res.status(200).json({
        plan: planView,
        WIPTimeLine
      });
    } catch (e) {
      next(e);
    }
  }
}



export default new issueController();

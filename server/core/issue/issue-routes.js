import { Router } from 'express';
import issueController from './issue-controller.js';

const issueRouter = Router();

issueRouter.post('/planning', issueController.getBlockersLink);
issueRouter.post('/planOndate', issueController.getPlanOnDate);
issueRouter.put('/:id', issueController.updateIssue);
export default issueRouter;

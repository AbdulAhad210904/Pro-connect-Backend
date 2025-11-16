import express from 'express';
import { createProject, getProjects, getProject, updateProject, getUserProjects, deleteProject, assignProjectToCraftsman, completeProject, getProjectApplicants } from '../controllers/projectController.js';
import { checkAlreadyApplied, applyToProject, getCraftsmanAppliedProjects, getCraftsmanCurrentProjects, getCraftsmanProjectHistory, checkCanApply } from '../controllers/projectController.js';
import { authenticate } from '../middlewares/authentication.js';
import { verifyCraftsman, verifyIndividual } from '../middlewares/authorization.js';

const router = express.Router();
//middlwares added as well.
router.get('/getproject/:projectId',authenticate, getProject);

// Individual routes
router.post('/createproject', authenticate,verifyIndividual, createProject);
router.patch('/updateproject/:id', authenticate,verifyIndividual, updateProject);
router.get('/users/:userId/projects', authenticate, verifyIndividual, getUserProjects);
router.delete('/deleteproject/:id', authenticate,verifyIndividual, deleteProject);
router.post('/assign',authenticate,verifyIndividual, assignProjectToCraftsman);
router.post('/completeproject',authenticate,verifyIndividual, completeProject);
router.get('/getapplicants/:id',authenticate,verifyIndividual, getProjectApplicants);

// Craftsman routes
router.get('/getprojects',authenticate,verifyCraftsman, getProjects);
router.post('/check-applied', authenticate, verifyCraftsman, checkAlreadyApplied);
router.post('/check-can-apply', checkCanApply);
router.post('/:id/apply', authenticate,verifyCraftsman, applyToProject);
router.get('/craftsman/:craftsmanId/appliedprojects',authenticate,verifyCraftsman, getCraftsmanAppliedProjects);
router.get('/craftsman/:craftsmanId/currentprojects',authenticate,verifyCraftsman, getCraftsmanCurrentProjects);
router.get('/craftsman/:craftsmanId/projecthistory',authenticate,verifyCraftsman, getCraftsmanProjectHistory);

export default router;
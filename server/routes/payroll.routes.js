import { Router } from 'express';
import payrollController from '../controllers/payroll.controller.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';
import { salaryStructureSchema, createPayrollRunSchema } from '../validators/payroll.validator.js';

const router = Router();

router.use(authenticate);

// Salary structures - HR can edit; HR and Admin can view
router.put(
  '/salary-structures/:employeeId',
  authorize(ROLES.HR),
  validate({ body: salaryStructureSchema }),
  payrollController.setSalaryStructure
);
router.get(
  '/salary-structures/:employeeId',
  authorize(ROLES.ADMIN, ROLES.HR),
  payrollController.getSalaryStructure
);

// Payroll runs - HR prepares draft; Admin and HR view
router.post(
  '/runs',
  authorize(ROLES.HR),
  validate({ body: createPayrollRunSchema }),
  payrollController.createPayrollRun
);
router.get('/runs', authorize(ROLES.ADMIN, ROLES.HR), payrollController.getPayrollRuns);
router.get('/runs/:id', authorize(ROLES.ADMIN, ROLES.HR), payrollController.getPayrollRunById);

// Admin finalizes payroll run (strictly Admin only)
router.post('/runs/:id/finalize', authorize(ROLES.ADMIN), payrollController.finalizePayrollRun);

// Employee payslips
router.get('/me/payslips', authorize(ROLES.EMPLOYEE), payrollController.getMyPayslips);
router.get('/me/payslips/:id', authorize(ROLES.EMPLOYEE), payrollController.getPayslipById);
router.get('/me/payslips/:id/pdf', authorize(ROLES.EMPLOYEE), payrollController.downloadPayslipPdf);

// Admin and HR access to specific payslip and PDF download
router.get('/payslips/:id', authorize(ROLES.ADMIN, ROLES.HR), payrollController.getPayslipById);
router.get('/payslips/:id/pdf', authorize(ROLES.ADMIN, ROLES.HR), payrollController.downloadPayslipPdf);

export default router;

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDb, closeDb } from '../config/db.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import Notification from '../models/Notification.js';

describe('HCM Lite Comprehensive Backend Test Suite (All 20 Requirements)', () => {
  let server;
  let baseUrl;

  // Test state variables
  let adminToken = '';
  let hrToken = '';
  let empAToken = '';
  let empBToken = '';
  let companyId = '';
  let deptId = '';
  let desgId = '';
  let empAId = '';
  let empBId = '';
  let empAUserId = '';
  let empBUserId = '';
  let payrollRunId = '';
  let empAPayslipId = '';
  let empBPayslipId = '';

  before(async () => {
    await connectDb();

    // Start server on an ephemeral port
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;

    // Clean up any previous test company/users if present
    const existingCompany = await Company.findOne({ name: 'Test HCM Corp' });
    if (existingCompany) {
      await User.deleteMany({ company: existingCompany._id });
      await Employee.deleteMany({ company: existingCompany._id });
      await Department.deleteMany({ company: existingCompany._id });
      await Designation.deleteMany({ company: existingCompany._id });
      await Attendance.deleteMany({ company: existingCompany._id });
      await LeaveRequest.deleteMany({ company: existingCompany._id });
      await PayrollRun.deleteMany({ company: existingCompany._id });
      await Payslip.deleteMany({ company: existingCompany._id });
      await Notification.deleteMany({ company: existingCompany._id });
      await Company.deleteOne({ _id: existingCompany._id });
    }
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDb();
  });

  // Helper fetch function
  const request = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.token && { Authorization: `Bearer ${options.token}` }),
      ...options.headers,
    };
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, headers: res.headers, body: data };
  };

  // Requirement 20: Invalid request bodies are rejected with consistent errors
  it('Req 20: Invalid request bodies should be rejected with consistent 400 errors', async () => {
    const res = await request('/setup/initialize', {
      method: 'POST',
      body: { companyName: '' }, // Missing adminEmail, adminPassword
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  });

  // Requirement 1: First-run setup succeeds once and rejects a second initialization
  it('Req 1: First-run setup should succeed once and reject a second initialization with 409', async () => {
    const res1 = await request('/setup/initialize', {
      method: 'POST',
      body: {
        companyName: 'Test HCM Corp',
        adminEmail: 'admin@testhcm.com',
        adminPassword: 'SuperAdminPassword123!',
      },
    });

    assert.equal(res1.status, 201);
    assert.equal(res1.body.success, true);
    assert.ok(res1.body.data.token);
    assert.equal(res1.body.data.admin.email, 'admin@testhcm.com');

    adminToken = res1.body.data.token;
    companyId = res1.body.data.company.id;

    // Second initialization attempt must be rejected with 409 Conflict
    const res2 = await request('/setup/initialize', {
      method: 'POST',
      body: {
        companyName: 'Duplicate Corp',
        adminEmail: 'admin2@testhcm.com',
        adminPassword: 'SuperAdminPassword123!',
      },
    });

    assert.equal(res2.status, 409);
    assert.equal(res2.body.success, false);
  });

  // Requirement 2: Valid login succeeds; invalid credentials fail
  it('Req 2: Valid login succeeds; invalid credentials fail (401)', async () => {
    // Valid credentials
    const validLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@testhcm.com',
        password: 'SuperAdminPassword123!',
      },
    });
    assert.equal(validLogin.status, 200);
    assert.equal(validLogin.body.success, true);
    assert.ok(validLogin.body.data.token);

    // Invalid password
    const invalidLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@testhcm.com',
        password: 'WrongPassword999!',
      },
    });
    assert.equal(invalidLogin.status, 401);
    assert.equal(invalidLogin.body.success, false);
  });

  // Requirement 4: Missing or invalid JWT is rejected
  it('Req 4: Missing or invalid JWT is rejected (401)', async () => {
    // No token
    const noTokenRes = await request('/company');
    assert.equal(noTokenRes.status, 401);

    // Fake invalid token
    const badTokenRes = await request('/company', { token: 'invalid_token_12345' });
    assert.equal(badTokenRes.status, 401);
  });

  // Create HR Account & Verify Role Middleware (Req 5)
  it('Req 5: Role middleware blocks unauthorized operations', async () => {
    // 1. Admin creates HR user
    const hrRes = await request('/users/hr', {
      method: 'POST',
      token: adminToken,
      body: {
        email: 'hr@testhcm.com',
        password: 'HRPassword123!',
      },
    });
    assert.equal(hrRes.status, 201);

    // Login as HR
    const hrLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'hr@testhcm.com', password: 'HRPassword123!' },
    });
    assert.equal(hrLogin.status, 200);
    hrToken = hrLogin.body.data.token;

    // HR attempts to call Admin-only route (PUT /company/settings) -> Must return 403 Forbidden!
    const forbiddenRes = await request('/company/settings', {
      method: 'PUT',
      token: hrToken,
      body: { settings: { officeStartTime: '08:30' } },
    });
    assert.equal(forbiddenRes.status, 403);
    assert.equal(forbiddenRes.body.success, false);
  });

  // Set up Department, Designation, and Employees A and B
  it('Setup Department, Designation and Employees A and B', async () => {
    // Admin creates Department
    const deptRes = await request('/departments', {
      method: 'POST',
      token: adminToken,
      body: { name: 'Engineering', code: 'ENG' },
    });
    assert.equal(deptRes.status, 201);
    deptId = deptRes.body.data._id;

    // Admin creates Designation
    const desgRes = await request('/designations', {
      method: 'POST',
      token: adminToken,
      body: { title: 'Software Engineer', department: deptId },
    });
    assert.equal(desgRes.status, 201);
    desgId = desgRes.body.data._id;

    // HR creates Employee A
    const empARes = await request('/employees', {
      method: 'POST',
      token: hrToken,
      body: {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@testhcm.com',
        phone: '1234567890',
        joiningDate: '2026-01-01',
        department: deptId,
        designation: desgId,
        basicSalary: 100000,
        employeeCode: 'EMP001',
      },
    });
    assert.equal(empARes.status, 201);
    empAId = empARes.body.data.employee._id;
    const tempPasswordA = empARes.body.data.temporaryPassword;

    // HR creates Employee B
    const empBRes = await request('/employees', {
      method: 'POST',
      token: hrToken,
      body: {
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@testhcm.com',
        phone: '0987654321',
        joiningDate: '2026-01-01',
        department: deptId,
        designation: desgId,
        basicSalary: 120000,
        employeeCode: 'EMP002',
      },
    });
    assert.equal(empBRes.status, 201);
    empBId = empBRes.body.data.employee._id;
    const tempPasswordB = empBRes.body.data.temporaryPassword;

    // Login Employee A
    const loginA = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alice@testhcm.com', password: tempPasswordA },
    });
    assert.equal(loginA.status, 200);
    empAToken = loginA.body.data.token;
    empAUserId = loginA.body.data.user.id;

    // Login Employee B
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: 'bob@testhcm.com', password: tempPasswordB },
    });
    assert.equal(loginB.status, 200);
    empBToken = loginB.body.data.token;
    empBUserId = loginB.body.data.user.id;
  });

  // Requirement 6: Employee A cannot read Employee B's profile, attendance, leave, or payslip (IDOR check)
  it("Req 6: Employee A cannot read Employee B's profile (IDOR protection)", async () => {
    // Employee A attempts to view Employee B's profile 360 -> Must be 403 Forbidden!
    const idorProfile = await request(`/employees/${empBId}`, {
      method: 'GET',
      token: empAToken,
    });
    assert.equal(idorProfile.status, 403);
  });

  // Requirement 7: Duplicate daily check-in returns 409
  it('Req 7: Duplicate daily check-in returns 409, including concurrent attempts', async () => {
    // First check-in
    const checkIn1 = await request('/attendance/check-in', {
      method: 'POST',
      token: empAToken,
      body: { note: 'Morning check-in' },
    });
    assert.equal(checkIn1.status, 200);

    // Duplicate check-in on same day -> 409 Conflict
    const checkIn2 = await request('/attendance/check-in', {
      method: 'POST',
      token: empAToken,
      body: { note: 'Second attempt' },
    });
    assert.equal(checkIn2.status, 409);
  });

  // Requirement 8: Check-out cannot precede check-in
  it('Req 8: Check-out cannot precede check-in', async () => {
    // Employee B has not checked in yet. Trying to check out should fail (400)
    const invalidCheckOut = await request('/attendance/check-out', {
      method: 'POST',
      token: empBToken,
      body: { note: 'Checking out without checking in' },
    });
    assert.equal(invalidCheckOut.status, 400);
  });

  // Requirement 10: Overlapping and over-quota leave requests are rejected
  it('Req 10: Overlapping and over-quota leave requests are rejected', async () => {
    // 1. Employee A requests 2 days of Annual leave
    const leave1 = await request('/leaves', {
      method: 'POST',
      token: empAToken,
      body: {
        leaveTypeCode: 'ANNUAL',
        startDate: '2026-06-08', // Monday
        endDate: '2026-06-09',   // Tuesday
        reason: 'Personal vacation',
      },
    });
    assert.equal(leave1.status, 201);
    const leave1Id = leave1.body.data._id;

    // 2. Overlapping leave request -> 409 Conflict
    const overlapLeave = await request('/leaves', {
      method: 'POST',
      token: empAToken,
      body: {
        leaveTypeCode: 'ANNUAL',
        startDate: '2026-06-09', // Overlaps with 2026-06-09
        endDate: '2026-06-10',
        reason: 'Overlapping request',
      },
    });
    assert.equal(overlapLeave.status, 409);

    // 3. Over-quota leave request: Annual leave quota is 14 days. Requesting 20 days -> 400 Bad Request
    const overQuotaLeave = await request('/leaves', {
      method: 'POST',
      token: empAToken,
      body: {
        leaveTypeCode: 'ANNUAL',
        startDate: '2026-07-01',
        endDate: '2026-07-31', // Contains ~23 working days > 14
        reason: 'Month long leave',
      },
    });
    assert.equal(overQuotaLeave.status, 400);
  });

  // Requirement 11: Only HR can decide leave requests
  it('Req 11: Only HR can decide leave requests (Employee and Admin cannot)', async () => {
    // Get Employee A's pending leave
    const leavesRes = await request('/leaves/me', { token: empAToken });
    const pendingLeaveId = leavesRes.body.data.items[0]._id;

    // Employee A attempts to approve own leave -> 403 Forbidden
    const empApprove = await request(`/leaves/${pendingLeaveId}/decision`, {
      method: 'PATCH',
      token: empAToken,
      body: { status: 'APPROVED', decisionNote: 'Self approved' },
    });
    assert.equal(empApprove.status, 403);

    // Admin attempts to approve leave -> 403 Forbidden (Only HR can decide leaves as per challenge brief)
    const adminApprove = await request(`/leaves/${pendingLeaveId}/decision`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'APPROVED', decisionNote: 'Admin bypass attempt' },
    });
    assert.equal(adminApprove.status, 403);

    // HR approves leave -> 200 OK
    const hrApprove = await request(`/leaves/${pendingLeaveId}/decision`, {
      method: 'PATCH',
      token: hrToken,
      body: { status: 'APPROVED', decisionNote: 'Approved by HR Manager' },
    });
    assert.equal(hrApprove.status, 200);
    assert.equal(hrApprove.body.data.status, 'APPROVED');
  });

  // Requirements 13 & 14: Payroll creation, Only Admin can finalize, Finalized cannot be changed
  it('Req 13 & 14: Only Admin can finalize payroll; Finalized payroll cannot be changed', async () => {
    // 1. HR prepares payroll draft for May 2026
    const draftRes = await request('/payroll/runs', {
      method: 'POST',
      token: hrToken,
      body: { year: 2026, month: 5, notes: 'May 2026 Payroll' },
    });
    assert.equal(draftRes.status, 201);
    payrollRunId = draftRes.body.data._id;

    // 2. HR attempts to finalize payroll -> 403 Forbidden (Only Admin can finalize!)
    const hrFinalize = await request(`/payroll/runs/${payrollRunId}/finalize`, {
      method: 'POST',
      token: hrToken,
    });
    assert.equal(hrFinalize.status, 403);

    // 3. Admin finalizes payroll -> 200 OK
    const adminFinalize = await request(`/payroll/runs/${payrollRunId}/finalize`, {
      method: 'POST',
      token: adminToken,
    });
    assert.equal(adminFinalize.status, 200);
    assert.equal(adminFinalize.body.data.status, 'FINALIZED');

    // 4. Attempt to finalize again -> 409 Conflict
    const secondFinalize = await request(`/payroll/runs/${payrollRunId}/finalize`, {
      method: 'POST',
      token: adminToken,
    });
    assert.equal(secondFinalize.status, 409);
  });

  // Requirement 15: Employees cannot access another employee's payslip PDF (IDOR protection)
  it("Req 15: Employees cannot access another employee's payslip PDF", async () => {
    // Fetch payslips for Run
    const runDetails = await request(`/payroll/runs/${payrollRunId}`, { token: adminToken });
    const payslips = runDetails.body.data.payslips;

    const payslipA = payslips.find((p) => p.employee._id === empAId);
    const payslipB = payslips.find((p) => p.employee._id === empBId);

    empAPayslipId = payslipA._id;
    empBPayslipId = payslipB._id;

    // Employee A requests their own payslip PDF -> 200 OK
    const myPdfRes = await fetch(`${baseUrl}/payroll/me/payslips/${empAPayslipId}/pdf`, {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert.equal(myPdfRes.status, 200);
    assert.equal(myPdfRes.headers.get('content-type'), 'application/pdf');

    // Employee A attempts to request Employee B's payslip PDF -> 403 Forbidden!
    const stolenPdfRes = await fetch(`${baseUrl}/payroll/me/payslips/${empBPayslipId}/pdf`, {
      headers: { Authorization: `Bearer ${empAToken}` },
    });
    assert.equal(stolenPdfRes.status, 403);
  });

  // Requirement 16: Dashboard calculations use database records
  it('Req 16: Dashboard calculations use database records', async () => {
    const adminDash = await request('/dashboard/admin', { token: adminToken });
    assert.equal(adminDash.status, 200);
    assert.equal(adminDash.body.data.overview.activeEmployees, 2);
    assert.ok(adminDash.body.data.overview.monthlyPayrollEstimate > 0);

    const hrDash = await request('/dashboard/hr', { token: hrToken });
    assert.equal(hrDash.status, 200);
    assert.equal(hrDash.body.data.today.totalActiveEmployees, 2);

    const empDash = await request('/dashboard/me', { token: empAToken });
    assert.equal(empDash.status, 200);
    assert.equal(empDash.body.data.todayStatus.isCheckedIn, true);
  });

  // Requirement 17: AI tools obey caller permissions & fail safely when API key is missing
  it('Req 17: AI tools obey caller permissions and fail safely when API key is missing', async () => {
    const aiRes = await request('/ai/chat', {
      method: 'POST',
      token: empAToken,
      body: { message: 'What is the leave policy for casual leaves?' },
    });
    assert.equal(aiRes.status, 200);
    assert.equal(aiRes.body.success, true);
    assert.ok(aiRes.body.data.answer);
    assert.equal(aiRes.body.data.isAIGenerated, true);

    // Smart leave endpoint
    const smartLeaveRes = await request('/ai/smart-leave', {
      method: 'POST',
      token: empAToken,
      body: { query: 'I need sick leave on 2026-08-10 due to fever' },
    });
    assert.equal(smartLeaveRes.status, 200);
    assert.ok(smartLeaveRes.body.data.type);
  });

  // Requirement 18: Users cannot access another user's notifications
  it("Req 18: Users cannot access another user's notifications", async () => {
    // When payroll was finalized, notifications were generated for Employee A and B
    const notifARes = await request('/notifications', { token: empAToken });
    assert.equal(notifARes.status, 200);
    const notifA = notifARes.body.data.items[0];

    const notifBRes = await request('/notifications', { token: empBToken });
    assert.equal(notifBRes.status, 200);
    const notifB = notifBRes.body.data.items[0];

    // Employee A attempts to mark Employee B's notification as read -> 404 Not Found (scoped to user)
    const readAttempt = await request(`/notifications/${notifB._id}/read`, {
      method: 'PATCH',
      token: empAToken,
    });
    assert.equal(readAttempt.status, 404);
  });

  // Requirement 19: Only Admin can view audit logs
  it('Req 19: Only Admin can view audit logs', async () => {
    // Admin reads audit logs -> 200 OK
    const adminAudit = await request('/audit', { token: adminToken });
    assert.equal(adminAudit.status, 200);
    assert.ok(adminAudit.body.data.items.length > 0);

    // HR attempts to view audit logs -> 403 Forbidden
    const hrAudit = await request('/audit', { token: hrToken });
    assert.equal(hrAudit.status, 403);

    // Employee attempts to view audit logs -> 403 Forbidden
    const empAudit = await request('/audit', { token: empAToken });
    assert.equal(empAudit.status, 403);
  });
});

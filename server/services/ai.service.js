import { Groq } from 'groq-sdk';
import { env } from '../config/env.js';
import { ROLES } from '../config/constants.js';
import AILog from '../models/AILog.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import SalaryStructure from '../models/SalaryStructure.js';
import PayrollRun from '../models/PayrollRun.js';
import { formatDateStr } from '../utils/workingDays.js';
import { getEmployeeLeaveBalances } from './leave.service.js';

let groqClient = null;
if (env.AI_API_KEY && env.AI_API_KEY.trim() !== '') {
  try {
    groqClient = new Groq({ apiKey: env.AI_API_KEY, timeout: 15000 });
  } catch (err) {
    console.warn('[AI] Failed to initialize Groq SDK:', err.message);
  }
}

const SYSTEM_PROMPT = `You are HCM Lite AI, a knowledgeable human capital management assistant for an enterprise HR system.
Your role is to assist users based strictly on their permissions, configured policies, and available system tools.

COMPANY POLICIES & CHALLENGE RULES:
1. Working Hours & Attendance:
   - Official office start time: 09:00.
   - Grace period: 15 minutes (arrival after 09:15 is marked LATE).
   - Half-day threshold: Total work duration under 5 hours is classified as HALF_DAY.
   - Weekend days (Saturday and Sunday) and configured public holidays are excluded from expected working days.
2. Leave Quotas (Standard Working Days Per Year):
   - Annual Leave: 14 working days.
   - Sick Leave: 8 working days.
   - Casual Leave: 10 working days.
   - Unpaid Leave: Unlimited quota, subject to manager/HR approval.
   - Leave requests count working days only (weekends and holidays are never deducted from quota).
   - Overlapping leave requests and requests exceeding available quota are strictly rejected.
   - Only HR personnel can approve or reject leave requests. Employees cannot approve their own requests.
3. Salary & Payroll Formula:
   - Basic Salary is the foundation.
   - House Rent Allowance (HRA) = 40% of basic salary.
   - Medical Allowance = 10% of basic salary.
   - Gross Salary = 1.5 * basic salary + any other allowances.
   - Per-day gross = Gross salary / Expected working days in the payroll month.
   - Attendance deductions: 1 day gross for each absent or unpaid leave day; 0.5 day gross for each half-day.
   - Illustrative Annual Tax Slabs:
     * Up to 600,000: 0%
     * 600,001 to 1,200,000: 5% of amount above 600,000
     * 1,200,001 to 2,400,000: 30,000 + 15% of amount above 1,200,000
     * 2,400,001 to 3,600,000: 210,000 + 25% of amount above 2,400,000
     * Above 3,600,000: 510,000 + 35% of amount above 3,600,000
   - Monthly tax is calculated as annual tax divided by 12.
   - Net Salary = Gross Salary - Attendance Deductions - Monthly Income Tax.
   - Finalization of payroll is strictly reserved for the Administrator. Finalized runs are immutable.

SECURITY & PRIVACY RULES:
- NEVER reveal another employee's salary, bank details, or private profile to an employee.
- If an employee asks for another person's compensation or private details, politely refuse citing privacy and role restrictions.
- You have READ-ONLY tools. You CANNOT create, update, delete, approve leaves, or finalize payroll.
- Answer policy questions only from known configured policies. If unknown, state that the information is unavailable.
- Always provide helpful, concise, professional answers.`;

// Define AI Tool Schemas for Groq Function Calling
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_headcount',
      description: 'Get current company headcount and active employee count. (Available for Admin and HR)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attendance_summary',
      description: 'Get company-wide attendance summary for a specific date (YYYY-MM-DD). (Available for Admin and HR)',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_late_comers',
      description: 'Get list of employees who arrived late today or in the current month. (Available for Admin and HR)',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max records to return, default 5' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_leave_summary',
      description: 'Get overall leave statistics and pending count. (Available for Admin and HR)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_leave_balance',
      description: 'Get available leave balances for the authenticated employee. (Available for all roles)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_payroll_summary',
      description: 'Get latest payroll run summary and costs. (Available for Admin only)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: 'Search employees by name, code, or department. (Available for Admin and HR)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
  },
];

/**
 * Executes a tool securely by validating caller permissions and company scope
 */
const executeTool = async (name, args, actorUser, companyId) => {
  const role = actorUser.role;

  switch (name) {
    case 'get_headcount': {
      if (role === ROLES.EMPLOYEE) {
        return { error: 'Permission denied: Employees cannot view company-wide headcount.' };
      }
      const active = await Employee.countDocuments({ company: companyId, isActive: true });
      const total = await Employee.countDocuments({ company: companyId });
      return { activeEmployees: active, totalEmployees: total };
    }

    case 'get_attendance_summary': {
      if (role === ROLES.EMPLOYEE) {
        return { error: 'Permission denied: Employees cannot view company-wide attendance.' };
      }
      const targetDate = args.date || formatDateStr(new Date());
      const records = await Attendance.find({ company: companyId, date: targetDate });
      return {
        date: targetDate,
        totalCheckedIn: records.length,
        present: records.filter((r) => r.status === 'PRESENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      };
    }

    case 'get_late_comers': {
      if (role === ROLES.EMPLOYEE) {
        return { error: 'Permission denied: Only Admin and HR can view late-comers list.' };
      }
      const todayStr = formatDateStr(new Date());
      const currentMonthStr = todayStr.substring(0, 7);
      const records = await Attendance.find({
        company: companyId,
        date: { $regex: `^${currentMonthStr}` },
        status: 'LATE',
      })
        .populate('employee', 'firstName lastName employeeCode')
        .limit(args.limit || 5);

      return records.map((r) => ({
        employeeCode: r.employee?.employeeCode,
        name: `${r.employee?.firstName} ${r.employee?.lastName}`,
        date: r.date,
        lateMinutes: r.lateMinutes,
      }));
    }

    case 'get_leave_summary': {
      if (role === ROLES.EMPLOYEE) {
        return { error: 'Permission denied: Employees cannot view company leave summary.' };
      }
      const pendingCount = await LeaveRequest.countDocuments({ company: companyId, status: 'PENDING' });
      const approvedCount = await LeaveRequest.countDocuments({ company: companyId, status: 'APPROVED' });
      return { pendingApprovals: pendingCount, totalApproved: approvedCount };
    }

    case 'get_my_leave_balance': {
      if (!actorUser.employee) {
        return { error: 'No employee record linked to this account.' };
      }
      return getEmployeeLeaveBalances(companyId, actorUser.employee);
    }

    case 'get_payroll_summary': {
      if (role !== ROLES.ADMIN) {
        return { error: 'Permission denied: Only Admin can view payroll financial summaries.' };
      }
      const latest = await PayrollRun.findOne({ company: companyId }).sort({ year: -1, month: -1 });
      if (!latest) return { message: 'No payroll runs recorded yet.' };
      return {
        year: latest.year,
        month: latest.month,
        status: latest.status,
        employeeCount: latest.employeeCount,
        totalNetSalary: latest.totalNetSalary,
        totalGrossSalary: latest.totalGrossSalary,
      };
    }

    case 'search_employees': {
      if (role === ROLES.EMPLOYEE) {
        return { error: 'Permission denied: Employees cannot search full employee directory via AI.' };
      }
      const regex = new RegExp((args.query || '').trim(), 'i');
      const employees = await Employee.find({
        company: companyId,
        $or: [{ firstName: regex }, { lastName: regex }, { employeeCode: regex }],
      })
        .populate('department', 'name')
        .populate('designation', 'title')
        .limit(5);

      return employees.map((e) => ({
        employeeCode: e.employeeCode,
        name: `${e.firstName} ${e.lastName}`,
        department: e.department?.name,
        designation: e.designation?.title,
        status: e.employmentStatus,
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};

/**
 * AI Chat handler with function calling & security guardrails
 */
export const chatWithAI = async (companyId, actorUser, conversationInput, req = null) => {
  const startTime = Date.now();
  const toolsUsed = [];

  // Parse input messages
  let messages = [];
  if (Array.isArray(conversationInput.messages) && conversationInput.messages.length > 0) {
    messages = conversationInput.messages.slice(-10); // bound history to last 10
  } else if (conversationInput.message) {
    messages = [{ role: 'user', content: conversationInput.message }];
  }

  const promptPreview = messages[messages.length - 1]?.content?.substring(0, 300) || '';

  // Fallback if Groq API key is not configured
  if (!groqClient) {
    const fallbackAnswer =
      "I am HCM Lite AI Assistant. The Groq AI API key is currently not configured in the backend environment. You can review attendance, leaves, and payroll directly through the application's tabs.";

    await AILog.create({
      company: companyId,
      user: actorUser._id,
      endpoint: '/api/ai/chat',
      toolsUsed: [],
      promptPreview,
      success: true,
      errorMessage: 'Groq API Key not configured',
      durationMs: Date.now() - startTime,
    });

    return {
      answer: fallbackAnswer,
      isAIGenerated: true,
      toolsUsed: [],
    };
  }

  try {
    const fullMessages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nCurrent User Context:\n- Role: ${actorUser.role}\n- Email: ${actorUser.email}\n- Employee Linked: ${Boolean(actorUser.employee)}`,
      },
      ...messages,
    ];

    const modelName = env.AI_MODEL || 'llama-3.3-70b-versatile';

    const response = await groqClient.chat.completions.create({
      model: modelName,
      messages: fullMessages,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 1024,
    });

    const responseMessage = response.choices[0]?.message;

    // Check if the model requested any tool calls
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      fullMessages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          functionArgs = {};
        }

        toolsUsed.push(functionName);
        const toolResult = await executeTool(functionName, functionArgs, actorUser, companyId);

        fullMessages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(toolResult),
        });
      }

      // Second turn with tool results
      const finalResponse = await groqClient.chat.completions.create({
        model: modelName,
        messages: fullMessages,
        temperature: 0.2,
        max_tokens: 1024,
      });

      const answer = finalResponse.choices[0]?.message?.content || 'No response generated.';

      await AILog.create({
        company: companyId,
        user: actorUser._id,
        endpoint: '/api/ai/chat',
        toolsUsed,
        promptPreview,
        promptTokens: finalResponse.usage?.prompt_tokens || 0,
        completionTokens: finalResponse.usage?.completion_tokens || 0,
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        answer,
        isAIGenerated: true,
        toolsUsed,
      };
    }

    const answer = responseMessage?.content || 'No response generated.';

    await AILog.create({
      company: companyId,
      user: actorUser._id,
      endpoint: '/api/ai/chat',
      toolsUsed: [],
      promptPreview,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      success: true,
      durationMs: Date.now() - startTime,
    });

    return {
      answer,
      isAIGenerated: true,
      toolsUsed: [],
    };
  } catch (error) {
    console.error('[AI CHAT ERROR]', error.message);

    await AILog.create({
      company: companyId,
      user: actorUser._id,
      endpoint: '/api/ai/chat',
      toolsUsed,
      promptPreview,
      success: false,
      errorMessage: error.message,
      durationMs: Date.now() - startTime,
    });

    return {
      answer: `AI Assistant is temporarily unavailable (${error.message}). Please try again later.`,
      isAIGenerated: true,
      toolsUsed,
    };
  }
};

/**
 * AI Dashboard KPI summary generator
 */
export const generateDashboardSummary = async (companyId, actorUser, kpiData = {}) => {
  const startTime = Date.now();

  if (!groqClient) {
    return {
      insights: [
        'Total active headcount and attendance records are healthy.',
        'Review pending leave and attendance correction requests in the approvals tab.',
        'Ensure monthly payroll structures are updated prior to cycle finalization.',
      ],
      isAIGenerated: true,
    };
  }

  try {
    const prompt = `Analyze these HCM metrics and provide 3 to 5 concise executive insight bullets:\n${JSON.stringify(
      kpiData,
      null,
      2
    )}\nFormat output as a JSON array of strings: ["insight 1", "insight 2", "insight 3"]`;

    const response = await groqClient.chat.completions.create({
      model: env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an HR analytics expert. Return ONLY a valid JSON array of strings.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let insights = [];
    try {
      const match = content.match(/\[[\s\S]*\]/);
      insights = match ? JSON.parse(match[0]) : [content];
    } catch {
      insights = [content];
    }

    await AILog.create({
      company: companyId,
      user: actorUser._id,
      endpoint: '/api/ai/summary',
      promptPreview: 'Dashboard KPI summary',
      success: true,
      durationMs: Date.now() - startTime,
    });

    return {
      insights,
      isAIGenerated: true,
    };
  } catch (err) {
    return {
      insights: [
        'System attendance and leave records are actively tracking in real time.',
        'Review any pending approval items in your workflow queue.',
      ],
      isAIGenerated: true,
    };
  }
};

/**
 * Smart Leave parser: converts natural language query into prefilled form JSON
 * Does NOT save to database!
 */
export const parseSmartLeave = async (companyId, queryText) => {
  const todayStr = formatDateStr(new Date());

  if (!groqClient) {
    return {
      type: 'CASUAL',
      startDate: todayStr,
      endDate: todayStr,
      reason: queryText,
      isAIGenerated: false,
    };
  }

  try {
    const prompt = `Today's date is ${todayStr}.
Extract leave request details from this message: "${queryText}".
Rules:
- type must be one of: "ANNUAL", "SICK", "CASUAL", "UNPAID"
- startDate must be in YYYY-MM-DD format
- endDate must be in YYYY-MM-DD format
- reason must be a concise explanation
Return ONLY a valid JSON object matching this schema:
{
  "type": "CASUAL",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "..."
}`;

    const response = await groqClient.chat.completions.create({
      model: env.AI_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You parse plain English leave requests into JSON. Return ONLY JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 250,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;

    if (parsed && parsed.startDate && parsed.endDate) {
      return {
        ...parsed,
        isAIGenerated: true,
      };
    }

    return {
      type: 'CASUAL',
      startDate: todayStr,
      endDate: todayStr,
      reason: queryText,
      isAIGenerated: false,
    };
  } catch (err) {
    return {
      type: 'CASUAL',
      startDate: todayStr,
      endDate: todayStr,
      reason: queryText,
      isAIGenerated: false,
    };
  }
};

export default {
  chatWithAI,
  generateDashboardSummary,
  parseSmartLeave,
};

export const ROLES = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  EMPLOYEE: 'EMPLOYEE',
};

export const ROLE_LIST = Object.values(ROLES);

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

export const LEAVE_STATUS_LIST = Object.values(LEAVE_STATUS);

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  ABSENT: 'ABSENT',
  ON_LEAVE: 'ON_LEAVE',
};

export const ATTENDANCE_STATUS_LIST = Object.values(ATTENDANCE_STATUS);

export const CORRECTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const CORRECTION_STATUS_LIST = Object.values(CORRECTION_STATUS);

export const PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
};

export const PAYROLL_STATUS_LIST = Object.values(PAYROLL_STATUS);

export const EMPLOYMENT_STATUS = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  PROBATION: 'PROBATION',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
};

export const EMPLOYMENT_STATUS_LIST = Object.values(EMPLOYMENT_STATUS);

export const DEFAULT_COMPANY_SETTINGS = {
  officeStartTime: '09:00',
  gracePeriodMinutes: 15,
  halfDayHours: 5,
  weekendDays: [0, 6], // Sunday (0), Saturday (6)
  geofence: {
    latitude: null,
    longitude: null,
    radiusMeters: 500,
  },
};

export const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Annual Leave',
    code: 'ANNUAL',
    daysPerYear: 14,
    isPaid: true,
    isUnlimited: false,
    description: '14 working days per year for paid annual vacation.',
  },
  {
    name: 'Sick Leave',
    code: 'SICK',
    daysPerYear: 8,
    isPaid: true,
    isUnlimited: false,
    description: '8 working days per year for medical/health reasons.',
  },
  {
    name: 'Casual Leave',
    code: 'CASUAL',
    daysPerYear: 10,
    isPaid: true,
    isUnlimited: false,
    description: '10 working days per year for urgent personal matters.',
  },
  {
    name: 'Unpaid Leave',
    code: 'UNPAID',
    daysPerYear: 0,
    isPaid: false,
    isUnlimited: true,
    description: 'Unlimited quota without pay, subject to approval.',
  },
];

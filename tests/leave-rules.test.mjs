import test from "node:test";
import assert from "node:assert/strict";
import { countLeaveDays } from "../src/lib/leave-days.ts";
import {
  EmployeeSchema,
  LeaveRequestSchema,
  SignupFormSchema,
  todayInCompanyTimeZone,
} from "../src/lib/definitions.ts";

const leaveBase = {
  employeeId: "11111111-1111-4111-8111-111111111111",
  leaveTypeId: "22222222-2222-4222-8222-222222222222",
  startDate: "2099-12-01",
  endDate: "2099-12-22",
  days: 22,
  reason: "",
};

test("countLeaveDays is inclusive and rejects invalid dates", () => {
  assert.equal(countLeaveDays("2026-10-01", "2026-10-22"), 22);
  assert.equal(countLeaveDays("2026-10-01", "2026-10-01"), 1);
  assert.equal(countLeaveDays("2026-10-22", "2026-10-01"), 0);
  assert.equal(countLeaveDays("2026-02-31", "2026-03-02"), 0);
});

test("leave days are bounded by the range and half-day increments", () => {
  assert.equal(LeaveRequestSchema.safeParse(leaveBase).success, true);
  assert.equal(
    LeaveRequestSchema.safeParse({ ...leaveBase, days: 23 }).success,
    false
  );
  assert.equal(
    LeaveRequestSchema.safeParse({
      ...leaveBase,
      startDate: "2099-12-01",
      endDate: "2099-12-01",
      days: 0.5,
    }).success,
    true
  );
  assert.equal(
    LeaveRequestSchema.safeParse({ ...leaveBase, days: 1.25 }).success,
    false
  );
});

test("leave requests cannot start before today", () => {
  const today = todayInCompanyTimeZone();
  const past = LeaveRequestSchema.safeParse({
    ...leaveBase,
    startDate: "2020-01-06",
    endDate: "2020-01-07",
    days: 2,
  });
  assert.equal(past.success, false);

  const sameDay = LeaveRequestSchema.safeParse({
    ...leaveBase,
    startDate: today,
    endDate: today,
    days: 1,
  });
  assert.equal(sameDay.success, true);
});

test("leave requests cannot span calendar years or use invalid dates", () => {
  const crossYear = LeaveRequestSchema.safeParse({
    ...leaveBase,
    startDate: "2099-12-30",
    endDate: "2100-01-02",
    days: 4,
  });
  assert.equal(crossYear.success, false);

  const invalidDate = LeaveRequestSchema.safeParse({
    ...leaveBase,
    startDate: "2099-02-31",
    endDate: "2099-03-02",
    days: 2,
  });
  assert.equal(invalidDate.success, false);
});

test("employee birthdate must not be in the future or after hire date", () => {
  const base = {
    employeeNo: "E-1",
    firstName: "A",
    lastName: "B",
    birthdate: "2000-01-01",
    gender: "",
    phone: "",
    address: "",
    hireDate: "2020-01-01",
    status: "active",
    departmentId: "",
    positionId: "",
    managerId: "",
    userId: "",
  };

  assert.equal(EmployeeSchema.safeParse(base).success, true);
  assert.equal(
    EmployeeSchema.safeParse({
      ...base,
      birthdate: "2021-01-01",
    }).success,
    false
  );
  assert.equal(
    EmployeeSchema.safeParse({ ...base, birthdate: "2999-01-01" }).success,
    false
  );
  assert.equal(
    EmployeeSchema.safeParse({ ...base, birthdate: "2026-02-31" }).success,
    false
  );
});

test("signup emails are trimmed and lower-cased", () => {
  const parsed = SignupFormSchema.safeParse({
    email: "  User@Example.com ",
    password: "password1",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, "user@example.com");
});

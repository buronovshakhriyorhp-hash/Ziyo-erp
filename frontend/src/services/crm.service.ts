import api from "./api";

export interface Lead {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  sourceId: number | null;
  sourceName: string | null;
  statusId: number;
  statusName: string;
  statusColor: string | null;
  assignedTo: number | null;
  assignedName: string | null;
  courseInterest: string | null;
  notes: string | null;
  convertedAt: string | null;
  studentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  leadId: number | null;
  leadName: string | null;
  leadPhone: string | null;
  assignedTo: number;
  assigneeName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: number;
  leadId: number | null;
  calledBy: number;
  callerName: string;
  callDatetime: string;
  durationSec: number;
  callType: "inbound" | "outbound";
  result: string | null;
  nextCallAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const crmService = {
  // ── Leads ────────────────────────────────────────────────
  getLeads: (params?: {
    statusId?: number;
    assignedTo?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: PaginatedResponse<Lead> }>("/crm/leads", { params })
      .then((r) => r.data.data),

  getLead: (id: number) =>
    api.get<{ data: Lead }>(`/crm/leads/${id}`).then((r) => r.data.data),

  createLead: (dto: Partial<Lead>) =>
    api.post<{ data: Lead }>("/crm/leads", dto).then((r) => r.data.data),

  updateLead: (id: number, dto: Partial<Lead>) =>
    api.patch<{ data: Lead }>(`/crm/leads/${id}`, dto).then((r) => r.data.data),

  deleteLead: (id: number) => api.delete(`/crm/leads/${id}`),

  convertToStudent: (
    id: number,
    extra?: {
      birthDate?: string | null;
      address?: string | null;
      schoolName?: string | null;
      grade?: number | null;
    },
  ) =>
    api
      .post<{
        data: {
          userId: number;
          studentId: number;
          tempPassword: string;
          lead: Lead;
        };
      }>(`/crm/leads/${id}/convert`, extra ?? {})
      .then((r) => r.data.data),

  // ── Call Logs ─────────────────────────────────────────────
  getLeadCalls: (leadId: number) =>
    api
      .get<{ data: CallLog[] }>(`/crm/leads/${leadId}/calls`)
      .then((r) => r.data.data),

  addCall: (
    leadId: number,
    dto: Omit<
      CallLog,
      "id" | "leadId" | "calledBy" | "callerName" | "callDatetime" | "createdAt"
    >,
  ) =>
    api
      .post<{ data: CallLog }>(`/crm/leads/${leadId}/calls`, dto)
      .then((r) => r.data.data),

  getAllCalls: (params?: {
    calledBy?: number;
    leadId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: PaginatedResponse<CallLog> }>("/crm/call-logs", { params })
      .then((r) => r.data.data),

  getUpcomingCalls: (calledBy?: number) =>
    api
      .get<{
        data: CallLog[];
      }>("/crm/call-logs/upcoming", { params: { calledBy } })
      .then((r) => r.data.data),

  deleteCall: (callId: number) => api.delete(`/crm/call-logs/${callId}`),

  // ── Tasks ─────────────────────────────────────────────────
  getTasks: (params?: {
    assignedTo?: number;
    leadId?: number;
    isCompleted?: boolean;
    overdueOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: PaginatedResponse<Task> }>("/crm/tasks", { params })
      .then((r) => r.data.data),

  createTask: (dto: {
    leadId?: number;
    assignedTo?: number;
    title: string;
    description?: string;
    dueDate?: string;
  }) => api.post<{ data: Task }>("/crm/tasks", dto).then((r) => r.data.data),

  updateTask: (id: number, dto: Partial<Task>) =>
    api.patch<{ data: Task }>(`/crm/tasks/${id}`, dto).then((r) => r.data.data),

  completeTask: (id: number) =>
    api
      .patch<{ data: Task }>(`/crm/tasks/${id}/complete`)
      .then((r) => r.data.data),

  reopenTask: (id: number) =>
    api
      .patch<{ data: Task }>(`/crm/tasks/${id}/reopen`)
      .then((r) => r.data.data),

  deleteTask: (id: number) => api.delete(`/crm/tasks/${id}`),

  getOverdueSummary: () =>
    api
      .get<{
        data: {
          userId: number;
          assigneeName: string;
          overdueCount: number;
          dueTodayCount: number;
        }[];
      }>("/crm/tasks/overdue-summary")
      .then((r) => r.data.data),

  // ── Lookups ───────────────────────────────────────────────
  getStatuses: () =>
    api
      .get<{
        data: { id: number; name: string; color: string; sortOrder: number }[];
      }>("/crm/statuses")
      .then((r) => r.data.data),

  getSources: () =>
    api
      .get<{ data: { id: number; name: string }[] }>("/crm/sources")
      .then((r) => r.data.data),
};

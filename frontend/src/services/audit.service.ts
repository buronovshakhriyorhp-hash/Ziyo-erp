import { api } from "./api";

// ── Types ─────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  userId: number;
  action: "insert" | "update" | "delete" | "login";
  tableName: string;
  recordId: number;
  oldData: any | null;
  newData: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;

  // Joins
  userFirstName?: string;
  userLastName?: string;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  tableName?: string;
  userId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Service ───────────────────────────────────────────────
export const auditService = {
  /**
   * Barcha audit loglarni olish (filtrlash va paginatsiya bilan)
   */
  getLogs: async (
    params?: GetAuditLogsParams,
  ): Promise<PaginatedResponse<AuditLog>> => {
    const limit = params?.limit || 15;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    const queryParams: Record<string, any> = {
      table: params?.tableName,
      operation: params?.action,
      changedBy: params?.userId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      limit,
      offset,
    };

    const response = await api.get("/audit/logs", { params: queryParams });
    const result = response.data.data;

    return {
      data: result.logs || [],
      meta: {
        total: result.total || 0,
        page: page,
        limit: limit,
        totalPages: Math.ceil((result.total || 0) / limit) || 1,
      },
    };
  },
};

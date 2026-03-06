import api from "./api";

export interface Badge {
  name: string;
  description: string;
  iconUrl: string | null;
}

export interface GamificationProfile {
  studentId: number;
  xp: number;
  level: number;
  badges: Badge[];
}

export interface CourseMaterial {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  type: "video" | "pdf" | "assignment";
  contentUrl: string;
  orderIndex: number;
}

export interface LeaderboardEntry {
  id: number;
  fullName: string;
  xp: number;
  level: number;
}

export interface GroupTask {
  id: number;
  groupId: number;
  teacherId: number;
  title: string;
  description: string;
  taskType: "homework" | "gamified";
  xpReward: number;
  maxScore: number;
  deadline: string;
  createdAt: string;
  count_submissions?: string;
  submission_status?: string;
  ai_feedback?: string;
  earned_xp?: number;
  submitted_url?: string;
}

export const lmsService = {
  getProfile: async (): Promise<GamificationProfile> => {
    const res = await api.get<{ data: GamificationProfile }>("/lms/profile");
    return res.data.data;
  },
  getLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const res = await api.get<{ data: LeaderboardEntry[] }>(
      `/lms/leaderboard?limit=${limit}`,
    );
    return res.data.data;
  },
  getCourseMaterials: async (courseId: number): Promise<CourseMaterial[]> => {
    const res = await api.get<{ data: CourseMaterial[] }>(
      `/lms/courses/${courseId}/materials`,
    );
    return res.data.data;
  },
  submitAssignment: async (
    materialId: number,
    contentUrl: string,
  ): Promise<any> => {
    const res = await api.post(`/lms/materials/${materialId}/submit`, {
      contentUrl,
    });
    return res.data;
  },

  // --- Group Tasks (Phase 6) ---
  getGroupTasks: async (groupId: number): Promise<GroupTask[]> => {
    const res = await api.get<{ data: GroupTask[] }>(`/lms/groups/${groupId}/tasks`);
    return res.data.data;
  },

  createGroupTask: async (data: Partial<GroupTask>): Promise<GroupTask> => {
    const res = await api.post<{ data: GroupTask }>(`/lms/groups/tasks`, data);
    return res.data.data;
  },

  getStudentTasks: async (): Promise<GroupTask[]> => {
    const res = await api.get<{ data: GroupTask[] }>(`/lms/student/tasks`);
    return res.data.data;
  },

  submitGroupTask: async (taskId: number, contentUrl: string): Promise<any> => {
    const res = await api.post(`/lms/tasks/${taskId}/submit`, {
      contentUrl
    });
    return res.data;
  },
  gradeTask: async (submissionId: number, points: number, feedback: string): Promise<any> => {
    const res = await api.post(`/lms/tasks/submissions/${submissionId}/grade`, {
      points,
      feedback
    });
    return res.data;
  }
};

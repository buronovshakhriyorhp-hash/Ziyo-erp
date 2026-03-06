import api from "./api";
import type { PaginatedResponse } from "./crm.service";

export type { PaginatedResponse };

export interface Group {
  id: number;
  courseId: number;
  courseName: string;
  teacherId: number;
  teacherName: string;
  roomId: number | null;
  roomName: string | null;
  name: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string | null;
  maxStudents: number;
  currentStudents: number;
  status: "recruiting" | "active" | "completed" | "cancelled";
  createdAt: string;
}

export interface Course {
  id: number;
  subjectId: number;
  subjectName: string;
  name: string;
  description: string | null;
  durationMonths: number;
  lessonsPerWeek: number;
  lessonDurationMin: number;
  pricePerMonth: number;
  level: string;
  isActive: boolean;
  activeGroups: number;
}

export interface Enrollment {
  id: number;
  groupId: number;
  groupName: string;
  studentId: number;
  studentName: string;
  studentPhone: string;
  enrolledAt: string;
  status: "active" | "frozen" | "left" | "graduated";
  discountPct: number;
  notes: string | null;
}

export interface Lesson {
  id: number;
  groupId: number;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
}

export const academicService = {
  // ── Groups ────────────────────────────────────────────────
  getGroups: (params?: {
    courseId?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: PaginatedResponse<Group> }>("/academic/groups", { params })
      .then((r) => r.data.data),

  getGroup: (id: number) =>
    api.get<{ data: Group }>(`/academic/groups/${id}`).then((r) => r.data.data),

  createGroup: (dto: Partial<Group>) =>
    api.post<{ data: Group }>("/academic/groups", dto).then((r) => r.data.data),

  updateGroup: (id: number, dto: Partial<Group>) =>
    api
      .patch<{ data: Group }>(`/academic/groups/${id}`, dto)
      .then((r) => r.data.data),

  // ── Courses ───────────────────────────────────────────────
  getCourses: (params?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<{ data: PaginatedResponse<Course> }>("/academic/courses", { params })
      .then((r) => r.data.data),

  createCourse: (dto: Partial<Course>) =>
    api
      .post<{ data: Course }>("/academic/courses", dto)
      .then((r) => r.data.data),

  // ── Enrollments ───────────────────────────────────────────
  getGroupEnrollments: (groupId: number) =>
    api
      .get<{ data: Enrollment[] }>(`/academic/groups/${groupId}/enrollments`)
      .then((r) => r.data.data),

  getStudentEnrollments: (studentId: number) =>
    api
      .get<{
        data: Enrollment[];
      }>(`/academic/students/${studentId}/enrollments`)
      .then((r) => r.data.data),

  createEnrollment: (dto: {
    groupId: number;
    studentId: number;
    discountPct?: number;
  }) =>
    api
      .post<{ data: Enrollment }>("/academic/enrollments", dto)
      .then((r) => r.data.data),

  // ── Subjects & Rooms & Teachers ───────────────────────────
  getSubjects: () =>
    api
      .get<{ data: { id: number; name: string }[] }>("/academic/subjects")
      .then((r) => r.data.data),

  getRooms: () =>
    api
      .get<{ data: { id: number; name: string; capacity: number }[] }>(
        "/academic/rooms",
      )
      .then((r) => r.data.data)
      .catch(() => []),

  getTeachers: () =>
    api
      .get<any>("/users", { params: { roleId: 3 } }) // 3 is usually Teacher, but backend might accept string. Will handle correctly.
      .then((r) => {
        const resData = r.data.data;
        // If paginated, resData.data is the array. If direct array, resData is the array.
        return Array.isArray(resData) ? resData : resData?.data || [];
      })
      .catch(() => []),

  // ── Attendance & Lessons ──────────────────────────────────
  getGroupLessons: (groupId: number, params?: { from?: string; to?: string }) =>
    api
      .get<{
        data: any[];
      }>(`/academic/lessons`, { params: { groupId, ...params } })
      .then((r) => r.data.data),

  getSchedule: (params: {
    from: string;
    to: string;
    roomId?: number;
    teacherId?: number;
  }) =>
    api
      .get<{ data: any[] }>(`/academic/lessons`, { params })
      .then((r) => r.data.data),

  markAttendance: (dto: {
    lessonId: number;
    teacherStatus: string;
    students: { studentId: number; status: string; notes?: string }[];
    applyBilling?: boolean;
  }) => api.post("/attendance/mark", dto).then((r) => r.data),
};

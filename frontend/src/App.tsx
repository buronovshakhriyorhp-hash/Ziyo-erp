import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// ── Layout ─────────────────────────────────────────────────
import { Toaster } from "@/components/common/Toaster";

// ── Auth ───────────────────────────────────────────────────
import LoginPage from "@/pages/auth/LoginPage";

// ── Dashboard ──────────────────────────────────────────────
import DashboardPage from "@/pages/dashboard/DashboardPage";

// ── CRM ────────────────────────────────────────────────────
import LeadsPage from "@/pages/crm/LeadsPage";
import TasksPage from "@/pages/crm/TasksPage";

// ── Portals ────────────────────────────────────────────────
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentIndicators from "@/pages/student/StudentIndicators";
import StudentRating from "@/pages/student/StudentRating";
import StudentShop from "@/pages/student/StudentShop";
import StudentSettings from "@/pages/student/StudentSettings";
import StudentNotifications from "@/pages/student/StudentNotifications";
import StudentHomeworks from "@/pages/student/StudentHomeworks";
import PlaceholderPage from "@/pages/student/PlaceholderPage";
import LmsCourseView from "@/pages/student/LmsCourseView";
import ParentPortal from "@/pages/parent/ParentPortal";
import ParentDashboardLayout from "@/components/parent/ParentDashboardLayout";
import StudentPanelNew from "@/pages/StudentPanelNew";
import StudentDashboardLayout from "@/components/student/StudentDashboardLayout";

// ── Academic ───────────────────────────────────────────────
import GroupsPage from "@/pages/academic/GroupsPage";
import CoursesPage from "@/pages/academic/CoursesPage";
import AttendancePage from "@/pages/academic/AttendancePage";
import SchedulePage from "@/pages/academic/SchedulePage";

// ── Finance ────────────────────────────────────────────────
import TeacherManagement from "@/pages/admin/TeacherManagement";
import TeacherCabinet from "@/pages/teacher/TeacherCabinet";
import TeacherDashboardLayout from "@/components/teacher/TeacherDashboardLayout";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherGroups from "@/pages/teacher/TeacherGroups";
import TeacherAttendance from "@/pages/teacher/TeacherAttendance";
import TeacherHomework from "@/pages/teacher/TeacherHomework";
import UserManagement from "@/pages/admin/UserManagement";
import ReportsPage from "@/pages/admin/ReportsPage";
import AuditLogsPage from "@/pages/admin/AuditLogsPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import AccessDeniedPage from "@/pages/AccessDeniedPage";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";

// ── Admin Components ───────────────────────────────────────
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import AdminShopManagement from "@/pages/admin/AdminShopManagement";

// Dynamic default redirect based on role
function RoleBasedRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  const activeRole = user.roleName || (user as any).role;
  if (activeRole === "student") return <Navigate to="/student-portal" replace />;
  if (activeRole === "parent") return <Navigate to="/parent-portal" replace />;
  if (activeRole === "admin" || activeRole === "manager" || activeRole === "teacher") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

const router = createBrowserRouter([
  // ── Public routes ────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/access-denied",
    element: (
      <div className="min-h-screen bg-background">
        <div className="container-page">
          <AccessDeniedPage />
        </div>
      </div>
    ),
  },

  // ── Authenticated routes ─────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <RoleBasedRedirect /> },

      // Quick preview route (dev): new student panel
      { path: "student-panel", element: <StudentPanelNew /> },

      // ── Admin Command Center Layout (Phase 3 Mastery) ─────────
      {
        element: <AdminDashboardLayout />,
        children: [
          // Admin / Manager Dashboard
          {
            path: "dashboard",
            element: <ProtectedRoute roles={["admin", "manager", "teacher"]} />,
            children: [{ index: true, element: <DashboardPage /> }],
          },

          // CRM
          { path: "crm", element: <Navigate to="/crm/leads" replace /> },
          { path: "crm/leads", element: <LeadsPage /> },
          {
            path: "crm/calls",
            element: (
              <div className="space-y-5 p-6">
                <h1 className="page-title">Qo'ng'iroqlar</h1>
                <p className="text-muted-foreground">Tez orada...</p>
              </div>
            ),
          },
          { path: "crm/tasks", element: <TasksPage /> },

          // Academic
          { path: "academic", element: <Navigate to="/academic/groups" replace /> },
          { path: "academic/groups", element: <GroupsPage /> },
          { path: "academic/courses", element: <CoursesPage /> },
          {
            path: "academic/lessons",
            element: (
              <div className="space-y-5 p-6">
                <h1 className="page-title">Darslar</h1>
                <p className="text-muted-foreground">Tez orada...</p>
              </div>
            ),
          },

          { path: "finance/salaries", element: <TeacherManagement /> },

          // Students Placeholder
          {
            path: "students",
            element: (
              <div className="space-y-5 p-6">
                <h1 className="page-title">Talabalar bazasi</h1>
                <p className="text-muted-foreground">Tez orada...</p>
              </div>
            ),
          },

          // Admin Shop Management
          {
            path: "admin/shop",
            element: <AdminShopManagement />,
          },

          // Attendance & Schedule (General)
          { path: "attendance", element: <AttendancePage /> },
          { path: "schedule", element: <SchedulePage /> },

          // Reports & Analytics
          { path: "analytics", element: <ReportsPage /> },

          // Admin-only deeper routes
          {
            element: <ProtectedRoute roles={["admin"]} />,
            children: [
              { path: "users", element: <UserManagement /> },
              { path: "settings", element: <SettingsPage /> },
              { path: "audit", element: <AuditLogsPage /> },
            ],
          },

          // Teacher Cabinet inside the new layout
          {
            path: "my-salary",
            element: <ProtectedRoute roles={["teacher"]} />,
            children: [{ index: true, element: <TeacherCabinet /> }],
          },

          {
            path: "my-homeworks",
            element: <ProtectedRoute roles={["teacher", "admin", "manager"]} />,
            children: [{ index: true, element: <TeacherHomework /> }]
          },

          // Admin 404 fallback
          {
            path: "*",
            element: (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <p className="text-6xl font-bold text-muted-foreground/30">404</p>
                <h2 className="text-xl font-semibold text-foreground">Sahifa topilmadi</h2>
                <a href="/dashboard" className="text-brand-600 hover:underline text-sm font-medium">
                  Dashboard ga qaytish →
                </a>
              </div>
            ),
          },
        ],
      },

      // ── Dedicated Layouts ────────────────────────────────────
      {
        path: "student-portal",
        element: <ProtectedRoute roles={["student", "admin", "manager"]} />,
        children: [
          {
            element: <StudentDashboardLayout />,
            children: [
              { index: true, element: <StudentDashboard /> },
              { path: "analytics", element: <StudentIndicators /> },
              { path: "rating", element: <StudentRating /> },
              { path: "shop", element: <StudentShop /> },
              { path: "settings", element: <StudentSettings /> },
              { path: "notifications", element: <StudentNotifications /> },
              { path: "homeworks", element: <StudentHomeworks /> },
              { path: "payments", element: <PlaceholderPage title="To'lovlarim" description="To'lovlar tarixi tez orada ishga tushadi." /> },
              { path: "groups", element: <PlaceholderPage title="Guruhlarim" description="O'quv guruhlaringiz yuzasidan ma'lumotlar ustida ishlayabmiz." /> },
              { path: "extra-lessons", element: <PlaceholderPage title="Qo'shimcha darslar" description="Mavzularni mustahkamlash uchun qo'shimcha darslarga yozilish tez kunda tayyor bo'ladi..." /> },
              { path: "lms/courses/:courseId", element: <LmsCourseView /> },
            ]
          }
        ]
      },
      {
        path: "parent-portal",
        element: <ProtectedRoute roles={["parent", "admin", "manager"]} />,
        children: [
          {
            element: <ParentDashboardLayout />,
            children: [
              { index: true, element: <ParentPortal /> },
              { path: "children", element: <PlaceholderPage title="Farzandlarim" description="Farzandlaringizning to'liq akademik ro'yxati va har biriga oid chuqurlashtirilgan tahlil." /> },
              { path: "finances", element: <PlaceholderPage title="To'lovlar tarixi" description="Barcha moliyaviy operatsiyalar, to'lovlar va qarzdorlik akti." /> },
              { path: "market", element: <PlaceholderPage title="Do'kon & Yutuqlar" description="Ushbu platforma orqali farzandingiz uchun uning yig'gan 'Kumush'lari yordamida har xil qimmatbaho mukofotlar va o'quv qo'llanmalarni rasmiylashtirishingiz mumkin." /> },
              { path: "settings", element: <PlaceholderPage title="Sozlamalar" description="Shaxsiy ma'lumotlar, parol o'zgartirishlar hamda tizim xabarnomalarini sozlash maskani." /> },
            ]
          }
        ]
      },
      {
        path: "teacher-portal",
        element: <ProtectedRoute roles={["teacher", "admin", "manager"]} />,
        children: [
          {
            element: <TeacherDashboardLayout />,
            children: [
              { index: true, element: <TeacherDashboard /> },
              { path: "groups", element: <TeacherGroups /> },
              { path: "attendance", element: <TeacherAttendance /> },
              { path: "homework", element: <TeacherHomework /> },
              { path: "settings", element: <PlaceholderPage title="Sozlamalar" description="O'qituvchi profilini boshqarish tez orada ishga tushadi." /> },
            ]
          }
        ]
      },
    ],
  },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

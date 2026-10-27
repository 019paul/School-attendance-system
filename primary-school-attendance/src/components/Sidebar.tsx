import {
  BookOpenCheck,
  LayoutDashboard,
  Users,
  School,
  ClipboardCheck,
  History,
  ChartNoAxesColumn,
  GraduationCap,
  UserCog,
  Menu,
  X,
} from "lucide-react";
import type { PageName, User } from "../types";

interface SidebarProps {
  activePage: PageName;
  onNavigate: (page: PageName) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentUser: User;
}

const allNavItems: {
  label: PageName;
  icon: typeof LayoutDashboard;
  roles: ("admin" | "teacher")[];
}[] = [
  { label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher"] },
  { label: "Students", icon: Users, roles: ["admin", "teacher"] },
  { label: "Classes", icon: School, roles: ["admin"] },
  { label: "Teachers", icon: UserCog, roles: ["admin"] },
  { label: "Attendance", icon: ClipboardCheck, roles: ["admin", "teacher"] },
  { label: "History", icon: History, roles: ["admin", "teacher"] },
  { label: "Reports", icon: ChartNoAxesColumn, roles: ["admin"] },
];

export function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  setMobileOpen,
  currentUser,
}: SidebarProps) {
  const visibleNav = allNavItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      <button
        className="mobile-menu"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <BookOpenCheck size={24} />
          </div>
          <div>
            <strong>ClassTrack</strong>
            <span>School attendance</span>
          </div>
        </div>
        <div className="school-label">
          {currentUser.role === "admin" ? "ADMIN WORKSPACE" : "TEACHER WORKSPACE"}
        </div>
        <nav>
          {visibleNav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "nav-active" : ""}`}
              onClick={() => {
                onNavigate(label);
                setMobileOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {label === "Attendance" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="school-avatar">
            <GraduationCap size={21} />
          </div>
          <div style={{ minWidth: 0 }}>
            <strong>{currentUser.name}</strong>
            <span style={{ fontSize: "10px", color: "#8a948d" }}>
              {currentUser.role === "admin"
                ? "Administrator"
                : currentUser.assignedClasses.length > 0
                ? currentUser.assignedClasses.join(", ")
                : "No class assigned"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
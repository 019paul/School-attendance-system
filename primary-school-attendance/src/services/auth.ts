import type { User, UserRole } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";
import {
  clearCurrentUser,
  loadCurrentUser,
  loadTeachers,
  saveCurrentUser,
} from "../utils/storage";

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  assignedClasses: string[];
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: "Mrs. Sarah Jenkins",
    email: "admin@greenfield.edu",
    password: "AdminPass123!",
    role: "admin",
    roleLabel: "School Administrator",
    assignedClasses: [
      "Primary 1",
      "Primary 2",
      "Primary 3",
      "Primary 4",
      "Primary 5",
      "Primary 6",
    ],
    description: "Full access to school records, classes, and teacher assignments.",
  },
  {
    name: "Mr. Chukwuemeka Okafor",
    email: "mr.okafor@greenfield.edu",
    password: "TeacherPass123!",
    role: "teacher",
    roleLabel: "Teacher (Primary 1)",
    assignedClasses: ["Primary 1"],
    description: "Can take and view attendance for Primary 1 only.",
  },
  {
    name: "Mrs. Kemi Adebayo",
    email: "mrs.adebayo@greenfield.edu",
    password: "TeacherPass123!",
    role: "teacher",
    roleLabel: "Teacher (Primary 2 & 3)",
    assignedClasses: ["Primary 2", "Primary 3"],
    description: "Assigned to two classes; cannot access other classes.",
  },
  {
    name: "Ms. Clara Taylor",
    email: "ms.taylor@greenfield.edu",
    password: "TeacherPass123!",
    role: "teacher",
    roleLabel: "Teacher (Unassigned)",
    assignedClasses: [],
    description: "New teacher account with no assigned classes yet.",
  },
];

export async function signIn(
  emailInput: string,
  passwordInput: string
): Promise<{ user: User | null; error: string | null }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email || !password) {
    return { user: null, error: "Please enter both an email address and a password." };
  }

  // --- Real Supabase Auth (when credentials are provided) ---
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { user: null, error: error?.message || "Invalid email or password." };
      }

      // Fetch profile and role from Supabase database
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", data.user.id)
        .single();

      if (profile && profile.status === "inactive") {
        await supabase.auth.signOut();
        return {
          user: null,
          error: "Your account has been deactivated. Please contact the school administrator.",
        };
      }

      // Fetch teacher's assigned classes from database
      let assignedClasses: string[] = [];
      if (profile?.role === "teacher") {
        const { data: classRows } = await supabase
          .from("teacher_classes")
          .select("classes(name)")
          .eq("teacher_id", data.user.id);

        if (classRows) {
          assignedClasses = classRows
            .map((row: any) => row.classes?.name)
            .filter(Boolean);
        }
      } else {
        assignedClasses = [
          "Primary 1",
          "Primary 2",
          "Primary 3",
          "Primary 4",
          "Primary 5",
          "Primary 6",
        ];
      }

      const authenticatedUser: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: profile?.full_name || data.user.email?.split("@")[0] || "User",
        role: (profile?.role as UserRole) || "teacher",
        assignedClasses,
        status: (profile?.status as "active" | "inactive") || "active",
        schoolName: "Greenfield Primary School",
      };

      saveCurrentUser(authenticatedUser);
      return { user: authenticatedUser, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: err.message || "An unexpected error occurred during sign-in.",
      };
    }
  }

  // --- Safe Demo / Development Auth (when Supabase is not yet configured) ---
  const demoMatch = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === email);

  if (demoMatch) {
    if (password !== demoMatch.password) {
      return {
        user: null,
        error: "Incorrect password. For demo testing, use: " + demoMatch.password,
      };
    }

    // Refresh teacher assigned classes from storage in case an admin recently edited them
    let assignedClasses = demoMatch.assignedClasses;
    if (demoMatch.role === "teacher") {
      const storedTeachers = loadTeachers();
      const stored = storedTeachers.find((t) => t.email.toLowerCase() === email);
      if (stored) {
        if (stored.status === "inactive") {
          return {
            user: null,
            error: "This teacher account is deactivated. Contact the School Administrator.",
          };
        }
        assignedClasses = stored.assignedClasses;
      }
    }

    const sessionUser: User = {
      id: `user-${demoMatch.role}-${Date.now()}`,
      email: demoMatch.email,
      name: demoMatch.name,
      role: demoMatch.role,
      assignedClasses,
      status: "active",
      schoolName: "Greenfield Primary School",
    };

    saveCurrentUser(sessionUser);
    return { user: sessionUser, error: null };
  }

  // Check dynamically created teachers in local storage
  const teachers = loadTeachers();
  const createdTeacher = teachers.find((t) => t.email.toLowerCase() === email);

  if (createdTeacher) {
    if (createdTeacher.status === "inactive") {
      return {
        user: null,
        error: "This teacher account is deactivated. Contact the School Administrator.",
      };
    }
    // Accept standard demo password for newly invited teachers in demo mode
    if (password !== "TeacherPass123!" && password.length < 6) {
      return {
        user: null,
        error: "Password must be at least 6 characters (or use: TeacherPass123!).",
      };
    }

    const sessionUser: User = {
      id: createdTeacher.id,
      email: createdTeacher.email,
      name: createdTeacher.name,
      role: "teacher",
      assignedClasses: createdTeacher.assignedClasses,
      status: createdTeacher.status,
      schoolName: "Greenfield Primary School",
    };

    saveCurrentUser(sessionUser);
    return { user: sessionUser, error: null };
  }

  return {
    user: null,
    error:
      "Account not found. Please choose one of the pre-configured demo accounts or enter valid credentials.",
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on logout
    }
  }
  clearCurrentUser();
}

export async function sendPasswordResetEmail(
  emailInput: string
): Promise<{ success: boolean; error: string | null }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid school email address." };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send reset email." };
    }
  }

  // Demo fallback
  return { success: true, error: null };
}

export function getCurrentSession(): User | null {
  return loadCurrentUser();
}

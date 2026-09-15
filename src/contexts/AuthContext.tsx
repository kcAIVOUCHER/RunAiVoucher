import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export type Role = "master" | "agency_admin" | "agency_user";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
  agencyId?: string;
}

interface AuthContextData {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  clearSessionAndStorage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * Robust utility to clear all persistent auth data, cookies, and local caches
 * without destructive IndexedDB deletions that freeze mobile Safari/Chrome WebKit.
 */
export async function clearAllClientStorage(): Promise<void> {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn("Error during auth.signOut:", e);
  }

  try {
    localStorage.clear();
  } catch (e) {}

  try {
    sessionStorage.clear();
  } catch (e) {}

  try {
    // Clear cookies for path / and current domain safely
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        if (window.location.hostname) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        }
      }
    }
  } catch (e) {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never leave the app frozen in loading state on mobile browsers
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer);
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          const userEmail = (firebaseUser.email || "").toLowerCase().trim();
          const isMasterEmail = userEmail === "kcarrascosa.comercial@gmail.com";

          // Fetch authoritative role from backend API with strict 2s timeout
          let backendRole: Role = isMasterEmail ? "master" : "agency_user";
          let backendAgencyId: string | undefined = undefined;
          let backendName = firebaseUser.displayName || (isMasterEmail ? "Administrador Master SaaS" : "Usuário");

          try {
            const controller = new AbortController();
            const fetchTimer = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`/api/users/check-role?email=${encodeURIComponent(userEmail)}`, {
              signal: controller.signal
            });
            clearTimeout(fetchTimer);

            if (res.ok) {
              const checkData = await res.json();
              if (checkData.role) backendRole = checkData.role as Role;
              if (checkData.agencyId) backendAgencyId = checkData.agencyId;
              if (checkData.name) backendName = checkData.name;
            }
          } catch (e) {
            console.warn("Could not check role with backend API within timeout:", e);
          }

          if (isMasterEmail) {
            backendRole = "master";
          }

          let profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: backendName,
            role: backendRole,
            agencyId: backendAgencyId
          };

          if (isMounted) {
            setUser(profile);
          }
        } catch (error) {
          console.error("Error setting user session:", error);
          const fallbackEmail = (firebaseUser.email || "").toLowerCase().trim();
          if (isMounted) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || (fallbackEmail === "kcarrascosa.comercial@gmail.com" ? "Administrador Master SaaS" : "Usuário"),
              role: fallbackEmail === "kcarrascosa.comercial@gmail.com" ? "master" : "agency_user"
            });
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await clearAllClientStorage();
    setUser(null);
    setLoading(false);
  };

  const clearSessionAndStorage = async () => {
    await clearAllClientStorage();
    setUser(null);
    setLoading(false);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, clearSessionAndStorage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


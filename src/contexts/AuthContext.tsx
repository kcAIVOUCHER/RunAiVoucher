import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userEmail = (firebaseUser.email || "").toLowerCase().trim();
          const isMasterEmail = userEmail === "kcarrascosa.comercial@gmail.com";

          // Fetch authoritative role from backend API first (backed by Supabase/store)
          let backendRole: Role = isMasterEmail ? "master" : "agency_user";
          let backendAgencyId: string | undefined = undefined;
          let backendName = firebaseUser.displayName || (isMasterEmail ? "Administrador Master SaaS" : "Usuário");

          try {
            const res = await fetch(`/api/users/check-role?email=${encodeURIComponent(userEmail)}`);
            if (res.ok) {
              const checkData = await res.json();
              if (checkData.role) backendRole = checkData.role as Role;
              if (checkData.agencyId) backendAgencyId = checkData.agencyId;
              if (checkData.name) backendName = checkData.name;
            }
          } catch (e) {
            console.warn("Could not check role with backend API:", e);
          }

          if (isMasterEmail) {
            backendRole = "master";
          }

          // Fallback user profile in memory immediately
          let profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: backendName,
            role: backendRole,
            agencyId: backendAgencyId
          };

          // Attempt to sync/read from Firestore, but gracefully ignore any permission errors
          try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const data = docSnap.data();
              const finalRole = isMasterEmail ? "master" : (backendRole || data.role || "agency_user");
              const finalAgencyId = backendAgencyId || data.agencyId;
              
              profile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: data.name || backendName,
                role: finalRole,
                agencyId: finalAgencyId
              };

              // Update Firestore asynchronously if needed without blocking
              setDoc(docRef, { role: finalRole, agencyId: finalAgencyId || null }, { merge: true }).catch(() => {});
            } else {
              setDoc(docRef, {
                email: firebaseUser.email || "",
                role: backendRole,
                name: backendName,
                agencyId: backendAgencyId || null,
                createdAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          } catch (fsErr) {
            console.warn("Firestore user sync warning (using backend session profile):", fsErr);
          }

          setUser(profile);
        } catch (error) {
          console.error("Error setting user session:", error);
          // If user is logged into Firebase Auth, never leave user as null if we have their email
          const fallbackEmail = (firebaseUser.email || "").toLowerCase().trim();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || (fallbackEmail === "kcarrascosa.comercial@gmail.com" ? "Administrador Master SaaS" : "Usuário"),
            role: fallbackEmail === "kcarrascosa.comercial@gmail.com" ? "master" : "agency_user"
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

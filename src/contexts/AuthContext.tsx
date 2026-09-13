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

          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            let finalRole: Role = isMasterEmail ? "master" : (data.role || "agency_user");
            let finalAgencyId = data.agencyId;

            // Self-heal: always verify with backend in case database was reset and agency IDs changed
            try {
              const res = await fetch(`/api/users/check-role?email=${encodeURIComponent(userEmail)}`);
              if (res.ok) {
                const checkData = await res.json();
                if (checkData.agencyId !== data.agencyId) {
                   finalAgencyId = checkData.agencyId;
                   finalRole = checkData.role || finalRole;
                   await setDoc(docRef, { agencyId: finalAgencyId || null, role: finalRole }, { merge: true }).catch(console.error);
                }
              }
            } catch(e) {
              console.error("Error verifying role:", e);
            }

            // If master user profile had an outdated role in Firestore, heal it automatically
            if (isMasterEmail && finalRole !== "master") {
              finalRole = "master";
              setDoc(docRef, { role: "master" }, { merge: true }).catch(console.error);
            }

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              ...data,
              agencyId: finalAgencyId,
              role: finalRole
            } as UserProfile);
          } else {
            // User authenticated but no profile in Firestore, fetch role from backend
            let role: Role = isMasterEmail ? "master" : "agency_user";
            let agencyId: string | undefined = undefined;
            let userName = firebaseUser.displayName || (isMasterEmail ? "Administrador Master SaaS" : "Novo Usuário");

            try {
              const res = await fetch(`/api/users/check-role?email=${encodeURIComponent(userEmail)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.role) role = data.role as Role;
                if (data.agencyId) agencyId = data.agencyId;
                if (data.name) userName = data.name;
              }
            } catch (e) {
              console.error("Error fetching role from backend:", e);
            }

            if (isMasterEmail) {
              role = "master";
            }

            const defaultProfile: any = {
              email: firebaseUser.email || "",
              role: role,
              name: userName,
              createdAt: new Date().toISOString()
            };
            if (agencyId) {
              defaultProfile.agencyId = agencyId;
            }
            
            await setDoc(docRef, defaultProfile, { merge: true });
            setUser({
              uid: firebaseUser.uid,
              ...defaultProfile,
            } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
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

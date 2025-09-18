"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  email: string;
  role?: string;
  id?: string;
};

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // On mount, try to load user from cookie (or localStorage, or API)
  React.useEffect(() => {
    const cookie = typeof document !== 'undefined' ? document.cookie : '';
    const match = cookie.match(/(?:^|; )session=([^;]*)/);
    if (match) {
      try {
        let raw = match[1].replace(/-/g, "+").replace(/_/g, "/");
        raw = raw.padEnd(Math.ceil(raw.length / 4) * 4, "=");
        const json = atob(raw);
        const parsed = JSON.parse(json);
        if (parsed && parsed.email) {
          setUser({ email: parsed.email, role: parsed.role, id: parsed.id });
        }
      } catch (err) {
      }
    }
  }, []);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

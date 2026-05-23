import React, { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Participant, CurrentUser } from "../types";

interface StoreState {
  participants: Participant[];
  currentUser: CurrentUser | null;
  currentOTP: string | null;
  quizStartTime: number | null;

  setCurrentUser: (u: CurrentUser | null) => void;
  setCurrentOTP: (otp: string | null) => void;
  setQuizStartTime: (t: number | null) => void;
  addParticipant: (p: Participant) => void;
  clearCurrentSession: () => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentOTP, setCurrentOTP] = useState<string | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  const addParticipant = (p: Participant) => {
    setParticipants((prev) => {
      const updated = [...prev, p];
      updated.sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
      return updated;
    });
  };

  const clearCurrentSession = () => {
    setCurrentUser(null);
    setCurrentOTP(null);
    setQuizStartTime(null);
  };

  return (
    <StoreContext.Provider
      value={{
        participants,
        currentUser,
        currentOTP,
        quizStartTime,
        setCurrentUser,
        setCurrentOTP,
        setQuizStartTime,
        addParticipant,
        clearCurrentSession,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
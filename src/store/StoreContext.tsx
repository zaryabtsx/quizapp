import React, { createContext, useContext, useState, ReactNode } from "react";
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

const STORAGE_KEY = "quiz_store";

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(patch: object) {
  try {
    const current = loadState();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const saved = loadState();

  const [participants, setParticipants] = useState<Participant[]>(saved.participants ?? []);
  const [currentUser, setCurrentUserRaw] = useState<CurrentUser | null>(saved.currentUser ?? null);
  const [currentOTP, setCurrentOTPRaw] = useState<string | null>(saved.currentOTP ?? null);
  const [quizStartTime, setQuizStartTimeRaw] = useState<number | null>(saved.quizStartTime ?? null);

  const setCurrentUser = (u: CurrentUser | null) => {
    setCurrentUserRaw(u);
    saveState({ currentUser: u });
  };

  const setCurrentOTP = (otp: string | null) => {
    setCurrentOTPRaw(otp);
    saveState({ currentOTP: otp });
  };

  const setQuizStartTime = (t: number | null) => {
    setQuizStartTimeRaw(t);
    saveState({ quizStartTime: t });
  };

  const addParticipant = (p: Participant) => {
    setParticipants((prev) => {
      const updated = [...prev, p];
      updated.sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
      saveState({ participants: updated });
      return updated;
    });
  };

  const clearCurrentSession = () => {
    setCurrentUserRaw(null);
    setCurrentOTPRaw(null);
    setQuizStartTimeRaw(null);
    clearState();
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
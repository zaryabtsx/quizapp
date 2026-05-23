export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function formatTimePadded(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateSessionId(): string {
  return "sess_" + Math.random().toString(36).slice(2, 9);
}

export function maskMobile(mobile: string): string {
  if (mobile.length <= 5) return mobile;
  return mobile.slice(0, 4) + "****" + mobile.slice(-3);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
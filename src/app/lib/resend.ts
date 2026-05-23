interface VerificationEmailProps {
  email: string;
  otp: string;
  campaignId: string;
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail({ email, otp, campaignId }: VerificationEmailProps) {
  const response = await fetch("/api/send-verification-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp, campaignId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to send verification email.");
  }

  return response.json();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, otp, campaignId } = req.body ?? {};
  if (!email || !otp) {
    res.status(400).json({ error: "Missing email or otp." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing RESEND_API_KEY environment variable." });
    return;
  }

  const body = {
    from: "onboarding@resend.dev",
    to: email,
    subject: "Your quiz verification code",
    html: `
      <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.6;">
        <h1 style="font-size:20px; margin-bottom:10px;">Quiz verification code</h1>
        <p style="margin:0 0 16px;">Use the code below to verify your email and continue to the quiz:</p>
        <div style="font-size:24px; font-weight:700; letter-spacing:0.2em; margin:0 0 24px;">${otp}</div>
        <p style="margin:0 0 16px;">Campaign: <strong>${campaignId}</strong></p>
        <p style="margin:0;">If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      res.status(response.status).json({ error: errorData?.error?.message || "Failed to send verification email." });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Resend API request failed:", error);
    res.status(500).json({ error: "Failed to send verification email." });
  }
}

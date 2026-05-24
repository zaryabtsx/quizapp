import nodemailer from "nodemailer";

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

  // Validate SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    console.error("Missing SMTP configuration:", {
      smtpHost: !!smtpHost,
      smtpPort: !!smtpPort,
      smtpUser: !!smtpUser,
      smtpPass: !!smtpPass,
      fromEmail: !!fromEmail,
    });
    res.status(500).json({ error: "Server email configuration is missing." });
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === "465", // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Your Quiz Verification Code",
      html: `
        <div style="font-family:system-ui, sans-serif; color:#111; line-height:1.6; max-width:500px; margin:0 auto;">
          <div style="text-align:center; padding:20px 0;">
            <h1 style="font-size:24px; margin:0 0 10px; color:#333;">Quiz Verification Code</h1>
          </div>
          <div style="background:#f5f5f5; padding:20px; border-radius:8px; margin:20px 0;">
            <p style="margin:0 0 16px; color:#666;">Use the code below to verify your email and continue to the quiz:</p>
            <div style="font-size:32px; font-weight:700; letter-spacing:4px; margin:20px 0; text-align:center; color:#4F46E5;">${otp}</div>
            <p style="margin:16px 0; color:#666;">Campaign: <strong>${campaignId}</strong></p>
          </div>
          <p style="margin:20px 0; color:#999; font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="margin:20px 0 0; color:#999; font-size:12px; border-top:1px solid #eee; padding-top:16px;">This is an automated message, please do not reply.</p>
        </div>
      `,
      text: `Your Quiz Verification Code: ${otp}\n\nCampaign: ${campaignId}\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    console.log("Email sent:", info.messageId);
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      error: "Failed to send verification email. Please try again later.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

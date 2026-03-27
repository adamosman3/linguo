import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Linguo <onboarding@resend.dev>";

interface SendWelcomeEmailParams {
  name: string;
  email: string;
  role: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full access to all features and settings",
  manager: "Manage projects, users, and approve translations",
  translator: "Translate strings and submit for review",
  reviewer: "Review and approve/reject translations",
  viewer: "Read-only access to projects and translations",
};

export async function sendWelcomeEmail({ name, email, role }: SendWelcomeEmailParams) {
  const roleDescription = ROLE_DESCRIPTIONS[role] || role;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Linguo — Translation Management System",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Inter', system-ui, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #ff6633; padding: 32px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Linguo</h1>
                      <p style="margin: 4px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Translation Management System</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 22px; font-weight: 600;">Welcome, ${name}!</h2>
                      <p style="margin: 0 0 24px; color: #4a4a68; font-size: 15px; line-height: 1.6;">
                        You've been added to Linguo, our internal translation management platform. You can now collaborate on translating website content and email campaigns.
                      </p>
                      
                      <!-- Role Badge -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="background-color: #fff5f0; border: 1px solid #ffe0d0; border-radius: 8px; padding: 16px 20px;">
                            <p style="margin: 0 0 4px; color: #1a1a2e; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</p>
                            <p style="margin: 0; color: #ff6633; font-size: 18px; font-weight: 700; text-transform: capitalize;">${role}</p>
                            <p style="margin: 4px 0 0; color: #4a4a68; font-size: 13px;">${roleDescription}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}" style="display: inline-block; background-color: #ff6633; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                              Open Linguo
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Quick Start -->
                      <h3 style="margin: 0 0 12px; color: #1a1a2e; font-size: 16px; font-weight: 600;">Quick Start</h3>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; color: #4a4a68; font-size: 14px; line-height: 1.5;">
                            <strong style="color: #ff6633;">1.</strong> Browse existing projects or create a new one
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #4a4a68; font-size: 14px; line-height: 1.5;">
                            <strong style="color: #ff6633;">2.</strong> Add or import source strings for translation
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #4a4a68; font-size: 14px; line-height: 1.5;">
                            <strong style="color: #ff6633;">3.</strong> Translate using AI auto-translate or manual entry
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #4a4a68; font-size: 14px; line-height: 1.5;">
                            <strong style="color: #ff6633;">4.</strong> Review and approve translations for publishing
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                        This email was sent by Linguo Translation Management System.<br>
                        You received this because an admin added you as a team member.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

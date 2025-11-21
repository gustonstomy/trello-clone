import { createClient } from "../../../../lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { organizationId, email, role = "member" } = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to invite users" },
        { status: 403 }
      );
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingProfile.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400 }
        );
      }
    }

    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        email,
        token,
        role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      if (inviteError.code === "23505") {
        return NextResponse.json(
          { error: "An invite has already been sent to this email" },
          { status: 400 }
        );
      }
      throw inviteError;
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    let emailSent = false;
    const smtpConfigured =
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD;

    if (smtpConfigured) {
      try {
        const mailOptions = {
          from: process.env.SMTP_FROM || "noreply@trelloclone.com",
          to: email,
          subject: `You're invited to join ${organization.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #0079BF; color: white; padding: 20px; text-align: center; border-radius: 4px; }
                  .content { padding: 20px; }
                  .button { 
                    display: inline-block; 
                    background-color: #0079BF; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px;
                    margin: 20px 0;
                  }
                  .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #ccc; 
                    font-size: 12px; 
                    color: #666;
                  }
                  .link-text { 
                    font-size: 12px; 
                    color: #666; 
                    word-break: break-all;
                    margin-top: 10px;
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 4px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>You're invited!</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hi there,</p>
                    
                    <p><strong>${
                      user.user_metadata?.full_name || "Someone"
                    }</strong> has invited you to join <strong>${
            organization.name
          }</strong> on Trello Clone.</p>
                    
                    ${
                      organization.description
                        ? `<p><strong>About:</strong> ${organization.description}</p>`
                        : ""
                    }
                    
                    <p><strong>Your role:</strong> ${role}</p>
                    
                    <p>Click the button below to accept the invitation:</p>
                    
                    <a href="${inviteLink}" class="button">Accept Invitation</a>
                    
                    <p>Or copy and paste this link in your browser:</p>
                    <div class="link-text">${inviteLink}</div>
                    
                    <p><strong>Note:</strong> This invitation expires in 7 days.</p>
                    
                    <p>If you have any questions, feel free to reply to this email.</p>
                    
                    <p>Best regards,<br>Trello Clone Team</p>
                  </div>
                  
                  <div class="footer">
                    <p>This is an automated email. Please do not reply directly to this email address.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Invite email sent to ${email}`);
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    } else {
      console.log(
        "SMTP not configured. Email not sent. Please share the invite link manually."
      );
    }

    return NextResponse.json({
      success: true,
      invite,
      inviteLink,
      emailSent,
      message: emailSent
        ? `Invitation sent to ${email}`
        : "Invitation created. Please share the link below with the user.",
    });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

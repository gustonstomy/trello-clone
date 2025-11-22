import { createClient } from "../../../../lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { organizationId, email, role = "member" } = await request.json();

    // Validate input
    if (!email || !organizationId) {
      return NextResponse.json(
        { error: "Email and organization ID are required" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to invite
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

    // Check if user is already a member
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

    // Get organization details
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

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Create invite token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite in database
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
      console.error("Invite creation error:", inviteError);
      throw inviteError;
    }

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Send email with Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Trello Clone <onboarding@resend.dev>",
        to: email,
        subject: `You're invited to join ${organization.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  padding: 20px; 
                  background-color: #f9fafb;
                }
                .card {
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header { 
                  background: linear-gradient(135deg, #0079BF 0%, #0063A5 100%);
                  color: white; 
                  padding: 40px 20px; 
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .content { 
                  padding: 30px; 
                }
                .content p {
                  margin: 10px 0;
                }
                .highlight {
                  font-weight: 600;
                  color: #0079BF;
                }
                .cta-button { 
                  display: inline-block; 
                  background: linear-gradient(135deg, #0079BF 0%, #0063A5 100%);
                  color: white; 
                  padding: 14px 32px; 
                  text-decoration: none; 
                  border-radius: 6px;
                  font-weight: 600;
                  margin: 25px 0;
                  transition: all 0.3s ease;
                }
                .cta-button:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 8px 15px rgba(0, 121, 191, 0.3);
                }
                .link-section {
                  background-color: #f5f5f5;
                  border-left: 4px solid #0079BF;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 4px;
                  word-break: break-all;
                  font-size: 12px;
                  font-family: monospace;
                  color: #666;
                }
                .role-badge {
                  display: inline-block;
                  background-color: #dbeafe;
                  color: #1e40af;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  margin: 10px 0;
                }
                .footer { 
                  background-color: #f3f4f6;
                  padding: 20px; 
                  border-top: 1px solid #e5e7eb;
                  font-size: 12px; 
                  color: #6b7280;
                  text-align: center;
                }
                .footer p {
                  margin: 5px 0;
                }
                .warning {
                  background-color: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 15px;
                  border-radius: 4px;
                  margin: 20px 0;
                  font-size: 13px;
                  color: #92400e;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>🎉 You're Invited!</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hi there,</p>
                    
                    <p><span class="highlight">${
                      inviterProfile?.full_name || "Someone"
                    }</span> has invited you to collaborate on <span class="highlight">${
          organization.name
        }</span> in Trello Clone.</p>
                    
                    ${
                      organization.description
                        ? `
                      <p style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 3px solid #0079BF; margin: 15px 0;">
                        <strong>About this organization:</strong><br>
                        ${organization.description}
                      </p>
                    `
                        : ""
                    }
                    
                    <div class="role-badge">
                      Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
                    </div>
                    
                    <p style="margin-top: 20px; margin-bottom: 20px; color: #555;">
                      Click the button below to accept the invitation and start collaborating:
                    </p>
                    
                    <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
                    
                    <p style="color: #666; font-size: 14px;">
                      Or copy and paste this link in your browser:
                    </p>
                    <div class="link-section">
                      ${inviteLink}
                    </div>
                    
                    <div class="warning">
                      <strong>⏰ Important:</strong> This invitation expires in 7 days. Make sure to accept it before then.
                    </div>
                    
                    <p style="margin-top: 25px; color: #666;">
                      If you have any questions or need help, feel free to reply to this email.
                    </p>
                    
                    <p style="margin-top: 20px;">
                      Best regards,<br>
                      <strong>The Trello Clone Team</strong>
                    </p>
                  </div>
                  
                  <div class="footer">
                    <p>This is an automated email. Please do not reply directly to this email address.</p>
                    <p>© 2025 Trello Clone. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error("Email sending error:", emailError);
        // Don't fail the invite creation if email fails
        // The invite was created successfully
      } else {
        console.log("Email sent successfully:", emailData);
      }
    } catch (emailError) {
      console.error("Unexpected email error:", emailError);
      // Continue - invite was created even if email fails
    }

    return NextResponse.json({
      success: true,
      invite,
      inviteLink,
    });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

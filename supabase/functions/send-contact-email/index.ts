import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
const escapeHtml = (text: string): string => {
  if (!text) return "";
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
};

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
  wantsCallback: boolean;
  honeypot?: string; // Hidden field for spam detection
}

const MAX_REQUESTS_PER_HOUR = 5;

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-contact-email");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { name, email, phone, projectType, message, wantsCallback, honeypot }: ContactRequest = await req.json();

    console.log("Processing contact form from:", name, email, "IP:", clientIP);

    // SPAM CHECK: If honeypot field is filled, it's a bot
    if (honeypot && honeypot.trim() !== "") {
      console.log("Honeypot triggered - rejecting spam submission");
      // Return success to not alert the bot, but don't actually send
      return new Response(
        JSON.stringify({ success: true, message: "Message envoyé" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Le nom est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!email || !email.trim()) {
      return new Response(
        JSON.stringify({ error: "L'email est requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "L'adresse email n'est pas valide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Input length validation
    if (name.length > 100 || email.length > 255 || (phone && phone.length > 30) || (message && message.length > 5000)) {
      return new Response(
        JSON.stringify({ error: "Un ou plusieurs champs dépassent la longueur maximale autorisée" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // RATE LIMITING: Check submissions from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentSubmissions, error: rateCheckError } = await supabase
      .from("contact_rate_limits")
      .select("id")
      .eq("ip_address", clientIP)
      .gte("submitted_at", oneHourAgo);

    if (rateCheckError) {
      console.error("Rate limit check error:", rateCheckError);
    }

    const submissionCount = recentSubmissions?.length || 0;
    console.log(`Rate limit check: ${submissionCount}/${MAX_REQUESTS_PER_HOUR} submissions from IP ${clientIP}`);

    if (submissionCount >= MAX_REQUESTS_PER_HOUR) {
      console.log("Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ 
          error: "Trop de demandes envoyées. Veuillez réessayer dans 1 heure ou appelez-nous au 0485 75 52 27." 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Record this submission for rate limiting
    await supabase.from("contact_rate_limits").insert({ 
      ip_address: clientIP 
    });

    // Clean up old rate limit entries
    await supabase.rpc("cleanup_old_rate_limits");

    // Store contact request in database
    const { error: insertError } = await supabase.from("contact_requests").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      project_type: projectType || null,
      message: message?.trim() || null,
      wants_callback: wantsCallback || false,
      ip_address: clientIP,
      user_agent: userAgent,
    });

    if (insertError) {
      console.error("Error storing contact request:", insertError);
      // Continue anyway - email is more important
    } else {
      console.log("Contact request stored in database");
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("fr-BE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Email to the business owner
    const ownerEmailResponse = await resend.emails.send({
      from: "Le Cuivre Électrique <onboarding@resend.dev>",
      to: ["cuivre.electrique@gmail.com"],
      reply_to: email.trim(),
      subject: `🔔 Nouveau message - ${projectType || "Contact"} - ${name.trim()}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #B87333 0%, #8B5A2B 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nouvelle demande de contact</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #B87333; margin-top: 0; border-bottom: 2px solid #B87333; padding-bottom: 10px;">
              📋 Informations du client
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333; width: 140px;">👤 Nom</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(name.trim())}</td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">📧 Email</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email.trim())}" style="color: #B87333;">${escapeHtml(email.trim())}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">📞 Téléphone</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee;"><a href="tel:${escapeHtml(phone?.trim() || '')}" style="color: #B87333;">${escapeHtml(phone?.trim()) || "Non fourni"}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">🔧 Type de travaux</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(projectType) || "Non spécifié"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">📞 Rappel souhaité</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #555;">${wantsCallback ? "✅ Oui" : "❌ Non"}</td>
              </tr>
            </table>
            
            ${message?.trim() ? `
              <h2 style="color: #B87333; border-bottom: 2px solid #B87333; padding-bottom: 10px;">💬 Message</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #B87333; white-space: pre-wrap; color: #333; line-height: 1.6;">${escapeHtml(message.trim())}</div>
            ` : ''}
            
            <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
              <h3 style="color: #666; margin-top: 0; font-size: 14px;">📊 Informations techniques</h3>
              <table style="width: 100%; font-size: 12px; color: #888;">
                <tr>
                  <td style="padding: 4px 0;"><strong>Date:</strong> ${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>IP:</strong> ${escapeHtml(clientIP)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; word-break: break-all;"><strong>Navigateur:</strong> ${escapeHtml(userAgent.substring(0, 150))}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">
              Ce message a été envoyé depuis le formulaire de contact du site Le Cuivre Électrique.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Owner email response:", JSON.stringify(ownerEmailResponse));

    if (ownerEmailResponse.error) {
      console.error("Failed to send owner email:", ownerEmailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de l'envoi du message. Veuillez réessayer ou appelez-nous au 0485 75 52 27."
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate dynamic response delay
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isOutsideBusinessHours = currentHour < 8 || currentHour >= 18;
    const isLongMessage = message && message.trim().length > 500;
    
    // Dynamic delay: 24h for standard requests, 24-48h for complex/off-hours
    const responseDelay = (isWeekend || isOutsideBusinessHours || isLongMessage) ? "24 à 48h" : "24h";
    
    // Logo URL (hosted externally for email compatibility)
    const logoUrl = "https://tuemfswhxxtdygjvvdxm.supabase.co/storage/v1/object/public/assets/logo-cuivre-electrique.png";

    // Confirmation email to the client with professional HTML
    const clientEmailResponse = await resend.emails.send({
      from: "Le Cuivre Électrique <contact@cuivre-electrique.com>",
      to: [email.trim()],
      subject: "Nous avons bien reçu votre demande – Le Cuivre Électrique",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de votre demande</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
            <tr>
              <td style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #B87333 0%, #8B5A2B 100%); padding: 30px 40px; text-align: center;">
                      <img src="${logoUrl}" alt="Le Cuivre Électrique" style="max-width: 180px; height: auto; margin-bottom: 15px;" onerror="this.style.display='none'">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                        Merci pour votre confiance !
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="font-size: 18px; color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                        Bonjour,
                      </p>
                      
                      <p style="font-size: 16px; color: #555555; line-height: 1.7; margin: 0 0 25px 0;">
                        Nous avons bien reçu votre demande via notre site.<br>
                        Notre équipe vous recontactera dans les plus brefs délais.
                      </p>
                      
                      <!-- Response Delay Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f8f4f0 0%, #f0ebe5 100%); border-radius: 10px; padding: 25px; text-align: center; border-left: 4px solid #B87333;">
                            <p style="font-size: 16px; color: #666666; margin: 0 0 8px 0;">
                              ⏱ Délai habituel de réponse :
                            </p>
                            <p style="font-size: 28px; color: #B87333; margin: 0; font-weight: 700;">
                              ${responseDelay}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="font-size: 16px; color: #555555; line-height: 1.7; margin: 30px 0 25px 0;">
                        Merci pour votre confiance.
                      </p>
                      
                      <p style="font-size: 16px; color: #555555; line-height: 1.7; margin: 0;">
                        Cordialement,<br>
                        <strong style="color: #B87333;">Le Cuivre Électrique</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Urgent Contact Box -->
                  <tr>
                    <td style="padding: 0 40px 30px 40px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="background: linear-gradient(135deg, #B87333 0%, #8B5A2B 100%); border-radius: 10px; padding: 25px; text-align: center;">
                            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0;">
                              ⚡ Besoin urgent ? Appelez-nous !
                            </p>
                            <p style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">
                              <a href="tel:0485755227" style="color: #ffffff; text-decoration: none;">0485 75 52 27</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer / Signature -->
                  <tr>
                    <td style="background-color: #2d2d2d; padding: 30px 40px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="text-align: center;">
                            <img src="${logoUrl}" alt="Le Cuivre Électrique" style="max-width: 120px; height: auto; margin-bottom: 15px; opacity: 0.9;" onerror="this.style.display='none'">
                            <p style="color: #B87333; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
                              Le Cuivre Électrique
                            </p>
                            <p style="color: #aaaaaa; font-size: 14px; margin: 0 0 5px 0;">
                              📞 <a href="tel:0485755227" style="color: #aaaaaa; text-decoration: none;">0485 75 52 27</a>
                            </p>
                            <p style="color: #aaaaaa; font-size: 14px; margin: 0 0 15px 0;">
                              🌐 <a href="https://cuivre-electrique.com" style="color: #B87333; text-decoration: none;">cuivre-electrique.com</a>
                            </p>
                            <p style="color: #777777; font-size: 11px; margin: 15px 0 0 0; border-top: 1px solid #444; padding-top: 15px;">
                              Cet email est une confirmation automatique. Pour toute question, contactez-nous directement.
                            </p>
                          </td>
                        </tr>
                      </table>
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

    console.log("Client email response:", JSON.stringify(clientEmailResponse));

    if (clientEmailResponse.error) {
      console.warn("Client confirmation email failed, but owner was notified:", clientEmailResponse.error);
      // Don't fail the whole request if only the client confirmation failed
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Votre demande a été envoyée avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({ 
        error: "Une erreur est survenue. Veuillez réessayer ou appelez-nous au 0485 75 52 27."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
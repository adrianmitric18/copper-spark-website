import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
  wantsCallback: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-contact-email");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, projectType, message, wantsCallback }: ContactRequest = await req.json();

    console.log("Processing contact form from:", name, email);

    // Validate required fields
    if (!name || !email || !phone || !projectType) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Tous les champs obligatoires doivent être remplis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email to the business owner
    const ownerEmailResponse = await resend.emails.send({
      from: "Le Cuivre Électrique <onboarding@resend.dev>",
      to: ["cuivre.electrique@gmail.com"],
      subject: `Nouvelle demande de devis - ${projectType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B87333; border-bottom: 2px solid #B87333; padding-bottom: 10px;">
            Nouvelle demande de devis
          </h1>
          
          <h2 style="color: #333;">Informations du client</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nom:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Téléphone:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Type de travaux:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${projectType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Souhaite être rappelé:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${wantsCallback ? "Oui" : "Non"}</td>
            </tr>
          </table>
          
          ${message ? `
            <h2 style="color: #333; margin-top: 20px;">Message</h2>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
          ` : ''}
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            Ce message a été envoyé depuis le formulaire de contact du site Le Cuivre Électrique.
          </p>
        </div>
      `,
    });

    console.log("Owner email sent:", ownerEmailResponse);

    // Confirmation email to the client
    const clientEmailResponse = await resend.emails.send({
      from: "Le Cuivre Électrique <onboarding@resend.dev>",
      to: [email],
      subject: "Votre demande a bien été reçue - Le Cuivre Électrique",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B87333;">Merci pour votre demande, ${name} !</h1>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Nous avons bien reçu votre demande de devis pour <strong>${projectType}</strong>.
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Nous reviendrons vers vous dans les <strong>48 heures</strong> avec un devis détaillé.
          </p>
          
          ${wantsCallback ? `
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Comme demandé, nous vous rappellerons au <strong>${phone}</strong>.
            </p>
          ` : ''}
          
          <div style="background: linear-gradient(135deg, #B87333 0%, #8B5A2B 100%); color: white; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <h2 style="margin: 0 0 10px 0;">Besoin urgent ?</h2>
            <p style="margin: 0;">Appelez-nous directement au <strong>0485 75 52 27</strong></p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            À très bientôt,<br>
            <strong>Adrian Mitric</strong><br>
            Le Cuivre Électrique
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            Cet email est une confirmation automatique. Ne répondez pas directement à ce message.
          </p>
        </div>
      `,
    });

    console.log("Client confirmation email sent:", clientEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails envoyés avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

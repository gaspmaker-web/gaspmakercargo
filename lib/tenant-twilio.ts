import twilio from 'twilio';
import prisma from '@/lib/prisma';
import { getTenantId } from '@/lib/tenant-cache';

interface TwilioConfig {
  client: any;
  messagingServiceSid: string;
  phoneNumber: string;
}

const twilioCache = new Map<string, TwilioConfig>();

export async function getTenantTwilio(tenantSlug?: string): Promise<TwilioConfig> {
  const slug = tenantSlug || process.env.TENANT_SLUG || 'gaspmaker';

  if (twilioCache.has(slug)) return twilioCache.get(slug)!;

  try {
    const tenantId = await getTenantId(slug);
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          twilio_account_sid: true,
          twilio_auth_token: true,
          twilio_messaging_service_sid: true,
          twilio_phone_number: true
        }
      });

      if (tenant?.twilio_account_sid && tenant?.twilio_auth_token) {
        const config: TwilioConfig = {
          client: twilio(tenant.twilio_account_sid, tenant.twilio_auth_token),
          messagingServiceSid: tenant.twilio_messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID!,
          phoneNumber: tenant.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER!
        };
        twilioCache.set(slug, config);
        return config;
      }
    }
  } catch (error) {
    console.error('Error getting tenant Twilio:', error);
  }

  // Fallback — usar credenciales del .env (GaspMaker)
  return {
    client: twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!),
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!
  };
}

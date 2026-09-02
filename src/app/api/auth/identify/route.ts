import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTotpAuthUri } from '@/lib/auth/totp';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    const supabase = await createClient();

    // Query user profile
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, phone_number, full_name, is_active, totp_secret, totp_enabled')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'This mobile number is not registered in the system. Please contact your administrator.' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This staff account has been deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // If first-time onboarding (totp_enabled is false), generate the setup QR code
    if (!user.totp_enabled) {
      const authUri = getTotpAuthUri(`${user.full_name} (${cleanPhone})`, user.totp_secret);
      const qrCodeUrl = await QRCode.toDataURL(authUri, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
      });

      return NextResponse.json({
        success: true,
        needsSetup: true,
        fullName: user.full_name,
        phoneNumber: cleanPhone,
        qrCodeUrl,
        manualSecret: user.totp_secret,
      });
    }

    // Regular daily login
    return NextResponse.json({
      success: true,
      needsSetup: false,
      fullName: user.full_name,
      phoneNumber: cleanPhone,
    });
  } catch (err: any) {
    console.error('Error identifying user:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

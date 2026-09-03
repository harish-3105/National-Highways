import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTotpAuthUri, generateTotpSecret } from '@/lib/auth/totp';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    const tenDigitPhone = cleanPhone.slice(-10);

    if (!/^[6-9]\d{9}$/.test(tenDigitPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Query existing user profile
    let { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, phone_number, full_name, is_active, totp_secret, totp_enabled, failed_totp_attempts, totp_locked_until')
      .eq('phone_number', tenDigitPhone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. If user profile doesn't exist yet, check if they exist in the Staff Directory
    if (!user) {
      const { data: staff, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .or(`contact_no.eq.${tenDigitPhone},contact_no.eq.+91${tenDigitPhone},contact_no.ilike.%${tenDigitPhone}`)
        .neq('delete_status', 'DELETED')
        .maybeSingle();

      if (staffError) {
        return NextResponse.json({ error: staffError.message }, { status: 500 });
      }

      if (!staff) {
        // Not a registered staff member and not a pre-configured user -> Block Public Access
        return NextResponse.json(
          { error: 'This mobile number is not registered in the TN Highways Department staff directory. Please contact your administrator.' },
          { status: 404 }
        );
      }

      // Automatically provision user profile on the fly for registered staff
      // Fetch default 'Viewer' role (Position 0)
      const { data: viewerRole } = await supabase
        .from('roles')
        .select('id')
        .eq('position', 0)
        .maybeSingle();

      const defaultRoleId = viewerRole?.id || '00000000-0000-0000-0000-000000000002';
      const newSecret = generateTotpSecret();

      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          staff_id: staff.id,
          phone_number: tenDigitPhone,
          full_name: staff.name,
          role_id: defaultRoleId,
          jurisdiction_scope: 'DIVISION',
          circle: staff.circle || null,
          division: staff.division || null,
          sub_division: staff.sub_division || null,
          totp_secret: newSecret,
          totp_enabled: false,
          is_active: true,
          failed_totp_attempts: 0,
          totp_locked_until: null,
        })
        .select('id, phone_number, full_name, is_active, totp_secret, totp_enabled, failed_totp_attempts, totp_locked_until')
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      user = newUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'User profile not found or could not be created.' }, { status: 500 });
    }

    // 3. Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This staff account has been deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // 4. If first-time onboarding (totp_enabled is false), generate the setup QR code
    if (!user.totp_enabled) {
      const authUri = getTotpAuthUri(`${user.full_name} (${tenDigitPhone})`, user.totp_secret);
      const qrCodeUrl = await QRCode.toDataURL(authUri, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
      });

      return NextResponse.json({
        success: true,
        needsSetup: true,
        fullName: user.full_name,
        phoneNumber: tenDigitPhone,
        qrCodeUrl,
        manualSecret: user.totp_secret,
      });
    }

    // 5. Regular daily login
    return NextResponse.json({
      success: true,
      needsSetup: false,
      fullName: user.full_name,
      phoneNumber: tenDigitPhone,
    });
  } catch (err: any) {
    console.error('Error identifying user:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

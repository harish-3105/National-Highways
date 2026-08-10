import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FeeBillRecord } from '@/types/feeBill';
import { derivePendencyStage } from '@/lib/feeBillMasterData';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
  const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

// In-memory fallback array for dev when DB table is not yet created
let fallbackStore: FeeBillRecord[] = [];

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const circle = searchParams.get('circle')?.trim() || '';
    const division = searchParams.get('division')?.trim() || '';
    const paymentStatus = searchParams.get('paymentStatus')?.trim() || '';
    const pendencyStatus = searchParams.get('pendencyStatus')?.trim() || '';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    if (supabase) {
      const { data, error } = await supabase
        .from('fee_bills')
        .select('*')
        .order('fee_bill_date', { ascending: false });

      if (!error && Array.isArray(data)) {
        let mapped: FeeBillRecord[] = data.map((item: any) => ({
          id: item.id,
          feeBillNumber: item.fee_bill_number,
          feeBillDate: item.fee_bill_date,
          circle: item.circle,
          division: item.division,
          lawyerName: item.lawyer_name,
          lawyerDesignation: item.lawyer_designation,
          caseType: item.case_type,
          caseNumber: item.case_number,
          caseYear: item.case_year,
          casePertainsTo: item.case_pertains_to || 'GOTN',
          appearanceAmount: Number(item.appearance_amount) || 0,
          appearanceDate: item.appearance_date,
          conferenceAmount: Number(item.conference_amount) || 0,
          conferenceDate: item.conference_date,
          verifyingAmount: Number(item.verifying_amount) || 0,
          verifyingDate: item.verifying_date,
          assistanceAmount: Number(item.assistance_amount) || 0,
          assistanceDate: item.assistance_date,
          totalFeeAmount: Number(item.total_fee_amount) || 0,
          assistantName: item.assistant_name || '',
          assistantDesignation: item.assistant_designation || '',
          paymentStatus: item.payment_status || 'Not Settled',
          settledAmount: Number(item.settled_amount) || 0,
          itCess: Number(item.it_cess) || 0,
          utrRbiReference: item.utr_rbi_reference || '',
          paymentDate: item.payment_date || '',
          goStatus: item.go_status || 'Yes',
          goNumber: item.go_number || '',
          goDate: item.go_date || '',
          paymentSanction: item.payment_sanction || 'No',
          proposalSubmitted: item.proposal_submitted || 'No',
          proposalMovement: item.proposal_movement || { deToCe: false, seToCe: false, seToRorMorth: false },
          directMovement: item.direct_movement || { deToCe: false, seToCe: false },
          letterNumber: item.letter_number || '',
          letterDate: item.letter_date || '',
          currentPendency: item.current_pendency || 'Pending with DE',
          delete_status: item.delete_status || 'ACTIVE',
          isDeleted: item.delete_status === 'DELETED' || item.delete_status === 'SOFT_DELETE',
          createdBy: item.created_by || 'System Admin',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        // Apply filters
        mapped = mapped.filter((b) => {
          if (!includeDeleted && b.isDeleted) return false;
          if (circle && b.circle !== circle) return false;
          if (division && b.division !== division) return false;
          if (paymentStatus && paymentStatus !== 'ALL' && b.paymentStatus !== paymentStatus) return false;
          if (pendencyStatus && pendencyStatus !== 'ALL' && b.currentPendency !== pendencyStatus) return false;
          if (search) {
            const str = `${b.feeBillNumber} ${b.lawyerName} ${b.caseNumber} ${b.division} ${b.circle}`.toLowerCase();
            if (!str.includes(search)) return false;
          }
          return true;
        });

        return NextResponse.json({ success: true, feeBills: mapped, totalCount: mapped.length });
      }
    }

    // Return real fallback store if DB table is initializing
    let filtered = fallbackStore.filter((b) => {
      if (!includeDeleted && b.isDeleted) return false;
      if (circle && b.circle !== circle) return false;
      if (division && b.division !== division) return false;
      if (paymentStatus && paymentStatus !== 'ALL' && b.paymentStatus !== paymentStatus) return false;
      if (pendencyStatus && pendencyStatus !== 'ALL' && b.currentPendency !== pendencyStatus) return false;
      if (search) {
        const str = `${b.feeBillNumber} ${b.lawyerName} ${b.caseNumber} ${b.division} ${b.circle}`.toLowerCase();
        if (!str.includes(search)) return false;
      }
      return true;
    });

    return NextResponse.json({ success: true, feeBills: filtered, totalCount: filtered.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg, feeBills: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body: FeeBillRecord = await request.json();

    const derivedPendency = derivePendencyStage(body);
    const isDel = body.delete_status === 'DELETED' || body.delete_status === 'SOFT_DELETE';

    const record: FeeBillRecord = {
      ...body,
      id: body.id && String(body.id).startsWith('fb-') ? body.id : (body.id || `fb-${Date.now()}`),
      currentPendency: derivedPendency,
      delete_status: body.delete_status || 'ACTIVE',
      isDeleted: isDel,
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      const payload = {
        fee_bill_number: record.feeBillNumber,
        fee_bill_date: record.feeBillDate,
        circle: record.circle,
        division: record.division,
        lawyer_name: record.lawyerName,
        lawyer_designation: record.lawyerDesignation,
        case_type: record.caseType,
        case_number: record.caseNumber,
        case_year: record.caseYear,
        case_pertains_to: record.casePertainsTo,
        appearance_amount: record.appearanceAmount,
        appearance_date: record.appearanceDate || null,
        conference_amount: record.conferenceAmount,
        conference_date: record.conferenceDate || null,
        verifying_amount: record.verifyingAmount,
        verifying_date: record.verifyingDate || null,
        assistance_amount: record.assistanceAmount,
        assistance_date: record.assistanceDate || null,
        total_fee_amount: record.totalFeeAmount,
        assistant_name: record.assistantName || null,
        assistant_designation: record.assistantDesignation || null,
        payment_status: record.paymentStatus,
        settled_amount: record.settledAmount || 0,
        it_cess: record.itCess || 0,
        utr_rbi_reference: record.utrRbiReference || null,
        payment_date: record.paymentDate || null,
        go_status: record.goStatus || 'Yes',
        go_number: record.goNumber || null,
        go_date: record.goDate || null,
        payment_sanction: record.paymentSanction || 'No',
        proposal_submitted: record.proposalSubmitted || 'No',
        proposal_movement: record.proposalMovement || {},
        direct_movement: record.directMovement || {},
        letter_number: record.letterNumber || null,
        letter_date: record.letterDate || null,
        current_pendency: derivedPendency,
        delete_status: record.delete_status || 'ACTIVE',
        updated_at: new Date().toISOString(),
      };

      // Upsert into Supabase
      const { data: existing } = await supabase
        .from('fee_bills')
        .select('id')
        .eq('fee_bill_number', record.feeBillNumber)
        .maybeSingle();

      if (existing) {
        await supabase.from('fee_bills').update(payload).eq('id', existing.id);
        record.id = existing.id;
      } else {
        const { data: inserted } = await supabase
          .from('fee_bills')
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select('id')
          .single();
        if (inserted?.id) record.id = inserted.id;
      }
    }

    // Sync fallback store
    const idx = fallbackStore.findIndex((b) => String(b.id) === String(record.id) || b.feeBillNumber === record.feeBillNumber);
    if (idx >= 0) {
      fallbackStore[idx] = record;
    } else {
      fallbackStore.unshift(record);
    }

    return NextResponse.json({ success: true, feeBill: record });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export const PUT = POST;

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    if (supabase) {
      await supabase
        .from('fee_bills')
        .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    const idx = fallbackStore.findIndex((b) => String(b.id) === String(id));
    if (idx >= 0) {
      fallbackStore[idx].isDeleted = true;
      fallbackStore[idx].delete_status = 'DELETED';
    }

    return NextResponse.json({ success: true, message: 'Fee bill soft-deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

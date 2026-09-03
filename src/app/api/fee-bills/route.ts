import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FeeBillRecord } from '@/types/feeBill';
import { derivePendencyStage } from '@/lib/feeBillMasterData';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit/logger';

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

// In-memory fallback array for dev when DB connection is unavailable
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
        let mapped: FeeBillRecord[] = data.map((item: any) => {
          const ext = item.proposal_movement?._ext || {};
          return {
            id: String(item.id),
            feeBillNumber: item.fee_bill_number,
            feeBillDate: item.fee_bill_date,
            receiptDate: item.receipt_date || item.date_of_receipt_in_office || ext.receiptDate || '',
            circle: item.circle,
            division: item.division,
            lawyerName: item.lawyer_name,
            lawyerDesignation: item.lawyer_designation || '',
            caseDetails: item.case_details || '',
            casePertainsTo: item.case_pertains_to || '',
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
            paymentStatus: (item.payment_status === 'Not Settled' || !item.payment_status) ? 'Pending' : item.payment_status,
            settledAmount: Number(item.settled_amount) || 0,
            itCess: Number(item.it_cess) || 0,
            amountDeposited: Number(item.amount_deposited) || 0,
            utrRbiReference: item.utr_rbi_reference || '',
            paymentDate: item.payment_date || '',
            assistantSettledAmount: Number(item.assistant_settled_amount !== undefined ? item.assistant_settled_amount : ext.assistantSettledAmount) || 0,
            assistantItCess: Number(item.assistant_it_cess !== undefined ? item.assistant_it_cess : ext.assistantItCess) || 0,
            assistantAmountDeposited: Number(item.assistant_amount_deposited !== undefined ? item.assistant_amount_deposited : ext.assistantAmountDeposited) || 0,
            assistantUtrRbiReference: item.assistant_utr_rbi_reference || ext.assistantUtrRbiReference || '',
            assistantPaymentDate: item.assistant_payment_date || ext.assistantPaymentDate || '',
            assistantPaymentStatus: item.assistant_payment_status || ext.assistantPaymentStatus || '',
            goStatus: item.go_status || '',
            statusOfObtainingGo: item.status_of_obtaining_go || '',
            goNumber: item.go_number || '',
            goDate: item.go_date || '',
            goReferenceLetterNo: item.go_reference_letter_no || ext.goReferenceLetterNo || '',
            goReferenceLetterDate: item.go_reference_letter_date || ext.goReferenceLetterDate || '',
            statusOfPaymentProposal: item.status_of_payment_proposal || '',
            proceedingLetterNo: item.proceeding_letter_no || '',
            proceedingLetterDate: item.proceeding_letter_date || '',
            sanctionedAmount: Number(item.sanctioned_amount) || 0,
            isSanctioned: item.is_sanctioned || '',
            paymentSanction: item.payment_sanction || '',
            proposalSubmitted: item.proposal_submitted || '',
            proposalMovement: item.proposal_movement || { deToCe: false, seToCe: false, seToRorMorth: false },
            directMovement: item.direct_movement || { deToCe: false, seToCe: false },
            letterNumber: item.letter_number || '',
            letterDate: item.letter_date || '',
            currentPendency: item.current_pendency || '',
            remarks: item.remarks || '',
            delete_status: item.delete_status || 'ACTIVE',
            isDeleted: item.delete_status === 'DELETED' || item.delete_status === 'SOFT_DELETE',
            createdBy: item.created_by || 'System Admin',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
        });

        // Apply filters
        mapped = mapped.filter((b) => {
          if (!includeDeleted && b.isDeleted) return false;
          if (circle && b.circle !== circle) return false;
          if (division && b.division !== division) return false;
          if (paymentStatus && paymentStatus !== 'ALL' && b.paymentStatus !== paymentStatus) return false;
          if (pendencyStatus && pendencyStatus !== 'ALL' && b.currentPendency !== pendencyStatus) return false;
          if (search) {
            const str = [b.feeBillNumber, b.lawyerName, b.caseDetails, b.division, b.circle].filter(Boolean).join(' ').toLowerCase();
            if (!str.includes(search)) return false;
          }
          return true;
        });

        // Enforce Row-Level PBAC Data Siloing if user lacks statewide view permission
        const session = await getSession();
        if (session && !session.isSuperAdmin) {
          const canViewStatewide =
            session.permissions.includes('jurisdiction:view_statewide') ||
            session.permissions.includes('*:*') ||
            session.jurisdictionScope === 'STATEWIDE';

          if (!canViewStatewide) {
            if (session.jurisdictionScope === 'DIVISION' && session.division) {
              mapped = mapped.filter((b) => b.division.toLowerCase() === session.division?.toLowerCase());
            } else if (session.jurisdictionScope === 'CIRCLE' && session.circle) {
              mapped = mapped.filter((b) => b.circle.toLowerCase() === session.circle?.toLowerCase());
            }
          }
        }

        return NextResponse.json({ success: true, feeBills: mapped, totalCount: mapped.length });
      }
    }

    // Return fallback store if DB is unreachable
    let filtered = fallbackStore.filter((b) => {
      if (!includeDeleted && b.isDeleted) return false;
      if (circle && b.circle !== circle) return false;
      if (division && b.division !== division) return false;
      if (paymentStatus && paymentStatus !== 'ALL' && b.paymentStatus !== paymentStatus) return false;
      if (pendencyStatus && pendencyStatus !== 'ALL' && b.currentPendency !== pendencyStatus) return false;
      if (search) {
        const str = [b.feeBillNumber, b.lawyerName, b.caseDetails, b.division, b.circle].filter(Boolean).join(' ').toLowerCase();
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

    if (!body.feeBillNumber || !body.feeBillNumber.trim()) {
      return NextResponse.json(
        { success: false, message: 'Fee Bill Number is required.' },
        { status: 400 }
      );
    }

    const session = await getSession();
    const isRestore = Boolean(body.id && (body as any).action === 'restore');
    const isUpdatingRealId = Boolean(body.id && !String(body.id).startsWith('fb-'));
    const requiredPerm = isRestore ? 'fee_bills:restore' : isUpdatingRealId ? 'fee_bills:edit' : 'fee_bills:create';

    let authCheck = canPerformAction(session, requiredPerm, {
      circle: body.circle || null,
      division: body.division || null,
    });

    if (!authCheck.allowed && isRestore) {
      authCheck = canPerformAction(session, 'fee_bills:edit', {
        circle: body.circle || null,
        division: body.division || null,
      });
    }

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    const trimmedFeeBillNumber = body.feeBillNumber.trim();
    const derivedPendency = derivePendencyStage(body);
    const isDel = body.delete_status === 'DELETED' || body.delete_status === 'SOFT_DELETE';

    const record: FeeBillRecord = {
      ...body,
      caseDetails: (body.caseDetails || '').trim(),
      feeBillNumber: trimmedFeeBillNumber,
      id: body.id && String(body.id).startsWith('fb-') ? body.id : (body.id || `fb-${Date.now()}`),
      currentPendency: derivedPendency,
      delete_status: body.delete_status || 'ACTIVE',
      isDeleted: isDel,
      updatedAt: new Date().toISOString(),
    };

    let existingBill: any = null;

    if (supabase) {
      if (isUpdatingRealId) {
        const { data: oldB } = await supabase.from('fee_bills').select('*').eq('id', body.id).maybeSingle();
        existingBill = oldB;
      }

      // 1. Strict Duplicate Check: Block saving if fee_bill_number already exists on another record
      const { data: existingWithNumber } = await supabase
        .from('fee_bills')
        .select('id, fee_bill_number, delete_status')
        .eq('fee_bill_number', trimmedFeeBillNumber)
        .neq('delete_status', 'DELETED')
        .maybeSingle();

      if (existingWithNumber) {
        if (!isUpdatingRealId || String(existingWithNumber.id) !== String(body.id)) {
          return NextResponse.json(
            {
              success: false,
              message: `Fee Bill Number "${trimmedFeeBillNumber}" already exists in the system. Duplicate fee bill numbers are not permitted.`,
            },
            { status: 409 }
          );
        }
      }

      // Native Top-Level Column Payload
      const nativePayload: Record<string, unknown> = {
        fee_bill_number: record.feeBillNumber,
        fee_bill_date: record.feeBillDate || null,
        receipt_date: record.receiptDate || null,
        circle: record.circle,
        division: record.division,
        lawyer_name: record.lawyerName,
        lawyer_designation: record.lawyerDesignation,
        case_details: record.caseDetails || null,
        case_pertains_to: record.casePertainsTo || 'GOTN',
        appearance_amount: Number(record.appearanceAmount) || 0,
        appearance_date: record.appearanceDate || null,
        conference_amount: Number(record.conferenceAmount) || 0,
        conference_date: record.conferenceDate || null,
        verifying_amount: Number(record.verifyingAmount) || 0,
        verifying_date: record.verifyingDate || null,
        assistance_amount: Number(record.assistanceAmount) || 0,
        assistance_date: record.assistanceDate || null,
        total_fee_amount: Number(record.totalFeeAmount) || 0,
        assistant_name: record.assistantName || null,
        assistant_designation: record.assistantDesignation || null,
        payment_status: record.paymentStatus || 'Pending',
        settled_amount: Number(record.settledAmount) || 0,
        it_cess: Number(record.itCess) || 0,
        amount_deposited: Number(record.amountDeposited) || 0,
        utr_rbi_reference: record.utrRbiReference || null,
        payment_date: record.paymentDate || null,
        assistant_settled_amount: Number(record.assistantSettledAmount) || 0,
        assistant_it_cess: Number(record.assistantItCess) || 0,
        assistant_amount_deposited: Number(record.assistantAmountDeposited) || 0,
        assistant_utr_rbi_reference: record.assistantUtrRbiReference || null,
        assistant_payment_date: record.assistantPaymentDate || null,
        assistant_payment_status: record.assistantPaymentStatus || null,
        go_status: record.goStatus || 'Not Required',
        status_of_obtaining_go: record.statusOfObtainingGo || null,
        go_number: record.goNumber || null,
        go_date: record.goDate || null,
        go_reference_letter_no: record.goReferenceLetterNo || null,
        go_reference_letter_date: record.goReferenceLetterDate || null,
        status_of_payment_proposal: record.statusOfPaymentProposal || null,
        proceeding_letter_no: record.proceedingLetterNo || null,
        proceeding_letter_date: record.proceedingLetterDate || null,
        sanctioned_amount: Number(record.sanctionedAmount) || 0,
        is_sanctioned: record.isSanctioned || 'No',
        payment_sanction: record.paymentSanction || 'No',
        proposal_submitted: record.proposalSubmitted || 'No',
        proposal_movement: record.proposalMovement || {},
        direct_movement: record.directMovement || { deToCe: false, seToCe: false },
        letter_number: record.letterNumber || null,
        letter_date: record.letterDate || null,
        current_pendency: derivedPendency,
        remarks: record.remarks || null,
        delete_status: record.delete_status || 'ACTIVE',
        updated_at: new Date().toISOString(),
      };

      // Try inserting with native columns first
      if (isUpdatingRealId) {
        let { error: updateErr } = await supabase.from('fee_bills').update(nativePayload).eq('id', body.id);
        if (updateErr && updateErr.code === 'PGRST204') {
          const fallbackPayload = { ...nativePayload };
          delete fallbackPayload.receipt_date;
          delete fallbackPayload.assistant_settled_amount;
          delete fallbackPayload.assistant_it_cess;
          delete fallbackPayload.assistant_amount_deposited;
          delete fallbackPayload.assistant_utr_rbi_reference;
          delete fallbackPayload.assistant_payment_date;
          delete fallbackPayload.assistant_payment_status;
          delete fallbackPayload.go_reference_letter_no;
          delete fallbackPayload.go_reference_letter_date;
          fallbackPayload.proposal_movement = {
            ...(typeof record.proposalMovement === 'object' ? record.proposalMovement : {}),
            _ext: {
              receiptDate: record.receiptDate || null,
              assistantSettledAmount: record.assistantSettledAmount || 0,
              assistantItCess: record.assistantItCess || 0,
              assistantAmountDeposited: record.assistantAmountDeposited || 0,
              assistantUtrRbiReference: record.assistantUtrRbiReference || null,
              assistantPaymentDate: record.assistantPaymentDate || null,
              assistantPaymentStatus: record.assistantPaymentStatus || null,
              goReferenceLetterNo: record.goReferenceLetterNo || null,
              goReferenceLetterDate: record.goReferenceLetterDate || null,
            },
          };
          const { error: retryErr } = await supabase.from('fee_bills').update(fallbackPayload).eq('id', body.id);
          updateErr = retryErr;
        }

        if (updateErr) {
          console.error('Supabase fee_bills update error:', updateErr);
          return NextResponse.json({ success: false, message: updateErr.message }, { status: 500 });
        }

        // Log Tamper-Proof Audit for update
        if (session) {
          const isRestored =
            (existingBill?.delete_status === 'DELETED' || existingBill?.delete_status === 'SOFT_DELETE') &&
            nativePayload.delete_status === 'ACTIVE';
          await logAudit({
            actor: session,
            module: 'FEE_BILLS',
            action: isRestored ? 'RESTORE' : 'UPDATE',
            entityId: String(body.id),
            entityTitle: `Fee Voucher: ${record.feeBillNumber} (${record.lawyerName || 'Advocate'})`,
            changesSummary: isRestored
              ? `Restored archived fee voucher ${record.feeBillNumber} for ${record.lawyerName || 'Advocate'}`
              : `Updated advocate fee voucher for ${record.lawyerName} in ${record.division}`,
            oldState: existingBill,
            newState: nativePayload,
          });
        }
      } else {
        let { data: inserted, error: insertErr } = await supabase
          .from('fee_bills')
          .insert([{ ...nativePayload, created_at: new Date().toISOString() }])
          .select('id')
          .single();

        if (insertErr && insertErr.code === 'PGRST204') {
          const fallbackPayload = { ...nativePayload };
          delete fallbackPayload.receipt_date;
          delete fallbackPayload.assistant_settled_amount;
          delete fallbackPayload.assistant_it_cess;
          delete fallbackPayload.assistant_amount_deposited;
          delete fallbackPayload.assistant_utr_rbi_reference;
          delete fallbackPayload.assistant_payment_date;
          delete fallbackPayload.assistant_payment_status;
          delete fallbackPayload.go_reference_letter_no;
          delete fallbackPayload.go_reference_letter_date;
          fallbackPayload.proposal_movement = {
            ...(typeof record.proposalMovement === 'object' ? record.proposalMovement : {}),
            _ext: {
              receiptDate: record.receiptDate || null,
              assistantSettledAmount: record.assistantSettledAmount || 0,
              assistantItCess: record.assistantItCess || 0,
              assistantAmountDeposited: record.assistantAmountDeposited || 0,
              assistantUtrRbiReference: record.assistantUtrRbiReference || null,
              assistantPaymentDate: record.assistantPaymentDate || null,
              assistantPaymentStatus: record.assistantPaymentStatus || null,
              goReferenceLetterNo: record.goReferenceLetterNo || null,
              goReferenceLetterDate: record.goReferenceLetterDate || null,
            },
          };

          const retryResult = await supabase
            .from('fee_bills')
            .insert([{ ...fallbackPayload, created_at: new Date().toISOString() }])
            .select('id')
            .single();

          inserted = retryResult.data;
          insertErr = retryResult.error;
        }

        if (insertErr) {
          console.error('Supabase fee_bills insert error:', insertErr);
          return NextResponse.json({ success: false, message: insertErr.message }, { status: 500 });
        }
        if (inserted?.id) record.id = String(inserted.id);

        // Log Tamper-Proof Audit for create
        if (session) {
          await logAudit({
            actor: session,
            module: 'FEE_BILLS',
            action: 'CREATE',
            entityId: String(record.id),
            entityTitle: `Fee Voucher: ${record.feeBillNumber} (${record.lawyerName || 'Advocate'})`,
            changesSummary: `Created new advocate fee voucher for ${record.lawyerName} in ${record.division}`,
            newState: nativePayload,
          });
        }
      }
    }

    // Sync fallback store
    const idx = fallbackStore.findIndex((b) => String(b.id) === String(record.id));
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

    const session = await getSession();

    if (supabase) {
      const { data: existingBill } = await supabase.from('fee_bills').select('*').eq('id', id).maybeSingle();

      if (existingBill) {
        const authCheck = canPerformAction(session, 'fee_bills:delete', {
          circle: existingBill.circle,
          division: existingBill.division,
        });

        if (!authCheck.allowed) {
          return NextResponse.json(
            { success: false, message: authCheck.reason || 'Unauthorized operation.' },
            { status: 403 }
          );
        }

        await supabase
          .from('fee_bills')
          .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
          .eq('id', id);

        // Log Tamper-Proof Audit for delete
        if (session) {
          await logAudit({
            actor: session,
            module: 'FEE_BILLS',
            action: 'DELETE',
            entityId: id,
            entityTitle: `Fee Voucher: ${existingBill.fee_bill_number || id}`,
            changesSummary: `Soft-deleted advocate fee voucher for ${existingBill.lawyer_name}`,
            oldState: existingBill,
          });
        }
      }
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

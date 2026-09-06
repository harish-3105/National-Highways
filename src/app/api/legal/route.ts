import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LegalCaseData } from '@/types/legal';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';
import { logAudit } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

function mapDbRowToLegalCase(item: Record<string, unknown>): LegalCaseData {
  const getStr = (val: unknown, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    return String(val);
  };

  const rawAppealInfo = (item.appeal_info as Record<string, unknown>) || undefined;
  const postHearing = (item.post_hearing_details as Record<string, unknown>) || undefined;
  const caDetails = (item.counter_affidavit_details as Record<string, unknown>) || undefined;

  const appellateCourt = getStr(item.appellate_court) || (rawAppealInfo ? getStr(rawAppealInfo.appellateCourt) : '');
  const appealCaseDetailsStr = getStr(item.appeal_case_details) || (rawAppealInfo ? getStr(rawAppealInfo.appealCaseDetails) : '');
  const appealFilingDate = getStr(item.appeal_filing_date) || (rawAppealInfo ? getStr(rawAppealInfo.appealFilingDate) : '');
  const limitationDueDate = getStr(item.limitation_due_date) || (rawAppealInfo ? getStr(rawAppealInfo.limitationDueDate) : '');
  const delayInFilingAppeal = getStr(item.delay_in_filing_appeal, rawAppealInfo ? getStr(rawAppealInfo.delayInFilingAppeal, 'No') : 'No');
  const delayPeriodDays = item.delay_period_days !== null && item.delay_period_days !== undefined
    ? Number(item.delay_period_days)
    : rawAppealInfo && rawAppealInfo.delayPeriodDays !== undefined && rawAppealInfo.delayPeriodDays !== null
    ? Number(rawAppealInfo.delayPeriodDays)
    : 0;
  const condonationOfDelay = getStr(item.condonation_of_delay) || (rawAppealInfo ? getStr(rawAppealInfo.condonationOfDelay) : '');

  const isAppealClassification = getStr(item.case_classification) === 'Appeal Case' || Boolean(rawAppealInfo);

  const appealInfoObj: LegalCaseData['appealInfo'] = isAppealClassification
    ? {
        appellateCourt,
        appealCaseDetails: appealCaseDetailsStr,
        appealFilingDate,
        limitationDueDate,
        delayInFilingAppeal: delayInFilingAppeal || 'No',
        delayPeriodDays,
        condonationOfDelay: condonationOfDelay || '',
      }
    : undefined;

  const caseDetailsStr = getStr(item.case_details) || getStr(item.case_number) || '';
  const baseCaseDetailsStr = getStr(item.base_case_details) || getStr(item.base_case_number) || '';

  return {
    id: String(item.id || ''),
    caseClassification: (isAppealClassification ? 'Appeal Case' : 'Normal Case') as LegalCaseData['caseClassification'],
    appellateCourt: appellateCourt || undefined,
    appealFilingDate: appealFilingDate || undefined,
    limitationDueDate: limitationDueDate || undefined,
    delayInFilingAppeal: delayInFilingAppeal || 'No',
    delayPeriodDays,
    condonationOfDelay: condonationOfDelay || undefined,
    appealInfo: appealInfoObj,
    caseDetails: caseDetailsStr,
    appealCaseDetails: appealCaseDetailsStr,
    baseCaseDetails: baseCaseDetailsStr,
    circle: getStr(item.circle),
    division: getStr(item.division),
    category: getStr(item.category),
    nameOfCourt: getStr(item.name_of_court),
    petitionerNames: getStr(item.petitioner_names || item.petitioner_name || item.name_of_petitioner),
    respondentNames: getStr(item.respondent_names || item.name_of_respondent || item.respondent_name),
    casePertainsTo: getStr(item.case_pertains_to),
    natureOfCase: getStr(item.nature_of_case),
    specifyNatureOfCase: getStr(item.specify_nature_of_case),
    specifyNameOfCourt: getStr(item.specify_name_of_court),
    briefOfPrayer: getStr(item.brief_of_prayer),
    baseCircle: getStr(item.base_circle),
    baseDivision: getStr(item.base_division),
    baseCourtName: getStr(item.base_court_name),
    specifyBaseCourtName: getStr(item.specify_base_court_name),
    specifyAppellateCourt: getStr(item.specify_appellate_court),
    basePetitionerNames: getStr(item.base_petitioner_names),
    baseRespondentNames: getStr(item.base_respondent_names),
    baseCasePertainsTo: getStr(item.base_case_pertains_to),
    baseNatureOfCase: getStr(item.base_nature_of_case),
    specifyBaseNatureOfCase: getStr(item.specify_base_nature_of_case),
    baseBriefOfPrayer: getStr(item.base_brief_of_prayer),
    baseFinalOrder: getStr(item.base_final_order),
    baseFinalOrderDate: getStr(item.base_final_order_date),
    linkedBaseCaseId: getStr(item.linked_base_case_id),
    financialImplication: getStr(item.financial_implication),
    presentStage: getStr(item.present_stage || item.case_details_present_status),
    currentStatus: getStr(item.current_status || item.status),
    caRequired: getStr(item.ca_required),
    caFiled: getStr(item.ca_filed || item.counter_affidavit_filed),
    caDueDate: getStr(item.ca_due_date),
    caFiledDate: getStr(item.ca_filed_date || caDetails?.dateOfFiling),
    lastHearingDate: getStr(item.last_hearing_date || caDetails?.lastHearingDate),
    nextHearingDate: getStr(item.next_hearing_date || caDetails?.nextHearingDate),
    nextListingPurpose: getStr(item.next_listing_purpose),
    interimOrderDirection: getStr(item.interim_order_direction || postHearing?.interimOrFinalOrder),
    interimOrderDate: getStr(item.interim_order_date || postHearing?.orderDate),
    latestOrderFinalOrder: getStr(item.latest_order_final_order),
    latestOrderDate: getStr(item.latest_order_date),
    complianceRequired: getStr(item.compliance_required),
    complianceAction: getStr(item.compliance_action),
    compliancePeriod: getStr(item.compliance_period || postHearing?.compliancePeriod),
    complianceEndDate: getStr(item.compliance_end_date || postHearing?.endDateForCompliance),
    complianceCompletionDate: getStr(item.compliance_completion_date),
    actionTakenDetailsForCompliance: getStr(item.action_taken_details_for_compliance || postHearing?.statusOfActionTakenForCompliance),
    complianceStatus: getStr(item.compliance_status),
    remarks: getStr(item.remarks),
    finalResult: getStr(item.final_result),
    finalResultOrder: getStr(item.final_result_order),
    finalOrderDate: getStr(item.final_order_date),
    adverseToDepartment: getStr(item.adverse_to_department),
    gpOpinion: getStr(item.gp_opinion),
    appealFiled: getStr(item.appeal_filed),
    appealFiledDate: getStr(item.appeal_filed_date),
    linkedAppealCaseId: getStr(item.linked_appeal_case_id),
    finalOrderRemarks: getStr(item.final_order_remarks),
    delete_status: getStr(item.delete_status, 'ACTIVE'),
    isDeleted: item.delete_status === 'DELETED' || item.is_deleted === true,
    createdBy: getStr(item.created_by),
    createdAt: getStr(item.created_at, new Date().toISOString()),
    updatedBy: getStr(item.updated_by),
    updatedAt: getStr(item.updated_at, new Date().toISOString()),
  };
}

function parseUuidOrNull(val: unknown): string | null {
  if (typeof val !== 'string' || !val) return null;
  const trimmed = val.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circle = searchParams.get('circle');
    const division = searchParams.get('division');
    const classification = searchParams.get('classification');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const rawIncludeDeleted = searchParams.get('includeDeleted') === 'true';

    const session = await getSession();
    const authCheck = canPerformAction(session, 'legal:view');
    if (!authCheck.allowed) {
      return NextResponse.json({ success: false, error: authCheck.reason || 'Unauthorized' }, { status: 403 });
    }

    const includeDeleted = rawIncludeDeleted && canPerformAction(session, 'system:view_archived').allowed;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable', cases: [] }, { status: 500 });
    }

    let query = supabase
      .from('legal_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.neq('delete_status', 'DELETED');
    }

    if (circle && circle !== 'ALL') query = query.eq('circle', circle);
    if (division && division !== 'ALL') query = query.eq('division', division);
    if (classification && classification !== 'ALL') query = query.eq('case_classification', classification);
    if (status && status !== 'ALL') query = query.eq('current_status', status);

    if (search) {
      const cleanSearch = search.replace(/[,()"]/g, '').trim();
      if (cleanSearch) {
        query = query.or(
          `case_details.ilike.%${cleanSearch}%,case_number.ilike.%${cleanSearch}%,appeal_case_details.ilike.%${cleanSearch}%,base_case_details.ilike.%${cleanSearch}%,name_of_court.ilike.%${cleanSearch}%,petitioner_names.ilike.%${cleanSearch}%,respondent_names.ilike.%${cleanSearch}%,brief_of_prayer.ilike.%${cleanSearch}%`
        );
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('legal_cases DB read error:', error);
      return NextResponse.json({ success: false, error: error.message, cases: [] }, { status: 500 });
    }

    const casesList = (data || []).map(mapDbRowToLegalCase);
    return NextResponse.json({ success: true, cases: casesList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, cases: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: LegalCaseData = await req.json();
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const session = await getSession();

    const isNew = !body.id || body.id.startsWith('lc-');
    const requiredPerm = isNew ? 'legal:create' : 'legal:edit';

    const authCheck = canPerformAction(session, requiredPerm, {
      circle: body.circle || null,
      division: body.division || null,
    });

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    let existingRecord: Record<string, unknown> | null = null;

    if (!isNew && body.id) {
      const { data: oldRec, error: fetchOldErr } = await supabase.from('legal_cases').select('*').eq('id', body.id).maybeSingle();
      if (fetchOldErr) {
        return NextResponse.json({ success: false, error: fetchOldErr.message }, { status: 500 });
      }
      if (!oldRec) {
        return NextResponse.json({ success: false, error: 'Legal case not found' }, { status: 404 });
      }
      existingRecord = oldRec;
    }

    const computedCaseDetails =
      body.caseDetails ||
      (body.caseClassification === 'Appeal Case'
        ? body.appealCaseDetails || body.appealInfo?.appealCaseDetails
        : '') ||
      null;

    const computedAppealCaseDetails =
      body.appealCaseDetails ||
      body.appealInfo?.appealCaseDetails ||
      null;

    const computedAppellateCourt =
      body.appellateCourt ||
      body.appealInfo?.appellateCourt ||
      (body.caseClassification === 'Appeal Case' ? body.nameOfCourt : null) ||
      null;

    const computedAppealFilingDate =
      body.appealFilingDate ||
      body.appealInfo?.appealFilingDate ||
      null;

    const computedLimitationDueDate =
      body.limitationDueDate ||
      body.appealInfo?.limitationDueDate ||
      null;

    const computedDelayInFilingAppeal =
      body.delayInFilingAppeal ||
      body.appealInfo?.delayInFilingAppeal ||
      'No';

    const computedDelayPeriodDays =
      body.delayPeriodDays !== undefined && body.delayPeriodDays !== null
        ? Number(body.delayPeriodDays)
        : body.appealInfo?.delayPeriodDays !== undefined && body.appealInfo?.delayPeriodDays !== null
        ? Number(body.appealInfo.delayPeriodDays)
        : 0;

    const computedCondonationOfDelay =
      body.condonationOfDelay ||
      body.appealInfo?.condonationOfDelay ||
      null;

    const computedBaseCaseDetails =
      body.baseCaseDetails ||
      null;

    const payload: Record<string, unknown> = {
      case_classification: body.caseClassification || 'Normal Case',
      case_details: computedCaseDetails,
      appeal_case_details: computedAppealCaseDetails,
      appellate_court: computedAppellateCourt,
      appeal_filing_date: computedAppealFilingDate,
      limitation_due_date: computedLimitationDueDate,
      delay_in_filing_appeal: computedDelayInFilingAppeal,
      delay_period_days: computedDelayPeriodDays,
      condonation_of_delay: computedCondonationOfDelay,
      base_case_details: computedBaseCaseDetails,
      circle: body.circle,
      division: body.division,
      category: body.category || '',
      name_of_court: body.nameOfCourt,
      specify_name_of_court: body.specifyNameOfCourt || null,
      petitioner_names: body.petitionerNames,
      respondent_names: body.respondentNames,
      case_pertains_to: body.casePertainsTo || 'GOTN',
      nature_of_case: body.natureOfCase,
      specify_nature_of_case: body.specifyNatureOfCase || null,
      brief_of_prayer: body.briefOfPrayer,
      base_circle: body.baseCircle || null,
      base_division: body.baseDivision || null,
      base_court_name: body.baseCourtName || null,
      specify_base_court_name: body.specifyBaseCourtName || null,
      specify_appellate_court: body.specifyAppellateCourt || null,
      base_petitioner_names: body.basePetitionerNames || null,
      base_respondent_names: body.baseRespondentNames || null,
      base_case_pertains_to: body.baseCasePertainsTo || null,
      base_nature_of_case: body.baseNatureOfCase || null,
      specify_base_nature_of_case: body.specifyBaseNatureOfCase || null,
      base_brief_of_prayer: body.baseBriefOfPrayer || null,
      base_final_order: body.baseFinalOrder || null,
      base_final_order_date: body.baseFinalOrderDate || null,
      linked_base_case_id: parseUuidOrNull(body.linkedBaseCaseId),
      financial_implication: body.financialImplication ? String(body.financialImplication) : null,
      present_stage: body.presentStage || 'Hearing',
      current_status: body.currentStatus || 'Pending',
      ca_required: body.caRequired || 'Yes',
      ca_filed: body.caFiled || 'No',
      ca_due_date: body.caDueDate || null,
      ca_filed_date: body.caFiledDate || null,
      last_hearing_date: body.lastHearingDate || null,
      next_hearing_date: body.nextHearingDate || null,
      next_listing_purpose: body.nextListingPurpose || null,
      interim_order_direction: body.interimOrderDirection || null,
      interim_order_date: body.interimOrderDate || null,
      latest_order_final_order: body.latestOrderFinalOrder || null,
      latest_order_date: body.latestOrderDate || null,
      compliance_required: body.complianceRequired || 'No',
      compliance_action: body.complianceAction || null,
      compliance_period: body.compliancePeriod || null,
      compliance_end_date: body.complianceEndDate || null,
      compliance_completion_date: body.complianceCompletionDate || null,
      action_taken_details_for_compliance: body.actionTakenDetailsForCompliance || null,
      compliance_status: body.complianceStatus || 'Pending',
      remarks: body.remarks || null,
      final_result: body.finalResult || 'No',
      final_result_order: body.finalResultOrder || null,
      final_order_date: body.finalOrderDate || null,
      adverse_to_department: body.adverseToDepartment || 'No',
      gp_opinion: body.gpOpinion || 'Pending',
      appeal_filed: body.appealFiled || 'No',
      appeal_filed_date: body.appealFiledDate || null,
      linked_appeal_case_id: parseUuidOrNull(body.linkedAppealCaseId),
      final_order_remarks: body.finalOrderRemarks || null,
      delete_status: body.delete_status || 'ACTIVE',
      updated_at: nowIso,
    };

    if (!isNew && body.id) {
      const { data, error } = await supabase
        .from('legal_cases')
        .update(payload)
        .eq('id', body.id)
        .select();

      if (error) {
        console.error('Supabase legal_cases update error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (data && data[0]) {
        const updatedCase = data[0];
        if (session) {
          await logAudit({
            actor: session,
            module: 'LEGAL',
            action: 'UPDATE',
            entityId: updatedCase.id,
            entityTitle: `Legal Case: ${updatedCase.case_details || updatedCase.id}`,
            changesSummary: `Updated legal case in ${updatedCase.division || 'division'}`,
            oldState: existingRecord,
            newState: updatedCase,
          });
        }

        return NextResponse.json({ success: true, case: mapDbRowToLegalCase(updatedCase), mode: 'UPDATE' });
      }
    } else {
      const { data, error } = await supabase
        .from('legal_cases')
        .insert([payload])
        .select();

      if (error) {
        console.error('Supabase legal_cases insert error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (data && data[0]) {
        const newCase = data[0];
        if (session) {
          await logAudit({
            actor: session,
            module: 'LEGAL',
            action: 'CREATE',
            entityId: newCase.id,
            entityTitle: `Legal Case: ${newCase.case_details || newCase.id}`,
            changesSummary: `Registered new legal case in ${newCase.division || 'division'}`,
            newState: newCase,
          });
        }

        return NextResponse.json({ success: true, case: mapDbRowToLegalCase(newCase), mode: 'CREATE' });
      }
    }

    return NextResponse.json({ success: false, error: 'Failed to persist legal case' }, { status: 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Case ID is required for deletion' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const session = await getSession();

    const { data: existingCase, error: fetchErr } = await supabase.from('legal_cases').select('*').eq('id', id).maybeSingle();
    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }
    if (!existingCase) {
      return NextResponse.json({ success: false, error: 'Legal case not found' }, { status: 404 });
    }

    const authCheck = canPerformAction(session, 'legal:delete', {
      circle: existingCase.circle,
      division: existingCase.division,
    });

    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    const isHardDelete = searchParams.get('hard') === 'true' || searchParams.get('permanent') === 'true';

    if (isHardDelete) {
      const hardAuth = canPerformAction(session, 'system:hard_delete');
      if (!hardAuth.allowed) {
        return NextResponse.json(
          { success: false, error: hardAuth.reason || 'Hard deletion unauthorized.' },
          { status: 403 }
        );
      }

      const { error: delErr } = await supabase.from('legal_cases').delete().eq('id', id);
      if (delErr) {
        return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
      }

      if (session) {
        await logAudit({
          actor: session,
          module: 'LEGAL',
          action: 'DELETE',
          entityId: id,
          entityTitle: `Legal Case: ${existingCase.case_details || id}`,
          changesSummary: `Permanently deleted legal case`,
          oldState: existingCase,
        });
      }

      return NextResponse.json({ success: true, message: 'Case permanently deleted' });
    } else {
      const { error: softErr } = await supabase
        .from('legal_cases')
        .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (softErr) {
        return NextResponse.json({ success: false, error: softErr.message }, { status: 500 });
      }

      if (session) {
        await logAudit({
          actor: session,
          module: 'LEGAL',
          action: 'DELETE',
          entityId: id,
          entityTitle: `Legal Case: ${existingCase.case_details || id}`,
          changesSummary: `Soft-deleted legal case from active register`,
          oldState: existingCase,
        });
      }

      return NextResponse.json({ success: true, message: 'Case marked as deleted' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const session = await getSession();
    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== 'restore') {
      return NextResponse.json({ success: false, error: 'Invalid restore request' }, { status: 400 });
    }

    const { data: existingCase, error: fetchErr } = await supabase.from('legal_cases').select('*').eq('id', id).maybeSingle();
    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }
    if (!existingCase) {
      return NextResponse.json({ success: false, error: 'Legal case not found' }, { status: 404 });
    }

    const authCheck = canPerformAction(session, 'legal:restore', {
      circle: existingCase.circle,
      division: existingCase.division,
    });

    if (!authCheck.allowed) {
      const fallbackCheck = canPerformAction(session, 'legal:delete', {
        circle: existingCase.circle,
        division: existingCase.division,
      });
      if (!fallbackCheck.allowed) {
        return NextResponse.json(
          { success: false, error: authCheck.reason || 'Unauthorized operation.' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from('legal_cases')
      .update({ delete_status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (session) {
      await logAudit({
        actor: session,
        module: 'LEGAL',
        action: 'RESTORE',
        entityId: id,
        entityTitle: `Legal Case: ${existingCase.case_details || id}`,
        changesSummary: `Restored archived legal case back to active register`,
        oldState: existingCase,
      });
    }

    return NextResponse.json({ success: true, message: 'Case restored successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

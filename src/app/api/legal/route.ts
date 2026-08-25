import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LegalCaseData } from '@/types/legal';

export const dynamic = 'force-dynamic';

// In-memory runtime cache for development
const inMemoryLegalStore: LegalCaseData[] = [];

function mapDbRowToLegalCase(item: Record<string, unknown>): LegalCaseData {
  const appealInfo = (item.appeal_info as LegalCaseData['appealInfo']) || undefined;
  const postHearing = (item.post_hearing_details as Record<string, unknown>) || undefined;
  const caDetails = (item.counter_affidavit_details as Record<string, unknown>) || undefined;

  const getStr = (val: unknown, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    return String(val);
  };

  return {
    id: item.id ? String(item.id) : `lc-${Date.now()}`,
    caseClassification: getStr(item.case_classification, item.appeal_info ? 'Appeal Case' : 'Normal Case') as LegalCaseData['caseClassification'],
    appealInfo,
    caseType: getStr(item.case_type),
    circle: getStr(item.circle),
    division: getStr(item.division),
    caseNumber: getStr(item.case_number),
    caseYear: getStr(item.case_year),
    category: getStr(item.category),
    nameOfCourt: getStr(item.name_of_court),
    petitionerNames: getStr(item.petitioner_names || item.petitioner_name || item.name_of_petitioner),
    respondentNames: getStr(item.respondent_names || item.name_of_respondent || item.respondent_name),
    casePertainsTo: getStr(item.case_pertains_to),
    natureOfCase: getStr(item.nature_of_case),
    specifyNatureOfCase: getStr(item.specify_nature_of_case),
    briefOfPrayer: getStr(item.brief_of_prayer),
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
    finalOrderComplianceActionGiven: getStr(item.final_order_compliance_action_given),
    finalOrderComplianceAction: getStr(item.final_order_compliance_action),
    finalOrderCompliancePeriod: getStr(item.final_order_compliance_period),
    finalOrderComplianceEndDate: getStr(item.final_order_compliance_end_date),
    finalOrderComplianceActionTaken: getStr(item.final_order_compliance_action_taken),
    finalOrderComplianceStatus: getStr(item.final_order_compliance_status),
    finalOrderRemarks: getStr(item.final_order_remarks),
    delete_status: getStr(item.delete_status, 'ACTIVE'),
    isDeleted: item.delete_status === 'DELETED' || item.is_deleted === true,
    createdBy: getStr(item.created_by),
    createdAt: getStr(item.created_at, new Date().toISOString()),
    updatedBy: getStr(item.updated_by),
    updatedAt: getStr(item.updated_at, new Date().toISOString()),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circle = searchParams.get('circle');
    const division = searchParams.get('division');
    const classification = searchParams.get('classification');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const supabase = await createClient();
    let casesList: LegalCaseData[] = [];

    if (supabase) {
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
            `case_number.ilike.%${cleanSearch}%,name_of_court.ilike.%${cleanSearch}%,petitioner_names.ilike.%${cleanSearch}%,respondent_names.ilike.%${cleanSearch}%,brief_of_prayer.ilike.%${cleanSearch}%`
          );
        }
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        casesList = data.map(mapDbRowToLegalCase);
      } else if (error) {
        console.warn('Notice: legal_cases DB read error:', error.message);
        casesList = [...inMemoryLegalStore];
      }
    } else {
      casesList = [...inMemoryLegalStore];
    }

    // Apply memory filters if fallback
    if (!supabase || casesList.length === 0) {
      if (inMemoryLegalStore.length > 0) {
        casesList = inMemoryLegalStore.filter((c) => {
          if (!includeDeleted && (c.delete_status === 'DELETED' || c.isDeleted)) return false;
          if (circle && circle !== 'ALL' && c.circle !== circle) return false;
          if (division && division !== 'ALL' && c.division !== division) return false;
          if (classification && classification !== 'ALL' && c.caseClassification !== classification) return false;
          if (status && status !== 'ALL' && c.currentStatus !== status) return false;
          if (search) {
            const term = search.toLowerCase();
            const hit =
              c.caseNumber.toLowerCase().includes(term) ||
              c.nameOfCourt.toLowerCase().includes(term) ||
              c.petitionerNames.toLowerCase().includes(term) ||
              c.respondentNames.toLowerCase().includes(term) ||
              c.briefOfPrayer.toLowerCase().includes(term);
            if (!hit) return false;
          }
          return true;
        });
      }
    }

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

    const caseId = body.id || `lc-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const normalizedCase: LegalCaseData = {
      ...body,
      id: caseId,
      delete_status: body.delete_status || 'ACTIVE',
      isDeleted: body.delete_status === 'DELETED',
      updatedAt: nowIso,
      createdAt: body.createdAt || nowIso,
    };

    if (supabase) {
      const payload: Record<string, unknown> = {
        case_classification: body.caseClassification || 'Normal Case',
        appeal_info: body.appealInfo || null,
        case_type: body.caseType,
        circle: body.circle,
        division: body.division,
        case_number: body.caseNumber,
        case_year: body.caseYear,
        category: body.category || '',
        name_of_court: body.nameOfCourt,
        petitioner_names: body.petitionerNames,
        respondent_names: body.respondentNames,
        case_pertains_to: body.casePertainsTo || 'GOTN',
        nature_of_case: body.natureOfCase,
        specify_nature_of_case: body.specifyNatureOfCase || null,
        brief_of_prayer: body.briefOfPrayer,
        financial_implication: body.financialImplication ? String(body.financialImplication) : null,
        present_stage: body.presentStage,
        current_status: body.currentStatus,
        ca_required: body.caRequired,
        ca_filed: body.caFiled,
        ca_due_date: body.caDueDate || null,
        ca_filed_date: body.caFiledDate || null,
        last_hearing_date: body.lastHearingDate || null,
        next_hearing_date: body.nextHearingDate || null,
        next_listing_purpose: body.nextListingPurpose || null,
        interim_order_direction: body.interimOrderDirection || null,
        interim_order_date: body.interimOrderDate || null,
        latest_order_final_order: body.latestOrderFinalOrder || null,
        latest_order_date: body.latestOrderDate || null,
        compliance_required: body.complianceRequired,
        compliance_action: body.complianceAction || null,
        compliance_period: body.compliancePeriod || null,
        compliance_end_date: body.complianceEndDate || null,
        action_taken_details_for_compliance: body.actionTakenDetailsForCompliance || null,
        compliance_status: body.complianceStatus || 'Pending',
        remarks: body.remarks || null,
        final_result: body.finalResult,
        final_result_order: body.finalResultOrder || null,
        final_order_date: body.finalOrderDate || null,
        adverse_to_department: body.adverseToDepartment,
        gp_opinion: body.gpOpinion || null,
        appeal_filed: body.appealFiled || null,
        appeal_filed_date: body.appealFiledDate || null,
        linked_appeal_case_id: body.linkedAppealCaseId || null,
        final_order_compliance_action_given: body.finalOrderComplianceActionGiven || null,
        final_order_compliance_action: body.finalOrderComplianceAction || null,
        final_order_compliance_period: body.finalOrderCompliancePeriod || null,
        final_order_compliance_end_date: body.finalOrderComplianceEndDate || null,
        final_order_compliance_action_taken: body.finalOrderComplianceActionTaken || null,
        final_order_compliance_status: body.finalOrderComplianceStatus || null,
        final_order_remarks: body.finalOrderRemarks || null,
        delete_status: body.delete_status || 'ACTIVE',
        updated_at: nowIso,
      };

      if (body.id && !body.id.startsWith('lc-')) {
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
          return NextResponse.json({ success: true, case: mapDbRowToLegalCase(data[0]), mode: 'UPDATE' });
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
          return NextResponse.json({ success: true, case: mapDbRowToLegalCase(data[0]), mode: 'CREATE' });
        }
      }
    }

    // Update in-memory fallback
    const idx = inMemoryLegalStore.findIndex((c) => c.id === caseId);
    if (idx >= 0) {
      inMemoryLegalStore[idx] = normalizedCase;
    } else {
      inMemoryLegalStore.unshift(normalizedCase);
    }

    return NextResponse.json({ success: true, case: normalizedCase });
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
    if (supabase && !id.startsWith('lc-')) {
      const { error } = await supabase
        .from('legal_cases')
        .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    const idx = inMemoryLegalStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      inMemoryLegalStore[idx].delete_status = 'DELETED';
      inMemoryLegalStore[idx].isDeleted = true;
    }

    return NextResponse.json({ success: true, message: 'Case marked as deleted' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

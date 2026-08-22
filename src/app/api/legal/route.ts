import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LegalCaseData } from '@/types/legal';

export const dynamic = 'force-dynamic';

// In-memory fallback store for dev resiliency
let inMemoryLegalStore: LegalCaseData[] = [];

function mapDbRowToLegalCase(item: any): LegalCaseData {
  return {
    id: item.id ? String(item.id) : `lc-${Date.now()}`,
    caseClassification: item.case_classification || (item.appeal_info ? 'Appeal Case' : 'Normal Case'),
    appealInfo: item.appeal_info || undefined,
    caseType: item.case_type || 'Writ Petition (WP)',
    circle: item.circle || 'Chennai',
    division: item.division || 'Chennai City Division',
    caseNumber: item.case_number || '',
    caseYear: item.case_year || String(new Date().getFullYear()),
    category: item.category || 'Filed Against Department',
    nameOfCourt: item.name_of_court || 'High Court of Madras',
    petitionerNames: item.petitioner_names || item.petitioner_name || item.name_of_petitioner || '',
    respondentNames: item.respondent_names || item.name_of_respondent || item.respondent_name || 'Highways Department',
    casePertainsTo: item.case_pertains_to || 'GOTN',
    natureOfCase: item.nature_of_case || 'Work',
    specifyNatureOfCase: item.specify_nature_of_case || '',
    briefOfPrayer: item.brief_of_prayer || '',
    financialImplication: item.financial_implication || '',
    presentStage: item.present_stage || item.case_details_present_status || 'Notice / Admission',
    currentStatus: item.current_status || item.status || 'Pending',
    caRequired: item.ca_required || 'Yes',
    caFiled: item.ca_filed || item.counter_affidavit_filed || 'No',
    caDueDate: item.ca_due_date || '',
    caFiledDate: item.ca_filed_date || item.counter_affidavit_details?.dateOfFiling || '',
    lastHearingDate: item.last_hearing_date || item.counter_affidavit_details?.lastHearingDate || '',
    nextHearingDate: item.next_hearing_date || item.counter_affidavit_details?.nextHearingDate || '',
    nextListingPurpose: item.next_listing_purpose || '',
    interimOrderDirection: item.interim_order_direction || item.post_hearing_details?.interimOrFinalOrder || '',
    interimOrderDate: item.interim_order_date || item.post_hearing_details?.orderDate || '',
    latestOrderFinalOrder: item.latest_order_final_order || '',
    latestOrderDate: item.latest_order_date || '',
    complianceRequired: item.compliance_required || 'No',
    complianceAction: item.compliance_action || '',
    compliancePeriod: item.compliance_period || item.post_hearing_details?.compliancePeriod || '',
    complianceEndDate: item.compliance_end_date || item.post_hearing_details?.endDateForCompliance || '',
    actionTakenDetailsForCompliance: item.action_taken_details_for_compliance || item.post_hearing_details?.statusOfActionTakenForCompliance || '',
    complianceStatus: item.compliance_status || 'Pending',
    remarks: item.remarks || '',
    finalResult: item.final_result || 'No',
    finalResultOrder: item.final_result_order || '',
    finalOrderDate: item.final_order_date || '',
    adverseToDepartment: item.adverse_to_department || 'No',
    gpOpinion: item.gp_opinion || 'Pending',
    appealFiled: item.appeal_filed || 'No',
    appealFiledDate: item.appeal_filed_date || '',
    linkedAppealCaseId: item.linked_appeal_case_id || '',
    finalOrderComplianceActionGiven: item.final_order_compliance_action_given || '',
    finalOrderComplianceAction: item.final_order_compliance_action || 'No',
    finalOrderCompliancePeriod: item.final_order_compliance_period || '',
    finalOrderComplianceEndDate: item.final_order_compliance_end_date || '',
    finalOrderComplianceActionTaken: item.final_order_compliance_action_taken || '',
    finalOrderComplianceStatus: item.final_order_compliance_status || 'Pending',
    finalOrderRemarks: item.final_order_remarks || '',
    delete_status: item.delete_status || 'ACTIVE',
    isDeleted: item.delete_status === 'DELETED' || item.is_deleted === true,
    createdBy: item.created_by || '',
    createdAt: item.created_at || new Date().toISOString(),
    updatedBy: item.updated_by || '',
    updatedAt: item.updated_at || new Date().toISOString(),
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
        console.warn('Notice: Falling back to inMemory store for legal cases:', error.message);
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
        category: body.category,
        name_of_court: body.nameOfCourt,
        petitioner_names: body.petitionerNames,
        respondent_names: body.respondentNames,
        case_pertains_to: body.casePertainsTo,
        nature_of_case: body.natureOfCase,
        specify_nature_of_case: body.specifyNatureOfCase || null,
        brief_of_prayer: body.briefOfPrayer,
        financial_implication: body.financialImplication || null,
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
        gp_opinion: body.gpOpinion,
        appeal_filed: body.appealFiled,
        appeal_filed_date: body.appealFiledDate || null,
        linked_appeal_case_id: body.linkedAppealCaseId || null,
        final_order_compliance_action_given: body.finalOrderComplianceActionGiven || null,
        final_order_compliance_action: body.finalOrderComplianceAction || 'No',
        final_order_compliance_period: body.finalOrderCompliancePeriod || null,
        final_order_compliance_end_date: body.finalOrderComplianceEndDate || null,
        final_order_compliance_action_taken: body.finalOrderComplianceActionTaken || null,
        final_order_compliance_status: body.finalOrderComplianceStatus || 'Pending',
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

        if (!error && data && data[0]) {
          return NextResponse.json({ success: true, case: mapDbRowToLegalCase(data[0]), mode: 'UPDATE' });
        }
      } else {
        const { data, error } = await supabase
          .from('legal_cases')
          .insert([payload])
          .select();

        if (!error && data && data[0]) {
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
      await supabase
        .from('legal_cases')
        .update({ delete_status: 'DELETED', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // In-memory update
    const idx = inMemoryLegalStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      inMemoryLegalStore[idx].delete_status = 'DELETED';
      inMemoryLegalStore[idx].isDeleted = true;
    }

    return NextResponse.json({ success: true, message: `Case ${id} soft-deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

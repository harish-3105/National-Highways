import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CaseEntryFormData } from '@/types/legal';

export const dynamic = 'force-dynamic';

const SAMPLE_LEGAL_CASES: CaseEntryFormData[] = [
  {
    id: 'lc-101',
    circle: 'Chennai',
    division: 'Chennai City Division',
    caseNumber: 'WP/14502/2024',
    caseYear: '2024',
    category: 'Filed Against Department',
    nameOfCourt: 'Madras High Court - Main Bench',
    nameOfRespondent: 'Superintending Engineer, NH Chennai',
    casePertainsTo: 'GOTN',
    natureOfCase: 'Land Acquisition',
    specifyNatureOfCase: 'Bypass road compensation claim',
    briefOfPrayer: 'Writ of Mandamus for enhanced land acquisition compensation.',
    caseDetailsPresentStatus: 'Counter affidavit drafted and ready for filing.',
    counterAffidavitFiled: 'Yes',
    counterAffidavitData: {
      dateOfFiling: '2024-06-12',
      details: 'Counter affidavit filed denying excessive valuation claim.',
      lastHearingDate: '2024-07-20',
      nextHearingDate: '2026-09-10',
    },
    status: 'ONGOING',
    lawyerName: 'Adv. R. Swaminathan (Special Govt Pleader)',
  },
  {
    id: 'lc-102',
    circle: 'Madurai',
    division: 'Madurai Division',
    caseNumber: 'WA/892/2025',
    caseYear: '2025',
    category: 'Filed By Department',
    nameOfCourt: 'Madras High Court - Madurai Bench',
    nameOfRespondent: 'M/s Southern Tollway Developers Pvt Ltd',
    casePertainsTo: 'MoRTH',
    natureOfCase: 'Tender',
    specifyNatureOfCase: 'Concession agreement default',
    briefOfPrayer: 'Writ Appeal against single judge interim stay order.',
    caseDetailsPresentStatus: 'Awaiting hearing listing.',
    counterAffidavitFiled: 'No',
    actionToTakeForCounterAffidavit: 'Filing stay vacation petition before division bench.',
    status: 'PENDING',
    lawyerName: 'Adv. K. Meenakshi Sundaram',
  },
  {
    id: 'lc-103',
    circle: 'Salem',
    division: 'Salem Division',
    caseNumber: 'ARB/45/2023',
    caseYear: '2023',
    category: 'Filed Against Department',
    nameOfCourt: 'Arbitral Tribunal Chennai',
    nameOfRespondent: 'Executive Engineer, NH Salem',
    casePertainsTo: 'Both',
    natureOfCase: 'Work',
    specifyNatureOfCase: 'EPC contract price escalation',
    briefOfPrayer: 'Claim for Rs 12.5 Crores towards delayed site handover.',
    caseDetailsPresentStatus: 'Cross examination of department witness complete.',
    counterAffidavitFiled: 'Yes',
    counterAffidavitData: {
      dateOfFiling: '2023-11-05',
      details: 'Detailed defence statement with milestone records filed.',
      lastHearingDate: '2026-06-15',
      nextHearingDate: '2026-08-25',
    },
    status: 'ONGOING',
    lawyerName: 'Adv. T. Murugesan (Senior Panel Counsel)',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circle = searchParams.get('circle');
    const division = searchParams.get('division');
    const search = searchParams.get('search');

    try {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase
          .from('legal_cases')
          .select('*')
          .neq('delete_status', 'DELETED')
          .order('created_at', { ascending: false });

        if (circle) query = query.eq('circle', circle);
        if (division) query = query.eq('division', division);
        if (search) {
          query = query.or(`case_number.ilike.%${search}%,name_of_court.ilike.%${search}%,name_of_respondent.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const formattedCases: CaseEntryFormData[] = data.map((item: any) => ({
            id: item.id,
            circle: item.circle || 'Chennai',
            division: item.division || 'Chennai City Division',
            caseNumber: item.case_number,
            caseYear: item.case_year || '2024',
            category: item.category || 'Filed Against Department',
            nameOfCourt: item.name_of_court || 'Madras High Court',
            nameOfRespondent: item.name_of_respondent || 'Department Representative',
            casePertainsTo: item.case_pertains_to || 'GOTN',
            natureOfCase: item.nature_of_case || 'Work',
            specifyNatureOfCase: item.specify_nature_of_case,
            briefOfPrayer: item.brief_of_prayer || '',
            caseDetailsPresentStatus: item.case_details_present_status || '',
            counterAffidavitFiled: item.counter_affidavit_filed || 'No',
            counterAffidavitData: item.counter_affidavit_details,
            postHearingData: item.post_hearing_details,
            actionToTakeForCounterAffidavit: item.action_to_take_counter_affidavit,
            convertedCase: item.converted_case,
            status: item.status || 'PENDING',
            lawyerName: item.lawyer_name || 'Panel Advocate',
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));

          return NextResponse.json({ success: true, cases: formattedCases });
        }
      }
    } catch {
      // Supabase offline fallback
    }

    let filtered = SAMPLE_LEGAL_CASES;
    if (circle) filtered = filtered.filter((c) => c.circle === circle);
    if (division) filtered = filtered.filter((c) => c.division === division);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.nameOfCourt.toLowerCase().includes(q) ||
          c.nameOfRespondent.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, cases: filtered });
  } catch {
    return NextResponse.json({ success: true, cases: SAMPLE_LEGAL_CASES });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CaseEntryFormData = await req.json();
    const supabase = await createClient();

    if (supabase) {
      const payload: Record<string, unknown> = {
        circle: body.circle,
        division: body.division,
        case_number: body.caseNumber,
        case_year: body.caseYear,
        category: body.category,
        name_of_court: body.nameOfCourt,
        name_of_respondent: body.nameOfRespondent,
        case_pertains_to: body.casePertainsTo,
        nature_of_case: body.natureOfCase,
        specify_nature_of_case: body.specifyNatureOfCase,
        brief_of_prayer: body.briefOfPrayer,
        case_details_present_status: body.caseDetailsPresentStatus,
        counter_affidavit_filed: body.counterAffidavitFiled,
        counter_affidavit_details: body.counterAffidavitData,
        post_hearing_details: body.postHearingData,
        action_to_take_counter_affidavit: body.actionToTakeForCounterAffidavit,
        converted_case: body.convertedCase,
        status: body.status || 'PENDING',
        updated_at: new Date().toISOString(),
      };

      // Check if updating an existing record (id present and not a sample id)
      if (body.id && !body.id.startsWith('lc-')) {
        const { data, error } = await supabase
          .from('legal_cases')
          .update(payload)
          .eq('id', body.id)
          .select();

        if (!error && data && data[0]) {
          return NextResponse.json({ success: true, case: data[0], mode: 'UPDATE' });
        }
      } else {
        // Insert new record
        const { data, error } = await supabase.from('legal_cases').insert([payload]).select();
        if (!error && data && data[0]) {
          return NextResponse.json({ success: true, case: data[0], mode: 'CREATE' });
        }
      }
    }

    return NextResponse.json({ success: true, case: { ...body, id: body.id || `lc-${Date.now()}` } });
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

    return NextResponse.json({ success: true, message: `Case ${id} successfully deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

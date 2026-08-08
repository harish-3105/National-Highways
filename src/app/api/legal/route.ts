import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CaseEntryFormData } from '@/types/legal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const circle = searchParams.get('circle');
    const division = searchParams.get('division');
    const search = searchParams.get('search');

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
      if (!error && data) {
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

    return NextResponse.json({ success: true, cases: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, cases: [] }, { status: 500 });
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

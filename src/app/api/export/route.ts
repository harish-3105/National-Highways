import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  HIGHWAYS_L1_COLUMNS,
  HIGHWAYS_L2_MACRO_COLUMNS,
  HIGHWAYS_L2_MICRO_COLUMNS,
  DLP_COLUMNS,
  ONGOING_WORKS_COLUMNS,
  LEGAL_CASES_COLUMNS,
  FEE_BILLS_COLUMNS,
  STAFF_COLUMNS,
} from '@/lib/export/columns';
import { buildExcelWorkbook, buildCsvBuffer, SheetExportPayload } from '@/lib/export/serverExcelBuilder';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      module,
      scope = 'all',
      selectedIds = [],
      selectedKeys,
      format = 'xlsx',
      corridorLevels = ['L1', 'L2_MACRO', 'L2_MICRO'],
      emptyTemplate = false,
      filters = {},
      customFileName,
    } = body;

    const supabase = getSupabaseClient();
    const timestamp = new Date().toISOString().slice(0, 10);
    const dateSuffix = emptyTemplate ? `Template_${timestamp}` : timestamp;

    const sheets: SheetExportPayload[] = [];
    let filePrefix = customFileName || `TN_NH_${String(module).toUpperCase()}`;

    // -------------------------------------------------------------------------
    // 1. CORRIDORS CATALOG MODULE
    // -------------------------------------------------------------------------
    if (module === 'highways' || module === 'corridors') {
      filePrefix = emptyTemplate ? 'TN_Highway_Catalog_Template' : `TN_Highway_Catalog_${timestamp}`;

      // Level 1: Master Highway Corridors
      if (corridorLevels.includes('L1')) {
        let l1Data: Record<string, unknown>[] = [];
        if (!emptyTemplate && supabase) {
          let query = supabase.from('highways').select('*').order('created_at', { ascending: false });
          if (filters.includeDeleted !== true) query = query.neq('status', 'DELETED');
          if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);
          if (filters.config && filters.config !== 'ALL') query = query.eq('configuration', filters.config);

          const { data } = await query;
          if (data) {
            // Attach DLP counts
            const { data: dlpData } = await supabase.from('dlp_contracts').select('highway_code');
            const dlpMap = new Map<string, number>();
            if (dlpData) {
              dlpData.forEach((d: { highway_code: string }) => {
                const code = (d.highway_code || '').toUpperCase();
                dlpMap.set(code, (dlpMap.get(code) || 0) + 1);
              });
            }

            l1Data = data.map((hw: any) => ({
              ...hw,
              dlp_count: dlpMap.get((hw.road_code || '').toUpperCase()) || 0,
            }));
          }
        }

        sheets.push({
          sheetName: 'Corridors Master (L1)',
          columns: HIGHWAYS_L1_COLUMNS,
          selectedKeys: selectedKeys?.L1 || selectedKeys,
          data: l1Data,
        });
      }

      // Level 2 Macro: Traffic Census & PCU Ranges
      if (corridorLevels.includes('L2_MACRO')) {
        let macroData: Record<string, unknown>[] = [];
        if (!emptyTemplate && supabase) {
          let query = supabase
            .from('highway_sub_chainages')
            .select('*')
            .order('highway_code', { ascending: true })
            .order('from_km', { ascending: true });

          if (filters.includeDeleted !== true) {
            query = query.neq('delete_status', 'DELETED').neq('delete_status', 'SOFT_DELETE');
          }

          const { data } = await query;
          if (data) {
            macroData = data.filter(
              (s: any) => s.breakdown_type === 'MACRO_PCU' || s.pcu_count > 0 || s.stretch_name
            );
          }
        }

        sheets.push({
          sheetName: 'Traffic Census PCU (L2)',
          columns: HIGHWAYS_L2_MACRO_COLUMNS,
          selectedKeys: selectedKeys?.L2_MACRO || selectedKeys,
          data: macroData,
        });
      }

      // Level 2 Micro: Granular Carriageway Lane Geometry
      if (corridorLevels.includes('L2_MICRO')) {
        let microData: Record<string, unknown>[] = [];
        if (!emptyTemplate && supabase) {
          let query = supabase
            .from('highway_sub_chainages')
            .select('*')
            .order('highway_code', { ascending: true })
            .order('from_km', { ascending: true });

          if (filters.includeDeleted !== true) {
            query = query.neq('delete_status', 'DELETED').neq('delete_status', 'SOFT_DELETE');
          }

          const { data } = await query;
          if (data) {
            microData = data.filter(
              (s: any) => s.breakdown_type === 'MICRO_LANE' || s.row_width || s.carriageway_width
            );
            if (microData.length === 0) microData = data; // Fallback to all if breakdown_type was unpopulated
          }
        }

        sheets.push({
          sheetName: 'Lane Geometry (L2)',
          columns: HIGHWAYS_L2_MICRO_COLUMNS,
          selectedKeys: selectedKeys?.L2_MICRO || selectedKeys,
          data: microData,
        });
      }
    }

    // -------------------------------------------------------------------------
    // 2. DLP & MAINTENANCE MODULE
    // -------------------------------------------------------------------------
    else if (module === 'dlp' || module === 'maintenance') {
      filePrefix = emptyTemplate ? 'TN_DLP_Maintenance_Template' : `TN_DLP_Maintenance_${timestamp}`;
      let dlpData: Record<string, unknown>[] = [];

      if (!emptyTemplate && supabase) {
        let query = supabase
          .from('dlp_work_stretches')
          .select('*, dlp_corridors(division_name, highway_code)')
          .order('created_at', { ascending: false });

        if (filters.includeDeleted !== true) query = query.neq('status', 'DELETED');
        if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);
        if (filters.category && filters.category !== 'ALL') query = query.eq('category', filters.category);

        const { data } = await query;
        if (data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          dlpData = data.map((item: any) => {
            const corridor = item.dlp_corridors || {};
            let daysRemaining: number | '' = '';
            let computedStatus = item.status || 'ACTIVE';

            if (item.dlp_till_date) {
              const exp = new Date(item.dlp_till_date);
              if (!isNaN(exp.getTime())) {
                exp.setHours(0, 0, 0, 0);
                const diffTime = exp.getTime() - today.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                computedStatus = daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 90 ? 'EXPIRING_SOON' : 'ACTIVE';
              }
            }

            return {
              ...item,
              division_name: corridor.division_name || item.division_name || '',
              highway_code: corridor.highway_code || item.highway_code || '',
              computed_status: computedStatus,
              days_remaining: daysRemaining,
            };
          });
        }
      }

      sheets.push({
        sheetName: 'DLP Maintenance Stretches',
        columns: DLP_COLUMNS,
        selectedKeys,
        data: dlpData,
      });
    }

    // -------------------------------------------------------------------------
    // 3. ONGOING WORKS / MAJOR PROJECTS MODULE
    // -------------------------------------------------------------------------
    else if (module === 'ongoing-works' || module === 'major-projects') {
      filePrefix = emptyTemplate ? 'TN_Ongoing_Works_35Col_Template' : `TN_Ongoing_Works_${timestamp}`;
      let worksData: Record<string, unknown>[] = [];

      if (!emptyTemplate && supabase) {
        let query = supabase.from('major_projects_50cr').select('*').order('s_no', { ascending: true });

        if (filters.includeDeleted !== true) query = query.neq('delete_status', 'DELETED');
        if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);
        if (filters.circle && filters.circle !== 'ALL') query = query.ilike('circle', filters.circle);
        if (filters.division && filters.division !== 'ALL') query = query.ilike('division', filters.division);
        if (filters.stage && filters.stage !== 'ALL') query = query.eq('work_stage', filters.stage);

        const { data } = await query;
        if (data) worksData = data;
      }

      sheets.push({
        sheetName: 'Ongoing Capital Works',
        columns: ONGOING_WORKS_COLUMNS,
        selectedKeys,
        data: worksData,
      });
    }

    // -------------------------------------------------------------------------
    // 4. LEGAL CASES MODULE
    // -------------------------------------------------------------------------
    else if (module === 'legal' || module === 'cases') {
      filePrefix = emptyTemplate ? 'TN_Legal_Cases_Template' : `TN_Legal_Cases_${timestamp}`;
      let legalData: Record<string, unknown>[] = [];

      if (!emptyTemplate && supabase) {
        let query = supabase.from('legal_cases').select('*').order('created_at', { ascending: false });

        if (filters.includeDeleted !== true) query = query.neq('delete_status', 'DELETED');
        if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);
        if (filters.circle && filters.circle !== 'ALL') query = query.eq('circle', filters.circle);
        if (filters.division && filters.division !== 'ALL') query = query.eq('division', filters.division);
        if (filters.status && filters.status !== 'ALL') query = query.eq('current_status', filters.status);

        const { data } = await query;
        if (data) {
          legalData = data.map((item: any) => ({
            ...item,
            caseDetails: item.case_details || item.case_number || '',
            nameOfCourt: item.name_of_court || '',
            petitionerNames: item.petitioner_names || '',
            respondentNames: item.respondent_names || '',
            briefOfPrayer: item.brief_of_prayer || '',
            caseClassification: item.case_classification || 'Normal Case',
            currentStatus: item.current_status || 'Pending',
            presentStage: item.present_stage || '',
            caRequired: item.ca_required || '',
            caFiled: item.ca_filed || '',
            caDueDate: item.ca_due_date || '',
            caFiledDate: item.ca_filed_date || '',
            lastHearingDate: item.last_hearing_date || '',
            nextHearingDate: item.next_hearing_date || '',
            nextListingPurpose: item.next_listing_purpose || '',
          }));
        }
      }

      sheets.push({
        sheetName: 'Legal Cases Tracking',
        columns: LEGAL_CASES_COLUMNS,
        selectedKeys,
        data: legalData,
      });
    }

    // -------------------------------------------------------------------------
    // 5. FEE BILLS PORTAL MODULE
    // -------------------------------------------------------------------------
    else if (module === 'fee-bills' || module === 'fee_bills') {
      filePrefix = emptyTemplate ? 'TN_Advocate_Fee_Bills_Template' : `TN_Advocate_Fee_Bills_${timestamp}`;
      let feeBillsData: Record<string, unknown>[] = [];

      if (!emptyTemplate && supabase) {
        let query = supabase.from('fee_bills').select('*').order('fee_bill_date', { ascending: false });

        if (filters.includeDeleted !== true) query = query.neq('delete_status', 'DELETED');
        if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);
        if (filters.circle && filters.circle !== 'ALL') query = query.eq('circle', filters.circle);
        if (filters.division && filters.division !== 'ALL') query = query.eq('division', filters.division);
        if (filters.paymentStatus && filters.paymentStatus !== 'ALL') query = query.eq('payment_status', filters.paymentStatus);

        const { data } = await query;
        if (data) {
          feeBillsData = data.map((item: any) => ({
            ...item,
            feeBillNumber: item.fee_bill_number || '',
            feeBillDate: item.fee_bill_date || '',
            receiptDate: item.receipt_date || '',
            lawyerName: item.lawyer_name || '',
            lawyerDesignation: item.lawyer_designation || '',
            caseDetails: item.case_details || '',
            appearanceAmount: item.appearance_amount || 0,
            conferenceAmount: item.conference_amount || 0,
            verifyingAmount: item.verifying_amount || 0,
            assistanceAmount: item.assistance_amount || 0,
            totalFeeAmount: item.total_fee_amount || 0,
            paymentStatus: item.payment_status || 'Pending',
            settledAmount: item.settled_amount || 0,
            utrRbiReference: item.utr_rbi_reference || '',
            paymentDate: item.payment_date || '',
            goStatus: item.go_status || '',
            currentPendency: item.current_pendency || '',
          }));
        }
      }

      sheets.push({
        sheetName: 'Advocate Fee Bills',
        columns: FEE_BILLS_COLUMNS,
        selectedKeys,
        data: feeBillsData,
      });
    }

    // -------------------------------------------------------------------------
    // 6. STAFF DIRECTORY MODULE
    // -------------------------------------------------------------------------
    else if (module === 'staff' || module === 'staff-members') {
      filePrefix = emptyTemplate ? 'TN_Staff_Directory_Template' : `TN_Staff_Directory_${timestamp}`;
      let staffData: Record<string, unknown>[] = [];

      if (!emptyTemplate && supabase) {
        let query = supabase.from('staff_members').select('*').order('created_at', { ascending: false });

        if (filters.includeDeleted !== true) query = query.neq('delete_status', 'DELETED');
        if (scope === 'selected' && selectedIds.length > 0) query = query.in('id', selectedIds);

        const { data } = await query;
        if (data) staffData = data;
      }

      sheets.push({
        sheetName: 'Staff Directory',
        columns: STAFF_COLUMNS,
        selectedKeys,
        data: staffData,
      });
    } else {
      return NextResponse.json({ success: false, message: `Unknown module: ${module}` }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // RENDER SPREADSHEET (XLSX vs CSV)
    // -------------------------------------------------------------------------
    if (format === 'csv') {
      const targetSheet = sheets[0];
      if (!targetSheet) {
        return NextResponse.json({ success: false, message: 'No sheet data available for CSV export' }, { status: 400 });
      }

      const csvBuffer = buildCsvBuffer(targetSheet);
      return new NextResponse(new Uint8Array(csvBuffer), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filePrefix}.csv"`,
          'Content-Length': String(csvBuffer.length),
        },
      });
    }

    // Generate Excel XLSX
    const excelBuffer = await buildExcelWorkbook({
      fileNamePrefix: filePrefix,
      sheets,
      format: 'xlsx',
    });

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filePrefix}.xlsx"`,
        'Content-Length': String(excelBuffer.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Server Export API Error:', err);
    return NextResponse.json({ success: false, message: `Export generation failed: ${msg}` }, { status: 500 });
  }
}

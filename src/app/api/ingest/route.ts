import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseDatasetFile, DatasetType } from '@/lib/ingestion/parser';
import { getSession } from '@/lib/auth/session';
import { canPerformAction } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

const INGEST_PERMISSION_MAP: Record<DatasetType, string> = {
  HIGHWAYS_MASTER: 'highways:import',
  HIGHWAY_SUB_CHAINAGES: 'sub_chainages:import',
  HIGHWAY_MILESTONES: 'highways:import',
  ACCIDENT_BLACKSPOTS: 'highways:import',
  ONGOING_WORKS: 'works:import',
  DLP_CONTRACTS: 'dlp:import',
  LEGAL_CASES: 'legal:import',
};

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

// Chunk helper to process large bulk payloads safely
async function batchInsertOrUpsert(
  supabase: any,
  tableName: string,
  dataArray: any[],
  options: { onConflict?: string } = {}
) {
  const CHUNK_SIZE = 250;
  let totalInserted = 0;
  let lastError: any = null;
  const allInsertedData: any[] = [];

  for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
    const chunk = dataArray.slice(i, i + CHUNK_SIZE);
    let query = supabase.from(tableName);

    if (options.onConflict) {
      query = query.upsert(chunk, { onConflict: options.onConflict });
    } else {
      query = query.insert(chunk);
    }

    const { data, error } = await query.select();
    if (error) {
      lastError = error;
      break;
    }
    if (data) {
      allInsertedData.push(...data);
    }
    totalInserted += data?.length || chunk.length;
  }

  return { totalInserted, data: allInsertedData, error: lastError };
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message: 'Supabase client could not be initialized. Check environment variables.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const datasetType = formData.get('datasetType') as DatasetType | null;

    if (!file || !datasetType) {
      return NextResponse.json(
        { success: false, message: 'File and datasetType are required fields.' },
        { status: 400 }
      );
    }

    const session = await getSession();
    const requiredPerm = INGEST_PERMISSION_MAP[datasetType] || 'works:import';
    let authCheck = canPerformAction(session, requiredPerm);
    if (!authCheck.allowed) {
      // Fallback check to generic works:import or *:*
      authCheck = canPerformAction(session, 'works:import');
    }
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, message: authCheck.reason || 'Unauthorized operation.' },
        { status: 403 }
      );
    }

    // 1. Parse file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parseResult = await parseDatasetFile(buffer, file.name, datasetType);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: (parseResult as any).message || 'File parsing failed.',
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid data rows found in the uploaded file.' },
        { status: 400 }
      );
    }

    // 2. Perform Database Insertion / Upsert by Dataset Type
    let insertedCount = 0;
    let dbError: any = null;

    if (datasetType === 'HIGHWAYS_MASTER') {
      const result = await batchInsertOrUpsert(supabase, 'highways', parseResult.data, {
        onConflict: 'road_code',
      });
      insertedCount = result.totalInserted;
      dbError = result.error;
    } else if (datasetType === 'HIGHWAY_SUB_CHAINAGES') {
      const result = await batchInsertOrUpsert(supabase, 'highway_sub_chainages', parseResult.data);
      insertedCount = result.totalInserted;
      dbError = result.error;
    } else if (datasetType === 'DLP_CONTRACTS') {
      const allowedColumns = [
        'id',
        'highway_code',
        'stretch_name',
        'from_km',
        'to_km',
        'length_km',
        'contractor_name',
        'contract_mode',
        'work_description',
        'doc_date',
        'dlp_expiry_date',
        'days_remaining',
        'status',
        'created_at',
        'division_name',
        'dlp_contract_count',
        'dlp_length_km',
        'construction_project_count',
        'construction_length_km',
        'stmc_contract_count',
        'stmc_length_km',
        'stmc_expiry_date',
        'pbmc_project_count',
        'pbmc_length_km',
        'no_dlp_length_km',
        'uncontracted_after_2027_km',
        'contract_details',
      ];

      const isValidIsoDate = (val: any): boolean => {
        if (!val) return false;
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          return !isNaN(Date.parse(val));
        }
        return false;
      };

      const dateCols = ['dlp_expiry_date', 'doc_date', 'stmc_expiry_date', 'pbmc_expiry_date', 'no_dlp_expiry_date'];
      const numCols = [
        'from_km',
        'to_km',
        'length_km',
        'dlp_contract_count',
        'dlp_length_km',
        'construction_project_count',
        'construction_length_km',
        'stmc_contract_count',
        'stmc_length_km',
        'pbmc_project_count',
        'pbmc_length_km',
        'no_dlp_length_km',
        'uncontracted_after_2027_km',
        'days_remaining',
      ];

      const cleanData = parseResult.data.map((item: any) => {
        const payload: Record<string, any> = {};
        for (const col of allowedColumns) {
          if (item[col] !== undefined) {
            if (dateCols.includes(col)) {
              payload[col] = isValidIsoDate(item[col]) ? item[col] : null;
            } else if (numCols.includes(col)) {
              const val = Number(item[col] || 0);
              payload[col] = isNaN(val) ? 0 : Math.round(val * 1000) / 1000;
            } else {
              payload[col] = item[col];
            }
          }
        }
        return payload;
      });

      const dlpResult = await batchInsertOrUpsert(supabase, 'dlp_contracts', cleanData);
      insertedCount = dlpResult.totalInserted;
      dbError = dlpResult.error;

      if (!dbError && dlpResult.data && dlpResult.data.length > 0) {
        // Secondary insertion loop for dlp_sub_contracts relational table
        const subContractsToInsert: any[] = [];
        dlpResult.data.forEach((parentItem: any) => {
          const details = parentItem.contract_details;
          if (details && Array.isArray(details.sub_contracts)) {
            details.sub_contracts.forEach((sub: any) => {
              subContractsToInsert.push({
                parent_contract_id: parentItem.id,
                sub_contract_type: sub.type || sub.sub_contract_type || 'DLP',
                sub_contract_title: sub.title || sub.sub_contract_title || 'Sub-Stretch',
                from_km: Number(sub.from_km || 0),
                to_km: Number(sub.to_km || 0),
                length_km: Number(sub.length_km || 0),
                contractor_name: sub.contractor_name || '',
                expiry_date: isValidIsoDate(sub.expiry_date) ? sub.expiry_date : null,
              });
            });
          }
        });

        if (subContractsToInsert.length > 0) {
          await batchInsertOrUpsert(supabase, 'dlp_sub_contracts', subContractsToInsert);
        }
      }
    } else if (datasetType === 'HIGHWAY_MILESTONES') {
      const result = await batchInsertOrUpsert(supabase, 'highway_chainages', parseResult.data);
      insertedCount = result.totalInserted;
      dbError = result.error;
    } else if (datasetType === 'ACCIDENT_BLACKSPOTS') {
      const result = await batchInsertOrUpsert(supabase, 'accident_blackspots', parseResult.data);
      insertedCount = result.totalInserted;
      dbError = result.error;
    } else if (datasetType === 'LEGAL_CASES') {
      const uniqueCasesMap = new Map();
      const noCaseDetailsRows: any[] = [];
      parseResult.data.forEach((item: any) => {
        const key = item.case_details || item.case_number;
        if (key) {
          uniqueCasesMap.set(key, item);
        } else {
          noCaseDetailsRows.push(item);
        }
      });
      const uniqueLegalCases = [...Array.from(uniqueCasesMap.values()), ...noCaseDetailsRows];

      const result = await batchInsertOrUpsert(supabase, 'legal_cases', uniqueLegalCases);
      insertedCount = result.totalInserted;
      dbError = result.error;
    } else if (datasetType === 'ONGOING_WORKS') {
      const cleanData = parseResult.data.map((item: any) => ({
        s_no: Number(item.s_no) || 1,
        division: item.division || 'Chennai',
        scheme: item.scheme || 'Annual Plan 2025-26',
        name_of_work: item.name_of_work,
        project_cost_cr: Number(item.project_cost_cr) || 0,
        work_stage: item.work_stage || 'IN_PROGRESS',
        progress_percent:
          item.progress_percent !== undefined && item.progress_percent !== null
            ? Number(item.progress_percent)
            : null,
        probable_completion_date: item.probable_completion_date || null,
        stage_remarks: item.stage_remarks || null,
        progress_remarks: item.progress_remarks || null,
        delete_status: 'ACTIVE',

        pmis_id: item.pmis_id || null,
        old_new_nh: item.old_new_nh || null,
        length_km: item.length_km ? Number(item.length_km) : null,
        job_no: item.job_no || null,
        sanction_date: item.sanction_date || null,

        // 5 Contract & Milestone Fields
        loa_date: item.loa_date || null,
        agreement_date: item.agreement_date || null,
        contract_value_cr: item.contract_value_cr ? Number(item.contract_value_cr) : null,
        site_handover_date: item.site_handover_date || null,
        appointed_date: item.appointed_date || null,
        scheduled_completion_date: item.scheduled_completion_date || null,

        completed_length_prior_km: item.completed_length_prior_km ? Number(item.completed_length_prior_km) : 0,
        completed_length_current_fy_km: item.completed_length_current_fy_km ? Number(item.completed_length_current_fy_km) : 0,
        total_completed_length_km: item.total_completed_length_km ? Number(item.total_completed_length_km) : 0,

        revised_cost_cr: item.revised_cost_cr ? Number(item.revised_cost_cr) : null,
        cost_increase_rce_cr: item.cost_increase_rce_cr ? Number(item.cost_increase_rce_cr) : null,
        expenditure_prior_cr: item.expenditure_prior_cr ? Number(item.expenditure_prior_cr) : 0,
        expenditure_current_fy_cr: item.expenditure_current_fy_cr ? Number(item.expenditure_current_fy_cr) : 0,
        cumm_financial_expenditure_cr: item.cumm_financial_expenditure_cr ? Number(item.cumm_financial_expenditure_cr) : 0,
        contract_cum_expenditure_cr: item.contract_cum_expenditure_cr ? Number(item.contract_cum_expenditure_cr) : 0,

        likely_completion_date: item.likely_completion_date || null,
        time_overrun_years: item.time_overrun_years ? Number(item.time_overrun_years) : null,
        eot_granted_till: item.eot_granted_till || null,
        eot_proposal_agency: item.eot_proposal_agency || null,
        cos_details: item.cos_details || null,

        de_name_phone: item.de_name_phone || null,
        contractor_name: item.contractor_name || null,
        detailed_stage_status: item.detailed_stage_status || null,
        updated_division_date: item.updated_division_date || null,

        issue_land: item.issue_land || null,
        issue_forest: item.issue_forest || null,
        issue_utility: item.issue_utility || null,
        issue_railways: item.issue_railways || null,
        issue_others: item.issue_others || null,

        updated_at: new Date().toISOString(),
      }));

      const result = await batchInsertOrUpsert(supabase, 'major_projects_50cr', cleanData);
      insertedCount = result.totalInserted;
      dbError = result.error;

      // Historical Snapshot Audit for Bulk Ingestion
      if (!dbError && result.data && result.data.length > 0) {
        try {
          const snapshotsToInsert = result.data.map((proj: any) => {
            const cost = Number(proj.revised_cost_cr || proj.project_cost_cr || 0);
            const exp = Number(proj.cumm_financial_expenditure_cr || 0);
            const finPercent = cost > 0 ? Math.min(100, Math.round((exp / cost) * 100 * 10) / 10) : 0;

            return {
              project_id: proj.id,
              action_source: 'EXCEL_UPLOAD',
              user_identifier: 'bulk_ingestion',
              progress_percent: proj.progress_percent,
              financial_progress_percent: finPercent,
              cumm_financial_expenditure_cr: proj.cumm_financial_expenditure_cr,
              contract_cum_expenditure_cr: proj.contract_cum_expenditure_cr,
              progress_remarks: proj.progress_remarks,
              stage_remarks: proj.stage_remarks,
              detailed_stage_status: proj.detailed_stage_status,
              issue_land: proj.issue_land,
              issue_forest: proj.issue_forest,
              issue_utility: proj.issue_utility,
              issue_railways: proj.issue_railways,
              issue_others: proj.issue_others,
              full_snapshot: proj,
            };
          });

          await batchInsertOrUpsert(supabase, 'major_projects_snapshots', snapshotsToInsert);
        } catch (snapshotErr) {
          console.error('Error logging bulk ingestion snapshots:', snapshotErr);
        }
      }
    }

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database insertion error: ${dbError.message}`,
        },
        { status: 500 }
      );
    }

    // 3. Log Upload Activity Safely
    try {
      await supabase.from('dataset_uploads').insert({
        dataset_type: datasetType,
        file_name: file.name,
        total_rows: parseResult.totalRows,
        inserted_rows: insertedCount,
        status: 'COMPLETED',
      });
    } catch {
      // ignore upload activity log error
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      totalRows: parseResult.totalRows,
      preview: parseResult.data.slice(0, 5),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

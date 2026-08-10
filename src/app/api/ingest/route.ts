import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseDatasetFile, DatasetType } from '@/lib/ingestion/parser';

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
      const noCaseNumberRows: any[] = [];
      parseResult.data.forEach((item: any) => {
        if (item.case_number) {
          uniqueCasesMap.set(item.case_number, item);
        } else {
          noCaseNumberRows.push(item);
        }
      });
      const uniqueLegalCases = [...Array.from(uniqueCasesMap.values()), ...noCaseNumberRows];

      const result = await batchInsertOrUpsert(supabase, 'legal_cases', uniqueLegalCases, {
        onConflict: 'case_number',
      });
      insertedCount = result.totalInserted;
      dbError = result.error;
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

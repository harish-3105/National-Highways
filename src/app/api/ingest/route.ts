import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseDatasetFile, DatasetType } from '@/lib/ingestion/parser';

export async function POST(request: Request) {
  try {
    // Read & sanitize environment variables per request
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabaseUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
    const supabaseKey = rawKey.replace(/^["']|["']$/g, '').trim();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          message: `Server Config Error: URL present? ${Boolean(supabaseUrl)}, Key present? ${Boolean(supabaseKey)}. Please verify Vercel Environment Variables.`,
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const datasetType = (formData.get('datasetType') as DatasetType) || 'HIGHWAYS_MASTER';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded. Please select a .xlsx, .xls, or .csv file.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse and Validate File against Dataset Schema
    const parseResult = await parseDatasetFile(buffer, file.name, datasetType);

    if (!parseResult.success || parseResult.validRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Schema validation failed for dataset type "${datasetType}".`,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    // 2. Direct Supabase Client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    let insertedCount = 0;
    let dbError: any = null;

    if (datasetType === 'HIGHWAYS_MASTER') {
      // Deduplicate items by road_code while preserving the master record with the largest length_km
      const uniqueMap = new Map();
      parseResult.data.forEach((item: any) => {
        const existing = uniqueMap.get(item.road_code);
        if (!existing || item.length_km > existing.length_km) {
          uniqueMap.set(item.road_code, item);
        }
      });
      const uniqueHighways = Array.from(uniqueMap.values());

      const { data, error } = await supabase
        .from('highways')
        .upsert(uniqueHighways, { onConflict: 'road_code' })
        .select();

      if (error) dbError = error;
      else insertedCount = data?.length || 0;
    } else if (datasetType === 'DLP_CONTRACTS') {
      const { data, error } = await supabase
        .from('dlp_contracts')
        .insert(parseResult.data)
        .select();

      if (error) dbError = error;
      else insertedCount = data?.length || 0;
    } else if (datasetType === 'HIGHWAY_MILESTONES') {
      const { data, error } = await supabase
        .from('highway_chainages')
        .insert(parseResult.data)
        .select();

      if (error) dbError = error;
      else insertedCount = data?.length || 0;
    } else if (datasetType === 'ACCIDENT_BLACKSPOTS') {
      const { data, error } = await supabase
        .from('accident_blackspots')
        .insert(parseResult.data)
        .select();

      if (error) dbError = error;
      else insertedCount = data?.length || 0;
    } else if (datasetType === 'LEGAL_CASES') {
      // Deduplicate items by case_number
      const uniqueCasesMap = new Map();
      parseResult.data.forEach((item: any) => {
        uniqueCasesMap.set(item.case_number, item);
      });
      const uniqueLegalCases = Array.from(uniqueCasesMap.values());

      const { data, error } = await supabase
        .from('legal_cases')
        .upsert(uniqueLegalCases, { onConflict: 'case_number' })
        .select();

      if (error) dbError = error;
      else insertedCount = data?.length || 0;
    }

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database error while inserting records into Supabase: ${dbError.message} (URL: ${supabaseUrl.slice(0, 25)}..., Key Length: ${supabaseKey.length})`,
          details: dbError,
        },
        { status: 500 }
      );
    }

    // 3. Log Upload Activity
    await supabase.from('dataset_uploads').insert({
      dataset_type: datasetType,
      file_name: file.name,
      total_rows: parseResult.totalRows,
      inserted_rows: insertedCount,
      status: 'COMPLETED',
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${file.name}. Parsed ${parseResult.validRows} valid rows and inserted into PostgreSQL.`,
      datasetType,
      insertedCount,
      dataPreview: parseResult.data.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Server error during ingestion: ${error.message}` },
      { status: 500 }
    );
  }
}

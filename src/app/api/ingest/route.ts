import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseDatasetFile, DatasetType } from '@/lib/ingestion/parser';

export async function POST(request: Request) {
  try {
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

    const supabase = await createClient();

    // 2. Insert into PostgreSQL based on Dataset Type
    let insertedCount = 0;
    let dbError = null;

    if (datasetType === 'HIGHWAYS_MASTER') {
      const { data, error } = await supabase
        .from('highways')
        .upsert(parseResult.data, { onConflict: 'road_code' })
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
    }

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          message: `Database error while inserting records into Supabase: ${dbError.message}`,
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

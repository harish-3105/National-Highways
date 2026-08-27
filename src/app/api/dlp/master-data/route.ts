import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DlpMasterConfigItem, DlpMasterData } from '@/types/dlp';

export const dynamic = 'force-dynamic';

function groupMasterData(items: DlpMasterConfigItem[]): DlpMasterData {
  const activeItems = items.filter((i) => i.status !== 'DELETED');

  const circles = Array.from(
    new Set(activeItems.filter((i) => i.category === 'circle').map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const divisions = Array.from(
    new Set(activeItems.filter((i) => i.category === 'division').map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const schemes = Array.from(
    new Set(activeItems.filter((i) => i.category === 'scheme').map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const circleDivisionMap: Record<string, string[]> = {};
  circles.forEach((c) => {
    circleDivisionMap[c] = [];
  });

  activeItems
    .filter((i) => i.category === 'division')
    .forEach((item) => {
      const parentCircle = item.parent_value?.trim();
      if (parentCircle) {
        if (!circleDivisionMap[parentCircle]) {
          circleDivisionMap[parentCircle] = [];
        }
        if (!circleDivisionMap[parentCircle].includes(item.value.trim())) {
          circleDivisionMap[parentCircle].push(item.value.trim());
        }
      }
    });

  // Sort division arrays inside each circle
  Object.keys(circleDivisionMap).forEach((circleKey) => {
    circleDivisionMap[circleKey].sort((a, b) => a.localeCompare(b));
  });

  return {
    rawItems: activeItems,
    circles,
    divisions,
    schemes,
    circleDivisionMap,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('dlp_master_config')
      .select('*')
      .neq('status', 'DELETED')
      .order('category', { ascending: true })
      .order('value', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const { category, value, parent_category, parent_value } = body;

    if (!category || !value || typeof value !== 'string' || value.trim() === '') {
      return NextResponse.json({ error: 'Category and value are required' }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    const cleanValue = value.trim();
    const cleanParentCategory = parent_category
      ? String(parent_category).trim().toLowerCase()
      : cleanCategory === 'division'
      ? 'circle'
      : null;
    const cleanParentValue = parent_value ? String(parent_value).trim() : null;

    if (!['circle', 'division', 'scheme'].includes(cleanCategory)) {
      return NextResponse.json(
        { error: "Category must be 'circle', 'division', or 'scheme'" },
        { status: 400 }
      );
    }

    // Check duplicate
    let checkQuery = supabase
      .from('dlp_master_config')
      .select('id')
      .eq('category', cleanCategory)
      .ilike('value', cleanValue)
      .neq('status', 'DELETED');

    if (cleanParentValue) {
      checkQuery = checkQuery.ilike('parent_value', cleanParentValue);
    }

    const { data: existing, error: checkError } = await checkQuery.maybeSingle();
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        {
          error: `"${cleanValue}" already exists in ${cleanCategory}${
            cleanParentValue ? ` under ${cleanParentValue}` : ''
          }.`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('dlp_master_config')
      .insert([
        {
          category: cleanCategory,
          value: cleanValue,
          parent_category: cleanParentCategory,
          parent_value: cleanParentValue,
          status: 'ACTIVE',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const { id, value, parent_category, parent_value } = body;

    if (!id) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (value && typeof value === 'string' && value.trim() !== '') {
      updates.value = value.trim();
    }
    if (parent_category !== undefined) {
      updates.parent_category = parent_category ? String(parent_category).trim().toLowerCase() : null;
    }
    if (parent_value !== undefined) {
      updates.parent_value = parent_value ? String(parent_value).trim() : null;
    }

    const { data, error } = await supabase
      .from('dlp_master_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID query parameter is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('dlp_master_config')
      .update({ status: 'DELETED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Option deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

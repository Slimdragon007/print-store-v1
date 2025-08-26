import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Fetch prints with their variants from Supabase
  const { data: prints, error } = await supabase
    .from('prints')
    .select(`
      id,
      slug,
      title,
      r2_key,
      print_variants (
        id,
        code,
        label,
        price_cents
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prints:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  // Transform to match existing API format
  const items = prints?.map(p => ({
    id: p.slug, // Use slug for compatibility
    title: p.title,
    imageUrl: supabase.storage.from('prints').getPublicUrl(p.r2_key).data.publicUrl,
    variants: p.print_variants?.map((v: any) => ({ 
      id: v.code, 
      label: v.label, 
      priceCents: v.price_cents 
    })) || []
  })) || [];
  
  return NextResponse.json({ items });
}
import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SourceRow from "./SourceRow";

export const dynamic = "force-dynamic";

export default async function Sources() {
  const c = supabaseAdmin();
  const { data } = await c.from("sources").select("*").order("slug");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
      <Card>
        <CardHeader><CardTitle>Toggle which boards to scrape</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data || []).map((s: any) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

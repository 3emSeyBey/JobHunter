import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code2, UserSquare2 } from "lucide-react";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function Profiles() {
  const c = supabaseAdmin();
  const { data } = await c.from("profiles").select("*").order("slug");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Profile context is sent to the LLM with every job. Better data = better matching.
        </p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(data || []).map((p: any) => {
          const Icon = p.slug === "dev" ? Code2 : UserSquare2;
          return (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription className="mono uppercase tracking-wider text-[10px]">
                      {p.slug} profile
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProfileForm profile={p} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

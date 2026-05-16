"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ProfileForm({ profile }: { profile: any }) {
  const [p, setP] = useState({
    name: profile.name || "",
    email: profile.email || "",
    notify_email: profile.notify_email || "",
    bio: profile.bio || "",
    skills: (profile.skills || []).join(", "),
    experience: profile.experience || "",
    preferred_roles: (profile.preferred_roles || []).join(", "),
    qualifications: profile.qualifications || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const r = await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: profile.id,
        ...p,
        skills: p.skills.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_roles: p.preferred_roles.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(r.ok);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Email</Label>
          <Input value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
        </div>
        <div>
          <Label>Notify email</Label>
          <Input value={p.notify_email} onChange={(e) => setP({ ...p, notify_email: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3} />
      </div>
      <div>
        <Label>Skills (comma-separated)</Label>
        <Textarea value={p.skills} onChange={(e) => setP({ ...p, skills: e.target.value })} rows={2} />
      </div>
      <div>
        <Label>Experience</Label>
        <Textarea value={p.experience} onChange={(e) => setP({ ...p, experience: e.target.value })} rows={3} />
      </div>
      <div>
        <Label>Preferred roles (comma-separated)</Label>
        <Textarea value={p.preferred_roles} onChange={(e) => setP({ ...p, preferred_roles: e.target.value })} rows={2} />
      </div>
      <div>
        <Label>Qualifications</Label>
        <Textarea value={p.qualifications} onChange={(e) => setP({ ...p, qualifications: e.target.value })} rows={3} />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </div>
  );
}

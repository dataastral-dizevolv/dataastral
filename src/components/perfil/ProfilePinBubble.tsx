"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSignupPasswordError, mapPasswordUpdateError } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="font-jakarta text-[12px] font-black uppercase tracking-[0.22em] text-current sm:text-[13px]">
      {index} · {title}
    </p>
  );
}

export function ProfilePinBubble() {
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    const passwordError = getSignupPasswordError(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(mapPasswordUpdateError(error));
        return;
      }

      toast.success("Senha atualizada");
      setNewPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ChatBubble
      from="iris"
      className="!border-midnight !bg-midnight text-[15px] font-black text-midnight-foreground sm:text-[17px]"
    >
      <div className="space-y-3">
        <SectionLabel index="05" title="Trocar senha" />
        <p className="text-xs font-normal text-midnight-foreground/70">Crie uma nova senha com pelo menos 6 caracteres.</p>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="rounded-xl border-0 bg-milky-way text-milky-way-foreground"
          />
          <Button
            type="button"
            disabled={saving}
            onClick={() => void changePassword()}
            className="transition-all active:scale-95 active:opacity-70"
          >
            Atualizar
          </Button>
        </div>
      </div>
    </ChatBubble>
  );
}

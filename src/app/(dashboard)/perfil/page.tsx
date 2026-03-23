"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search } from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DASHBOARD_ME_KEY, useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import type { LocationData } from "@/types/calculator";

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeTime(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export default function PerfilPage() {
  const { user } = useDashboardUser();
  const { mutate } = useSWRConfig();
  const [fullName, setFullName] = useState(user.nome);
  const [birthDate, setBirthDate] = useState(user.birthDate ?? "");
  const [birthTime, setBirthTime] = useState(normalizeTime(user.birthTime));
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const existingLocation = useMemo<LocationData | null>(() => {
    if (!user.birthLocation || !user.birthTimezone || user.birthLat == null || user.birthLng == null) {
      return null;
    }

    const parts = user.birthLocation.split(",").map((part) => part.trim());

    return {
      city: parts[0] || "Cidade",
      state: parts[1] || "Estado",
      country: parts[2] || "País",
      lat: user.birthLat,
      lng: user.birthLng,
      timezone: user.birthTimezone,
      displayName: user.birthLocation,
    };
  }, [user.birthLat, user.birthLng, user.birthLocation, user.birthTimezone]);

  const {
    placeQuery,
    setPlaceQuery,
    locationResults,
    locationLoading,
    locationOpen,
    setLocationOpen,
    selectedLocation,
    handleSelectLocation,
  } = useLocationSearch({
    initialQuery: user.birthLocation ?? "",
    initialLocation: existingLocation,
  });

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (birthDate.length > 0 && !isValidDate(birthDate)) {
      toast.error("Informe uma data válida no formato AAAA-MM-DD.");
      return;
    }

    if (birthTime.length > 0 && !isValidTime(birthTime)) {
      toast.error("Informe a hora no formato HH:mm.");
      return;
    }

    const locationFilled = placeQuery.trim().length > 0;

    if (locationFilled && !selectedLocation) {
      setLocationError("Selecione uma opção da lista para confirmar local e timezone.");
      return;
    }

    if (selectedLocation && !selectedLocation.timezone) {
      setLocationError("Não foi possível confirmar o timezone. Escolha outra opção.");
      return;
    }

    setSaving(true);
    setLocationError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          birthDate,
          birthTime,
          birthLocation: selectedLocation?.displayName ?? "",
          birthTimezone: selectedLocation?.timezone ?? "",
          birthLat: selectedLocation?.lat ?? null,
          birthLng: selectedLocation?.lng ?? null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(payload.error ?? "Não foi possível salvar seu perfil agora.");
        return;
      }

      await mutate(DASHBOARD_ME_KEY);
      toast.success("Perfil atualizado com sucesso.");
    } catch {
      toast.error("Falha de conexão ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-background px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Card className="border border-border py-0 shadow-none">
          <CardHeader className="space-y-2 p-6">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-accent">Módulo</p>
            <CardTitle className="font-display text-3xl tracking-tight">Perfil</CardTitle>
            <CardDescription>Configure sua identidade astral para acelerar a calculadora e personalizar o calendário.</CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border border-border py-0 shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="font-display text-2xl tracking-tight">Informações de Conta</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-6 pt-0 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                  Nome
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Seu nome"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                  E-mail
                </Label>
                <Input id="email" type="email" value={user.email} readOnly disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border py-0 shadow-none">
            <CardHeader className="p-6">
              <CardTitle className="font-display text-2xl tracking-tight">Meu Mapa Natal</CardTitle>
              <CardDescription>Salve seus dados de nascimento para preenchimento automático.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birth-date" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth-time" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                    Hora de Nascimento
                  </Label>
                  <Input
                    id="birth-time"
                    type="time"
                    value={birthTime}
                    onChange={(event) => setBirthTime(event.target.value)}
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="relative space-y-2">
                <Label htmlFor="birth-place" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                  Local de Nascimento
                </Label>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-iris-muted" />
                  <Input
                    id="birth-place"
                    type="text"
                    value={placeQuery}
                    onChange={(event) => {
                      setPlaceQuery(event.target.value);
                      setLocationError(null);
                    }}
                    onFocus={() => setLocationOpen(locationResults.length > 0)}
                    placeholder="Digite cidade, estado e país"
                    className="border-iris bg-muted pl-9"
                  />
                  {locationLoading ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-iris-muted" /> : null}
                </div>

                <AnimatePresence>
                  {locationOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-iris bg-muted p-1"
                    >
                      {locationResults.map((locationOption) => (
                        <button
                          key={`${locationOption.displayName}-${locationOption.lat}-${locationOption.lng}`}
                          type="button"
                          onClick={() => {
                            void handleSelectLocation(locationOption);
                            setLocationError(null);
                          }}
                          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background/70"
                        >
                          <MapPin className="mt-0.5 size-3.5 text-iris-accent" />
                          <span className="text-xs leading-relaxed text-foreground">{locationOption.displayName}</span>
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {locationError ? <p className="text-[11px] text-red-300">{locationError}</p> : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-44">
              {saving ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

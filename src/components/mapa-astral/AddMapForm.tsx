"use client";

import * as React from "react";
import { Plus, UserPlus } from "lucide-react";

import { CityBirthAutocomplete } from "@/components/mapa-astral/CityBirthAutocomplete";
import { parseFlexibleDate } from "@/components/mapa-astral/constants";
import type { PersonChart } from "@/components/mapa-astral/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildNatalChart } from "@/lib/astrology/natal-chart";
import type { LocationData } from "@/types/calculator";

interface AddMapFormProps {
  onAdd: (person: PersonChart) => void;
}

export function AddMapForm({ onAdd }: AddMapFormProps) {
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [city, setCity] = React.useState<LocationData | null>(null);
  const [cityKey, setCityKey] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome";
    else if (name.trim().length > 60) next.name = "Máximo 60 caracteres";

    if (!date.trim()) next.date = "Informe a data de nascimento (dia/mês/ano AAAA)";
    else if (!parseFlexibleDate(date)) {
      next.date = "Data incompleta ou inválida. Use dia/mês/ano AAAA (ex: 07/03/1990).";
    }

    if (time.trim() && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      next.time = "Horário incompleto. Use HH:MM (ex: 14:30).";
    }

    if (!city || city.lat == null || city.lng == null) {
      next.city = "Digite e selecione a cidade na busca";
    } else if (!city.timezone) {
      next.city = "Não foi possível identificar o timezone. Escolha outra cidade.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate() || !city) return;

    const isoDate = parseFlexibleDate(date);
    if (!isoDate) return;

    try {
      const timeTrim = time.trim();
      const built = buildNatalChart({
        birthDate: isoDate,
        birthTime: timeTrim || null,
        birthTimezone: city.timezone,
        birthLat: city.lat,
        birthLng: city.lng,
      });

      onAdd({
        id: `person-${Date.now()}`,
        name: name.trim(),
        birthPlace: city.displayName,
        hasHouses: built.showHouses,
        chart: built.data,
        isSample: built.isSample,
      });

      setName("");
      setDate("");
      setTime("");
      setCity(null);
      setCityKey((k) => k + 1);
      setErrors({});
    } catch {
      setSubmitError("Não foi possível calcular o mapa. Verifique os dados e tente de novo.");
    }
  }

  return (
    <section id="adicionar-mapa" className="mt-10 scroll-mt-28 sm:mt-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-foreground" />
          <h2 className="font-ubuntu text-2xl font-black tracking-[-0.03em] text-foreground sm:text-3xl">
            Adicionar mapa
          </h2>
        </div>
        <a
          href="#adicionar-mapa-form"
          className="text-sm font-medium text-iris-blue-chambray underline underline-offset-4 transition-colors hover:text-iris-blue-chambray/80"
        >
          Preencher dados do mapa
        </a>
      </div>

      <form
        id="adicionar-mapa-form"
        onSubmit={handleSubmit}
        className="rounded-2xl bg-powder-blue p-4 text-powder-blue-foreground sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="space-y-2">
            <Label htmlFor="mapa-name">Nome</Label>
            <Input
              id="mapa-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria"
              className="border-white bg-white placeholder:text-muted-foreground/70"
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapa-date">Data completa</Label>
            <Input
              id="mapa-date"
              inputMode="numeric"
              autoComplete="off"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="dia/mês/ano AAAA — ex: 07/03/1990"
              className="border-white bg-white placeholder:text-muted-foreground/70"
            />
            <p className="text-xs text-powder-blue-foreground/70">Também aceita AAAA-MM-DD (outros idiomas).</p>
            {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapa-time">
              Horário <span className="font-normal text-powder-blue-foreground/70">(opcional)</span>
            </Label>
            <Input
              id="mapa-time"
              inputMode="numeric"
              autoComplete="off"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="HH:MM — ex: 14:30"
              className="border-white bg-white placeholder:text-muted-foreground/70"
            />
            {errors.time ? <p className="text-xs text-destructive">{errors.time}</p> : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapa-city">Cidade Estado País</Label>
            <CityBirthAutocomplete
              key={cityKey}
              id="mapa-city"
              value={city}
              onChange={setCity}
              placeholder="Digite a cidade para buscar"
              className="border-white bg-white placeholder:text-muted-foreground/70"
            />
            {errors.city ? <p className="text-xs text-destructive">{errors.city}</p> : null}
          </div>
        </div>

        {submitError ? <p className="mt-4 text-sm text-destructive">{submitError}</p> : null}

        <div className="mt-6 flex justify-end">
          <Button type="submit" className="rounded-full bg-foreground px-8 text-background hover:bg-foreground/90">
            <Plus className="h-4 w-4" />
            Adicionar mapa
          </Button>
        </div>
      </form>
    </section>
  );
}

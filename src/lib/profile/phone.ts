const E164_LIKE = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function normalizePhoneCountry(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "+55";
  }

  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  const digits = withPlus.replace(/[^\d+]/g, "").slice(0, 8);
  return digits.length > 1 ? digits : "+55";
}

export function toStoredPhone(country: string, national: string) {
  const digits = normalizePhoneDigits(national);
  return digits.length > 0 ? digits : null;
}

export function toStoredWhatsapp(value: string, country = "+55") {
  const trimmed = value.trim();
  const digits = normalizePhoneDigits(trimmed);
  if (!digits) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  const countryDigits = normalizePhoneDigits(country);
  if (countryDigits && digits.startsWith(countryDigits)) {
    return `+${digits}`;
  }

  return `+${countryDigits}${digits}`;
}

export function isLikelyPhone(value: string | null) {
  if (!value) {
    return true;
  }

  const digits = normalizePhoneDigits(value);
  return digits.length >= 8 && digits.length <= 15;
}

export function isLikelyWhatsapp(value: string | null) {
  if (!value) {
    return true;
  }

  return E164_LIKE.test(value) || normalizePhoneDigits(value).length >= 8;
}

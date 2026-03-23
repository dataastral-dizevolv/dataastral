from flask import Flask, request, jsonify
from flask_cors import CORS
import swisseph as swe
from datetime import datetime
import pytz
import os
import requests
import math


app = Flask(__name__)
CORS(app)


def get_julian_day(year, month, day, hour, minute, timezone_str):
    dt_local = datetime(year, month, day, hour, minute)
    tz_local = pytz.timezone(timezone_str)
    dt_utc = tz_local.localize(dt_local).astimezone(pytz.utc)
    return swe.utc_to_jd(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour, dt_utc.minute, dt_utc.second, 1)[1]


def get_natal_positions(jd, planet_list):
    positions = {}
    for name, planet_id in planet_list.items():
        pos = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH)[0]
        positions[name] = pos[0]
    return positions


def find_next_aspect(start_jd, natal_positions, planet_tr, aspect_angle, orbe=1.0, search_days=365):
    jd = start_jd
    planeta_transito_nome = swe.get_planet_name(planet_tr)
    for _ in range(int(search_days)):
        jd += 1
        pos_tr = swe.calc_ut(jd, planet_tr, swe.FLG_SWIEPH)[0][0]
        for natal_planet_name, natal_pos in natal_positions.items():
            angle_diff = abs(pos_tr - natal_pos)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            if abs(angle_diff - aspect_angle) < orbe:
                dt_tuple = swe.jdet_to_utc(jd)
                event_date = datetime(int(dt_tuple[0]), int(dt_tuple[1]), int(dt_tuple[2]), int(dt_tuple[3]), int(dt_tuple[4]))
                return {
                    "data": event_date.strftime(f"{event_date.day} de {MESES_PT[event_date.month]} de {event_date.year}"),
                    "planeta_transito": planeta_transito_nome.capitalize(),
                    "aspecto": "conjunção" if aspect_angle == 0 else "trígono",
                    "planeta_natal": natal_planet_name.capitalize(),
                    "aspect_angle": aspect_angle,
                    "orb_delta": abs(angle_diff - aspect_angle),
                }
    return None


def is_planet_retrograde(jd, planet_id):
    try:
        pos = swe.calc_ut(jd, planet_id, swe.FLG_SPEED)[0]
        speed = pos[3]
        return math.isfinite(speed) and speed < 0
    except Exception:
        return False


def get_planet_longitude(jd, planet_id):
    try:
        pos = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH)[0]
        return pos[0]
    except Exception:
        return None


def find_return_to_longitude(start_jd, transit_planet_id, target_longitude, orb, search_days):
    jd = start_jd
    for _ in range(int(search_days)):
        jd += 1
        try:
            pos_tr = swe.calc_ut(jd, transit_planet_id, swe.FLG_SWIEPH)[0][0]
        except Exception:
            continue

        angle_diff = abs(pos_tr - target_longitude)
        if angle_diff > 180:
            angle_diff = 360 - angle_diff

        if angle_diff < orb:
            return {
                "dateIso": jd_to_iso(jd),
                "transitPlanetId": transit_planet_id,
            }

    return None


PLANET_LABELS = {
    0: "Sol",
    1: "Lua",
    2: "Mercúrio",
    3: "Vênus",
    4: "Marte",
    5: "Júpiter",
    6: "Saturno",
    7: "Urano",
    8: "Netuno",
    9: "Plutão",
    15: "Quíron",
}

THEME_LABELS = {
    "financas": "Finanças",
    "amor": "Amor",
}

ASPECT_LABELS = {
    0: "conjunção",
    60: "sextil",
    90: "quadratura",
    120: "trígono",
    150: "quincúncio",
    180: "oposição",
}

MESES_PT = {
    1: "janeiro",
    2: "fevereiro",
    3: "março",
    4: "abril",
    5: "maio",
    6: "junho",
    7: "julho",
    8: "agosto",
    9: "setembro",
    10: "outubro",
    11: "novembro",
    12: "dezembro",
}


def format_date_label(iso_string):
    dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
    return f"{dt.day} de {MESES_PT[dt.month]} de {dt.year}"


def jd_to_iso(jd):
    dt_tuple = swe.jdet_to_utc(jd)
    year = int(dt_tuple[0])
    month = int(dt_tuple[1])
    day = int(dt_tuple[2])
    hour = int(dt_tuple[3])
    minute = int(dt_tuple[4])
    second = int(dt_tuple[5]) if len(dt_tuple) > 5 else 0
    return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}.000Z"


def fetch_rules(theme):
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes")

    url = f"{supabase_url}/rest/v1/astrology_rules"
    params = {
        "theme_id": f"eq.{theme}",
        "active": "eq.true",
        "order": "priority.asc,id.asc",
        "select": "id,theme_id,transit_planet_id,natal_planets,aspect_angle,search_days,orb,template_text,priority,synastry_mode,retrograde_logic,requires_conflict_date",
    }
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }

    response = requests.get(url, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def fetch_calendar_rules():
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes")

    url = f"{supabase_url}/rest/v1/astrology_rules"
    params = {
        "theme_id": "in.(financas,amor)",
        "active": "eq.true",
        "order": "priority.asc,id.asc",
        "select": "id,theme_id,transit_planet_id,natal_planets,aspect_angle,search_days,orb,template_text,priority",
    }
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }

    response = requests.get(url, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def render_template(template, context):
    return (
        template.replace("{transit_planet}", str(context.get("transit_planet", "")))
        .replace("{natal_planet}", str(context.get("natal_planet", "")))
        .replace("{aspect}", str(context.get("aspect", "")))
        .replace("{aspect_angle}", str(context.get("aspect_angle", "")))
    )


def parse_birth_date(date_string):
    return datetime.strptime(date_string, "%Y-%m-%d")


def parse_birth_time(time_string):
    if not time_string:
        return 12, 0
    parts = time_string.split(":")
    return int(parts[0]), int(parts[1])


def normalize_angle_diff(a, b):
    diff = abs(a - b)
    if diff > 180:
        diff = 360 - diff
    return diff


def to_iso_date(year, month, day):
    return f"{year:04d}-{month:02d}-{day:02d}"


def days_in_month(year, month):
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)

    current_month = datetime(year, month, 1)
    return (next_month - current_month).days


def get_today_jd():
    now = datetime.utcnow()
    return swe.utc_to_jd(now.year, now.month, now.day, 0, 0, 0, 1)[1]


def scan_ephemerides_month(body):
    year = int(body.get("year", 0))
    month = int(body.get("month", 0))

    if year < 1900 or year > 2200 or month < 1 or month > 12:
        raise RuntimeError("Parâmetros inválidos para varredura mensal")

    birth_date = body.get("birthDate")
    birth_timezone = body.get("birthTimezone")

    if not birth_date or not birth_timezone:
        raise RuntimeError("birthDate e birthTimezone são obrigatórios")

    birth_dt = parse_birth_date(birth_date)
    birth_hour, birth_minute = parse_birth_time(body.get("birthTime"))
    rules = fetch_calendar_rules()

    if not rules:
        return {"events": []}

    natal_planet_ids = []
    for rule in rules:
        for pid in rule.get("natal_planets", []):
            if pid not in natal_planet_ids:
                natal_planet_ids.append(pid)

    natal_planets = {PLANET_LABELS.get(pid, f"Planeta {pid}"): pid for pid in natal_planet_ids}
    natal_jd = get_julian_day(birth_dt.year, birth_dt.month, birth_dt.day, birth_hour, birth_minute, birth_timezone)
    natal_positions = get_natal_positions(natal_jd, natal_planets)

    today_jd = get_today_jd()
    total_days = days_in_month(year, month)
    events = []
    seen = set()

    for day in range(1, total_days + 1):
        jd = swe.utc_to_jd(year, month, day, 0, 0, 0, 1)[1]
        if jd <= today_jd:
            continue

        data_iso = to_iso_date(year, month, day)

        for rule in rules:
            search_days = int(rule.get("search_days", 0))
            if search_days <= 0:
                continue

            if jd - today_jd > search_days:
                continue

            transit_planet_id = int(rule.get("transit_planet_id"))
            aspect_angle = int(rule.get("aspect_angle"))
            orb = float(rule.get("orb", 1.0))
            transit_name = swe.get_planet_name(transit_planet_id).capitalize()
            transit_pos = swe.calc_ut(jd, transit_planet_id, swe.FLG_SWIEPH)[0][0]

            for natal_planet_id in rule.get("natal_planets", []):
                natal_name = PLANET_LABELS.get(natal_planet_id, f"Planeta {natal_planet_id}")
                natal_pos = natal_positions.get(natal_name)

                if natal_pos is None:
                    continue

                angle_diff = normalize_angle_diff(transit_pos, natal_pos)

                if abs(angle_diff - aspect_angle) < orb:
                    aspecto = "conjunção" if aspect_angle == 0 else "trígono"
                    key = f"{data_iso}:{rule.get('id')}:{transit_planet_id}:{natal_planet_id}:{aspect_angle}"
                    if key in seen:
                        continue

                    seen.add(key)
                    descricao = render_template(
                        rule.get("template_text", ""),
                        {
                            "transit_planet": transit_name,
                            "natal_planet": natal_name,
                            "aspect": aspecto,
                            "aspect_angle": aspect_angle,
                        },
                    )

                    events.append(
                        {
                            "id": key,
                            "data": data_iso,
                            "titulo": f"{transit_name} em {aspecto} com {natal_name}",
                            "descricao": descricao,
                            "tipo": "portal" if aspect_angle == 0 else "harmonia",
                            "planeta": transit_name,
                            "aspecto": aspecto,
                            "tema": THEME_LABELS.get(rule.get("theme_id"), "Tema"),
                        }
                    )

    events.sort(key=lambda event: (event["data"], event["id"]))
    return {"events": events}


def date_label_to_iso(label):
    try:
        dt = datetime.strptime(label, "%d de %B de %Y")
    except Exception:
        try:
            day_str, _, month_name, _, year_str = label.split(" ")
            month_num = next((k for k, v in MESES_PT.items() if v == month_name.lower()), None)
            if month_num is None:
                return ""
            dt = datetime(int(year_str), int(month_num), int(day_str))
        except Exception:
            return ""
    return f"{dt.year:04d}-{dt.month:02d}-{dt.day:02d}T00:00:00.000Z"


def run_engine(body):
    rules = fetch_rules(body["theme"])
    if not rules:
        return {
            "prediction": "Este tema ainda não possui regras cadastradas no motor.",
            "eventDate": "Tema em calibração",
            "eventDateIso": "",
            "code": "NO_RULES_FOR_THEME",
        }

    birth_dt = parse_birth_date(body["birthDate"])
    birth_hour, birth_minute = parse_birth_time(body.get("birthTime"))
    birth_timezone = body.get("birthTimezone")
    if not birth_timezone:
        raise RuntimeError("birthTimezone ausente")

    natal_planet_ids = []
    for rule in rules:
        for pid in rule.get("natal_planets", []):
            if pid not in natal_planet_ids:
                natal_planet_ids.append(pid)

    user_planets = {PLANET_LABELS.get(pid, f"Planeta {pid}"): pid for pid in natal_planet_ids}
    user_jd = get_julian_day(birth_dt.year, birth_dt.month, birth_dt.day, birth_hour, birth_minute, birth_timezone)
    user_natal = get_natal_positions(user_jd, user_planets)

    target_natal = None
    target_birth_date = body.get("targetBirthDate")
    target_birth_timezone = body.get("targetBirthTimezone")
    if target_birth_date and target_birth_timezone:
        try:
            target_dt = parse_birth_date(target_birth_date)
            target_hour, target_minute = parse_birth_time(body.get("targetBirthTime"))
            target_jd = get_julian_day(
                target_dt.year,
                target_dt.month,
                target_dt.day,
                target_hour,
                target_minute,
                target_birth_timezone,
            )
            target_natal = get_natal_positions(target_jd, user_planets)
        except Exception:
            target_natal = None

    conflict_jd = None
    conflict_date = body.get("conflictDate")
    if conflict_date:
        try:
            conflict_dt = parse_birth_date(conflict_date)
            conflict_jd = get_julian_day(conflict_dt.year, conflict_dt.month, conflict_dt.day, 12, 0, "UTC")
        except Exception:
            conflict_jd = None

    now = datetime.utcnow()
    start_jd = swe.utc_to_jd(now.year, now.month, now.day, 0, 0, 0, 1)[1]

    for rule in rules:
        synastry_mode = bool(rule.get("synastry_mode"))
        retrograde_logic = bool(rule.get("retrograde_logic"))
        transit_planet_id = int(rule.get("transit_planet_id"))
        aspect_angle = int(rule.get("aspect_angle"))
        orb = float(rule.get("orb"))
        search_days = int(rule.get("search_days"))
        template_text = rule.get("template_text", "")

        if synastry_mode and target_natal is None:
            continue

        if retrograde_logic:
            if conflict_jd is None:
                continue

            was_mercury_retrograde = is_planet_retrograde(conflict_jd, 2)
            if not was_mercury_retrograde:
                continue

            conflict_longitude = get_planet_longitude(conflict_jd, 2)
            if conflict_longitude is None:
                continue

            return_event = find_return_to_longitude(start_jd, 2, conflict_longitude, orb, search_days)
            if not return_event:
                continue

            event_date_iso = return_event["dateIso"]
            prediction = render_template(
                template_text,
                {
                    "transit_planet": PLANET_LABELS.get(2, "Mercúrio"),
                    "natal_planet": PLANET_LABELS.get(2, "Mercúrio"),
                    "aspect": "retorno ao grau do conflito",
                    "aspect_angle": 0,
                },
            )

            return {
                "prediction": prediction,
                "eventDate": format_date_label(event_date_iso),
                "eventDateIso": event_date_iso,
                "code": "RETROGRADE_RETURN_FOUND",
                "transitPlanet": PLANET_LABELS.get(2, "Mercúrio"),
                "natalPlanet": PLANET_LABELS.get(2, "Mercúrio"),
                "aspectAngle": 0,
                "orbDelta": None,
            }

        natal_to_use = target_natal if synastry_mode else user_natal
        event = find_next_aspect(
            start_jd,
            natal_to_use,
            transit_planet_id,
            aspect_angle,
            orb,
            search_days,
        )
        if not event:
            continue

        event_date_iso = date_label_to_iso(event["data"])
        prediction = render_template(
            template_text,
            {
                "transit_planet": PLANET_LABELS.get(transit_planet_id, f"Planeta {transit_planet_id}"),
                "natal_planet": event.get("planeta_natal", ""),
                "aspect": ASPECT_LABELS.get(aspect_angle, f"{aspect_angle} graus"),
                "aspect_angle": aspect_angle,
            },
        )

        return {
            "prediction": prediction,
            "eventDate": event.get("data", ""),
            "eventDateIso": event_date_iso,
            "code": "ASPECT_FOUND",
            "transitPlanet": PLANET_LABELS.get(transit_planet_id, f"Planeta {transit_planet_id}"),
            "natalPlanet": event.get("planeta_natal", ""),
            "aspectAngle": event.get("aspect_angle"),
            "orbDelta": event.get("orb_delta"),
            "technicalDetails": {
                "transitPlanet": PLANET_LABELS.get(transit_planet_id, f"Planeta {transit_planet_id}"),
                "natalPlanet": event.get("planeta_natal", ""),
                "aspectAngle": event.get("aspect_angle"),
                "orbDelta": event.get("orb_delta"),
            },
        }

    return {
        "prediction": "Tente outra pergunta.",
        "eventDate": "Nenhum trânsito relevante encontrado.",
        "eventDateIso": "",
        "code": "NO_RELEVANT_ASPECT_FOUND",
    }


@app.route('/api/engine', methods=['POST'])
def handler():
    body = request.get_json() or {}
    try:
        result = run_engine(body)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e), "code": "ENGINE_ERROR"}), 500


@app.route('/api/ephemerides', methods=['POST'])
def handler_ephemerides():
    body = request.get_json() or {}
    try:
        result = scan_ephemerides_month(body)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e), "code": "ENGINE_ERROR"}), 500

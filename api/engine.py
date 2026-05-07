from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import swisseph as swe
from datetime import datetime, timezone
import pytz
import os
import requests
import math
import importlib
import re

try:
    import kerykeion
except Exception:
    kerykeion = None


def _resolve_kerykeion_class(class_name):
    if kerykeion is not None:
        candidate = getattr(kerykeion, class_name, None)
        if candidate is not None:
            return candidate

    module_candidates = [
        "kerykeion",
        "kerykeion.factory",
        "kerykeion.factories",
        "kerykeion.charts",
        "kerykeion.chart",
        "kerykeion.chart_data",
        "kerykeion.chart_data_factory",
        "kerykeion.chart_drawer",
    ]

    for module_name in module_candidates:
        try:
            module = importlib.import_module(module_name)
        except Exception:
            continue

        candidate = getattr(module, class_name, None)
        if candidate is not None:
            return candidate

    return None


KrInstance = _resolve_kerykeion_class("KrInstance")
AspectsFactory = _resolve_kerykeion_class("AspectsFactory")
AstrologicalSubjectFactory = _resolve_kerykeion_class("AstrologicalSubjectFactory")
ChartDataFactory = _resolve_kerykeion_class("ChartDataFactory")
ChartDrawer = _resolve_kerykeion_class("ChartDrawer")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(ROOT_DIR, ".env.local"), override=False)
load_dotenv(os.path.join(API_DIR, ".env"), override=False)

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)


def get_supabase_admin_env():
    supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    service_role_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()

    if not supabase_url:
        raise RuntimeError("Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")

    if not service_role_key:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY.")

    return supabase_url, service_role_key


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

SKY_DEFAULT_LAT = -23.55
SKY_DEFAULT_LON = -46.63
SKY_DEFAULT_TZ = "UTC"

SKY_PLANET_ORDER = [
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
]

PLANET_SYMBOLS = {
    "Sun": "☉",
    "Moon": "☽",
    "Mercury": "☿",
    "Venus": "♀",
    "Mars": "♂",
    "Jupiter": "♃",
    "Saturn": "♄",
    "Uranus": "♅",
    "Neptune": "♆",
    "Pluto": "♇",
}

ASPECT_COLORS = {
    "conjunction": "hsl(4, 65%, 46%)",
    "opposition": "hsl(4, 65%, 46%)",
    "square": "hsl(4, 65%, 46%)",
    "trine": "hsl(145, 54%, 42%)",
    "sextile": "hsl(145, 54%, 42%)",
    "quincunx": "hsl(282, 41%, 54%)",
}

SKY_PLANET_IDS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
}

SKY_ASPECTS_BY_ANGLE = {
    0: "conjunction",
    60: "sextile",
    90: "square",
    120: "trine",
    150: "quincunx",
    180: "opposition",
}

PLANET_NAME_ALIASES = {
    "sun": "Sun",
    "sol": "Sun",
    "moon": "Moon",
    "lua": "Moon",
    "mercury": "Mercury",
    "mercurio": "Mercury",
    "mercúrio": "Mercury",
    "venus": "Venus",
    "vênus": "Venus",
    "mars": "Mars",
    "marte": "Mars",
    "jupiter": "Jupiter",
    "júpiter": "Jupiter",
    "saturn": "Saturn",
    "saturno": "Saturn",
    "uranus": "Uranus",
    "urano": "Uranus",
    "neptune": "Neptune",
    "netuno": "Neptune",
    "pluto": "Pluto",
    "plutão": "Pluto",
}

PLANET_ID_TO_NAME = {
    swe.SUN: "Sun",
    swe.MOON: "Moon",
    swe.MERCURY: "Mercury",
    swe.VENUS: "Venus",
    swe.MARS: "Mars",
    swe.JUPITER: "Jupiter",
    swe.SATURN: "Saturn",
    swe.URANUS: "Uranus",
    swe.NEPTUNE: "Neptune",
    swe.PLUTO: "Pluto",
}

ANGLE_KEYS = [
    "angle",
    "abs_pos",
    "absolute_position",
    "longitude",
    "lon",
    "degree",
    "degrees",
    "position",
]

VISUAL_ANGLE_KEYS = [
    "visual_angle",
    "display_angle",
    "adjusted_angle",
    "draw_angle",
    "glyph_angle",
    "label_angle",
]


def _normalize_angle(angle):
    return float(angle) % 360


def _to_number(value):
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except Exception:
            return None
    return None


def _coerce_planet_name(raw_value):
    if isinstance(raw_value, str):
        key = raw_value.strip().lower()
        if key in PLANET_NAME_ALIASES:
            return PLANET_NAME_ALIASES[key]
        if raw_value in SKY_PLANET_ORDER:
            return raw_value
    if isinstance(raw_value, (int, float)):
        return PLANET_ID_TO_NAME.get(int(raw_value))
    return None


def _extract_attr_angle(raw_value):
    if raw_value is None:
        return None
    if isinstance(raw_value, dict):
        for key in ANGLE_KEYS:
            if key in raw_value:
                number = _to_number(raw_value.get(key))
                if number is not None:
                    return _normalize_angle(number)
        return None

    for key in ANGLE_KEYS:
        number = _to_number(getattr(raw_value, key, None))
        if number is not None:
            return _normalize_angle(number)
    return None


def _extract_planets_visual_from_payload(payload):
    if payload is None:
        return {}

    found = {}
    visited = set()

    def walk(node, depth=0):
        if depth > 8:
            return

        node_id = id(node)
        if node_id in visited:
            return
        visited.add(node_id)

        if isinstance(node, dict):
            candidate_name = _coerce_planet_name(node.get("name") or node.get("planet") or node.get("label"))

            angle = None
            for key in ANGLE_KEYS:
                if key in node:
                    angle = _to_number(node.get(key))
                    if angle is not None:
                        angle = _normalize_angle(angle)
                        break

            visual_angle = None
            for key in VISUAL_ANGLE_KEYS:
                if key in node:
                    visual_angle = _to_number(node.get(key))
                    if visual_angle is not None:
                        visual_angle = _normalize_angle(visual_angle)
                        break

            if candidate_name and angle is not None:
                existing = found.get(candidate_name)
                candidate = {
                    "angle": angle,
                    "visual_angle": visual_angle if visual_angle is not None else angle,
                }
                if existing is None or (
                    existing.get("visual_angle") == existing.get("angle") and candidate["visual_angle"] != candidate["angle"]
                ):
                    found[candidate_name] = candidate

            for value in node.values():
                if isinstance(value, (dict, list, tuple)):
                    walk(value, depth + 1)
            return

        if isinstance(node, (list, tuple)):
            for item in node:
                if isinstance(item, (dict, list, tuple)):
                    walk(item, depth + 1)
            return

        if hasattr(node, "__dict__"):
            walk(vars(node), depth + 1)

    walk(payload)
    return found


def _extract_houses_from_subject(subject):
    houses = []
    house_names = [
        "first_house",
        "second_house",
        "third_house",
        "fourth_house",
        "fifth_house",
        "sixth_house",
        "seventh_house",
        "eighth_house",
        "ninth_house",
        "tenth_house",
        "eleventh_house",
        "twelfth_house",
    ]

    for house_name in house_names:
        house = getattr(subject, house_name, None)
        angle = _extract_attr_angle(house)
        houses.append(angle if angle is not None else 0.0)

    return houses


def _extract_angles_from_subject(subject, houses):
    asc = _extract_ascendant(subject)
    mc = _extract_attr_angle(getattr(subject, "mc", None))

    if mc is None:
        tenth_house = getattr(subject, "tenth_house", None)
        mc = _extract_attr_angle(tenth_house)

    if mc is None and len(houses) >= 10:
        mc = _to_number(houses[9])

    mc = _normalize_angle(mc if mc is not None else 90.0)

    return {
        "asc": _normalize_angle(asc),
        "desc": _normalize_angle(asc + 180.0),
        "mc": mc,
        "ic": _normalize_angle(mc + 180.0),
    }


def _extract_houses_with_swe(jd_ut, lat, lon):
    try:
        house_cusps, _ = swe.houses(jd_ut, lat, lon)
        if len(house_cusps) >= 12:
            return [_normalize_angle(cusp) for cusp in house_cusps[:12]]
    except Exception:
        pass
    return [float(index * 30) for index in range(12)]


def _to_float(value, default):
    try:
        return float(value)
    except Exception:
        return default


def _sign_from_abs_pos(abs_pos):
    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    index = int((float(abs_pos) % 360) // 30)
    return signs[index]


def _extract_subject_planets(subject):
    planets = []

    for planet_name in SKY_PLANET_ORDER:
        attr_name = planet_name.lower()
        point = getattr(subject, attr_name, None)
        if point is None:
            continue

        angle = _to_float(getattr(point, "abs_pos", 0.0), 0.0) % 360
        sign = getattr(point, "sign", "") or _sign_from_abs_pos(angle)
        planets.append(
            {
                "name": planet_name,
                "symbol": PLANET_SYMBOLS.get(planet_name, ""),
                "angle": angle,
                "sign": sign,
            }
        )

    return planets


def _extract_subject_planets_with_visual(subject, visual_angles_by_name):
    planets = _extract_subject_planets(subject)

    for planet in planets:
        visual_data = visual_angles_by_name.get(planet["name"], {})
        visual_angle = visual_data.get("visual_angle")
        if visual_angle is None:
            visual_angle = planet["angle"]
        planet["visual_angle"] = _normalize_angle(visual_angle)

    return planets


def _extract_ascendant(subject):
    asc = getattr(subject, "first_house", None)
    if asc is not None:
        return _to_float(getattr(asc, "abs_pos", 0.0), 0.0) % 360

    asc_sign = getattr(subject, "asc", None)
    if isinstance(asc_sign, dict):
        return _to_float(asc_sign.get("abs_pos"), 0.0) % 360

    return 0.0


def _extract_aspects_from_factory(subject):
    if AspectsFactory is None:
        return []

    try:
        result = AspectsFactory.single_chart_aspects(subject)
        aspects = []
        for aspect in getattr(result, "aspects", []):
            raw_name = str(getattr(aspect, "aspect", "")).lower()
            if not raw_name:
                continue

            aspects.append(
                {
                    "from": str(getattr(aspect, "p1_name", "")),
                    "to": str(getattr(aspect, "p2_name", "")),
                    "color": ASPECT_COLORS.get(raw_name, "hsl(282, 41%, 54%)"),
                }
            )
        return aspects
    except Exception:
        return []


def _instantiate_chart_data(subject):
    if ChartDataFactory is None:
        return None

    constructors = [
        lambda: ChartDataFactory(subject),
        lambda: ChartDataFactory(astrological_subject=subject),
        lambda: ChartDataFactory(subject=subject),
    ]

    factory_instance = None
    for constructor in constructors:
        try:
            factory_instance = constructor()
            break
        except Exception:
            continue

    if factory_instance is None:
        return None

    if isinstance(factory_instance, (dict, list, tuple)):
        return factory_instance

    for method_name in ["get_chart_data", "build", "to_dict"]:
        method = getattr(factory_instance, method_name, None)
        if callable(method):
            try:
                data = method()
                if data is not None:
                    return data
            except Exception:
                continue

    for attr_name in ["chart_data", "data", "result"]:
        data = getattr(factory_instance, attr_name, None)
        if data is not None:
            return data

    return factory_instance


def _instantiate_chart_drawer(subject, chart_data):
    if ChartDrawer is None:
        return None

    constructors = [
        lambda: ChartDrawer(chart_data),
        lambda: ChartDrawer(chart_data=chart_data),
        lambda: ChartDrawer(astrological_subject=subject, chart_data=chart_data),
        lambda: ChartDrawer(subject=subject, chart_data=chart_data),
        lambda: ChartDrawer(subject),
    ]

    for constructor in constructors:
        try:
            return constructor()
        except Exception:
            continue

    return None


def _extract_chart_payload(subject):
    chart_data = _instantiate_chart_data(subject)
    chart_drawer = _instantiate_chart_drawer(subject, chart_data)

    payload_candidates = [chart_data]

    if chart_drawer is not None:
        for method_name in ["get_chart_data", "to_dict"]:
            method = getattr(chart_drawer, method_name, None)
            if callable(method):
                try:
                    payload = method()
                    if payload is not None and not isinstance(payload, str):
                        payload_candidates.append(payload)
                except Exception:
                    continue

        for attr_name in ["chart_data", "data", "points", "planets"]:
            payload = getattr(chart_drawer, attr_name, None)
            if payload is not None:
                payload_candidates.append(payload)

        payload_candidates.append(chart_drawer)

    for payload in payload_candidates:
        extracted = _extract_planets_visual_from_payload(payload)
        if extracted:
            return extracted

    return {}


def _angle_delta(angle_a, angle_b):
    delta = abs((angle_a - angle_b) % 360)
    if delta > 180:
        delta = 360 - delta
    return delta


def _calc_swe_julian_day(now_utc):
    hour_float = now_utc.hour + (now_utc.minute / 60.0) + (now_utc.second / 3600.0)
    return swe.julday(now_utc.year, now_utc.month, now_utc.day, hour_float)


def _extract_planets_with_swe(jd_ut):
    planets = []

    for planet_name in SKY_PLANET_ORDER:
        planet_id = SKY_PLANET_IDS.get(planet_name)
        if planet_id is None:
            continue

        try:
            angle = float(swe.calc_ut(jd_ut, planet_id, swe.FLG_SWIEPH)[0][0]) % 360
        except Exception:
            continue

        planets.append(
            {
                "name": planet_name,
                "symbol": PLANET_SYMBOLS.get(planet_name, ""),
                "angle": angle,
                "visual_angle": angle,
                "sign": _sign_from_abs_pos(angle),
            }
        )

    return planets


def _extract_aspects_from_planets(planets, orb=4.0):
    aspects = []

    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            p1 = planets[i]
            p2 = planets[j]
            delta = _angle_delta(p1.get("angle", 0.0), p2.get("angle", 0.0))

            for target, aspect_name in SKY_ASPECTS_BY_ANGLE.items():
                if abs(delta - target) <= orb:
                    aspects.append(
                        {
                            "from": p1.get("name", ""),
                            "to": p2.get("name", ""),
                            "color": ASPECT_COLORS.get(aspect_name, "hsl(282, 41%, 54%)"),
                        }
                    )
                    break

    return aspects


def _extract_angles_with_swe(jd_ut, lat, lon):
    try:
        _, ascmc = swe.houses(jd_ut, lat, lon)
        if len(ascmc) > 1:
            asc = _normalize_angle(_to_float(ascmc[0], 0.0))
            mc = _normalize_angle(_to_float(ascmc[1], 90.0))
            return {
                "asc": asc,
                "desc": _normalize_angle(asc + 180.0),
                "mc": mc,
                "ic": _normalize_angle(mc + 180.0),
            }
    except Exception:
        pass

    return {
        "asc": 0.0,
        "desc": 180.0,
        "mc": 90.0,
        "ic": 270.0,
    }


def _build_sky_now_with_swe(now_utc, lat, lon):
    jd_ut = _calc_swe_julian_day(now_utc)
    planets = _extract_planets_with_swe(jd_ut)
    aspects = _extract_aspects_from_planets(planets)
    angles = _extract_angles_with_swe(jd_ut, lat, lon)
    houses = _extract_houses_with_swe(jd_ut, lat, lon)

    return {
        "planets": planets,
        "aspects": aspects,
        "houses": houses,
        "angles": angles,
        "ascendant": angles["asc"],
    }


def _build_subject_now_with_kr_instance(now_utc, lat, lon, tz_str):
    if KrInstance is None:
        return None

    subject = KrInstance(
        "Sky Now",
        now_utc.year,
        now_utc.month,
        now_utc.day,
        now_utc.hour,
        now_utc.minute,
        "Sao Paulo",
        "BR",
        lon=lon,
        lat=lat,
        tz_str=tz_str,
    )

    if hasattr(subject, "get_all"):
        subject.get_all()

    return subject


def _build_subject_now_with_factory(now_utc, lat, lon, tz_str):
    if AstrologicalSubjectFactory is None:
        raise RuntimeError("kerykeion indisponível")

    return AstrologicalSubjectFactory.from_birth_data(
        name="Sky Now",
        year=now_utc.year,
        month=now_utc.month,
        day=now_utc.day,
        hour=now_utc.hour,
        minute=now_utc.minute,
        lng=lon,
        lat=lat,
        tz_str=tz_str,
        online=False,
    )


def get_sky_now_data(lat, lon):
    now_utc = datetime.now(timezone.utc)

    subject = None
    if KrInstance is not None:
        try:
            subject = _build_subject_now_with_kr_instance(now_utc, lat, lon, SKY_DEFAULT_TZ)
        except Exception:
            subject = None

    if subject is None and AstrologicalSubjectFactory is not None:
        try:
            subject = _build_subject_now_with_factory(now_utc, lat, lon, SKY_DEFAULT_TZ)
        except Exception:
            subject = None

    if subject is not None:
        chart_visual_payload = _extract_chart_payload(subject)
        planets = _extract_subject_planets_with_visual(subject, chart_visual_payload)
        aspects = _extract_aspects_from_factory(subject)
        if len(aspects) == 0:
            aspects = _extract_aspects_from_planets(planets)
        houses = _extract_houses_from_subject(subject)
        if len(houses) != 12 or all(_to_number(cusp) in [None, 0.0] for cusp in houses):
            houses = _extract_houses_with_swe(_calc_swe_julian_day(now_utc), lat, lon)
        angles = _extract_angles_from_subject(subject, houses)

        return {
            "planets": planets,
            "aspects": aspects,
            "houses": houses,
            "angles": angles,
            "ascendant": angles["asc"],
        }

    return _build_sky_now_with_swe(now_utc, lat, lon)


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
    supabase_url, service_role_key = get_supabase_admin_env()

    url = f"{supabase_url}/rest/v1/astrology_rules"
    params = {
        "theme_id": f"eq.{theme}",
        "active": "eq.true",
        "order": "priority.asc,id.asc",
        "select": "id,theme_id,transit_planet_id,natal_planets,aspect_angle,search_days,orb,template_text,template_audio,template_whatsapp,priority,synastry_mode,retrograde_logic,requires_conflict_date",
    }
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }

    response = requests.get(url, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def fetch_calendar_rules():
    supabase_url, service_role_key = get_supabase_admin_env()

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


TEMPLATE_KEY_PATTERN = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")
TEMPLATE_DYNAMIC_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_]{1,62}$")


def stringify_template_value(value):
    if value is None:
        return ""

    if isinstance(value, (list, tuple, set)):
        parts = [str(item).strip() for item in value if str(item).strip() != ""]
        return ", ".join(parts)

    return str(value)


def build_template_context(body, static_context):
    context = {**static_context}
    dynamic_answers = body.get("dynamicAnswers")

    if not isinstance(dynamic_answers, dict):
        return context

    for key, value in dynamic_answers.items():
        if not isinstance(key, str):
            continue

        normalized_key = key.strip()
        if not TEMPLATE_DYNAMIC_KEY_PATTERN.match(normalized_key):
            continue

        if normalized_key in context:
            continue

        context[normalized_key] = stringify_template_value(value)

    return context


def render_template(template, context):
    if not isinstance(template, str):
        return ""

    def replacer(match):
        key = match.group(1)
        return stringify_template_value(context.get(key, ""))

    return TEMPLATE_KEY_PATTERN.sub(replacer, template)


def parse_birth_date(date_string):
    return datetime.strptime(date_string, "%Y-%m-%d")


def parse_birth_time(time_string):
    if time_string is None:
        return 12, 0

    if not isinstance(time_string, str):
        return 12, 0

    normalized_time = time_string.strip()
    if normalized_time == "":
        return 12, 0

    parts = normalized_time.split(":")
    if len(parts) != 2:
        return 12, 0

    try:
        hour = int(parts[0])
        minute = int(parts[1])
    except Exception:
        return 12, 0

    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        return 12, 0

    return hour, minute


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
    gender = body.get("gender")
    if isinstance(gender, str):
        gender = gender.strip().lower() or None
    else:
        gender = None

    rules = fetch_rules(body["theme"])
    if not rules:
        return {
            "prediction": "Este tema ainda não possui regras cadastradas no motor.",
            "prediction_text": "Este tema ainda não possui regras cadastradas no motor.",
            "audio_text": "Este tema ainda não possui regras cadastradas no motor.",
            "whatsapp_text": "Este tema ainda não possui regras cadastradas no motor.",
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
        template_audio = rule.get("template_audio") or template_text
        template_whatsapp = rule.get("template_whatsapp") or template_text

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
            template_context = build_template_context(
                body,
                {
                    "transit_planet": PLANET_LABELS.get(2, "Mercúrio"),
                    "natal_planet": PLANET_LABELS.get(2, "Mercúrio"),
                    "aspect": "retorno ao grau do conflito",
                    "aspect_angle": 0,
                },
            )
            prediction = render_template(
                template_text,
                template_context,
            )
            audio_text = render_template(
                template_audio,
                template_context,
            )
            whatsapp_text = render_template(
                template_whatsapp,
                template_context,
            )

            return {
                "prediction": prediction,
                "prediction_text": prediction,
                "audio_text": audio_text,
                "whatsapp_text": whatsapp_text,
                "eventDate": format_date_label(event_date_iso),
                "eventDateIso": event_date_iso,
                "code": "RETROGRADE_RETURN_FOUND",
                "transitPlanet": PLANET_LABELS.get(2, "Mercúrio"),
                "natalPlanet": PLANET_LABELS.get(2, "Mercúrio"),
                "aspectAngle": 0,
                "orbDelta": None,
                "technicalDetails": {
                    "gender": gender,
                },
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
        template_context = build_template_context(
            body,
            {
                "transit_planet": PLANET_LABELS.get(transit_planet_id, f"Planeta {transit_planet_id}"),
                "natal_planet": event.get("planeta_natal", ""),
                "aspect": ASPECT_LABELS.get(aspect_angle, f"{aspect_angle} graus"),
                "aspect_angle": aspect_angle,
            },
        )
        prediction = render_template(
            template_text,
            template_context,
        )
        audio_text = render_template(
            template_audio,
            template_context,
        )
        whatsapp_text = render_template(
            template_whatsapp,
            template_context,
        )

        return {
            "prediction": prediction,
            "prediction_text": prediction,
            "audio_text": audio_text,
            "whatsapp_text": whatsapp_text,
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
                "gender": gender,
            },
        }

    return {
        "prediction": "Tente outra pergunta.",
        "prediction_text": "Tente outra pergunta.",
        "audio_text": "Tente outra pergunta.",
        "whatsapp_text": "Tente outra pergunta.",
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


@app.route('/api/sky-now', methods=['GET'])
def handler_sky_now():
    try:
        lat = _to_float(request.args.get("lat"), SKY_DEFAULT_LAT)
        lon = _to_float(request.args.get("lon"), SKY_DEFAULT_LON)
        result = get_sky_now_data(lat, lon)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e), "code": "SKY_NOW_ERROR"}), 500

from __future__ import annotations

import argparse
import json
import math
import mimetypes
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from email import policy
from email.parser import BytesParser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from PIL import ExifTags, Image, ImageDraw, ImageFont

try:
    import cv2
except ImportError:  # Optional: a simpler numpy fallback remains available.
    cv2 = None


# PyInstaller keeps bundled read-only resources in _MEIPASS. Mutable projects
# and exports intentionally live beside the executable so a copied portable
# folder behaves exactly like the source version and remains easy to back up.
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).resolve().parent
    RESOURCE_DIR = Path(getattr(sys, "_MEIPASS", BASE_DIR))
else:
    BASE_DIR = Path(__file__).resolve().parent
    RESOURCE_DIR = BASE_DIR
STATIC_DIR = RESOURCE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
EXPORT_DIR = DATA_DIR / "exports"
PROJECT_DIR = DATA_DIR / "projects"
JOB_DIR = DATA_DIR / "jobs"
for directory in (EXPORT_DIR, PROJECT_DIR, JOB_DIR):
    directory.mkdir(parents=True, exist_ok=True)

EARTH_RADIUS_M = 6_378_137.0
TILE_SIZE = 256
MAX_TILES = 900
MAX_MOSAIC_PIXELS = 120_000_000

PROVIDERS = {
    "google_sat": "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    "google_hybrid": "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    "google_road": "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "esri": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "esri_street": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    "esri_topo": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    "osm": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "osm_hot": "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    "cyclosm": "https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    "opentopo": "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    "carto_light": "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    "carto_dark": "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    "carto_voyager": "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    "carto_light_nolabels": "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
    "carto_dark_nolabels": "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
    "amap_sat": "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    "amap_road": "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    "tencent_road": "https://rt0.map.gtimg.com/tile?z={z}&x={x}&y={y}&type=vector&styleid=0",
    "usgs_topo": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    "esri_natgeo": "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
    "esri_ocean": "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
    "esri_gray": "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
}

PROGRAM_FILES = Path(os.environ.get("ProgramFiles", r"C:\Program Files"))
SKETCHUP_CANDIDATES = [
    *(PROGRAM_FILES / "SketchUp" / f"SketchUp {year}" / "SketchUp" / "SketchUp.exe" for year in range(2027, 2016, -1)),
    Path(r"F:\QIAN-SU2022\SU2022\SketchUp.exe"),
]
AUTOCAD_CORE_CANDIDATES = [
    *(PROGRAM_FILES / "Autodesk" / f"AutoCAD {year}" / "accoreconsole.exe" for year in range(2027, 2016, -1)),
    Path(r"F:\CAD2021\AutoCAD 2021\accoreconsole.exe"),
    Path(r"F:\CAD2019\AutoCAD 2019\accoreconsole.exe"),
]


def first_existing(candidates: Iterable[Path]) -> Path | None:
    return next((p for p in candidates if p.exists()), None)


def clamp_lat(lat: float) -> float:
    return max(-85.05112878, min(85.05112878, lat))


def lon_to_world_px(lon: float, zoom: int) -> float:
    return (lon + 180.0) / 360.0 * (2**zoom) * TILE_SIZE


def lat_to_world_px(lat: float, zoom: int) -> float:
    lat = clamp_lat(lat)
    rad = math.radians(lat)
    return (1 - math.asinh(math.tan(rad)) / math.pi) / 2 * (2**zoom) * TILE_SIZE


def world_px_to_lon(x: float, zoom: int) -> float:
    return x / (TILE_SIZE * 2**zoom) * 360.0 - 180.0


def world_px_to_lat(y: float, zoom: int) -> float:
    n = math.pi - (2 * math.pi * y) / (TILE_SIZE * 2**zoom)
    return math.degrees(math.atan(math.sinh(n)))


def normalize_bounds(raw: Any) -> tuple[float, float, float, float]:
    if not isinstance(raw, (list, tuple)) or len(raw) != 4:
        raise ValueError("bounds 必须为 [west, south, east, north]")
    west, south, east, north = map(float, raw)
    if west >= east or south >= north:
        raise ValueError("研究区边界无效")
    if not (-180 <= west <= 180 and -180 <= east <= 180):
        raise ValueError("经度超出范围")
    return west, clamp_lat(south), east, clamp_lat(north)


def normalize_clip_polygon(raw: Any) -> list[tuple[float, float]]:
    if not raw:
        return []
    coordinates = raw.get("coordinates") if isinstance(raw, dict) else raw
    if isinstance(coordinates, list) and coordinates and isinstance(coordinates[0], list) and coordinates[0] and isinstance(coordinates[0][0], list):
        coordinates = coordinates[0]
    if not isinstance(coordinates, list):
        raise ValueError("异形识别范围格式无效")
    ring = [(float(point[0]), float(point[1])) for point in coordinates if isinstance(point, (list, tuple)) and len(point) >= 2]
    if len(ring) >= 2 and ring[0] == ring[-1]:
        ring.pop()
    if ring and len(ring) < 3:
        raise ValueError("异形识别范围至少需要 3 个点")
    return ring


def point_in_polygon(point: tuple[float, float], polygon: list[tuple[float, float]]) -> bool:
    if not polygon:
        return True
    x, y = point
    inside = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        crosses = (yi > y) != (yj > y)
        if crosses and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-15) + xi:
            inside = not inside
        j = i
    return inside


def feature_centroid(feature: dict[str, Any]) -> tuple[float, float]:
    coordinates = (feature.get("geometry") or {}).get("coordinates") or []
    ring = coordinates[0] if coordinates and isinstance(coordinates[0], list) else []
    points = [(float(point[0]), float(point[1])) for point in ring if isinstance(point, list) and len(point) >= 2]
    if not points:
        return 0.0, 0.0
    return sum(point[0] for point in points) / len(points), sum(point[1] for point in points) / len(points)


def mosaic_plan(bounds: tuple[float, float, float, float], zoom: int) -> dict[str, Any]:
    west, south, east, north = bounds
    left = lon_to_world_px(west, zoom)
    right = lon_to_world_px(east, zoom)
    top = lat_to_world_px(north, zoom)
    bottom = lat_to_world_px(south, zoom)
    x0, x1 = math.floor(left / TILE_SIZE), math.floor((right - 1e-7) / TILE_SIZE)
    y0, y1 = math.floor(top / TILE_SIZE), math.floor((bottom - 1e-7) / TILE_SIZE)
    tile_count = (x1 - x0 + 1) * (y1 - y0 + 1)
    width, height = max(1, round(right - left)), max(1, round(bottom - top))
    center_lat = (south + north) / 2
    resolution = math.cos(math.radians(center_lat)) * 2 * math.pi * EARTH_RADIUS_M / (TILE_SIZE * 2**zoom)
    return {
        "left": left,
        "right": right,
        "top": top,
        "bottom": bottom,
        "x0": x0,
        "x1": x1,
        "y0": y0,
        "y1": y1,
        "tile_count": tile_count,
        "width": width,
        "height": height,
        "resolution_m_per_px": resolution,
    }


def render_url(template: str, x: int, y: int, z: int) -> str:
    if not template.startswith(("https://", "http://")):
        raise ValueError("瓦片地址只允许 http/https")
    return (
        template.replace("{x}", str(x))
        .replace("{y}", str(y))
        .replace("{z}", str(z))
        .replace("{s}", str((x + y) % 4))
        .replace("{r}", "")
    )


def fetch_tile(template: str, x: int, y: int, z: int, timeout: float = 18) -> tuple[int, int, Image.Image]:
    url = render_url(template, x, y, z)
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "TizzyQ-Microclimate-Lab/1.0 (local research tool)",
            "Accept": "image/avif,image/webp,image/png,image/jpeg,*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
    image = Image.open(BytesIO(data)).convert("RGB")
    if image.size != (TILE_SIZE, TILE_SIZE):
        image = image.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
    # Several providers return a perfectly valid PNG that only says “map data
    # not available”. Treat low-variance placeholders as failed tiles so the
    # application never advertises an upscaled blank image as a high-res map.
    sample = np.asarray(image.resize((64, 64), Image.Resampling.BILINEAR), dtype=np.float32)
    if float(sample.std()) < 9.0:
        raise ValueError("瓦片为无影像占位图（该区域/级别没有真实数据）")
    return x, y, image


def add_cartographic_marks(image: Image.Image, resolution: float, provider_name: str) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    width, height = image.size
    margin = max(22, round(min(width, height) * 0.018))
    north_x = width - margin - 30
    north_y = margin + 48
    draw.ellipse((north_x - 31, north_y - 31, north_x + 31, north_y + 31), fill=(8, 14, 18, 190), outline=(255, 255, 255, 210), width=2)
    draw.polygon([(north_x, north_y - 25), (north_x - 10, north_y + 12), (north_x, north_y + 4), (north_x + 10, north_y + 12)], fill=(216, 244, 74, 255))
    draw.text((north_x - 5, north_y - 47), "N", fill=(255, 255, 255, 255))

    target_px = max(100, min(320, width // 5))
    raw_m = target_px * resolution
    exponent = 10 ** math.floor(math.log10(max(raw_m, 1e-9)))
    scale_m = max(v for v in (1, 2, 5, 10) if v * exponent <= raw_m) * exponent
    scale_px = scale_m / resolution
    sx, sy = margin, height - margin - 24
    draw.rectangle((sx - 12, sy - 30, sx + scale_px + 12, sy + 25), fill=(8, 14, 18, 190))
    draw.line((sx, sy, sx + scale_px, sy), fill=(255, 255, 255, 255), width=5)
    draw.line((sx, sy - 8, sx, sy + 8), fill=(255, 255, 255, 255), width=3)
    draw.line((sx + scale_px, sy - 8, sx + scale_px, sy + 8), fill=(255, 255, 255, 255), width=3)
    label = f"{scale_m / 1000:g} km" if scale_m >= 1000 else f"{scale_m:g} m"
    draw.text((sx, sy - 24), label, fill=(255, 255, 255, 255))
    draw.text((margin, margin), f"TizzyQ Microclimate Lab · {provider_name}", fill=(255, 255, 255, 230), stroke_width=2, stroke_fill=(0, 0, 0, 170))


def create_mosaic(payload: dict[str, Any]) -> dict[str, Any]:
    bounds = normalize_bounds(payload.get("bounds"))
    zoom = int(payload.get("zoom", 18))
    if not 1 <= zoom <= 22:
        raise ValueError("zoom 必须在 1–22")
    requested_provider = str(payload.get("provider", "google_sat"))
    provider_id = requested_provider
    template = str(payload.get("template") or PROVIDERS.get(provider_id, ""))
    if not template:
        raise ValueError("未知瓦片源")
    plan = mosaic_plan(bounds, zoom)
    if plan["tile_count"] > MAX_TILES:
        raise ValueError(f"当前选区需要 {plan['tile_count']} 张瓦片，超过安全上限 {MAX_TILES}；请降低精度或缩小范围")
    if plan["width"] * plan["height"] > MAX_MOSAIC_PIXELS:
        raise ValueError("拼图像素量过大；请降低精度或缩小范围")

    fallback_from: str | None = None
    # Some research networks permit Google tiles in the browser but block
    # server-side requests. Probe once and fall back to the equally aligned
    # Esri imagery service instead of producing a blank mosaic.
    try:
        fetch_tile(template, plan["x0"], plan["y0"], zoom, timeout=6)
    except Exception:
        if provider_id.startswith("google"):
            fallback_from = provider_id
            provider_id = "esri"
            template = PROVIDERS["esri"]

    canvas = Image.new(
        "RGB",
        ((plan["x1"] - plan["x0"] + 1) * TILE_SIZE, (plan["y1"] - plan["y0"] + 1) * TILE_SIZE),
        (26, 32, 30),
    )
    failures: list[str] = []
    success_count = 0
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [
            pool.submit(fetch_tile, template, x, y, zoom)
            for y in range(plan["y0"], plan["y1"] + 1)
            for x in range(plan["x0"], plan["x1"] + 1)
        ]
        for future in as_completed(futures):
            try:
                x, y, tile = future.result()
                canvas.paste(tile, ((x - plan["x0"]) * TILE_SIZE, (y - plan["y0"]) * TILE_SIZE))
                success_count += 1
            except Exception as exc:  # keep partial mosaics inspectable
                failures.append(str(exc))

    if success_count == 0:
        detail = failures[0] if failures else "未知网络错误"
        raise ValueError(f"所有瓦片均下载失败：{detail}")
    if success_count < max(1, math.ceil(plan["tile_count"] * 0.75)):
        raise ValueError(f"仅成功下载 {success_count}/{plan['tile_count']} 张瓦片，未生成不完整拼图")

    crop_box = (
        round(plan["left"] - plan["x0"] * TILE_SIZE),
        round(plan["top"] - plan["y0"] * TILE_SIZE),
        round(plan["right"] - plan["x0"] * TILE_SIZE),
        round(plan["bottom"] - plan["y0"] * TILE_SIZE),
    )
    cropped = canvas.crop(crop_box)
    export_id = uuid.uuid4().hex[:12]
    raw_output = EXPORT_DIR / f"mosaic_{export_id}_z{zoom}_raw.png"
    marked_output = EXPORT_DIR / f"mosaic_{export_id}_z{zoom}.png"
    # Keep a pristine image for recognition and CAD alignment. Cartographic
    # marks are drawn only on the presentation copy, never over source pixels.
    cropped.save(raw_output, "PNG", optimize=True)
    marked = cropped.copy()
    add_cartographic_marks(marked, plan["resolution_m_per_px"], provider_id)
    marked.save(marked_output, "PNG", optimize=True)
    meta = {
        "id": export_id,
        "filename": marked_output.name,
        "url": f"/files/exports/{marked_output.name}",
        "raw_filename": raw_output.name,
        "raw_url": f"/files/exports/{raw_output.name}",
        "bounds": list(bounds),
        "zoom": zoom,
        "provider": provider_id,
        "requested_provider": requested_provider,
        "fallback_from": fallback_from,
        "tile_count": plan["tile_count"],
        "width": cropped.width,
        "height": cropped.height,
        "resolution_m_per_px": round(plan["resolution_m_per_px"], 4),
        "failed_tiles": len(failures),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    (EXPORT_DIR / f"mosaic_{export_id}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


def component_rectangles(mask: np.ndarray, min_cells: int, max_cells: int) -> list[tuple[int, int, int, int, int]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    components: list[tuple[int, int, int, int, int]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            stack = [(x, y)]
            seen[y, x] = True
            xs: list[int] = []
            ys: list[int] = []
            while stack:
                cx, cy = stack.pop()
                xs.append(cx)
                ys.append(cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            size = len(xs)
            if min_cells <= size <= max_cells:
                components.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1, size))
    return components


def raster_footprints(payload: dict[str, Any]) -> dict[str, Any]:
    export_id = str(payload.get("export_id", ""))
    bounds = normalize_bounds(payload.get("bounds"))
    clip_polygon = normalize_clip_polygon(payload.get("clip_polygon"))
    sensitivity = max(0.1, min(1.0, float(payload.get("sensitivity", 0.58))))
    candidates = list(EXPORT_DIR.glob(f"mosaic_{export_id}_z*_raw.png"))
    if not candidates:
        candidates = list(EXPORT_DIR.glob(f"mosaic_{export_id}_z*.png"))
    if not candidates:
        raise FileNotFoundError("找不到对应高清影像")
    source = Image.open(candidates[0]).convert("RGB")
    original_w, original_h = source.size
    max_side = 3600
    resize_ratio = min(1.0, max_side / max(original_w, original_h))
    sample_w = max(1, round(original_w * resize_ratio))
    sample_h = max(1, round(original_h * resize_ratio))
    if resize_ratio < 1:
        source = source.resize((sample_w, sample_h), Image.Resampling.LANCZOS)
    array = np.asarray(source, dtype=np.float32)
    west, south, east, north = bounds

    if cv2 is not None:
        rgb = array.astype(np.uint8)
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        smooth = cv2.GaussianBlur(gray, (5, 5), 0)
        lower = max(24, round(82 - sensitivity * 45))
        upper = max(lower + 35, round(190 - sensitivity * 65))
        edges = cv2.Canny(smooth, lower, upper)
        # Suppress very dark vegetation/water and extremely saturated areas,
        # then close roof-edge gaps at the actual high-resolution scale.
        valid = ((gray > 42) & (hsv[:, :, 1] < 205)).astype(np.uint8) * 255
        edges = cv2.bitwise_and(edges, valid)
        kernel_size = 3 if max(sample_w, sample_h) < 2200 else 5
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
        closed = cv2.dilate(closed, np.ones((3, 3), np.uint8), iterations=1)
        contours, _hierarchy = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        center_lat = (south + north) / 2
        width_m = EARTH_RADIUS_M * math.radians(east - west) * math.cos(math.radians(center_lat))
        height_m = EARTH_RADIUS_M * math.radians(north - south)
        square_m_per_px = (width_m / sample_w) * (height_m / sample_h)
        min_area_m2 = max(5.0, float(payload.get("min_area", 18)))
        max_area_m2 = max(min_area_m2 + 1, float(payload.get("max_area", 6000)))
        found: list[tuple[float, np.ndarray, float]] = []
        for contour in contours:
            area_px = float(cv2.contourArea(contour))
            area_m2 = area_px * square_m_per_px
            if not min_area_m2 <= area_m2 <= max_area_m2:
                continue
            perimeter = cv2.arcLength(contour, True)
            if perimeter <= 0:
                continue
            rect = cv2.minAreaRect(contour)
            rw, rh = rect[1]
            if min(rw, rh) < 3 or max(rw, rh) / max(1.0, min(rw, rh)) > 7:
                continue
            rectangularity = area_px / max(1.0, rw * rh)
            if rectangularity < 0.24:
                continue
            epsilon = max(1.2, 0.018 * perimeter)
            approx = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
            polygon = approx if 4 <= len(approx) <= 10 else cv2.boxPoints(rect)
            confidence = min(0.94, 0.42 + rectangularity * 0.36 + min(area_m2, 300) / 1800)
            found.append((area_m2, polygon.astype(float), confidence))
        found.sort(key=lambda item: item[0], reverse=True)
        features: list[dict[str, Any]] = []
        for index, (area_m2, polygon, confidence) in enumerate(found[:500], 1):
            ring: list[list[float]] = []
            for px, py in polygon:
                lon = west + (float(px) / sample_w) * (east - west)
                lat = north - (float(py) / sample_h) * (north - south)
                ring.append([lon, lat])
            if ring and ring[0] != ring[-1]:
                ring.append(ring[0])
            features.append({
                "type": "Feature",
                "properties": {
                    "id": f"AI-{index:03d}", "source": "ai-raster", "zone": "主区",
                    "status": "待核查", "floors": 2, "confidence": round(confidence, 2),
                    "detected_area_m2": round(area_m2, 1),
                },
                "geometry": {"type": "Polygon", "coordinates": [ring]},
            })
        if clip_polygon:
            features = [feature for feature in features if point_in_polygon(feature_centroid(feature), clip_polygon)]
        return {
            "type": "FeatureCollection", "features": features,
            "method": "高清影像 OpenCV 屋顶候选（必须人工核查）",
            "source_size": [original_w, original_h], "analysis_size": [sample_w, sample_h],
            "quality": "high" if max(original_w, original_h) >= 2600 else "medium",
        }

    # Numpy fallback for machines without OpenCV.
    gray = array.mean(axis=2)
    saturation = array.max(axis=2) - array.min(axis=2)
    block = max(5, sample_w // 120)
    gh, gw = sample_h // block, sample_w // block
    clipped = gray[: gh * block, : gw * block]
    sat_clipped = saturation[: gh * block, : gw * block]
    means = clipped.reshape(gh, block, gw, block).mean(axis=(1, 3))
    variances = clipped.reshape(gh, block, gw, block).var(axis=(1, 3))
    sats = sat_clipped.reshape(gh, block, gw, block).mean(axis=(1, 3))
    threshold = np.percentile(variances, 76 - sensitivity * 18)
    roof_like = (variances >= threshold) & (means >= 58) & (sats <= 145)
    # Close one-cell gaps so roof edges form one editable candidate.
    padded = np.pad(roof_like, 1)
    dilated = np.zeros_like(roof_like)
    for dy in range(3):
        for dx in range(3):
            dilated |= padded[dy : dy + gh, dx : dx + gw]
    components = component_rectangles(dilated, min_cells=max(3, round(7 - sensitivity * 4)), max_cells=max(30, round(190 + sensitivity * 160)))
    features: list[dict[str, Any]] = []
    for index, (x0, y0, x1, y1, size) in enumerate(sorted(components, key=lambda c: c[4], reverse=True)[:220], 1):
        px0, py0 = x0 * block, y0 * block
        px1, py1 = min(sample_w, x1 * block), min(sample_h, y1 * block)
        if (px1 - px0) * (py1 - py0) < block * block * 5:
            continue
        lon0 = west + (px0 / sample_w) * (east - west)
        lon1 = west + (px1 / sample_w) * (east - west)
        lat1 = north - (py0 / sample_h) * (north - south)
        lat0 = north - (py1 / sample_h) * (north - south)
        features.append(
            {
                "type": "Feature",
                "properties": {"id": f"AI-{index:03d}", "source": "ai-raster", "zone": "主区", "status": "待核查", "floors": 2, "confidence": round(min(0.92, 0.38 + size / 300), 2)},
                "geometry": {"type": "Polygon", "coordinates": [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]]},
            }
        )
    if clip_polygon:
        features = [feature for feature in features if point_in_polygon(feature_centroid(feature), clip_polygon)]
    return {
        "type": "FeatureCollection",
        "features": features,
        "method": "本地影像启发式预描边（必须人工核查）",
        "source_size": [original_w, original_h],
        "analysis_size": [sample_w, sample_h],
    }


def osm_footprints(payload: dict[str, Any]) -> dict[str, Any]:
    west, south, east, north = normalize_bounds(payload.get("bounds"))
    clip_polygon = normalize_clip_polygon(payload.get("clip_polygon"))
    query = f'[out:json][timeout:35];(way["building"]({south},{west},{north},{east}););out body;>;out skel qt;'
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    request = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=data,
        headers={"User-Agent": "TizzyQ-Microclimate-Lab/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        result = json.loads(response.read().decode("utf-8"))
    nodes = {element["id"]: (element["lon"], element["lat"]) for element in result.get("elements", []) if element.get("type") == "node"}
    features: list[dict[str, Any]] = []
    for element in result.get("elements", []):
        if element.get("type") != "way":
            continue
        coordinates = [nodes[node_id] for node_id in element.get("nodes", []) if node_id in nodes]
        if len(coordinates) < 3:
            continue
        if coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
        center = (
            sum(point[0] for point in coordinates) / len(coordinates),
            sum(point[1] for point in coordinates) / len(coordinates),
        )
        if clip_polygon and not point_in_polygon(center, clip_polygon):
            continue
        levels = element.get("tags", {}).get("building:levels")
        try:
            floors = max(1, int(round(float(levels)))) if levels else 2
        except (ValueError, TypeError):
            floors = 2
        features.append(
            {
                "type": "Feature",
                "properties": {"id": f"OSM-{element['id']}", "source": "osm", "zone": "主区", "status": "待核查", "floors": floors, "confidence": 0.88},
                "geometry": {"type": "Polygon", "coordinates": [coordinates]},
            }
        )
    return {"type": "FeatureCollection", "features": features, "method": "OpenStreetMap 已配准建筑轮廓"}


def rational_to_float(value: Any) -> float:
    try:
        return float(value)
    except Exception:
        return float(value.numerator) / float(value.denominator)


def dms_to_decimal(values: Any, ref: str) -> float:
    degrees, minutes, seconds = (rational_to_float(v) for v in values)
    result = degrees + minutes / 60 + seconds / 3600
    return -result if ref in ("S", "W") else result


def extract_photo_metadata(filename: str, data: bytes) -> dict[str, Any]:
    record: dict[str, Any] = {"filename": filename, "has_gps": False, "lat": None, "lon": None, "captured_at": None, "floors": None, "status": "待核查"}
    try:
        image = Image.open(BytesIO(data))
        exif = image.getexif()
        record["width"], record["height"] = image.size
        record["captured_at"] = exif.get(36867) or exif.get(306)
        gps_ifd = exif.get_ifd(34853) if exif and 34853 in exif else {}
        gps = {ExifTags.GPSTAGS.get(key, key): value for key, value in gps_ifd.items()}
        if gps.get("GPSLatitude") and gps.get("GPSLongitude"):
            record["lat"] = round(dms_to_decimal(gps["GPSLatitude"], str(gps.get("GPSLatitudeRef", "N"))), 7)
            record["lon"] = round(dms_to_decimal(gps["GPSLongitude"], str(gps.get("GPSLongitudeRef", "E"))), 7)
            record["has_gps"] = True
    except Exception as exc:
        record["error"] = str(exc)
    return record


def parse_multipart(headers: Any, body: bytes) -> list[dict[str, Any]]:
    content_type = headers.get("Content-Type", "")
    raw = b"Content-Type: " + content_type.encode("utf-8") + b"\r\nMIME-Version: 1.0\r\n\r\n" + body
    message = BytesParser(policy=policy.default).parsebytes(raw)
    parts: list[dict[str, Any]] = []
    if not message.is_multipart():
        return parts
    for part in message.iter_parts():
        disposition = part.get("Content-Disposition", "")
        if "form-data" not in disposition:
            continue
        parts.append(
            {
                "name": part.get_param("name", header="content-disposition"),
                "filename": part.get_filename(),
                "content_type": part.get_content_type(),
                "data": part.get_payload(decode=True) or b"",
            }
        )
    return parts


def polygon_ring(feature: dict[str, Any]) -> list[tuple[float, float]]:
    geometry = feature.get("geometry", {})
    if geometry.get("type") != "Polygon" or not geometry.get("coordinates"):
        return []
    ring = [(float(point[0]), float(point[1])) for point in geometry["coordinates"][0] if len(point) >= 2]
    if len(ring) >= 2 and ring[0] == ring[-1]:
        ring.pop()
    return ring


def geojson_origin(collection: dict[str, Any]) -> tuple[float, float]:
    points = [point for feature in collection.get("features", []) for point in polygon_ring(feature)]
    if not points:
        raise ValueError("没有可导出的闭合建筑轮廓")
    return min(p[0] for p in points), min(p[1] for p in points)


def lonlat_to_local(lon: float, lat: float, lon0: float, lat0: float) -> tuple[float, float]:
    x = EARTH_RADIUS_M * math.radians(lon - lon0) * math.cos(math.radians((lat + lat0) / 2))
    y = EARTH_RADIUS_M * math.radians(lat - lat0)
    return x, y


def signed_area(points: list[tuple[float, float]]) -> float:
    return sum(
        points[i][0] * points[(i + 1) % len(points)][1]
        - points[(i + 1) % len(points)][0] * points[i][1]
        for i in range(len(points))
    ) / 2


def segments_intersect(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float], d: tuple[float, float]) -> bool:
    def orient(p: tuple[float, float], q: tuple[float, float], r: tuple[float, float]) -> float:
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

    o1, o2, o3, o4 = orient(a, b, c), orient(a, b, d), orient(c, d, a), orient(c, d, b)
    eps = 1e-9
    return ((o1 > eps and o2 < -eps) or (o1 < -eps and o2 > eps)) and ((o3 > eps and o4 < -eps) or (o3 < -eps and o4 > eps))


def clean_and_validate_points(points: list[tuple[float, float]]) -> tuple[list[tuple[float, float]], list[str]]:
    cleaned: list[tuple[float, float]] = []
    for point in points:
        if not cleaned or point != cleaned[-1]:
            cleaned.append(point)
    if len(cleaned) > 1 and cleaned[0] == cleaned[-1]:
        cleaned.pop()
    errors: list[str] = []
    if len(set(cleaned)) < 3:
        return cleaned, ["少于 3 个不同顶点"]
    if abs(signed_area(cleaned)) < 0.05:
        errors.append("闭合后面积过小")
    n = len(cleaned)
    for i in range(n):
        a, b = cleaned[i], cleaned[(i + 1) % n]
        if math.dist(a, b) < 0.05:
            errors.append("存在短于 0.05 m 的边")
            break
        for j in range(i + 1, n):
            if j in (i, (i + 1) % n) or i in (j, (j + 1) % n):
                continue
            if i == 0 and j == n - 1:
                continue
            c, d = cleaned[j], cleaned[(j + 1) % n]
            if segments_intersect(a, b, c, d):
                errors.append("轮廓自相交")
                return cleaned, errors
    if signed_area(cleaned) < 0:
        cleaned.reverse()
    return cleaned, errors


def audit_collection(collection: dict[str, Any], precision: int = 1) -> dict[str, Any]:
    try:
        lon0, lat0 = geojson_origin(collection)
    except ValueError:
        return {"ok": False, "valid": 0, "invalid": [{"id": "—", "errors": ["没有建筑轮廓"]}]}
    invalid: list[dict[str, Any]] = []
    valid = 0
    for index, feature in enumerate(collection.get("features", []), 1):
        props = feature.get("properties", {})
        identifier = str(props.get("id") or f"B-{index:03d}")
        ring = polygon_ring(feature)
        local = [tuple(round(v, precision) for v in lonlat_to_local(lon, lat, lon0, lat0)) for lon, lat in ring]
        _cleaned, errors = clean_and_validate_points(local)
        height = float(props.get("height") or (float(props.get("floors") or 0) * float(props.get("floor_height") or 0)))
        if height <= 0:
            errors.append("建筑高度必须大于 0")
        if errors:
            invalid.append({"id": identifier, "errors": errors})
        else:
            valid += 1
    return {"ok": not invalid and valid > 0, "valid": valid, "invalid": invalid, "precision_m": 10 ** -precision}


def normalized_buildings(collection: dict[str, Any], precision: int = 1) -> tuple[list[dict[str, Any]], tuple[float, float]]:
    lon0, lat0 = geojson_origin(collection)
    buildings: list[dict[str, Any]] = []
    for index, feature in enumerate(collection.get("features", []), 1):
        ring = polygon_ring(feature)
        points, errors = clean_and_validate_points([
            tuple(round(v, precision) for v in lonlat_to_local(lon, lat, lon0, lat0)) for lon, lat in ring
        ])
        properties = feature.get("properties", {})
        identifier = str(properties.get("id") or f"B-{index:03d}")
        if errors:
            raise ValueError(f"{identifier} 几何无效：{'、'.join(errors)}")
        floors = max(1, int(properties.get("floors") or 2))
        floor_height = float(properties.get("floor_height") or 3.3)
        height = round(float(properties.get("height") or floors * floor_height), precision)
        if height <= 0:
            raise ValueError(f"{identifier} 建筑高度必须大于 0")
        source = str(properties.get("source") or "manual")
        zone = str(properties.get("zone") or "主区")
        buildings.append({
            "id": identifier, "points": points, "floors": floors, "floor_height": floor_height,
            "height": height, "source": source, "zone": zone,
        })
    if not buildings:
        raise ValueError("没有有效建筑多边形")
    return buildings, (lon0, lat0)


def dxf_text(collection: dict[str, Any], precision: int = 1, plot_scale: int = 100) -> str:
    buildings, origin = normalized_buildings(collection, precision)
    def layer_name(building: dict[str, Any]) -> str:
        source = building["source"].lower()
        source_key = "MANUAL" if "manual" in source else "OSM" if "osm" in source else "AI"
        zone_key = "".join(char for char in building["zone"].upper() if char.isascii() and char.isalnum())[:12] or "ZONE"
        return f"BLDG_{zone_key}_{source_key}"[:31]

    layers = sorted({layer_name(building) for building in buildings})
    lines = [
        "0", "SECTION", "2", "HEADER",
        "999", f"TizzyQ origin WGS84: {origin[0]:.8f},{origin[1]:.8f}; units=m; geometry=1:1; plot_scale=1:{plot_scale}; precision={10**-precision:g}m",
        "9", "$ACADVER", "1", "AC1009", "0", "ENDSEC",
        "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", str(len(layers)),
    ]
    colors = [1, 3, 5, 30, 140, 200]
    for index, layer in enumerate(layers):
        lines.extend(["0", "LAYER", "2", layer, "70", "0", "62", str(colors[index % len(colors)]), "6", "CONTINUOUS"])
    lines.extend(["0", "ENDTAB", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"])
    for building in buildings:
        layer = layer_name(building)
        # Classic R12 POLYLINE/VERTEX entities are intentionally used here.
        # They open reliably in old and new AutoCAD versions and remain closed.
        lines.extend(["999", f"BUILDING_ID={building['id']}; SOURCE={building['source']}; ZONE={building['zone']}; HEIGHT_M={building['height']}"])
        lines.extend(["0", "POLYLINE", "8", layer, "66", "1", "70", "1", "10", "0.0", "20", "0.0", "30", "0.0"])
        for x, y in building["points"]:
            lines.extend(["0", "VERTEX", "8", layer, "10", f"{x:.{precision}f}", "20", f"{y:.{precision}f}", "30", "0.0"])
        lines.extend(["0", "SEQEND", "8", layer])
    lines.extend(["0", "ENDSEC", "0", "EOF"])
    # Use logical newlines here; Path.write_text performs the Windows CRLF
    # translation once. Embedding CRLF would otherwise create invalid CRCRLF.
    return "\n".join(lines) + "\n"


def obj_text(collection: dict[str, Any], precision: int = 1) -> str:
    buildings, origin = normalized_buildings(collection, precision)
    lines = ["# TizzyQ Microclimate massing", f"# origin_wgs84 {origin[0]:.8f} {origin[1]:.8f}", "# units meter"]
    vertex_offset = 1
    for building in buildings:
        points = building["points"]
        height = building["height"]
        lines.append(f"o {building['id'].replace(' ', '_')}")
        for x, y in points:
            lines.append(f"v {x:.{precision}f} {y:.{precision}f} 0.0")
        for x, y in points:
            lines.append(f"v {x:.{precision}f} {y:.{precision}f} {height:.{precision}f}")
        n = len(points)
        bottom = [vertex_offset + i for i in range(n)]
        top = [vertex_offset + n + i for i in range(n)]
        lines.append("f " + " ".join(map(str, reversed(bottom))))
        lines.append("f " + " ".join(map(str, top)))
        for i in range(n):
            j = (i + 1) % n
            lines.append(f"f {bottom[i]} {bottom[j]} {top[j]} {top[i]}")
        vertex_offset += n * 2
    return "\n".join(lines) + "\n"


def fbx_ascii_text(collection: dict[str, Any], precision: int = 1) -> str:
    buildings, origin = normalized_buildings(collection, precision)
    vertices: list[float] = []
    polygon_indices: list[int] = []
    vertex_cursor = 0
    for building in buildings:
        points = building["points"]
        n = len(points)
        for x, y in points:
            vertices.extend([x, y, 0.0])
        for x, y in points:
            vertices.extend([x, y, building["height"]])
        faces: list[list[int]] = []
        faces.append([vertex_cursor + i for i in reversed(range(n))])
        faces.append([vertex_cursor + n + i for i in range(n)])
        for i in range(n):
            j = (i + 1) % n
            faces.append([vertex_cursor + i, vertex_cursor + j, vertex_cursor + n + j, vertex_cursor + n + i])
        for face in faces:
            for index, value in enumerate(face):
                polygon_indices.append(-(value + 1) if index == len(face) - 1 else value)
        vertex_cursor += n * 2
    vertex_values = ",".join(f"{value:.{precision}f}" for value in vertices)
    index_values = ",".join(str(value) for value in polygon_indices)
    return f'''; FBX 7.4.0 project file
; TizzyQ Microclimate Lab · units meter · origin WGS84 {origin[0]:.8f},{origin[1]:.8f}
FBXHeaderExtension:  {{
    FBXHeaderVersion: 1003
    FBXVersion: 7400
    Creator: "TizzyQ Microclimate Lab"
}}
GlobalSettings:  {{
    Version: 1000
    Properties70:  {{
        P: "UpAxis", "int", "Integer", "",2
        P: "UpAxisSign", "int", "Integer", "",1
        P: "FrontAxis", "int", "Integer", "",1
        P: "FrontAxisSign", "int", "Integer", "",-1
        P: "CoordAxis", "int", "Integer", "",0
        P: "CoordAxisSign", "int", "Integer", "",1
        P: "UnitScaleFactor", "double", "Number", "",100
        P: "OriginalUnitScaleFactor", "double", "Number", "",100
    }}
}}
Definitions:  {{
    Version: 100
    Count: 2
    ObjectType: "Geometry" {{ Count: 1 }}
    ObjectType: "Model" {{ Count: 1 }}
}}
Objects:  {{
    Geometry: 1001, "Geometry::Village_Massing", "Mesh" {{
        GeometryVersion: 124
        Vertices: *{len(vertices)} {{ a: {vertex_values} }}
        PolygonVertexIndex: *{len(polygon_indices)} {{ a: {index_values} }}
        Layer: 0 {{ Version: 100 }}
    }}
    Model: 1002, "Model::Village_Massing", "Mesh" {{
        Version: 232
        Properties70:  {{
            P: "Lcl Translation", "Lcl Translation", "", "A",0,0,0
            P: "Lcl Rotation", "Lcl Rotation", "", "A",0,0,0
            P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
        }}
        Shading: T
        Culling: "CullingOff"
    }}
}}
Connections:  {{
    C: "OO",1001,1002
}}
'''


def convert_dxf_to_dwg(dxf_path: Path, dwg_path: Path) -> tuple[bool, str]:
    core = first_existing(AUTOCAD_CORE_CANDIDATES)
    if not core:
        return False, "未检测到 AutoCAD Core Console"
    # Accoreconsole is unreliable with apostrophes and non-ASCII characters in
    # file paths, so conversion runs in an ASCII-only system temp directory.
    with tempfile.TemporaryDirectory(prefix="tizzyq_dwg_") as temp_name:
        temp_dir = Path(temp_name)
        safe_dxf = temp_dir / "input.dxf"
        safe_dwg = temp_dir / "output.dwg"
        script_path = temp_dir / "save.scr"
        shutil.copy2(dxf_path, safe_dxf)
        lisp_output = str(safe_dwg).replace("\\", "/").replace('"', '\\"')
        script_path.write_text(
            f'(setvar "INSUNITS" 6)\n(command "_.SAVEAS" "2018" "{lisp_output}")\n(command "_.QUIT")\n',
            encoding="ascii",
            errors="ignore",
        )
        try:
            result = subprocess.run(
                [str(core), "/i", str(safe_dxf), "/s", str(script_path), "/l", "en-US"],
                cwd=str(temp_dir),
                capture_output=True,
                text=False,
                timeout=90,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            raw_output = (result.stdout or b"") + b"\n" + (result.stderr or b"")
            detail = raw_output.decode("utf-16", errors="replace")[-4000:]
            if safe_dwg.exists():
                dwg_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(safe_dwg, dwg_path)
            return dwg_path.exists(), detail
        except Exception as exc:
            return False, str(exc)


def sketchup_ruby_script(collection: dict[str, Any], output_path: Path, export_format: str, marker_path: Path) -> str:
    buildings, origin = normalized_buildings(collection, 1)
    payload = json.dumps(buildings, ensure_ascii=False)
    escaped_output = str(output_path).replace("\\", "/").replace("'", "\\\\'")
    escaped_marker = str(marker_path).replace("\\", "/").replace("'", "\\\\'")
    return f'''require 'json'
begin
  model = Sketchup.active_model
  model.start_operation('TizzyQ village massing', true)
  model.entities.clear!
  buildings = JSON.parse(%q|{payload}|)
  root_group = model.entities.add_group
  root_group.name = 'TizzyQ_Buildings_1to1m'
  zone_groups = {{}}
  source_groups = {{}}
  buildings.each do |building|
    zone_name = building['zone'].to_s.empty? ? '主区' : building['zone'].to_s
    source_name = building['source'].to_s.empty? ? 'manual' : building['source'].to_s
    zone_group = zone_groups[zone_name]
    unless zone_group
      zone_group = root_group.entities.add_group
      zone_group.name = "ZONE_#{{zone_name}}"
      zone_groups[zone_name] = zone_group
    end
    source_key = "#{{zone_name}}::#{{source_name}}"
    source_group = source_groups[source_key]
    unless source_group
      source_group = zone_group.entities.add_group
      source_group.name = "SOURCE_#{{source_name}}"
      source_groups[source_key] = source_group
    end
    group = source_group.entities.add_group
    group.name = building['id'].to_s
    points = building['points'].map {{ |xy| Geom::Point3d.new(xy[0].to_f.m, xy[1].to_f.m, 0) }}
    face = group.entities.add_face(points)
    raise "Invalid closed face: #{{building['id']}}" unless face
    face.reverse! if face.normal.z < 0
    face.pushpull(building['height'].to_f.m)
    group.set_attribute('TizzyQ', 'floors', building['floors'])
    group.set_attribute('TizzyQ', 'floor_height_m', building['floor_height'])
    group.set_attribute('TizzyQ', 'height_m', building['height'])
    group.set_attribute('TizzyQ', 'source', source_name)
    group.set_attribute('TizzyQ', 'zone', zone_name)
  end
  model.set_attribute('TizzyQ', 'origin_wgs84', '{origin[0]:.8f},{origin[1]:.8f}')
  model.set_attribute('TizzyQ', 'unit', 'meter')
  [model.definitions, model.materials, model.layers, model.styles].each do |collection|
    collection.purge_unused if collection.respond_to?(:purge_unused)
  end
  if model.respond_to?(:environments) && model.environments.respond_to?(:purge_unused)
    model.environments.purge_unused
  end
  model.commit_operation
  output = '{escaped_output}'
  if '{export_format}' == 'skp'
    ok = model.save(output)
  else
    temp_skp = output.sub(/\\.[^.]+$/, '.skp')
    model.save(temp_skp)
    ok = model.export(output, {{:triangulated_faces => true, :doublesided_faces => false, :edges => false, :texture_maps => false, :units => 'meter'}})
  end
  File.open('{escaped_marker}', 'w') {{ |f| f.write(ok ? 'ok' : 'failed') }}
rescue => e
  File.open('{escaped_marker}', 'w') {{ |f| f.write("error: #{{e.class}} #{{e.message}}") }}
ensure
  UI.start_timer(1.0, false) {{ Sketchup.quit }}
end
'''


def convert_with_sketchup(collection: dict[str, Any], output_path: Path, export_format: str) -> tuple[bool, str]:
    executable = first_existing(SKETCHUP_CANDIDATES)
    if not executable:
        return False, "未检测到 SketchUp"
    template_candidates = [
        executable.parent / "resources" / "zh-cn" / "Templates" / "Temp01a - Simple.skp",
        executable.parent / "resources" / "en-US" / "Templates" / "Temp01a - Simple.skp",
    ]
    template = first_existing(template_candidates)
    if not template:
        return False, "未找到 SketchUp 米制模板"
    # -RubyStartup runs only after a model window exists. Launching a copied
    # template also avoids the welcome screen, and ASCII-only temp paths avoid
    # SketchUp's known Unicode command-line limitation.
    with tempfile.TemporaryDirectory(prefix="tizzyq_skp_", ignore_cleanup_errors=True) as temp_name:
        temp_dir = Path(temp_name)
        input_model = temp_dir / "input.skp"
        safe_output = temp_dir / f"output.{export_format}"
        script_path = temp_dir / "export.rb"
        marker_path = temp_dir / "status.txt"
        shutil.copy2(template, input_model)
        script_path.write_text(sketchup_ruby_script(collection, safe_output, export_format, marker_path), encoding="utf-8")
        try:
            process = subprocess.Popen([str(executable), str(input_model), "-RubyStartup", str(script_path)], cwd=str(temp_dir))
            deadline = time.time() + 80
            while time.time() < deadline:
                if marker_path.exists():
                    status = marker_path.read_text(encoding="utf-8", errors="replace")
                    if safe_output.exists() and status == "ok":
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(safe_output, output_path)
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        pass
                    return output_path.exists() and status == "ok", status
                time.sleep(0.5)
            return False, "SketchUp 转换超时；请确认 SketchUp 窗口未被许可对话框阻塞"
        except Exception as exc:
            return False, str(exc)


def safe_project_name(name: str) -> str:
    cleaned = "".join(char for char in name.strip() if char.isalnum() or char in "-_中文项目大西村")
    return cleaned[:80] or "未命名项目"


class MicroclimateHandler(SimpleHTTPRequestHandler):
    server_version = "TizzyQMicroclimate/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def json_response(self, payload: Any, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def file_response(self, path: Path, download_name: str | None = None) -> None:
        if not path.exists() or not path.is_file():
            self.send_error(404)
            return
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(path.stat().st_size))
        if download_name:
            encoded = urllib.parse.quote(download_name)
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{encoded}")
        self.end_headers()
        with path.open("rb") as stream:
            shutil.copyfileobj(stream, self.wfile)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length > 50_000_000:
            raise ValueError("请求体过大")
        return json.loads(self.rfile.read(length).decode("utf-8")) if length else {}

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            self.json_response(
                {
                    "ok": True,
                    "name": "TizzyQ's Microclimate Research Modeling Program",
                    "version": "0.3.0",
                    "pillow": Image.__version__,
                    "numpy": np.__version__,
                    "sketchup": str(first_existing(SKETCHUP_CANDIDATES) or ""),
                    "autocad_core": str(first_existing(AUTOCAD_CORE_CANDIDATES) or ""),
                    "native_exports": ["PNG", "GeoJSON", "DXF", "OBJ", "FBX", "SKP"],
                    "opencv": cv2.__version__ if cv2 is not None else "",
                }
            )
            return
        if parsed.path == "/api/projects":
            projects: list[dict[str, Any]] = []
            for path in sorted(PROJECT_DIR.glob("*.json"), key=lambda item: item.stat().st_mtime, reverse=True):
                try:
                    payload = json.loads(path.read_text(encoding="utf-8"))
                    projects.append({
                        "name": payload.get("name") or path.stem,
                        "saved_at": payload.get("saved_at") or time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(path.stat().st_mtime)),
                        "buildings": len((payload.get("geojson") or {}).get("features", [])),
                    })
                except (OSError, json.JSONDecodeError):
                    continue
            self.json_response({"projects": projects})
            return
        if parsed.path == "/api/project":
            query = urllib.parse.parse_qs(parsed.query)
            name = safe_project_name((query.get("name") or [""])[0])
            path = PROJECT_DIR / f"{name}.json"
            if not path.exists():
                self.json_response({"error": "项目不存在"}, 404)
            else:
                self.json_response(json.loads(path.read_text(encoding="utf-8")))
            return
        if parsed.path.startswith("/files/exports/"):
            name = Path(urllib.parse.unquote(parsed.path)).name
            self.file_response(EXPORT_DIR / name)
            return
        if parsed.path == "/":
            self.file_response(STATIC_DIR / "index.html")
            return
        if parsed.path.startswith("/static/"):
            name = parsed.path.removeprefix("/static/")
            target = (STATIC_DIR / name).resolve()
            if STATIC_DIR.resolve() not in target.parents:
                self.send_error(403)
            else:
                self.file_response(target)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        try:
            if parsed.path == "/api/mosaic":
                self.json_response(create_mosaic(self.read_json()))
                return
            if parsed.path == "/api/footprints/raster":
                self.json_response(raster_footprints(self.read_json()))
                return
            if parsed.path == "/api/footprints/osm":
                self.json_response(osm_footprints(self.read_json()))
                return
            if parsed.path == "/api/geometry/audit":
                payload = self.read_json()
                self.json_response(audit_collection(payload.get("geojson") or {}, int(payload.get("precision", 1))))
                return
            if parsed.path == "/api/photos/exif":
                length = int(self.headers.get("Content-Length", "0"))
                if length > 150_000_000:
                    raise ValueError("照片总量过大")
                parts = parse_multipart(self.headers, self.rfile.read(length))
                photos = [extract_photo_metadata(part["filename"], part["data"]) for part in parts if part.get("filename")]
                self.json_response({"photos": photos})
                return
            if parsed.path == "/api/project/save":
                payload = self.read_json()
                name = safe_project_name(str(payload.get("name", "未命名项目")))
                payload["name"] = name
                payload["saved_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                (PROJECT_DIR / f"{name}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
                self.json_response({"ok": True, "name": name})
                return
            if parsed.path == "/api/project/delete":
                payload = self.read_json()
                name = safe_project_name(str(payload.get("name", "")))
                path = PROJECT_DIR / f"{name}.json"
                if not path.exists():
                    self.json_response({"error": "项目不存在"}, 404)
                else:
                    path.unlink()
                    self.json_response({"ok": True, "name": name})
                return
            if parsed.path.startswith("/api/export/"):
                payload = self.read_json()
                collection = payload.get("geojson") or {}
                precision = int(payload.get("precision", 1))
                plot_scale = max(1, int(payload.get("plot_scale", 100)))
                export_id = uuid.uuid4().hex[:10]
                kind = parsed.path.rsplit("/", 1)[-1].lower()
                if kind == "geojson":
                    output = EXPORT_DIR / f"buildings_{export_id}.geojson"
                    output.write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding="utf-8")
                    self.file_response(output, output.name)
                    return
                if kind in ("dxf", "dwg"):
                    dxf_path = EXPORT_DIR / f"buildings_{export_id}.dxf"
                    dxf_path.write_text(dxf_text(collection, precision, plot_scale), encoding="ascii", errors="ignore")
                    if kind == "dxf":
                        self.file_response(dxf_path, dxf_path.name)
                        return
                    dwg_path = EXPORT_DIR / f"buildings_{export_id}.dwg"
                    ok, detail = convert_dxf_to_dwg(dxf_path, dwg_path)
                    if not ok:
                        self.json_response({"error": "DWG 转换失败", "detail": detail, "fallback": f"/files/exports/{dxf_path.name}"}, 503)
                    else:
                        self.file_response(dwg_path, dwg_path.name)
                    return
                if kind == "obj":
                    output = EXPORT_DIR / f"village_massing_{export_id}.obj"
                    output.write_text(obj_text(collection, precision), encoding="utf-8")
                    self.file_response(output, output.name)
                    return
                if kind == "fbx":
                    output = EXPORT_DIR / f"village_massing_{export_id}.fbx"
                    ok, _detail = convert_with_sketchup(collection, output, "fbx")
                    if not ok:
                        # Portable fallback for computers without SketchUp.
                        output.write_text(fbx_ascii_text(collection, precision), encoding="utf-8")
                    self.file_response(output, output.name)
                    return
                if kind == "skp":
                    output = EXPORT_DIR / f"village_massing_{export_id}.skp"
                    ok, detail = convert_with_sketchup(collection, output, "skp")
                    if not ok:
                        self.json_response({"error": "SKP 转换失败", "detail": detail, "fallback": "/api/export/obj"}, 503)
                    else:
                        self.file_response(output, output.name)
                    return
                self.json_response({"error": "未知导出格式"}, 404)
                return
            self.send_error(404)
        except urllib.error.HTTPError as exc:
            self.json_response({"error": f"上游地图服务返回 {exc.code}", "detail": str(exc)}, 502)
        except urllib.error.URLError as exc:
            self.json_response({"error": "无法连接地图/矢量服务", "detail": str(exc.reason)}, 502)
        except FileNotFoundError as exc:
            self.json_response({"error": str(exc)}, 404)
        except ValueError as exc:
            self.json_response({"error": str(exc)}, 400)
        except Exception as exc:
            self.json_response({"error": "本地服务处理失败", "detail": f"{type(exc).__name__}: {exc}"}, 500)


def run(host: str, port: int) -> None:
    server = ThreadingHTTPServer((host, port), MicroclimateHandler)
    print(f"TizzyQ's MRMP: http://{host}:{port}")
    print("按 Ctrl+C 停止本地服务")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TizzyQ's Microclimate Research Modeling Program")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    arguments = parser.parse_args()
    run(arguments.host, arguments.port)

from __future__ import annotations

import tempfile
from pathlib import Path

import app


SAMPLE = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"id": "B-001", "status": "已核查", "floors": 2, "floor_height": 3.3, "source": "manual", "zone": "A"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[98.5860, 24.6900], [98.5862, 24.6900], [98.5862, 24.69015], [98.5860, 24.69015], [98.5860, 24.6900]]],
            },
        },
        {
            "type": "Feature",
            "properties": {"id": "B-002", "status": "已核查", "floors": 3, "floor_height": 3.3, "source": "ai-raster", "zone": "B"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[98.5863, 24.6901], [98.58648, 24.6901], [98.58648, 24.69028], [98.5863, 24.69028], [98.5863, 24.6901]]],
            },
        },
    ],
}


def main() -> None:
    dxf = app.dxf_text(SAMPLE, 1)
    assert "POLYLINE" in dxf and "SEQEND" in dxf and "BUILDING" in dxf
    assert dxf.count("POLYLINE") == 2
    assert "BLDG_A_MANUAL" in dxf and "BLDG_B_AI" in dxf
    audit = app.audit_collection(SAMPLE, 1)
    assert audit["ok"] and audit["valid"] == 2
    clip = [(98.5859, 24.6899), (98.58625, 24.6899), (98.58625, 24.6903), (98.5859, 24.6903)]
    assert app.point_in_polygon((98.5861, 24.6901), clip)
    assert not app.point_in_polygon((98.5864, 24.6901), clip)
    obj = app.obj_text(SAMPLE, 1)
    assert "o B-001" in obj and "v " in obj and "f " in obj
    fbx = app.fbx_ascii_text(SAMPLE, 1)
    assert "FBX 7.4.0" in fbx and "Village_Massing" in fbx
    print(f"DXF OK: {len(dxf.encode('ascii', errors='ignore'))} bytes")
    print(f"OBJ OK: {len(obj.encode('utf-8'))} bytes")
    print(f"FBX OK: {len(fbx.encode('utf-8'))} bytes")

    if app.first_existing(app.AUTOCAD_CORE_CANDIDATES):
        with tempfile.TemporaryDirectory(dir=app.JOB_DIR) as temp:
            temp_dir = Path(temp)
            dxf_path = temp_dir / "input.dxf"
            dwg_path = temp_dir / "output.dwg"
            dxf_path.write_text(dxf, encoding="ascii", errors="ignore")
            ok, detail = app.convert_dxf_to_dwg(dxf_path, dwg_path)
            if not ok:
                raise AssertionError(f"DWG conversion failed:\n{detail}")
            header = dwg_path.read_bytes()[:6]
            assert header.startswith(b"AC10"), header
            print(f"DWG OK: {dwg_path.stat().st_size} bytes · {header.decode('ascii', errors='replace')}")


if __name__ == "__main__":
    main()

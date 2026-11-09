# TizzyQ's Microclimate Research Modeling Program

**TizzyQ's MRMP** · Local web application for microclimate research

[简体中文](README.md) · **English**

TizzyQ's MRMP helps researchers prepare geometric inputs for village microclimate and wind studies. It combines satellite tile mosaics, building footprint review, field photo GPS, and CAD and 3D massing exports in a local web application. The interface is in Simplified Chinese. The current version is `0.3.0`.

## Install and run

The project targets Windows 10/11 and has been tested with Python 3.11. Clone the repository or choose **Code → Download ZIP** on GitHub and extract the archive. Open a terminal in the source directory and install the dependencies.

```powershell
python -m pip install -r requirements.txt
```

Optionally install `opencv-python` for OpenCV-based rooftop candidates. The NumPy fallback and manual tracing work without OpenCV. The repository includes the frontend mapping libraries. Map tiles, imagery downloads, and OpenStreetMap queries require network access.

Double-click `start.bat` or start the local service manually.

```powershell
python app.py --host 127.0.0.1 --port 8765
```

Open <http://127.0.0.1:8765>. Keep the service running while you work and press `Ctrl+C` to stop it. If another program is using port 8765, choose a different `--port` and open the corresponding address. By default the service listens on the local loopback interface.

GitHub's **Download ZIP** contains the source code. To build a Windows portable copy, install the project dependencies and PyInstaller on Windows, then run `python -m PyInstaller TizzyQ-Microclimate-Portable.spec`. Keep the complete output directory `dist/TizzyQ-Microclimate-Portable/`. You can copy `start.bat` next to the executable to launch it.

## Research workflow

1. Select a basemap or enter an authorized HTTPS XYZ tile URL. Draw a rectangular research area and, optionally, a more precise village boundary for building detection.
2. Generate a satellite mosaic from tiles at the selected zoom level between Z16 and Z22, subject to imagery availability. Export an unannotated PNG or a presentation PNG with a scale bar and north arrow.
3. Load candidate footprints from OpenStreetMap or trace candidates from the imagery. Draw or adjust outlines manually using polygons, rectangles, or an orthogonal mode aligned with the first edge. Optional area snapping scales the footprint uniformly within a user-defined tolerance.
4. Review footprint geometry and building heights. The export workflow checks for self-intersections, short edges, and invalid heights. Set floor counts, per-floor heights, and zones, and lock individual building heights as needed.
5. Read GPS coordinates from field photo EXIF metadata. Display the photo points, associate them with the nearest building, and export the GPS points as CSV or GeoJSON. Review these associations before using them as height evidence.
6. Save or reopen a `.tqproject.json` project and export the reviewed footprints or village massing models.

## Export formats

| Format | Output and requirements |
| --- | --- |
| PNG | Imagery mosaic, with an optional scale bar and north arrow. |
| GeoJSON | Building footprints in WGS84 or GPS points exported from the photo panel. |
| CSV | GPS points exported from the photo panel. |
| DXF | Closed building polylines grouped by zone and source. |
| DWG | Converts the DXF using a locally installed AutoCAD Core Console. |
| OBJ | Built-in export for building massing. |
| SKP | Requires a local SketchUp installation. Models are grouped by zone, source, and building. |
| FBX | Uses SketchUp when available and falls back to built-in ASCII FBX 7.4 if native export fails. |

CAD and 3D geometry use 1:1 local metre coordinates. The origin is the minimum longitude and minimum latitude of the exported footprint vertices. CAD plot scales such as 1:100 are recorded separately from the geometry. DXF, DWG, OBJ, and ASCII FBX support rounding intervals from 1 m to 0.001 m, with 0.1 m as the default. The current SketchUp export path uses 0.1 m. The rounding interval does not determine survey accuracy.

Imagery tracing can mistake trees, shed roofs, and bright roads for buildings. Review missing or merged footprints, coordinate alignment, and field evidence for heights before simulation. The interface starts with a suggested floor height of 3.0 m. Some Chinese basemaps, such as Amap, use GCJ-02 and should not be directly overlaid on WGS84 vectors.

## Project files and imagery

The program creates `data/projects/` for saved projects, `data/exports/` for generated files, and `data/jobs/` for conversion jobs. When moving a project, copy the corresponding images from `data/exports/` along with the project file so its mosaic references still resolve. The public repository contains the source and bundled frontend libraries. Project files, GPS records, imagery, and generated models are stored locally.

Download, reuse, and credit imagery and map data according to the provider's terms. If a selected provider is unreachable from the local Python service or has no usable imagery for the area, choose an accessible source you are authorized to use.

## Verification and contributions

```powershell
python -m py_compile app.py
python smoke_test.py
node --check static/app.js
powershell -NoProfile -ExecutionPolicy Bypass -File launcher_test.ps1
```

The smoke test checks geometry and DXF, OBJ, and ASCII FBX generation. It also checks DWG conversion when AutoCAD Core Console is detected. For issues, include the application version, reproduction steps, and relevant errors. Remove precise GPS data and personal information from shared logs and examples.

## License

The project source is available under the [MIT License](LICENSE). Bundled Leaflet libraries retain their own licenses. [Third-party notices](THIRD_PARTY_NOTICES.md).

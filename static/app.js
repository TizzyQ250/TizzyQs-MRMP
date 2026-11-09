(() => {
  "use strict";

  const PROVIDERS = {
    google_sat: { name: "Google 卫星（默认）", category: "卫星影像", url: "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", attribution: "Imagery © Google", subdomains: ["0", "1", "2", "3"], maxZoom: 22, crs: "WGS84", exportable: true },
    google_hybrid: { name: "Google 混合", category: "卫星影像", url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", attribution: "Imagery © Google", subdomains: ["0", "1", "2", "3"], maxZoom: 22, crs: "WGS84", exportable: true },
    esri: { name: "Esri World Imagery", category: "卫星影像", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles © Esri", maxZoom: 20, crs: "WGS84", exportable: true },
    amap_sat: { name: "高德卫星", category: "国内地图", url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", attribution: "高德地图", subdomains: ["1", "2", "3", "4"], maxZoom: 20, crs: "GCJ-02", exportable: true },
    amap_road: { name: "高德标准图", category: "国内地图", url: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", attribution: "高德地图", subdomains: ["1", "2", "3", "4"], maxZoom: 20, crs: "GCJ-02", exportable: true },
    tencent_road: { name: "腾讯地图", category: "国内地图", url: "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&type=vector&styleid=0", attribution: "腾讯地图", subdomains: ["0", "1", "2", "3"], maxZoom: 19, crs: "GCJ-02", exportable: true },
    baidu_road: { name: "百度标准图（仅对照）", category: "国内地图", url: "https://maponline{s}.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=1", attribution: "百度地图", subdomains: ["0", "1", "2", "3"], maxZoom: 19, crs: "BD-09", exportable: false },
    baidu_sat: { name: "百度卫星（仅对照）", category: "国内地图", url: "https://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46", attribution: "百度地图", subdomains: ["0", "1", "2", "3"], maxZoom: 19, crs: "BD-09", exportable: false },
    tianditu_img: { name: "天地图影像（需令牌）", category: "国内地图", url: "https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=", attribution: "天地图", subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"], maxZoom: 18, crs: "WGS84", exportable: false },
    tianditu_vec: { name: "天地图矢量（需令牌）", category: "国内地图", url: "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=", attribution: "天地图", subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"], maxZoom: 18, crs: "WGS84", exportable: false },
    google_road: { name: "Google 地图", category: "国际标准", url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", attribution: "© Google", subdomains: ["0", "1", "2", "3"], maxZoom: 22, crs: "WGS84", exportable: true },
    osm: { name: "OpenStreetMap", category: "国际标准", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors", maxZoom: 19, crs: "WGS84", exportable: true },
    osm_hot: { name: "OSM Humanitarian", category: "OSM 变体", url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attribution: "© HOT / OpenStreetMap", maxZoom: 20, crs: "WGS84", exportable: true },
    cyclosm: { name: "CyclOSM", category: "OSM 变体", url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", attribution: "© CyclOSM / OpenStreetMap", maxZoom: 20, crs: "WGS84", exportable: true },
    carto_light: { name: "Carto 浅色", category: "风格主题", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: "© CARTO", maxZoom: 20, crs: "WGS84", exportable: true },
    carto_dark: { name: "Carto 深色", category: "风格主题", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: "© CARTO", maxZoom: 20, crs: "WGS84", exportable: true },
    carto_voyager: { name: "Carto Voyager", category: "风格主题", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: "© CARTO", maxZoom: 20, crs: "WGS84", exportable: true },
    carto_light_nolabels: { name: "Carto 浅色无标注", category: "风格主题", url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", attribution: "© CARTO", maxZoom: 20, crs: "WGS84", exportable: true },
    carto_dark_nolabels: { name: "Carto 深色无标注", category: "风格主题", url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", attribution: "© CARTO", maxZoom: 20, crs: "WGS84", exportable: true },
    esri_street: { name: "Esri 街道", category: "风格主题", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 20, crs: "WGS84", exportable: true },
    esri_topo: { name: "Esri 地形", category: "专业地图", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 20, crs: "WGS84", exportable: true },
    esri_natgeo: { name: "Esri 国家地理", category: "专业地图", url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri / National Geographic", maxZoom: 16, crs: "WGS84", exportable: true },
    esri_ocean: { name: "Esri 海洋", category: "专业地图", url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 16, crs: "WGS84", exportable: true },
    esri_gray: { name: "Esri 灰色画布", category: "风格主题", url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri", maxZoom: 16, crs: "WGS84", exportable: true },
    opentopo: { name: "OpenTopoMap", category: "专业地图", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: "© OpenTopoMap", maxZoom: 17, crs: "WGS84", exportable: true },
    usgs_topo: { name: "USGS 地形", category: "专业地图", url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", attribution: "© USGS", maxZoom: 16, crs: "WGS84", exportable: true },
  };

  const STEP_META = {
    1: ["STEP 01", "研究区域选取", "准备"],
    2: ["STEP 02", "高清瓦片拼图", "影像"],
    3: ["STEP 03", "建筑轮廓识别", "描边"],
    4: ["STEP 04", "CAD 核查与闭合", "核查"],
    5: ["STEP 05", "现场照片与层高", "标定"],
    6: ["STEP 06", "村落白模输出", "模型"],
  };

  const state = {
    step: 1,
    map: null,
    tileLayer: null,
    provider: "google_sat",
    bounds: null,
    boundaryLayer: null,
    boundaryGroup: null,
    villageBoundaryLayer: null,
    villageBoundaryGroup: null,
    footprintGroup: null,
    photoGroup: null,
    imageOverlay: null,
    activeDrawPurpose: null,
    activeEditor: null,
    mosaic: null,
    photos: [],
    health: null,
    selectedBuildingId: null,
    pendingTiles: 0,
    activeDrawer: null,
    orthoPreview: null,
    orthoLocalPoints: [],
    orthoOrigin: null,
    orthoBasis: null,
    autosaveTimer: null,
    autosaveInFlight: false,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function toast(title, detail = "", type = "ok", timeout = 4300) {
    const element = document.createElement("div");
    element.className = `toast ${type === "error" ? "error" : ""}`;
    element.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span>`;
    $("#toastStack").appendChild(element);
    window.setTimeout(() => element.remove(), timeout);
  }

  function setBusy(active, title = "正在处理", detail = "请稍候") {
    const overlay = $("#busyOverlay");
    overlay.hidden = !active;
    if (active) {
      $("#busyTitle").textContent = title;
      $("#busyDetail").textContent = detail;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function round(value, digits = 1) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
  }

  function formatCount(value) {
    return new Intl.NumberFormat("zh-CN").format(value);
  }

  function setStep(step) {
    step = Number(step);
    state.step = step;
    $$(".workflow-step").forEach((button) => {
      const ownStep = Number(button.dataset.step);
      button.classList.toggle("active", ownStep === step);
      button.classList.toggle("done", ownStep < step);
    });
    $$(".step-panel").forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.panel) === step));
    const [kicker, title, tag] = STEP_META[step];
    $("#panelKicker").textContent = kicker;
    $("#panelTitle").textContent = title;
    $("#phaseTag").textContent = tag;
    if (step !== 6) showMap();
    window.setTimeout(() => state.map?.invalidateSize(), 50);
  }

  function populateProviders() {
    const select = $("#providerSelect");
    const categories = [...new Set(Object.values(PROVIDERS).map((provider) => provider.category))];
    select.innerHTML = categories.map((category) => `<optgroup label="${escapeHtml(category)}">${Object.entries(PROVIDERS)
      .filter(([, provider]) => provider.category === category)
      .map(([id, provider]) => `<option value="${id}">${escapeHtml(provider.name)} · ${provider.crs}</option>`).join("")}</optgroup>`).join("");
    select.value = state.provider;
  }

  function initializeMap() {
    if (!window.L) {
      toast("地图组件加载失败", "请检查网络后刷新页面。", "error", 8000);
      return;
    }
    state.map = L.map("map", { zoomControl: true, preferCanvas: true }).setView([24.69, 98.59], 16);
    state.boundaryGroup = L.featureGroup().addTo(state.map);
    state.villageBoundaryGroup = L.featureGroup().addTo(state.map);
    state.footprintGroup = L.featureGroup().addTo(state.map);
    state.photoGroup = L.featureGroup().addTo(state.map);
    populateProviders();
    changeProvider(state.provider);

    state.map.on("mousemove", (event) => {
      $("#cursorCoords").textContent = `${event.latlng.lat.toFixed(6)}, ${event.latlng.lng.toFixed(6)}`;
    });
    state.map.on("zoomstart movestart", () => {
      if (state.imageOverlay) state.imageOverlay.setOpacity(0);
    });
    state.map.on("zoomend", () => {
      $("#mapZoom").textContent = `Z ${state.map.getZoom()}`;
      const provider = PROVIDERS[state.provider];
      $("#tileLoadStatus span").textContent = state.pendingTiles ? `正在加载 Z${state.map.getZoom()}` : `Z${state.map.getZoom()} · ${provider?.crs || "WGS84"}`;
      syncLiveMapLayers();
      state.footprintGroup.eachLayer(styleFootprintLayer);
    });
    state.map.on("moveend", syncLiveMapLayers);
    state.map.on(L.Draw.Event.CREATED, handleDrawCreated);
    state.map.on(L.Draw.Event.EDITED, () => {
      syncLayerFeatures();
      renderBuildings();
      updateSummary();
      toast("轮廓已更新", "坐标将在导出时统一四舍五入到 0.1 m。", "ok");
      scheduleAutosave();
    });
    state.map.on(L.Draw.Event.DELETED, () => {
      renderBuildings();
      updateSummary();
      scheduleAutosave();
    });
  }

  function syncLiveMapLayers() {
    if (!state.map) return;
    if (state.imageOverlay && state.mosaic) {
      const isSameSource = !state.mosaic.requested_provider || state.mosaic.requested_provider === state.provider;
      const isNativeDetail = state.map.getZoom() <= Number(state.mosaic.zoom || 0);
      state.imageOverlay.setOpacity(isSameSource && isNativeDetail ? 1 : 0);
    }
    state.villageBoundaryLayer?.bringToFront?.();
    state.footprintGroup?.bringToFront?.();
    state.photoGroup?.bringToFront?.();
  }

  function changeProvider(id) {
    if (!state.map || !PROVIDERS[id]) return;
    state.provider = id;
    if (state.tileLayer) state.map.removeLayer(state.tileLayer);
    const provider = PROVIDERS[id];
    const tileOptions = {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
      crossOrigin: true,
    };
    if (provider.subdomains) tileOptions.subdomains = provider.subdomains;
    state.tileLayer = L.tileLayer(provider.url, tileOptions).addTo(state.map);
    state.pendingTiles = 0;
    const status = $("#tileLoadStatus");
    state.tileLayer.on("loading", () => { status.className = "tile-load-status loading"; status.querySelector("span").textContent = `正在加载 ${provider.name}`; });
    state.tileLayer.on("tileloadstart", () => { state.pendingTiles += 1; });
    state.tileLayer.on("tileload tileerror", () => { state.pendingTiles = Math.max(0, state.pendingTiles - 1); });
    state.tileLayer.on("load", () => { state.pendingTiles = 0; status.className = "tile-load-status"; status.querySelector("span").textContent = `已加载 Z${state.map.getZoom()} · ${provider.crs}`; });
    state.tileLayer.on("tileerror", () => { status.className = "tile-load-status error"; status.querySelector("span").textContent = "部分瓦片失败，可切换底图"; });
    state.tileLayer.bringToBack();
    if (!provider.exportable) toast("当前底图仅用于对照", `${provider.name} 的坐标/令牌机制不适合直接拼图；正式导出请切换 Google、Esri、OSM 或高德。`, "error", 6500);
    updateMosaicEstimate();
  }

  function enterHighDetailMode() {
    const provider = PROVIDERS[state.provider];
    const target = Math.min(provider.maxZoom, provider.category === "卫星影像" ? 21 : 20);
    state.map.setZoom(target, { animate: true });
    $("#mosaicZoom").value = Math.min(22, target);
    updateMosaicEstimate();
    toast("高清核查模式", `地图正在加载 Z${target} 瓦片；已画轮廓保持原坐标不变。`, "ok", 5500);
  }

  function locateFromInput() {
    const parts = $("#locationSearch").value.split(/[,，\s]+/).filter(Boolean).map(Number);
    if (parts.length !== 2 || parts.some((value) => !Number.isFinite(value))) {
      toast("坐标格式不正确", "请按“纬度, 经度”输入，例如 24.690, 98.590。", "error");
      return;
    }
    state.map.setView([parts[0], parts[1]], Math.max(16, state.map.getZoom()));
    toast("已定位", `${parts[0].toFixed(6)}, ${parts[1].toFixed(6)}`);
  }

  function beginRectangle() {
    stopActiveDrawing(false);
    state.activeDrawPurpose = "region";
    const drawer = new L.Draw.Rectangle(state.map, {
      shapeOptions: { color: getComputedStyle(document.documentElement).getPropertyValue("--acid").trim() || "#d9f34a", weight: 3, fill: false, fillOpacity: 0, className: "research-boundary" },
    });
    state.activeDrawer = drawer;
    drawer.enable();
    toast("请在地图上拖拽", "绿色矩形就是最终研究边界。", "ok");
  }

  function beginVillageBoundary() {
    if (!state.bounds) return toast("请先绘制矩形研究区", "异形村落边界必须位于矩形研究区内部。", "error");
    stopActiveDrawing(false);
    state.activeDrawPurpose = "village-boundary";
    const drawer = new L.Draw.Polygon(state.map, {
      allowIntersection: false,
      showArea: true,
      shapeOptions: { color: "#55d5e8", weight: 3, fillColor: "#55d5e8", fillOpacity: 0.05, className: "village-boundary" },
    });
    state.activeDrawer = drawer;
    drawer.enable();
    toast("绘制异形村落边界", "沿村落最外缘逐点绘制并点击起点闭合；识别将只保留该范围内建筑。", "ok", 6500);
  }

  function clearVillageBoundary() {
    state.villageBoundaryGroup.clearLayers();
    state.villageBoundaryLayer = null;
    $("#villageBoundaryStatus").textContent = "尚未设置，默认识别整个矩形";
    scheduleAutosave();
  }

  function beginBuildingDraw(mode = $("#buildingDrawMode").value) {
    stopActiveDrawing(false);
    state.activeDrawPurpose = "building";
    state.drawMode = mode;
    if (mode === "orthogonal") {
      startOrthogonalDraw();
      toast("局部平面正交绘制", "先画任意方向的第一条基准边；后续边自动保持平行/垂直。双击或按 Enter 闭合。", "ok", 7000);
      return;
    }
    const drawer = mode === "rectangle"
      ? new L.Draw.Rectangle(state.map, { shapeOptions: footprintStyle(false) })
      : new L.Draw.Polygon(state.map, { allowIntersection: false, showArea: true, shapeOptions: footprintStyle(false) });
    state.activeDrawer = drawer;
    drawer.enable();
    toast(mode === "rectangle" ? "两点矩形绘制" : "自由建筑轮廓", mode === "rectangle" ? "拖拽两个对角点生成矩形。" : "沿屋顶外边线逐点绘制，点击起点闭合。", "ok");
  }

  function startFineDraw() {
    const targetZoom = Math.min(21, PROVIDERS[state.provider]?.maxZoom || 20);
    if (state.map.getZoom() < 19) state.map.setZoom(targetZoom);
    beginBuildingDraw();
  }

  function stopActiveDrawing(resetContinuous = true) {
    state.activeDrawer?.disable?.();
    state.activeDrawer = null;
    stopOrthogonalDraw();
    state.activeDrawPurpose = null;
    if (resetContinuous && $("#continuousDraw")) $("#continuousDraw").checked = false;
  }

  function startOrthogonalDraw() {
    state.orthoLocalPoints = [];
    state.orthoOrigin = null;
    state.orthoBasis = null;
    state.map.doubleClickZoom.disable();
    const click = (event) => addOrthogonalPoint(event.latlng);
    const move = (event) => updateOrthogonalPreview(event.latlng);
    const dbl = (event) => { L.DomEvent.stop(event.originalEvent); finishOrthogonalDraw(); };
    const key = (event) => {
      if (event.key === "Enter") finishOrthogonalDraw();
      if (event.key === "Escape") stopActiveDrawing(true);
    };
    state.orthoHandlers = { click, move, dbl, key };
    state.map.on("click", click);
    state.map.on("mousemove", move);
    state.map.on("dblclick", dbl);
    document.addEventListener("keydown", key);
  }

  function stopOrthogonalDraw() {
    const handlers = state.orthoHandlers;
    if (handlers) {
      state.map.off("click", handlers.click);
      state.map.off("mousemove", handlers.move);
      state.map.off("dblclick", handlers.dbl);
      document.removeEventListener("keydown", handlers.key);
      state.orthoHandlers = null;
    }
    if (state.orthoPreview) state.map.removeLayer(state.orthoPreview);
    state.orthoPreview = null;
    state.map?.doubleClickZoom?.enable();
  }

  function addOrthogonalPoint(latlng) {
    if (!state.orthoOrigin) {
      state.orthoOrigin = latlng;
      state.orthoLocalPoints = [[0, 0]];
      updateOrthogonalPreview(latlng);
      return;
    }
    const [rawX, rawY] = lonlatLocal(latlng.lng, latlng.lat, state.orthoOrigin.lng, state.orthoOrigin.lat);
    if (!state.orthoBasis) {
      const length = Math.hypot(rawX, rawY);
      if (length < 0.2) return;
      state.orthoBasis = { ux: rawX / length, uy: rawY / length, vx: -rawY / length, vy: rawX / length };
      state.orthoLocalPoints.push([length, 0]);
    } else {
      const rawU = rawX * state.orthoBasis.ux + rawY * state.orthoBasis.uy;
      const rawV = rawX * state.orthoBasis.vx + rawY * state.orthoBasis.vy;
      const previous = state.orthoLocalPoints.at(-1);
      const snapped = Math.abs(rawU - previous[0]) >= Math.abs(rawV - previous[1])
        ? [rawU, previous[1]]
        : [previous[0], rawV];
      if (Math.hypot(snapped[0] - previous[0], snapped[1] - previous[1]) >= 0.15) state.orthoLocalPoints.push(snapped);
    }
    updateOrthogonalPreview(latlng);
  }

  function orthogonalLatLng(point) {
    const basis = state.orthoBasis || { ux: 1, uy: 0, vx: 0, vy: 1 };
    const x = point[0] * basis.ux + point[1] * basis.vx;
    const y = point[0] * basis.uy + point[1] * basis.vy;
    return localToLatLng(x, y, state.orthoOrigin.lng, state.orthoOrigin.lat);
  }

  function snappedOrthogonalCursor(latlng) {
    if (!state.orthoOrigin || !state.orthoBasis || !state.orthoLocalPoints.length) return latlng;
    const [rawX, rawY] = lonlatLocal(latlng.lng, latlng.lat, state.orthoOrigin.lng, state.orthoOrigin.lat);
    const rawU = rawX * state.orthoBasis.ux + rawY * state.orthoBasis.uy;
    const rawV = rawX * state.orthoBasis.vx + rawY * state.orthoBasis.vy;
    const previous = state.orthoLocalPoints.at(-1);
    const point = Math.abs(rawU - previous[0]) >= Math.abs(rawV - previous[1]) ? [rawU, previous[1]] : [previous[0], rawV];
    return orthogonalLatLng(point);
  }

  function updateOrthogonalPreview(cursor) {
    if (!state.orthoOrigin) return;
    const points = state.orthoBasis ? state.orthoLocalPoints.map(orthogonalLatLng) : [state.orthoOrigin];
    if (cursor) points.push(snappedOrthogonalCursor(cursor));
    if (!state.orthoPreview) state.orthoPreview = L.polyline(points, { ...footprintStyle(false), weight: 3, className: "building-footprint" }).addTo(state.map);
    else state.orthoPreview.setLatLngs(points);
  }

  function finishOrthogonalDraw() {
    if (!state.orthoBasis || state.orthoLocalPoints.length < 3) return toast("正交轮廓点数不足", "至少绘制三条边后再闭合。", "error");
    const points = [...state.orthoLocalPoints];
    const first = points[0], last = points.at(-1), previous = points.at(-2);
    if (Math.abs(last[0] - first[0]) > 0.05 && Math.abs(last[1] - first[1]) > 0.05) {
      const lastWasHorizontal = Math.abs(last[1] - previous[1]) < 0.05;
      points.push(lastWasHorizontal ? [last[0], first[1]] : [first[0], last[1]]);
    }
    const latlngs = points.map(orthogonalLatLng);
    stopOrthogonalDraw();
    handleDrawCreated({ layer: L.polygon(latlngs, footprintStyle(false)), layerType: "polygon" });
  }

  function handleDrawCreated(event) {
    if (state.activeDrawPurpose === "region") {
      state.boundaryGroup.clearLayers();
      state.boundaryLayer = event.layer.addTo(state.boundaryGroup);
      state.bounds = state.boundaryLayer.getBounds();
      state.activeDrawPurpose = null;
      updateBoundsUI();
      updateMosaicEstimate();
      state.map.fitBounds(state.bounds, { padding: [18, 18] });
      toast("研究区已确定", "后续卫图、CAD 与白模将共用这一边界。", "ok");
      scheduleAutosave();
      return;
    }
    if (state.activeDrawPurpose === "village-boundary") {
      const points = latLngRing(event.layer);
      if (!points.every((point) => state.bounds.contains(point))) {
        state.activeDrawPurpose = null;
        toast("异形边界超出矩形研究区", "请重新绘制，所有顶点都必须位于矩形内部。", "error", 7000);
        return;
      }
      state.villageBoundaryGroup.clearLayers();
      state.villageBoundaryLayer = event.layer;
      event.layer.setStyle({ color: "#55d5e8", weight: 3, fillColor: "#55d5e8", fillOpacity: 0.05, className: "village-boundary" });
      event.layer.addTo(state.villageBoundaryGroup);
      state.activeDrawPurpose = null;
      $("#villageBoundaryStatus").textContent = `${points.length} 个边界点 · 建筑识别已限制在异形范围内`;
      scheduleAutosave();
      return;
    }
    if (state.activeDrawPurpose === "building") {
      const index = Math.max(0, ...state.footprintGroup.getLayers().map((layer) => Number(String(layer.feature?.properties?.id || "").match(/MAN-(\d+)/)?.[1] || 0))) + 1;
      const drawMode = state.drawMode || "free";
      event.layer.feature = {
        type: "Feature",
        properties: { id: `MAN-${String(index).padStart(3, "0")}`, source: "manual", draw_mode: drawMode, zone: "主区", status: "已核查", floors: Number($("#defaultFloors").value) || 2, floor_height: Number($("#floorHeight").value) || 3, confidence: 1, height_locked: false },
      };
      applyAreaSnapToLayer(event.layer);
      styleFootprintLayer(event.layer);
      event.layer.addTo(state.footprintGroup);
      state.activeDrawPurpose = null;
      renderBuildings();
      updateSummary();
      scheduleAutosave();
      if ($("#continuousDraw").checked) window.setTimeout(() => beginBuildingDraw(drawMode), 180);
    }
  }

  function applyAreaSnapToLayer(layer) {
    const target = Number($("#targetBuildingArea").value || 0);
    if (target <= 0) return;
    const area = polygonArea(layer);
    const tolerance = Math.max(1, Number($("#areaSnapTolerance").value || 15)) / 100;
    if (area <= 0 || Math.abs(area - target) / target > tolerance) return;
    const scale = Math.sqrt(target / area);
    const center = layer.getBounds().getCenter();
    layer.setLatLngs(latLngRing(layer).map((point) => L.latLng(center.lat + (point.lat - center.lat) * scale, center.lng + (point.lng - center.lng) * scale)));
    layer.feature.properties.area_target_m2 = round(target, 1);
    layer.feature.properties.area_snapped = true;
    toast("面积已吸附", `${area.toFixed(1)} m² → ${target.toFixed(1)} m²，方向和正交关系保持不变。`, "ok");
  }

  function updateBoundsUI() {
    if (!state.bounds) return;
    const west = state.bounds.getWest();
    const east = state.bounds.getEast();
    const south = state.bounds.getSouth();
    const north = state.bounds.getNorth();
    $("#boundWest").value = west.toFixed(6);
    $("#boundEast").value = east.toFixed(6);
    $("#boundSouth").value = south.toFixed(6);
    $("#boundNorth").value = north.toFixed(6);
    const width = haversine(south, west, south, east);
    const height = haversine(south, west, north, west);
    $("#summaryArea").textContent = `${(width * height / 1e6).toFixed(2)} km²`;
    $("#summaryBounds").textContent = `${round(width)} × ${round(height)} m`;
  }

  function boundsArray() {
    if (!state.bounds) return null;
    return [state.bounds.getWest(), state.bounds.getSouth(), state.bounds.getEast(), state.bounds.getNorth()];
  }

  function villageBoundaryGeometry() {
    if (!state.villageBoundaryLayer) return null;
    const ring = latLngRing(state.villageBoundaryLayer).map((point) => [point.lng, point.lat]);
    if (ring.length && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) ring.push([...ring[0]]);
    return { type: "Polygon", coordinates: [ring] };
  }

  function updateMosaicEstimate() {
    const zoom = Number($("#mosaicZoom")?.value || 18);
    const labels = { 16: "区域级", 17: "村落级", 18: "建筑级", 19: "屋顶级", 20: "高清识别", 21: "极高清", 22: "最大级" };
    if ($("#zoomLabel")) $("#zoomLabel").textContent = `Z${zoom} / ${labels[zoom]}`;
    if (!state.bounds) {
      $("#tileCount").textContent = "0";
      return;
    }
    const [west, south, east, north] = boundsArray();
    const scale = 2 ** zoom;
    const px = (lon) => ((lon + 180) / 360) * scale * 256;
    const py = (lat) => {
      const rad = (Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180;
      return ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * scale * 256;
    };
    const left = px(west), right = px(east), top = py(north), bottom = py(south);
    const x0 = Math.floor(left / 256), x1 = Math.floor((right - 1e-7) / 256);
    const y0 = Math.floor(top / 256), y1 = Math.floor((bottom - 1e-7) / 256);
    const tiles = (x1 - x0 + 1) * (y1 - y0 + 1);
    const width = Math.max(1, Math.round(right - left));
    const height = Math.max(1, Math.round(bottom - top));
    const centerLat = (south + north) / 2;
    const resolution = Math.cos(centerLat * Math.PI / 180) * 2 * Math.PI * 6378137 / (256 * scale);
    $("#tileCount").textContent = formatCount(tiles);
    $("#pixelSize").textContent = `${formatCount(width)} × ${formatCount(height)} px`;
    $("#meterPerPixel").textContent = `${resolution.toFixed(2)} m/px`;
    $("#groundSpan").textContent = `${round(Math.max(width, height) * resolution)} m`;
    $("#summaryTiles").textContent = `${formatCount(tiles)} tiles`;
    $("#summaryResolution").textContent = `Z${zoom} · ${resolution.toFixed(2)} m/px`;
    const button = $("#createMosaicBtn");
    const provider = PROVIDERS[state.provider];
    button.disabled = tiles > 900 || !provider?.exportable || zoom > provider.maxZoom;
    $("#tileWarning").classList.toggle("warning", tiles > 500);
    if (tiles > 900) $("#tileWarning span").textContent = `当前需要 ${formatCount(tiles)} 张瓦片，超过本地安全上限 900。请降低精度或缩小选区。`;
    else if (zoom > provider.maxZoom) $("#tileWarning span").textContent = `${provider.name} 最高支持 Z${provider.maxZoom}，请降低精度或切换 Google 卫星。`;
    else if (!provider.exportable) $("#tileWarning span").textContent = `${provider.name} 仅用于屏幕对照，不能直接进行标准 XYZ 拼图。`;
    else $("#tileWarning span").textContent = "系统会逐张获取当前缩放级别的小瓦片并无损拼接，不会截取当前低清屏幕。请遵守所选地图服务许可。";
  }

  async function createMosaic() {
    if (!state.bounds) {
      toast("请先框选研究区域", "研究边界决定瓦片范围。", "error");
      setStep(1);
      return;
    }
    const zoom = Number($("#mosaicZoom").value);
    setBusy(true, "正在拼接高清卫图", "下载小瓦片 → 精确裁边 → 添加比例尺与指北针");
    try {
      const response = await fetch("/api/mosaic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bounds: boundsArray(), zoom, provider: state.provider, template: PROVIDERS[state.provider]?.custom ? PROVIDERS[state.provider].url : undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.detail || "拼图失败");
      state.mosaic = result;
      if (state.imageOverlay) state.map.removeLayer(state.imageOverlay);
      state.imageOverlay = L.imageOverlay(result.raw_url || result.url, state.bounds, { opacity: 1, interactive: false }).addTo(state.map);
      state.imageOverlay.bringToBack();
      syncLiveMapLayers();
      $("#mosaicPreview").innerHTML = `<span>PNG</span><div><b>${escapeHtml(result.raw_filename || result.filename)}</b><small>${formatCount(result.width)} × ${formatCount(result.height)} px · ${result.tile_count} tiles · <a href="${result.raw_url || result.url}" download>原色无覆盖图</a> · <a href="${result.url}" download>带比例尺展示图</a></small></div>`;
      downloadUrl(result.raw_url || result.url, result.raw_filename || result.filename);
      const sourceNote = result.fallback_from ? `；${result.fallback_from} 后端受阻，已自动切换为 ${result.provider}` : "";
      toast("高清卫图已生成", `${result.width} × ${result.height} px；失败瓦片 ${result.failed_tiles}${sourceNote}。`, "ok", 7500);
      scheduleAutosave();
    } catch (error) {
      toast("高清拼图失败", error.message, "error", 7000);
    } finally {
      setBusy(false);
    }
  }

  function footprintStyle(verified) {
    const css = getComputedStyle(document.documentElement);
    const acid = css.getPropertyValue("--acid").trim() || "#d9f34a";
    const signal = css.getPropertyValue("--signal").trim() || "#ff5a4f";
    return verified
      ? { color: acid, weight: 3, opacity: 1, fillColor: acid, fillOpacity: 0.06, className: "building-footprint" }
      : { color: signal, weight: 3, opacity: 1, fillColor: signal, fillOpacity: 0.04, dashArray: "7 4", className: "building-footprint" };
  }

  function styleFootprintLayer(layer) {
    const props = layer.feature?.properties || {};
    layer.setStyle(footprintStyle(props.status === "已核查"));
    layer.unbindTooltip();
    layer.bindTooltip(`${props.id || "建筑"} · ${props.floors || 2} 层`, { sticky: state.map.getZoom() < 20, permanent: state.map.getZoom() >= 20, direction: "center", className: "building-id-label" });
    if (layer._path) {
      layer._path.classList.add("building-footprint");
      layer._path.classList.toggle("is-selected", String(props.id) === state.selectedBuildingId);
    }
    layer.off("click");
    layer.on("click", () => {
      selectBuilding(props.id, true);
      const row = document.querySelector(`[data-building-id="${CSS.escape(String(props.id))}"]`);
      row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function addGeoJsonFootprints(collection, replace = true) {
    if (replace) state.footprintGroup.clearLayers();
    const layer = L.geoJSON(collection, {
      style: (feature) => footprintStyle(feature.properties?.status === "已核查"),
      onEachFeature: (feature, featureLayer) => {
        featureLayer.feature = feature;
        styleFootprintLayer(featureLayer);
      },
    });
    layer.eachLayer((featureLayer) => state.footprintGroup.addLayer(featureLayer));
    renderBuildings();
    updateSummary();
    scheduleAutosave();
  }

  async function runTrace(method) {
    if (!state.bounds) {
      toast("请先框选研究区域", "识别结果必须与研究区坐标对齐。", "error");
      return;
    }
    if (method === "raster" && !state.mosaic) {
      toast("请先生成高清卫图", "本地预描边需要刚才拼接的影像。", "error");
      setStep(2);
      return;
    }
    setBusy(true, method === "osm" ? "正在获取配准轮廓" : "正在进行本地预描边", method === "osm" ? "查询研究区内公开建筑矢量" : "分析屋顶候选区域，不上传影像");
    try {
      const endpoint = method === "osm" ? "/api/footprints/osm" : "/api/footprints/raster";
      const clip_polygon = villageBoundaryGeometry();
      const payload = method === "osm"
        ? { bounds: boundsArray(), clip_polygon }
        : { bounds: boundsArray(), clip_polygon, export_id: state.mosaic.id, sensitivity: Number($("#sensitivity").value) / 100, min_area: Number($("#minArea").value) || 18 };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.detail || "识别失败");
      addGeoJsonFootprints(result, $("#traceMergeMode").value !== "append");
      $("#traceMethod").textContent = result.method;
      $("#traceCount").textContent = `${result.features.length} 个候选轮廓`;
      if (!result.features.length) toast("该方法没有找到建筑", "可切换另一种识别方法，或在核查步骤手动补画。", "error", 7000);
      else toast("候选轮廓已对齐", `共 ${result.features.length} 个${clip_polygon ? "，已按异形村落边界过滤" : ""}；下一步请逐栋核查。`);
    } catch (error) {
      toast("建筑识别失败", error.message, "error", 7000);
    } finally {
      setBusy(false);
    }
  }

  function syncLayerFeatures() {
    state.footprintGroup.eachLayer((layer) => {
      if (!layer.feature) layer.feature = { type: "Feature", properties: {} };
      const coordinates = latLngRing(layer).map((latlng) => [latlng.lng, latlng.lat]);
      if (coordinates.length && (coordinates[0][0] !== coordinates.at(-1)[0] || coordinates[0][1] !== coordinates.at(-1)[1])) coordinates.push([...coordinates[0]]);
      layer.feature.geometry = { type: "Polygon", coordinates: [coordinates] };
    });
  }

  function latLngRing(layer) {
    let values = layer.getLatLngs?.() || [];
    while (Array.isArray(values[0])) values = values[0];
    return values;
  }

  function serializeFootprints(verifiedOnly = false) {
    syncLayerFeatures();
    const features = [];
    state.footprintGroup.eachLayer((layer) => {
      const feature = JSON.parse(JSON.stringify(layer.feature));
      if (!verifiedOnly || feature.properties?.status === "已核查") features.push(feature);
    });
    return { type: "FeatureCollection", features };
  }

  function polygonArea(layer) {
    const points = latLngRing(layer);
    if (points.length < 3) return 0;
    const origin = points[0];
    const projected = points.map((point) => lonlatLocal(point.lng, point.lat, origin.lng, origin.lat));
    let twice = 0;
    for (let i = 0; i < projected.length; i++) {
      const next = projected[(i + 1) % projected.length];
      twice += projected[i][0] * next[1] - next[0] * projected[i][1];
    }
    return Math.abs(twice) / 2;
  }

  function lonlatLocal(lon, lat, lon0, lat0) {
    const radius = 6378137;
    return [
      radius * ((lon - lon0) * Math.PI / 180) * Math.cos(((lat + lat0) / 2) * Math.PI / 180),
      radius * ((lat - lat0) * Math.PI / 180),
    ];
  }

  function localToLatLng(x, y, lon0, lat0) {
    const radius = 6378137;
    const lat = lat0 + (y / radius) * 180 / Math.PI;
    const lon = lon0 + (x / (radius * Math.cos(((lat + lat0) / 2) * Math.PI / 180))) * 180 / Math.PI;
    return L.latLng(lat, lon);
  }

  function filterFootprints() {
    const minArea = Number($("#minArea").value) || 0;
    const defaultFloors = Math.max(1, Number($("#defaultFloors").value) || 2);
    const remove = [];
    state.footprintGroup.eachLayer((layer) => {
      if (polygonArea(layer) < minArea) remove.push(layer);
      else {
        layer.feature.properties.floors = Number(layer.feature.properties.floors) || defaultFloors;
        layer.feature.properties.height = round(layer.feature.properties.floors * Number($("#floorHeight").value || 3.3), 1);
      }
    });
    remove.forEach((layer) => state.footprintGroup.removeLayer(layer));
    renderBuildings();
    updateSummary();
    toast("过滤已应用", `移除 ${remove.length} 个小于 ${minArea} m² 的候选轮廓。`);
    scheduleAutosave();
  }

  function renderBuildings() {
    const container = $("#buildingList");
    const layers = state.footprintGroup?.getLayers?.() || [];
    if (!layers.length) {
      container.innerHTML = '<div class="empty-state">还没有建筑轮廓</div>';
      return;
    }
    container.innerHTML = layers.map((layer, index) => {
      const props = layer.feature?.properties || {};
      const id = props.id || `B-${String(index + 1).padStart(3, "0")}`;
      props.id = id;
      const area = round(polygonArea(layer));
      const verified = props.status === "已核查";
      const floors = Number(props.floors) || 2;
      const floorHeight = Number(props.floor_height) || Number($("#floorHeight").value) || 3;
      if (!Number(props.height)) props.height = round(floors * floorHeight, Number($("#exportPrecision")?.value || 1));
      const dimensions = buildingDimensions(layer);
      return `<div class="building-row" data-building-id="${escapeHtml(id)}">
        <div><b>${escapeHtml(id)}</b><small>${area} m² · ${escapeHtml(props.source || "manual")}</small></div>
        <input title="层数" aria-label="${escapeHtml(id)} 层数" type="number" min="1" max="30" value="${floors}" data-building-floors="${escapeHtml(id)}">
        <input title="单层高度 m" aria-label="${escapeHtml(id)} 单层高度" type="number" min="2.2" max="8" step="0.1" value="${floorHeight}" data-building-floor-height="${escapeHtml(id)}">
        <input title="总高度 m" aria-label="${escapeHtml(id)} 总高度" type="number" min="0.1" max="300" step="0.1" value="${Number(props.height).toFixed(1)}" data-building-height="${escapeHtml(id)}">
        <button class="${verified ? "verified" : ""}" data-verify-building="${escapeHtml(id)}">${verified ? "已核查" : "待核查"}</button>
        <div class="building-controls">
          <label>东西向尺寸 m<input type="number" min="0.2" step="0.1" value="${dimensions.width.toFixed(1)}" data-building-width="${escapeHtml(id)}"></label>
          <label>南北向尺寸 m<input type="number" min="0.2" step="0.1" value="${dimensions.depth.toFixed(1)}" data-building-depth="${escapeHtml(id)}"></label>
          <label>分区<input value="${escapeHtml(props.zone || "主区")}" maxlength="20" data-building-zone="${escapeHtml(id)}"></label>
          <label class="lock-label"><input type="checkbox" data-building-lock="${escapeHtml(id)}" ${props.height_locked ? "checked" : ""}>锁定总高度</label>
        </div>
      </div>`;
    }).join("");
    selectBuilding(state.selectedBuildingId, false);
  }

  function layerById(id) {
    return state.footprintGroup.getLayers().find((layer) => String(layer.feature?.properties?.id) === String(id));
  }

  function selectBuilding(id, pan = false) {
    state.selectedBuildingId = id && layerById(id) ? String(id) : null;
    $$(".building-row").forEach((row) => row.classList.toggle("selected", row.dataset.buildingId === state.selectedBuildingId));
    state.footprintGroup.eachLayer((layer) => {
      styleFootprintLayer(layer);
      if (String(layer.feature?.properties?.id) === state.selectedBuildingId) layer.setStyle({ weight: 4, opacity: 1, fillOpacity: 0.22 });
    });
    const status = $("#selectionStatus");
    status.classList.toggle("active", Boolean(state.selectedBuildingId));
    status.textContent = state.selectedBuildingId ? `已选中 ${state.selectedBuildingId} · 可编辑尺寸、高度或直接删除` : "未选中建筑 · 缩放地图不会改变已画轮廓坐标";
    const layer = state.selectedBuildingId ? layerById(state.selectedBuildingId) : null;
    if (pan && layer) state.map.panTo(layer.getBounds().getCenter());
  }

  function buildingDimensions(layer) {
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    return {
      width: haversine(center.lat, bounds.getWest(), center.lat, bounds.getEast()),
      depth: haversine(bounds.getSouth(), center.lng, bounds.getNorth(), center.lng),
    };
  }

  function resizeFootprint(layer, targetWidth, targetDepth) {
    const current = buildingDimensions(layer);
    if (current.width <= 0 || current.depth <= 0) return;
    const center = layer.getBounds().getCenter();
    const scaleX = Math.max(0.05, targetWidth / current.width);
    const scaleY = Math.max(0.05, targetDepth / current.depth);
    const resized = latLngRing(layer).map((point) => L.latLng(
      center.lat + (point.lat - center.lat) * scaleY,
      center.lng + (point.lng - center.lng) * scaleX,
    ));
    layer.setLatLngs(resized);
    syncLayerFeatures();
    styleFootprintLayer(layer);
  }

  function removeBuildings(predicate, label) {
    const removed = [];
    state.footprintGroup.eachLayer((layer) => { if (predicate(layer)) removed.push(layer); });
    removed.forEach((layer) => state.footprintGroup.removeLayer(layer));
    state.selectedBuildingId = null;
    renderBuildings();
    selectBuilding(null, false);
    updateSummary();
    toast(label, `已移除 ${removed.length} 个轮廓。`);
    scheduleAutosave();
  }

  function deleteSelected() {
    if (!state.selectedBuildingId) return toast("请先选择建筑", "点击地图轮廓或建筑清单后再删除。", "error");
    removeBuildings((layer) => String(layer.feature?.properties?.id) === state.selectedBuildingId, "已删除选中建筑");
  }

  function toggleVerify(id) {
    const layer = layerById(id);
    if (!layer) return;
    const props = layer.feature.properties;
    props.status = props.status === "已核查" ? "待核查" : "已核查";
    styleFootprintLayer(layer);
    renderBuildings();
    updateSummary();
    scheduleAutosave();
  }

  function verifyAll() {
    state.footprintGroup.eachLayer((layer) => {
      layer.feature.properties.status = "已核查";
      styleFootprintLayer(layer);
    });
    renderBuildings();
    updateSummary();
    toast("核查状态已更新", "请确保误判已经删除、缺失建筑已经补画。", "ok");
    scheduleAutosave();
  }

  function enableEdit() {
    if (!state.footprintGroup.getLayers().length) {
      toast("没有可编辑的轮廓", "先执行识别或手动补画。", "error");
      return;
    }
    if (state.activeEditor) state.activeEditor.disable();
    state.activeEditor = new L.EditToolbar.Edit(state.map, { featureGroup: state.footprintGroup, selectedPathOptions: { maintainColor: true, opacity: 0.95, fillOpacity: 0.12 } });
    state.activeEditor.enable();
    toast("顶点编辑已开启", "拖动节点调整；点击地图空白后可继续编辑其他建筑。", "ok", 6000);
  }

  async function auditGeometry(showToast = true) {
    const precision = Number($("#exportPrecision").value || 1);
    const geojson = serializeFootprints(true);
    const response = await fetch("/api/geometry/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ geojson, precision }) });
    const result = await response.json();
    const box = $("#geometryAudit");
    if (result.ok) {
      box.className = "audit-result ok";
      box.textContent = `${result.valid} 栋通过：轮廓闭合、无自交，量化精度 ${result.precision_m} m。`;
      if (showToast) toast("几何审计通过", `${result.valid} 栋建筑可形成完整 CAD/SU 面。`);
    } else {
      box.className = "audit-result error";
      box.textContent = (result.invalid || []).map((item) => `${item.id}：${item.errors.join("、")}`).join("；");
      if (showToast) toast("几何审计未通过", box.textContent, "error", 8000);
    }
    return result;
  }

  async function handlePhotos(files) {
    if (!files.length) return;
    const form = new FormData();
    [...files].forEach((file) => form.append("photos", file, file.name));
    setBusy(true, "正在读取现场照片", "仅在本机提取 EXIF GPS、拍摄时间与尺寸");
    try {
      const response = await fetch("/api/photos/exif", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "照片读取失败");
      state.photos = result.photos;
      renderPhotos();
      renderPhotoMarkers();
      updateSummary();
      const gpsCount = state.photos.filter((photo) => photo.has_gps).length;
      toast("照片读取完成", `${state.photos.length} 张照片，${gpsCount} 张包含 GPS。`);
      scheduleAutosave();
    } catch (error) {
      toast("照片读取失败", error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function renderPhotos() {
    const container = $("#photoList");
    if (!state.photos.length) {
      container.innerHTML = '<div class="empty-state">尚未读取照片</div>';
      return;
    }
    container.innerHTML = state.photos.map((photo, index) => {
      const nearest = photo.has_gps ? nearestBuilding(photo.lat, photo.lon) : null;
      photo.nearest_building = nearest?.id || null;
      photo.nearest_distance_m = nearest ? round(nearest.distance, 1) : null;
      return `<div class="photo-row ${nearest && nearest.distance <= 120 ? "nearby" : ""}">
      <span class="photo-index">${String(index + 1).padStart(2, "0")}</span>
      <div><b>${escapeHtml(photo.filename)}</b><small>${photo.has_gps ? `${photo.lat}, ${photo.lon}` : "无 GPS"}${photo.captured_at ? ` · ${escapeHtml(photo.captured_at)}` : ""}${nearest ? ` · ${escapeHtml(nearest.id)} / ${round(nearest.distance)}m` : ""}</small></div>
      <input type="number" min="1" max="30" placeholder="层数" value="${photo.floors || ""}" data-photo-floor="${index}">
    </div>`;
    }).join("");
  }

  function renderPhotoMarkers() {
    state.photoGroup.clearLayers();
    state.photos.forEach((photo, index) => {
      if (!photo.has_gps) return;
      const marker = L.marker([photo.lat, photo.lon], {
        icon: L.divIcon({ className: "", html: `<div style="width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#55d5e8;color:#101513;border:2px solid white;font:700 10px sans-serif;box-shadow:0 3px 10px #0008">${index + 1}</div>`, iconSize: [25, 25], iconAnchor: [12, 12] }),
      });
      marker.bindPopup(`<b>${escapeHtml(photo.filename)}</b><br>${photo.lat}, ${photo.lon}<br>层数：${photo.floors || "待核查"}`);
      marker.addTo(state.photoGroup);
    });
  }

  function applyPhotoFloors() {
    const buildingLayers = state.footprintGroup.getLayers();
    if (!buildingLayers.length) {
      toast("没有建筑轮廓", "先完成建筑识别与核查。", "error");
      return;
    }
    const assignments = new Map();
    state.photos.forEach((photo) => {
      if (!photo.has_gps || !Number(photo.floors)) return;
      const nearest = nearestBuilding(photo.lat, photo.lon);
      if (nearest && nearest.distance <= 120) {
        const values = assignments.get(nearest.id) || [];
        values.push({ floors: Number(photo.floors), filename: photo.filename });
        assignments.set(nearest.id, values);
      }
    });
    let applied = 0;
    assignments.forEach((values, id) => {
      const layer = layerById(id);
      if (!layer || layer.feature.properties.height_locked) return;
      const sorted = values.map((value) => value.floors).sort((a, b) => a - b);
      const floors = sorted[Math.floor(sorted.length / 2)];
      const floorHeight = Number(layer.feature.properties.floor_height) || Number($("#floorHeight").value || 3);
      layer.feature.properties.floors = floors;
      layer.feature.properties.height = round(floors * floorHeight, Number($("#exportPrecision").value || 1));
      layer.feature.properties.height_source = `photo-median:${values.map((value) => value.filename).join("|")}`;
      applied += 1;
    });
    renderBuildings();
    toast("层高已写回", `${applied} 栋建筑按 120 m 内照片的楼层中位数更新；锁定高度未覆盖。`);
    scheduleAutosave();
  }

  function nearestBuilding(lat, lon) {
    let result = null;
    state.footprintGroup.getLayers().forEach((layer) => {
      const center = layer.getBounds().getCenter();
      const distance = haversine(lat, lon, center.lat, center.lng);
      if (!result || distance < result.distance) result = { id: layer.feature?.properties?.id || "—", distance, layer };
    });
    return result;
  }

  function exportPhotoPoints(format) {
    renderPhotos();
    const rows = state.photos.filter((photo) => photo.has_gps).map((photo) => ({
      filename: photo.filename, longitude: photo.lon, latitude: photo.lat, captured_at: photo.captured_at || "",
      floors: photo.floors || "", building_id: photo.nearest_building || "", distance_m: photo.nearest_distance_m ?? "",
    }));
    if (!rows.length) return toast("没有 GPS 照片", "请先上传带 GPS EXIF 的现场照片。", "error");
    if (format === "csv") {
      const keys = Object.keys(rows[0]);
      const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
      const content = "\ufeff" + [keys.join(","), ...rows.map((row) => keys.map((key) => quote(row[key])).join(","))].join("\r\n");
      downloadBlob(content, "现场照片_建筑对应表.csv", "text/csv;charset=utf-8");
    } else {
      const collection = { type: "FeatureCollection", features: rows.map((row) => ({ type: "Feature", properties: row, geometry: { type: "Point", coordinates: [row.longitude, row.latitude] } })) };
      downloadBlob(JSON.stringify(collection, null, 2), "现场照片_建筑对应表.geojson", "application/geo+json");
    }
  }

  function downloadBlob(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    downloadUrl(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const radius = 6378137;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function updateModelHeights() {
    const defaultFloorHeight = Number($("#floorHeight").value) || 3;
    const precision = Number($("#exportPrecision").value || 1);
    state.footprintGroup.eachLayer((layer) => {
      const floors = Math.max(1, Number(layer.feature.properties.floors) || 2);
      const floorHeight = Number(layer.feature.properties.floor_height) || defaultFloorHeight;
      layer.feature.properties.floor_height = floorHeight;
      if (!layer.feature.properties.height_locked) layer.feature.properties.height = round(floors * floorHeight, precision);
    });
  }

  function previewModel() {
    const verified = state.footprintGroup.getLayers().filter((layer) => layer.feature?.properties?.status === "已核查");
    if (!verified.length) {
      toast("没有已核查建筑", "请在 CAD 核查步骤确认建筑后再生成白模。", "error");
      setStep(4);
      return;
    }
    updateModelHeights();
    showModel();
    drawModelCanvas();
    updateModelAudit();
  }

  function showModel() {
    $(".map-stage").classList.add("model-mode");
    $("#stageMode span").textContent = "MASSING / 3D";
    $("#stageMode small").textContent = "按建筑分块拉伸的体块白模";
  }

  function showMap() {
    $(".map-stage").classList.remove("model-mode");
    $("#stageMode span").textContent = "MAP / 2D";
    $("#stageMode small").textContent = "卫星影像与建筑轮廓同屏核查";
    window.setTimeout(() => state.map?.invalidateSize(), 50);
  }

  function drawModelCanvas() {
    const canvas = $("#modelCanvas");
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const layers = state.footprintGroup.getLayers().filter((layer) => layer.feature?.properties?.status === "已核查");
    if (!layers.length) return;
    const allLatLngs = layers.flatMap(latLngRing);
    const lon0 = Math.min(...allLatLngs.map((p) => p.lng));
    const lat0 = Math.min(...allLatLngs.map((p) => p.lat));
    const angle = Number($("#modelAngle").value) * Math.PI / 180;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const models = layers.map((layer) => {
      const local = latLngRing(layer).map((point) => lonlatLocal(point.lng, point.lat, lon0, lat0));
      const projected = local.map(([x, y]) => {
        const xr = x * cos - y * sin;
        const yr = x * sin + y * cos;
        return [xr - yr, (xr + yr) * 0.48];
      });
      return { layer, points: projected, height: Number(layer.feature.properties.height) || 6.6, depth: projected.reduce((sum, point) => sum + point[1], 0) / projected.length };
    });
    const flat = models.flatMap((model) => model.points);
    const minX = Math.min(...flat.map((p) => p[0]));
    const maxX = Math.max(...flat.map((p) => p[0]));
    const minY = Math.min(...flat.map((p) => p[1]));
    const maxY = Math.max(...flat.map((p) => p[1]));
    const padding = 70;
    const scale = Math.min((rect.width - padding * 2) / Math.max(1, maxX - minX), (rect.height - padding * 2) / Math.max(1, maxY - minY));
    const offsetX = (rect.width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (rect.height - (maxY - minY) * scale) / 2 - minY * scale + 30;
    const heightScale = Math.max(1.1, scale * 0.8);
    models.sort((a, b) => a.depth - b.depth).forEach((model, modelIndex) => {
      const base = model.points.map(([x, y]) => [offsetX + x * scale, offsetY + y * scale]);
      const top = base.map(([x, y]) => [x, y - model.height * heightScale]);
      for (let i = 0; i < base.length; i++) {
        const next = (i + 1) % base.length;
        ctx.beginPath();
        ctx.moveTo(base[i][0], base[i][1]);
        ctx.lineTo(base[next][0], base[next][1]);
        ctx.lineTo(top[next][0], top[next][1]);
        ctx.lineTo(top[i][0], top[i][1]);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? "#aeb6ae" : "#c8cec7";
        ctx.fill();
        ctx.strokeStyle = "rgba(18,24,21,.72)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      top.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = modelIndex % 4 === 0 ? "#eff4dc" : "#e7ebe4";
      ctx.fill();
      ctx.strokeStyle = "#202823";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(217,243,74,.82)";
    ctx.font = "600 12px 'Barlow Condensed', sans-serif";
    ctx.fillText(`VERIFIED BUILDINGS ${layers.length} · LOCAL METERS · 0.1 m`, 22, rect.height - 22);
  }

  function updateModelAudit() {
    const layers = state.footprintGroup.getLayers().filter((layer) => layer.feature?.properties?.status === "已核查");
    const area = layers.reduce((sum, layer) => sum + polygonArea(layer), 0);
    const heights = layers.map((layer) => Number(layer.feature.properties.height) || 0).filter(Boolean);
    $("#modelClosed").textContent = layers.length;
    $("#modelArea").textContent = `${formatCount(round(area))} m²`;
    $("#modelHeightRange").textContent = heights.length ? `${Math.min(...heights).toFixed(1)}–${Math.max(...heights).toFixed(1)} m` : "—";
  }

  async function exportData(format) {
    updateModelHeights();
    const geojson = serializeFootprints(true);
    if (!geojson.features.length) {
      toast("没有已核查建筑", "正式导出只包含“已核查”的闭合轮廓。", "error");
      setStep(4);
      return;
    }
    const audit = await auditGeometry(false);
    if (!audit.ok) {
      toast("导出已阻止", "存在未闭合、自交、短边或无效高度；请根据几何审计结果修正。", "error", 8500);
      setStep(4);
      return;
    }
    const longTask = format === "skp" || format === "fbx";
    setBusy(true, `正在生成 ${format.toUpperCase()}`, longTask ? "SketchUp 将在本机创建独立建筑组，可能需要约一分钟" : "单位：米；坐标精度：0.1 m");
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geojson, precision: Number($("#exportPrecision").value || 1), plot_scale: Number($("#plotScale").value || 100), model_units: "meter", geometry_scale: 1 }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || contentType.includes("application/json")) {
        const error = await response.json();
        if (error.fallback) downloadUrl(error.fallback, `buildings_fallback.dxf`);
        throw new Error(error.detail || error.error || "导出失败");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = match ? decodeURIComponent(match[1]) : `tizzyq_export.${format}`;
      const url = URL.createObjectURL(blob);
      downloadUrl(url, filename);
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast(`${format.toUpperCase()} 已生成`, `${geojson.features.length} 栋；几何 1:1 米制；CAD 出图比例 1:${$("#plotScale").value}。`);
    } catch (error) {
      toast(`${format.toUpperCase()} 导出失败`, error.message, "error", 9000);
    } finally {
      setBusy(false);
    }
  }

  function downloadUrl(url, filename) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function updateSummary() {
    const layers = state.footprintGroup?.getLayers?.() || [];
    const verified = layers.filter((layer) => layer.feature?.properties?.status === "已核查").length;
    $("#summaryBuildings").textContent = `${layers.length} 栋`;
    $("#summaryVerified").textContent = `${verified} 已核查`;
    $("#summaryPhotos").textContent = `${state.photos.length} 张`;
    $("#summaryGps").textContent = `${state.photos.filter((photo) => photo.has_gps).length} 含 GPS`;
  }

  function buildProjectPayload() {
    const name = $("#projectName").value.trim() || "未命名项目";
    return {
      name,
      version: "0.3.0",
      provider: state.provider,
      bounds: boundsArray(),
      village_boundary: villageBoundaryGeometry(),
      zoom: Number($("#mosaicZoom").value),
      mosaic: state.mosaic,
      geojson: serializeFootprints(false),
      photos: state.photos,
      floor_height: Number($("#floorHeight").value),
      export_precision: Number($("#exportPrecision").value),
      plot_scale: Number($("#plotScale").value),
      theme: readTheme(),
    };
  }

  async function saveProject() {
    const payload = buildProjectPayload();
    localStorage.setItem("tizzyq.microclimate.project", JSON.stringify(payload));
    try {
      const response = await fetch("/api/project/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败");
      toast("工程已保存", `${result.name}.json 已写入本地 data/projects。`);
      await loadProjectList(result.name);
    } catch (error) {
      toast("已保存到浏览器", `本地后端保存失败：${error.message}`, "error");
    }
  }

  function scheduleAutosave(delay = 900) {
    clearTimeout(state.autosaveTimer);
    const status = $("#autosaveStatus");
    status.className = "autosave-status saving";
    status.innerHTML = "<i></i>正在自动保存";
    state.autosaveTimer = window.setTimeout(performAutosave, delay);
  }

  async function performAutosave() {
    if (state.autosaveInFlight) return scheduleAutosave(1000);
    state.autosaveInFlight = true;
    const payload = buildProjectPayload();
    localStorage.setItem("tizzyq.microclimate.project", JSON.stringify(payload));
    const status = $("#autosaveStatus");
    try {
      const response = await fetch("/api/project/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, autosave: true }) });
      if (!response.ok) throw new Error("自动保存失败");
      status.className = "autosave-status";
      status.innerHTML = `<i></i>${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 已保存`;
    } catch (_error) {
      status.className = "autosave-status error";
      status.innerHTML = "<i></i>浏览器草稿已保存";
    } finally {
      state.autosaveInFlight = false;
    }
  }

  function applyProjectPayload(payload, notice = true) {
    state.boundaryGroup.clearLayers();
    state.villageBoundaryGroup.clearLayers();
    state.footprintGroup.clearLayers();
    state.photoGroup.clearLayers();
    if (state.imageOverlay) { state.map.removeLayer(state.imageOverlay); state.imageOverlay = null; }
    state.bounds = null;
    state.villageBoundaryLayer = null;
    state.selectedBuildingId = null;
    $("#projectName").value = payload.name || "未命名项目";
    if (payload.provider && PROVIDERS[payload.provider]) {
      $("#providerSelect").value = payload.provider;
      changeProvider(payload.provider);
    }
    if (payload.zoom) $("#mosaicZoom").value = payload.zoom;
    if (payload.bounds?.length === 4) {
      const [west, south, east, north] = payload.bounds;
      state.bounds = L.latLngBounds([south, west], [north, east]);
      state.boundaryLayer = L.rectangle(state.bounds, { color: getComputedStyle(document.documentElement).getPropertyValue("--acid").trim() || "#d9f34a", weight: 3, fill: false, fillOpacity: 0, className: "research-boundary" }).addTo(state.boundaryGroup);
      state.map.fitBounds(state.bounds);
      updateBoundsUI();
    }
    if (payload.village_boundary?.coordinates?.[0]?.length >= 3) {
      const latlngs = payload.village_boundary.coordinates[0].map(([lon, lat]) => L.latLng(lat, lon));
      state.villageBoundaryLayer = L.polygon(latlngs, { color: "#55d5e8", weight: 3, fillColor: "#55d5e8", fillOpacity: 0.05, className: "village-boundary" }).addTo(state.villageBoundaryGroup);
      $("#villageBoundaryStatus").textContent = `${latlngs.length - 1} 个边界点 · 建筑识别已限制在异形范围内`;
    } else {
      $("#villageBoundaryStatus").textContent = "尚未设置，默认识别整个矩形";
    }
    if (payload.geojson?.features?.length) addGeoJsonFootprints(payload.geojson, true);
    state.photos = payload.photos || [];
    state.mosaic = payload.mosaic || null;
    if (state.mosaic?.raw_url && state.bounds) {
      state.imageOverlay = L.imageOverlay(state.mosaic.raw_url, state.bounds, { opacity: 1, interactive: false }).addTo(state.map);
      state.imageOverlay.bringToBack();
    }
    if (payload.floor_height) $("#floorHeight").value = payload.floor_height;
    if (payload.export_precision !== undefined) $("#exportPrecision").value = payload.export_precision;
    if (payload.plot_scale) $("#plotScale").value = payload.plot_scale;
    if (payload.theme) applyTheme(payload.theme);
    renderPhotos();
    renderPhotoMarkers();
    updateMosaicEstimate();
    updateSummary();
    syncLiveMapLayers();
    if (notice) toast("工程已打开", payload.name || "未命名项目");
  }

  async function loadProjectList(selected = "") {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      const select = $("#projectSelect");
      select.innerHTML = '<option value="">新建 / 最近工程</option>' + (result.projects || []).map((project) => `<option value="${escapeHtml(project.name)}">${escapeHtml(project.name)} · ${project.buildings} 栋</option>`).join("");
      if (selected) select.value = selected;
    } catch (_error) { /* localStorage remains available */ }
  }

  async function openProject(name) {
    if (!name) return;
    const response = await fetch(`/api/project?name=${encodeURIComponent(name)}`);
    const payload = await response.json();
    if (!response.ok) return toast("打开工程失败", payload.error || "工程不存在", "error");
    applyProjectPayload(payload);
    localStorage.setItem("tizzyq.microclimate.project", JSON.stringify(payload));
  }

  function newProject() {
    stopActiveDrawing(true);
    applyProjectPayload({ name: `新建微气候工程_${new Date().toISOString().slice(0, 10)}`, provider: "google_sat", zoom: 20, photos: [], geojson: { type: "FeatureCollection", features: [] } }, false);
    $("#projectSelect").value = "";
    toast("新工程已建立", "请定位并框选研究区域。所有旧工程仍保存在本地。", "ok");
    setStep(1);
    scheduleAutosave();
  }

  async function deleteCurrentProject() {
    const name = $("#projectName").value.trim();
    if (!name) return;
    if (!window.confirm(`确定删除网页工程“${name}”吗？\n另存到文件夹的工程文件不会被删除。`)) return;
    const response = await fetch("/api/project/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const result = await response.json();
    if (!response.ok) return toast("删除失败", result.error || "项目不存在", "error");
    localStorage.removeItem("tizzyq.microclimate.project");
    await loadProjectList();
    newProject();
    toast("工程已删除", `${result.name} 已从网页项目列表和本地 data/projects 移除。`);
  }

  function projectFilename(name = $("#projectName").value) {
    const safe = String(name || "未命名项目").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80);
    return `${safe}.tqproject.json`;
  }

  async function saveProjectToFolder() {
    const payload = buildProjectPayload();
    const content = JSON.stringify(payload, null, 2);
    try {
      if (window.showDirectoryPicker) {
        const directory = await window.showDirectoryPicker({ mode: "readwrite" });
        const handle = await directory.getFileHandle(projectFilename(payload.name), { create: true });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        toast("工程文件已保存", `${projectFilename(payload.name)} 已写入所选文件夹。`);
      } else {
        downloadBlob(content, projectFilename(payload.name), "application/json;charset=utf-8");
        toast("工程文件已下载", "当前浏览器不支持直接写入文件夹，已改为下载。", "ok");
      }
      await performAutosave();
    } catch (error) {
      if (error.name !== "AbortError") toast("保存工程文件失败", error.message, "error");
    }
  }

  async function openProjectFolder() {
    try {
      if (!window.showDirectoryPicker) return $("#projectFolderInput").click();
      const directory = await window.showDirectoryPicker({ mode: "read" });
      const files = [];
      for await (const entry of directory.values()) {
        if (entry.kind === "file" && /(?:\.tqproject)?\.json$/i.test(entry.name)) files.push(await entry.getFile());
      }
      await importProjectFiles(files);
    } catch (error) {
      if (error.name !== "AbortError") toast("读取工程文件夹失败", error.message, "error");
    }
  }

  async function importProjectFiles(files) {
    const candidates = [...files].filter((file) => /(?:\.tqproject)?\.json$/i.test(file.name)).sort((a, b) => b.lastModified - a.lastModified);
    if (!candidates.length) return toast("文件夹中没有工程文件", "请选择包含 .tqproject.json 或 .json 的文件夹。", "error");
    try {
      const payload = JSON.parse(await candidates[0].text());
      if (!payload || typeof payload !== "object" || !payload.name) throw new Error("工程文件缺少项目名称或格式无效");
      applyProjectPayload(payload);
      await performAutosave();
      await loadProjectList(payload.name);
      toast("工程文件已提取", `已打开 ${candidates[0].name}${candidates.length > 1 ? `；该文件夹另有 ${candidates.length - 1} 个工程文件` : ""}。`);
    } catch (error) {
      toast("工程文件无法读取", error.message, "error", 7000);
    }
  }

  function restoreProject() {
    const raw = localStorage.getItem("tizzyq.microclimate.project");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      applyProjectPayload(payload, false);
      toast("已恢复上次工程", payload.name || "未命名项目");
    } catch (error) {
      console.warn("Project restore failed", error);
    }
  }

  function readTheme() {
    return { accent: $("#accentColor").value, signal: $("#signalColor").value, density: $("#densitySelect").value };
  }

  function applyTheme(theme) {
    if (!theme) return;
    const accent = theme.accent || "#d9f34a";
    const signal = theme.signal || "#ff5a4f";
    document.documentElement.style.setProperty("--acid", accent);
    document.documentElement.style.setProperty("--signal", signal);
    $("#accentColor").value = accent;
    $("#signalColor").value = signal;
    $("#densitySelect").value = theme.density || "compact";
    document.body.classList.toggle("density-comfortable", theme.density === "comfortable");
    if (state.boundaryLayer) state.boundaryLayer.setStyle({ color: accent, fill: false, fillOpacity: 0 });
    state.footprintGroup?.eachLayer(styleFootprintLayer);
    localStorage.setItem("tizzyq.microclimate.theme", JSON.stringify(readTheme()));
  }

  function restoreTheme() {
    try { applyTheme(JSON.parse(localStorage.getItem("tizzyq.microclimate.theme") || "null")); } catch (_error) { /* defaults */ }
  }

  function applyCustomTile(save = false) {
    const url = $("#customTileUrl").value.trim();
    if (!url.startsWith("https://") || !["{z}", "{x}", "{y}"].every((token) => url.includes(token))) {
      return toast("XYZ 地址无效", "必须为 HTTPS，并包含 {z}、{x}、{y}。", "error");
    }
    PROVIDERS.custom_xyz = { name: "自定义 XYZ", category: "自定义", url, attribution: "Custom XYZ", maxZoom: 22, crs: "WGS84", exportable: true, custom: true };
    populateProviders();
    $("#providerSelect").value = "custom_xyz";
    changeProvider("custom_xyz");
    if (save) localStorage.setItem("tizzyq.microclimate.customTile", url);
    toast(save ? "自定义底图已保存" : "正在预览自定义底图", "如坐标基准不是 Web Mercator/WGS84，请勿用于正式 CAD 对齐。", "ok");
  }

  function restoreCustomTile() {
    const url = localStorage.getItem("tizzyq.microclimate.customTile");
    if (!url) return;
    $("#customTileUrl").value = url;
    PROVIDERS.custom_xyz = { name: "自定义 XYZ", category: "自定义", url, attribution: "Custom XYZ", maxZoom: 22, crs: "WGS84", exportable: true, custom: true };
    populateProviders();
  }

  async function checkHealth() {
    try {
      const response = await fetch("/api/health");
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("服务未就绪");
      state.health = result;
      $("#serverDot").classList.add("online");
      $("#serverStatus").textContent = "本地引擎在线";
      const capabilities = [result.autocad_core ? "DWG" : "DXF", result.sketchup ? "SKP" : "OBJ", "FBX"].join(" · ");
      $("#systemDetail").textContent = `${result.version} · ${capabilities}`;
      $("#skpCapability").textContent = result.sketchup ? "本机转换" : "未检测到 SketchUp";
    } catch (error) {
      $("#serverDot").classList.add("error");
      $("#serverStatus").textContent = "本地引擎离线";
      $("#systemDetail").textContent = "请运行 start.bat";
      $("#skpCapability").textContent = "引擎离线";
    }
  }

  function bindEvents() {
    $("#workflowNav").addEventListener("click", (event) => {
      const button = event.target.closest("[data-step]");
      if (button) setStep(button.dataset.step);
    });
    $$(".next-step").forEach((button) => button.addEventListener("click", () => setStep(button.dataset.next)));
    $("#providerSelect").addEventListener("change", (event) => { changeProvider(event.target.value); scheduleAutosave(); });
    $("#highDetailBtn").addEventListener("click", enterHighDetailMode);
    $("#locateBtn").addEventListener("click", locateFromInput);
    $("#locationSearch").addEventListener("keydown", (event) => { if (event.key === "Enter") locateFromInput(); });
    $("#startRectangleBtn").addEventListener("click", beginRectangle);
    $("#drawVillageBoundaryBtn").addEventListener("click", beginVillageBoundary);
    $("#clearVillageBoundaryBtn").addEventListener("click", clearVillageBoundary);
    $("#mosaicZoom").addEventListener("input", updateMosaicEstimate);
    $("#createMosaicBtn").addEventListener("click", createMosaic);
    $("#osmTraceBtn").addEventListener("click", () => runTrace("osm"));
    $("#rasterTraceBtn").addEventListener("click", () => runTrace("raster"));
    $("#sensitivity").addEventListener("input", (event) => $("#sensitivityLabel").textContent = `${event.target.value}%`);
    $("#filterFootprintsBtn").addEventListener("click", filterFootprints);
    $("#enableEditBtn").addEventListener("click", enableEdit);
    $("#drawBuildingBtn").addEventListener("click", () => beginBuildingDraw());
    $("#startFineDrawBtn").addEventListener("click", startFineDraw);
    $("#stopDrawBtn").addEventListener("click", () => stopActiveDrawing(true));
    $("#buildingDrawMode").addEventListener("change", (event) => {
      const help = {
        orthogonal: "第一条边定义任意旋转的局部施工平面，后续边自动投影为平行或垂直，不锁地图 X/Y 轴。",
        rectangle: "拖拽两个对角点生成正交矩形；矩形方向跟随地图显示方向。需要旋转建筑请用局部平面正交。",
        free: "逐点沿屋顶边界自由绘制，点击起点闭合，适合真实异形建筑。",
      };
      $("#drawModeHelp").textContent = help[event.target.value];
    });
    $("#deleteSelectedBtn").addEventListener("click", deleteSelected);
    $("#clearAiBtn").addEventListener("click", () => removeBuildings((layer) => /ai|raster/i.test(String(layer.feature?.properties?.source || "")), "AI 候选已清除"));
    $("#keepManualBtn").addEventListener("click", () => removeBuildings((layer) => layer.feature?.properties?.source !== "manual", "已仅保留人工轮廓"));
    $("#verifyAllBtn").addEventListener("click", verifyAll);
    $("#auditGeometryBtn").addEventListener("click", () => auditGeometry(true));
    $("#buildingList").addEventListener("click", (event) => {
      const verifyButton = event.target.closest("[data-verify-building]");
      if (verifyButton) toggleVerify(verifyButton.dataset.verifyBuilding);
      const row = event.target.closest(".building-row");
      if (row && !event.target.matches("input,button")) {
        const layer = layerById(row.dataset.buildingId);
        selectBuilding(row.dataset.buildingId, false);
        if (layer) state.map.fitBounds(layer.getBounds(), { maxZoom: Math.min(21, PROVIDERS[state.provider].maxZoom), padding: [80, 80] });
      }
    });
    $("#buildingList").addEventListener("change", (event) => {
      const id = event.target.dataset.buildingFloors || event.target.dataset.buildingFloorHeight || event.target.dataset.buildingHeight || event.target.dataset.buildingWidth || event.target.dataset.buildingDepth || event.target.dataset.buildingZone || event.target.dataset.buildingLock;
      if (!id) return;
      const layer = layerById(id);
      if (!layer) return;
      const props = layer.feature.properties;
      if (event.target.matches("[data-building-floors]")) props.floors = Math.max(1, Number(event.target.value) || 1);
      if (event.target.matches("[data-building-floor-height]")) props.floor_height = Math.max(0.1, Number(event.target.value) || 3);
      if (event.target.matches("[data-building-height]")) { props.height = round(Math.max(0.1, Number(event.target.value) || 0.1), Number($("#exportPrecision").value || 1)); props.height_locked = true; }
      if (event.target.matches("[data-building-lock]")) props.height_locked = event.target.checked;
      if (event.target.matches("[data-building-zone]")) props.zone = event.target.value.trim() || "主区";
      if (event.target.matches("[data-building-width]")) { const dims = buildingDimensions(layer); resizeFootprint(layer, Math.max(0.2, Number(event.target.value) || dims.width), dims.depth); }
      if (event.target.matches("[data-building-depth]")) { const dims = buildingDimensions(layer); resizeFootprint(layer, dims.width, Math.max(0.2, Number(event.target.value) || dims.depth)); }
      if (!props.height_locked && (event.target.matches("[data-building-floors]") || event.target.matches("[data-building-floor-height]"))) props.height = round((Number(props.floors) || 1) * (Number(props.floor_height) || 3), Number($("#exportPrecision").value || 1));
      styleFootprintLayer(layer);
      updateModelAudit();
      renderBuildings();
      selectBuilding(id, false);
      scheduleAutosave();
    });
    $("#photoInput").addEventListener("change", (event) => handlePhotos(event.target.files));
    $("#photoList").addEventListener("change", (event) => {
      if (!event.target.matches("[data-photo-floor]")) return;
      state.photos[Number(event.target.dataset.photoFloor)].floors = Math.max(1, Number(event.target.value) || 0) || null;
      renderPhotoMarkers();
      scheduleAutosave();
    });
    $("#applyFloorsBtn").addEventListener("click", applyPhotoFloors);
    $("#exportPhotoCsvBtn").addEventListener("click", () => exportPhotoPoints("csv"));
    $("#exportPhotoGeoJsonBtn").addEventListener("click", () => exportPhotoPoints("geojson"));
    $("#previewModelBtn").addEventListener("click", previewModel);
    $("#modelAngle").addEventListener("input", () => { if ($(".map-stage").classList.contains("model-mode")) drawModelCanvas(); });
    $("#floorHeight").addEventListener("change", () => { updateModelHeights(); updateModelAudit(); if ($(".map-stage").classList.contains("model-mode")) drawModelCanvas(); scheduleAutosave(); });
    $("#mapSwitchBtn").addEventListener("click", showMap);
    $("#backToMapBtn").addEventListener("click", showMap);
    $("#saveProjectBtn").addEventListener("click", saveProject);
    $("#newProjectBtn").addEventListener("click", newProject);
    $("#projectSelect").addEventListener("change", (event) => openProject(event.target.value));
    $("#projectName").addEventListener("input", () => scheduleAutosave(1400));
    $("#projectToolsBtn").addEventListener("click", () => { $("#projectDrawer").hidden = false; $("#themeDrawer").hidden = true; });
    $("#closeProjectDrawerBtn").addEventListener("click", () => { $("#projectDrawer").hidden = true; });
    $("#saveProjectFolderBtn").addEventListener("click", saveProjectToFolder);
    $("#openProjectFolderBtn").addEventListener("click", openProjectFolder);
    $("#importProjectFileBtn").addEventListener("click", () => $("#projectFileInput").click());
    $("#projectFolderInput").addEventListener("change", (event) => importProjectFiles(event.target.files));
    $("#projectFileInput").addEventListener("change", (event) => importProjectFiles(event.target.files));
    $("#deleteProjectBtn").addEventListener("click", deleteCurrentProject);
    $("#applyCustomTileBtn").addEventListener("click", () => applyCustomTile(false));
    $("#saveCustomTileBtn").addEventListener("click", () => applyCustomTile(true));
    $("#exportPrecision").addEventListener("change", (event) => { $("#precisionBadge").textContent = `${10 ** -Number(event.target.value)} m`; renderBuildings(); });
    $("#themeBtn").addEventListener("click", () => { $("#themeDrawer").hidden = false; $("#projectDrawer").hidden = true; });
    $("#closeThemeBtn").addEventListener("click", () => { $("#themeDrawer").hidden = true; });
    [$("#accentColor"), $("#signalColor"), $("#densitySelect")].forEach((control) => control.addEventListener("input", () => applyTheme(readTheme())));
    $$("[data-theme-preset]").forEach((button) => button.addEventListener("click", () => {
      const themes = { field: { accent: "#d9f34a", signal: "#ff5a4f", density: "compact" }, cyan: { accent: "#55d5e8", signal: "#ff6b5f", density: "compact" }, amber: { accent: "#ffbd3d", signal: "#e94d5f", density: "comfortable" } };
      applyTheme(themes[button.dataset.themePreset]);
    }));
    $$('[data-export]').forEach((button) => button.addEventListener("click", () => exportData(button.dataset.export)));
    window.addEventListener("resize", () => { state.map?.invalidateSize(); if ($(".map-stage").classList.contains("model-mode")) drawModelCanvas(); });
    window.addEventListener("beforeunload", () => localStorage.setItem("tizzyq.microclimate.project", JSON.stringify(buildProjectPayload())));
    window.setInterval(() => scheduleAutosave(0), 15000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    restoreTheme();
    restoreCustomTile();
    initializeMap();
    bindEvents();
    restoreProject();
    loadProjectList($("#projectName").value);
    checkHealth();
    setStep(1);
    updateMosaicEstimate();
    updateSummary();
  });
})();

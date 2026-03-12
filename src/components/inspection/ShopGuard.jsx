import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const VEHICLE_TYPES = [
  { id: "sedan", label: "4-Door Sedan", available: true },
  { id: "coupe", label: "2-Door Coupe", available: false },
  { id: "pickup", label: "Pickup Truck", available: false },
  { id: "suv", label: "SUV / Crossover", available: false },
  { id: "van", label: "Van / Minivan", available: false },
  { id: "convertible", label: "Convertible", available: false },
];

const SECTIONS = [
  { id: "front", label: "Front", icon: "▲", x: 52, y: 14, w: 156, h: 160, rx: 12 },
  { id: "right", label: "Right Side", icon: "▶", x: 208, y: 62, w: 48, h: 386, rx: 6 },
  { id: "rear", label: "Rear", icon: "▼", x: 52, y: 348, w: 156, h: 140, rx: 12 },
  { id: "top", label: "Top", icon: "◉", x: 52, y: 174, w: 156, h: 174, rx: 4 },
  { id: "left", label: "Left Side", icon: "◀", x: 4, y: 62, w: 48, h: 386, rx: 6 },
];

const SUB_ZONES = [
  // ── Front ──
  { id: "front_bumper", label: "Front Bumper", section: "front", group: "body" },
  { id: "hood", label: "Hood", section: "front", group: "body" },
  { id: "windshield_f", label: "Front Windshield", section: "front", group: "glass" },
  { id: "headlight_l", label: "Left Headlight", section: "front", group: "lights" },
  { id: "headlight_r", label: "Right Headlight", section: "front", group: "lights" },
  { id: "turn_fl", label: "Front Left Turn Signal", section: "front", group: "lights" },
  { id: "turn_fr", label: "Front Right Turn Signal", section: "front", group: "lights" },
  { id: "fog_fl", label: "Front Left Fog Light", section: "front", group: "lights", optional: true },
  { id: "fog_fr", label: "Front Right Fog Light", section: "front", group: "lights", optional: true },
  // ── Left Side ──
  { id: "fl_fender", label: "Front Left Fender", section: "left", group: "body" },
  { id: "fl_door", label: "Front Left Door", section: "left", group: "body" },
  { id: "fl_door_glass", label: "Front Left Door Glass", section: "left", group: "glass" },
  { id: "rl_door", label: "Rear Left Door", section: "left", group: "body" },
  { id: "rl_door_glass", label: "Rear Left Door Glass", section: "left", group: "glass" },
  { id: "rl_quarter", label: "Rear Left Quarter Panel", section: "left", group: "body" },
  { id: "rl_port_window", label: "Rear Left Port Window", section: "left", group: "glass", optional: true },
  { id: "l_mirror", label: "Left Side Mirror", section: "left", group: "body" },
  { id: "fl_wheel", label: "Front Left Wheel", section: "left", group: "wheels" },
  { id: "rl_wheel", label: "Rear Left Wheel", section: "left", group: "wheels" },
  // ── Right Side ──
  { id: "fr_fender", label: "Front Right Fender", section: "right", group: "body" },
  { id: "fr_door", label: "Front Right Door", section: "right", group: "body" },
  { id: "fr_door_glass", label: "Front Right Door Glass", section: "right", group: "glass" },
  { id: "rr_door", label: "Rear Right Door", section: "right", group: "body" },
  { id: "rr_door_glass", label: "Rear Right Door Glass", section: "right", group: "glass" },
  { id: "rr_quarter", label: "Rear Right Quarter Panel", section: "right", group: "body" },
  { id: "rr_port_window", label: "Rear Right Port Window", section: "right", group: "glass", optional: true },
  { id: "r_mirror", label: "Right Side Mirror", section: "right", group: "body" },
  { id: "fr_wheel", label: "Front Right Wheel", section: "right", group: "wheels" },
  { id: "rr_wheel", label: "Rear Right Wheel", section: "right", group: "wheels" },
  // ── Rear ──
  { id: "rear_bumper", label: "Rear Bumper", section: "rear", group: "body" },
  { id: "trunk", label: "Trunk / Deck Lid", section: "rear", group: "body" },
  { id: "windshield_r", label: "Rear Windshield", section: "rear", group: "glass" },
  { id: "taillight_l", label: "Left Taillight", section: "rear", group: "lights" },
  { id: "taillight_r", label: "Right Taillight", section: "rear", group: "lights" },
  { id: "turn_rl", label: "Rear Left Turn Signal", section: "rear", group: "lights" },
  { id: "turn_rr", label: "Rear Right Turn Signal", section: "rear", group: "lights" },
  { id: "fog_rl", label: "Rear Left Fog Light", section: "rear", group: "lights", optional: true },
  { id: "fog_rr", label: "Rear Right Fog Light", section: "rear", group: "lights", optional: true },
  // ── Top ──
  { id: "roof", label: "Roof", section: "top", group: "body" },
  { id: "sunroof", label: "Sunroof", section: "top", group: "glass", optional: true },
];

const CONDITIONS = [
  { id: "clean", label: "Clean", color: "#22c55e" },
  { id: "damaged", label: "Damaged", color: "#ef4444" },
  { id: "noted", label: "Noted", color: "#f97316" },
];

const DEFAULT_JOB_INFO = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleColor: "",
  vehicleVin: "",
  vehicleMileage: "",
  vehiclePlate: "",
  techName: "",
  roNumber: "",
  inspectionDate: (() => { const d = new Date(); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}/${d.getFullYear()}`; })(),
};

const REQUIRED_JOB_FIELDS = ["customerName", "vehicleYear", "vehicleMake", "vehicleModel", "vehicleVin", "techName"];

function isJobInfoComplete(jobInfo) {
  return REQUIRED_JOB_FIELDS.every((f) => jobInfo[f]?.trim());
}

function getMissingJobFields(jobInfo) {
  const labels = {
    customerName: "Customer Name",
    vehicleYear: "Year",
    vehicleMake: "Make",
    vehicleModel: "Model",
    vehicleVin: "VIN",
    techName: "Tech Name",
  };
  return REQUIRED_JOB_FIELDS.filter((f) => !jobInfo[f]?.trim()).map((f) => labels[f] || f);
}

const GROUP_LABELS = { body: "Body Panels", glass: "Glass", lights: "Lights", wheels: "Wheels" };

const LEGEND = [
  { bg: "var(--zone-default)", bd: "var(--zone-stroke)", label: "Not Inspected" },
  { bg: "#f97316", bd: "#f97316", label: "Selected" },
  { bg: "#166534", bd: "#22c55e", label: "All Clean" },
  { bg: "#7c2d12", bd: "#f97316", label: "Has Notes" },
  { bg: "#7f1d1d", bd: "#ef4444", label: "Damaged" },
  { bg: "#1e3a5c", bd: "#3b82f6", label: "Partially Done" },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function isFlagged(data) {
  return data && !data.notPresent && (data.notes?.trim() || data.photos?.length);
}

function hasStatus(data, id) {
  const s = data?.status;
  if (!s) return false;
  if (Array.isArray(s)) return s.includes(id);
  return s === id;
}

function getStatuses(data) {
  const s = data?.status;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return [s];
}

function primaryStatus(data) {
  if (hasStatus(data, "damaged")) return "damaged";
  if (hasStatus(data, "noted")) return "noted";
  if (hasStatus(data, "clean")) return "clean";
  return null;
}

function statusColor(status) {
  if (status === "damaged") return "#ef4444";
  if (status === "clean") return "#22c55e";
  if (status === "noted") return "#f97316";
  return null;
}

function getSectionZones(sectionId) {
  return SUB_ZONES.filter((z) => z.section === sectionId);
}

function getSectionAgg(sectionId, inspections) {
  const zones = getSectionZones(sectionId);
  const active = zones.filter((z) => !inspections[z.id]?.notPresent);
  const inspected = active.filter((z) => getStatuses(inspections[z.id]).length > 0);
  const hasDamaged = active.some((z) => hasStatus(inspections[z.id], "damaged"));
  const hasNoted = active.some((z) => hasStatus(inspections[z.id], "noted") || isFlagged(inspections[z.id]));
  const allClean = active.length > 0 && inspected.length === active.length && active.every((z) => hasStatus(inspections[z.id], "clean"));
  const npCount = zones.length - active.length;
  return {
    total: zones.length,
    active: active.length,
    inspected: inspected.length,
    npCount,
    status: hasDamaged ? "damaged" : hasNoted ? "noted" : allClean ? "clean" : inspected.length > 0 ? "partial" : null,
  };
}

function isZoneDone(zoneId, inspections) {
  const d = inspections[zoneId];
  if (d?.notPresent) return true;
  const sts = getStatuses(d);
  if (sts.length === 0) return false;
  // If damaged, must have notes or at least one photo
  if (sts.includes("damaged") && !d?.notes?.trim() && !d?.photos?.length) return false;
  return true;
}

function zoneMissingReason(zoneId, inspections) {
  const d = inspections[zoneId];
  if (d?.notPresent) return null;
  const sts = getStatuses(d);
  if (sts.length === 0) return "Select a condition or mark Not Present to continue";
  if (sts.includes("damaged") && !d?.notes?.trim() && !d?.photos?.length) return "Damaged zones require a description or photo before continuing";
  return null;
}

function getNextNav(currentZoneId, currentSectionId, inspections) {
  const secZones = getSectionZones(currentSectionId);
  const currentIdx = secZones.findIndex((z) => z.id === currentZoneId);
  // Try next zone in same section
  if (currentIdx < secZones.length - 1) {
    return { type: "zone", zoneId: secZones[currentIdx + 1].id, sectionId: currentSectionId };
  }
  // Try first zone of next section
  const secIdx = SECTIONS.findIndex((s) => s.id === currentSectionId);
  if (secIdx < SECTIONS.length - 1) {
    const nextSec = SECTIONS[secIdx + 1];
    const nextZones = getSectionZones(nextSec.id);
    if (nextZones.length > 0) {
      return { type: "section", zoneId: nextZones[0].id, sectionId: nextSec.id, sectionLabel: nextSec.label };
    }
  }
  return { type: "complete" };
}

function isLastZoneInSection(zoneId, sectionId) {
  const secZones = getSectionZones(sectionId);
  return secZones[secZones.length - 1]?.id === zoneId;
}

function sectionFill(section, inspections, selectedId, dark) {
  if (section.id === selectedId) return "#f97316";
  const agg = getSectionAgg(section.id, inspections);
  if (agg.status === "damaged") return "#7f1d1d";
  if (agg.status === "noted") return "#7c2d12";
  if (agg.status === "clean") return "#166534";
  if (agg.status === "partial") return dark ? "#1e3a5c" : "#93bbdf";
  return dark ? "#1a1a28" : "#cccce0";
}

function sectionStroke(section, inspections, selectedId, dark) {
  if (section.id === selectedId) return "#f97316";
  const agg = getSectionAgg(section.id, inspections);
  if (agg.status === "damaged") return "#ef4444";
  if (agg.status === "noted") return "#f97316";
  if (agg.status === "clean") return "#22c55e";
  if (agg.status === "partial") return "#3b82f6";
  return dark ? "#2e2e45" : "#a8a8c0";
}

/* ═══════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════ */

function MonoLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)", letterSpacing: 2, textTransform: "uppercase", ...style }}>
      {children}
    </div>
  );
}

function ToolbarStat({ value, label, color, showDivider }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: showDivider ? 18 : 0 }}>
      {showDivider && <div style={{ width: 1, height: 28, background: "var(--bd)", marginRight: -14 }} />}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <MonoLabel style={{ fontSize: 9, letterSpacing: 1 }}>{label}</MonoLabel>
      </div>
    </div>
  );
}

function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={{ color: "var(--bd)", fontSize: 11 }}>›</span>}
          <button
            onClick={() => onNavigate(item.level)}
            className="breadcrumb-btn"
            style={{ color: i === items.length - 1 ? "var(--tx)" : "var(--mu)", fontWeight: i === items.length - 1 ? 700 : 500 }}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

function PhotoThumbnail({ url, onRemove }) {
  return (
    <div className="photo-thumb">
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button onClick={onRemove} className="photo-remove">&times;</button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION DIAGRAM
   ═══════════════════════════════════════════ */

function SectionDiagram({ sections, inspections, selectedSection, onSectionClick, dark }) {
  const [hovered, setHovered] = useState(null);

  return (
    <svg viewBox="0 0 260 510" style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}>
      {/* Car silhouette */}
      <rect x="52" y="14" width="156" height="474" rx="16" fill={dark ? "#0a0a12" : "#dcdcec"} opacity="0.4" />
      <rect x="4" y="62" width="48" height="386" rx="6" fill={dark ? "#0a0a12" : "#dcdcec"} opacity="0.25" />
      <rect x="208" y="62" width="48" height="386" rx="6" fill={dark ? "#0a0a12" : "#dcdcec"} opacity="0.25" />

      {/* Sections */}
      {sections.map((s) => {
        const agg = getSectionAgg(s.id, inspections);
        const isSelected = s.id === selectedSection;
        const isHovered = hovered === s.id;
        return (
          <g key={s.id}>
            <rect
              x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx}
              fill={sectionFill(s, inspections, selectedSection, dark)}
              stroke={sectionStroke(s, inspections, selectedSection, dark)}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={isHovered && !isSelected ? 0.8 : 1}
              className="zone-rect"
              onClick={() => onSectionClick(s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Section label */}
            <text
              x={s.x + s.w / 2}
              y={s.id === "left" || s.id === "right" ? s.y + s.h / 2 : s.y + s.h / 2 - 6}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isSelected ? "#fff" : dark ? "#888" : "#666"}
              fontSize={s.id === "left" || s.id === "right" ? 10 : 12}
              fontFamily="'Rajdhani', sans-serif"
              fontWeight="700"
              letterSpacing="1.5"
              style={{ pointerEvents: "none", textTransform: "uppercase" }}
              transform={s.id === "left" ? `rotate(-90,${s.x + s.w / 2},${s.y + s.h / 2})` : s.id === "right" ? `rotate(90,${s.x + s.w / 2},${s.y + s.h / 2})` : undefined}
            >
              {s.label}
            </text>
            {/* Progress indicator */}
            {!isSelected && agg.inspected > 0 && (
              <text
                x={s.x + s.w / 2}
                y={s.id === "left" || s.id === "right" ? s.y + s.h / 2 + 14 : s.y + s.h / 2 + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? "#fff" : dark ? "#555" : "#999"}
                fontSize="9"
                fontFamily="'DM Mono', monospace"
                style={{ pointerEvents: "none" }}
                transform={s.id === "left" ? `rotate(-90,${s.x + s.w / 2},${s.y + s.h / 2 + 14})` : s.id === "right" ? `rotate(90,${s.x + s.w / 2},${s.y + s.h / 2 + 14})` : undefined}
              >
                {agg.inspected}/{agg.active}
              </text>
            )}
          </g>
        );
      })}

      {/* Orientation */}
      <text x="130" y="6" textAnchor="middle" className="orient-label" fontSize="7">FRONT</text>
      <text x="130" y="504" textAnchor="middle" className="orient-label" fontSize="7">REAR</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   SECTION DETAIL PANEL
   ═══════════════════════════════════════════ */

function SectionDetail({ section, inspections, onUpdateZone, onSelectZone, onBack }) {
  const zones = getSectionZones(section.id);
  const agg = getSectionAgg(section.id, inspections);

  // Group sub-zones by their group
  const groups = {};
  zones.forEach((z) => {
    if (!groups[z.group]) groups[z.group] = [];
    groups[z.group].push(z);
  });

  // Find uninspected zones for this section
  const uninspected = zones.filter((z) => !inspections[z.id]?.notPresent && getStatuses(inspections[z.id]).length === 0);

  return (
    <div className="panel slide-in">
      <Breadcrumb
        items={[{ label: "Overview", level: "overview" }, { label: section.label, level: "section" }]}
        onNavigate={(level) => { if (level === "overview") onBack(); }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--tx)", letterSpacing: 0.5 }}>{section.label}</div>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "var(--mu)", marginTop: 2 }}>
            {agg.inspected}/{agg.active} inspected
            {agg.npCount > 0 && <span> · {agg.npCount} not present</span>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "var(--s2)", borderRadius: 4, height: 6, marginBottom: 16, overflow: "hidden" }}>
        <div style={{
          width: agg.active > 0 ? `${(agg.inspected / agg.active) * 100}%` : "0%",
          height: "100%",
          background: agg.status === "damaged" ? "#ef4444" : agg.status === "clean" ? "#22c55e" : agg.status === "noted" ? "#f97316" : "#3b82f6",
          borderRadius: 4,
          transition: "width 0.3s ease",
        }} />
      </div>

      {/* Remaining hint */}
      {uninspected.length > 0 && (
        <div style={{ padding: "8px 12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, marginBottom: 16, fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#3b82f6" }}>
          {uninspected.length} zone{uninspected.length !== 1 ? "s" : ""} still need inspection
        </div>
      )}
      {uninspected.length === 0 && (
        <div style={{ padding: "8px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, marginBottom: 16, fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#22c55e" }}>
          ✓ Section complete
        </div>
      )}

      {/* Sub-zones by group */}
      {Object.entries(groups).map(([groupId, groupZones]) => (
        <div key={groupId} style={{ marginBottom: 14 }}>
          <MonoLabel style={{ marginBottom: 8, fontSize: 9 }}>
            {GROUP_LABELS[groupId] || groupId} — {groupZones.length}
          </MonoLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {groupZones.map((z) => {
              const d = inspections[z.id];
              const isNP = d?.notPresent;
              const sts = getStatuses(d);
              const fl = isFlagged(d);
              const ps = primaryStatus(d);
              const col = statusColor(ps);
              return (
                <button key={z.id} onClick={() => onSelectZone(z.id)} className="subzone-btn"
                  style={{
                    borderColor: isNP ? "var(--bd)" : fl ? "rgba(249,115,22,0.3)" : col ? `${col}40` : "var(--bd)",
                    background: isNP ? "var(--s2)" : fl ? "rgba(249,115,22,0.06)" : ps === "clean" ? "rgba(34,197,94,0.06)" : ps === "damaged" ? "rgba(239,68,68,0.06)" : "var(--s2)",
                    opacity: isNP ? 0.45 : 1,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                    {z.optional && <span style={{ fontSize: 7, color: "#f97316", flexShrink: 0 }}>◆</span>}
                    <span style={{ color: isNP ? "var(--bd)" : fl ? "#fb923c" : "var(--tx)", textDecoration: isNP ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {z.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
                    {isNP ? (
                      <span style={{ fontSize: 8, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>N/P</span>
                    ) : sts.length > 0 ? (
                      sts.map((sid) => {
                        const sc = statusColor(sid);
                        return sc ? <div key={sid} style={{ width: 7, height: 7, borderRadius: "50%", background: sc }} /> : null;
                      })
                    ) : (
                      <span style={{ fontSize: 8, fontFamily: "'DM Mono', monospace", color: "var(--bd)" }}>—</span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--bd)", marginLeft: 2 }}>›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ZONE INSPECTION PANEL
   ═══════════════════════════════════════════ */

function ZoneInspection({ zone, section, data, onUpdate, onBack, onBackToOverview, onNext, nextNav, inspections }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const photos = data?.photos || [];
  const notes = data?.notes || "";
  const statuses = getStatuses(data);
  const notPresent = data?.notPresent || false;
  const zoneDone = isZoneDone(zone.id, inspections);
  const blockReason = zoneMissingReason(zone.id, inspections);

  const handleAddPhotos = (e) => {
    const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
    onUpdate(zone.id, { photos: [...photos, ...urls] });
    e.target.value = "";
  };

  const handleRemovePhoto = (idx) => {
    onUpdate(zone.id, { photos: photos.filter((_, j) => j !== idx) });
  };

  const toggleNotPresent = () => {
    if (!notPresent) {
      onUpdate(zone.id, { notPresent: true, status: [], notes: "", photos: [] });
    } else {
      onUpdate(zone.id, { notPresent: false });
    }
  };

  const toggleCondition = (condId) => {
    const next = statuses.includes(condId)
      ? statuses.filter((s) => s !== condId)
      : [...statuses, condId];
    onUpdate(zone.id, { status: next });
  };

  return (
    <div className="panel slide-in">
      <Breadcrumb
        items={[
          { label: "Overview", level: "overview" },
          { label: section.label, level: "section" },
          { label: zone.label, level: "zone" },
        ]}
        onNavigate={(level) => {
          if (level === "overview") onBackToOverview();
          if (level === "section") onBack();
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--tx)", letterSpacing: 0.5 }}>{zone.label}</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--mu)", marginTop: 2 }}>
            {GROUP_LABELS[zone.group] || zone.group}
            {zone.optional && <span style={{ color: "#f97316", marginLeft: 6 }}>OPTIONAL</span>}
          </div>
        </div>
      </div>

      {/* Not Present */}
      <button onClick={toggleNotPresent} className="not-present-btn"
        style={{
          borderColor: notPresent ? "#ef4444" : "var(--bd)",
          background: notPresent ? "rgba(239,68,68,0.12)" : "var(--s2)",
          color: notPresent ? "#ef4444" : "var(--mu)",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="np-checkbox" style={{ borderColor: notPresent ? "#ef4444" : "var(--bd)", background: notPresent ? "#ef4444" : "transparent" }}>
            {notPresent && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>Not Present</div>
            <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 500 }}>This part is missing from the vehicle</div>
          </div>
        </div>
      </button>

      {notPresent ? (
        <div style={{ textAlign: "center", padding: "28px 10px", color: "var(--mu)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚫</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "#ef4444" }}>Marked Not Present</div>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", lineHeight: 1.7 }}>
            This zone is excluded from inspection.<br />Toggle above to re-enable.
          </div>
        </div>
      ) : (
        <>
          {/* Condition — multi-select */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <MonoLabel>Condition</MonoLabel>
              {statuses.length > 1 && (
                <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "var(--mu)", opacity: 0.7 }}>
                  {statuses.length} SELECTED
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {CONDITIONS.map((c) => {
                const active = statuses.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCondition(c.id)} className="condition-btn"
                    style={{
                      flex: 1,
                      borderColor: active ? c.color : "var(--bd)",
                      background: active ? `${c.color}20` : "var(--s2)",
                      color: active ? c.color : "var(--mu)",
                    }}>
                    {active && <span style={{ marginRight: 4, fontSize: 11 }}>✓</span>}
                    {c.label}
                  </button>
                );
              })}
            </div>
            {statuses.length > 1 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {statuses.map((sid) => {
                  const c = CONDITIONS.find((x) => x.id === sid);
                  if (!c) return null;
                  return (
                    <span key={sid} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", padding: "2px 8px", borderRadius: 3, background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}40` }}>
                      {c.label.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <MonoLabel style={{ marginBottom: 8 }}>
              {statuses.includes("damaged") ? (
                <>Damage Description <span style={{ color: "#ef4444" }}>*</span></>
              ) : "Notes"}
            </MonoLabel>
            <textarea className="notes-input" value={notes}
              onChange={(e) => onUpdate(zone.id, { notes: e.target.value })}
              placeholder={statuses.includes("damaged") ? "Required — describe the damage, location, severity..." : "Describe any damage, scratches, dents, chips, paint issues..."}
              rows={3}
              style={statuses.includes("damaged") && !notes?.trim() && !photos.length ? { borderColor: "rgba(239,68,68,0.5)" } : undefined}
            />
          </div>

          {/* Photos */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <MonoLabel>
                Photos <span style={{ color: "#f97316" }}>({photos.length})</span>
                {statuses.includes("damaged") && !notes?.trim() && !photos.length && (
                  <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
                )}
              </MonoLabel>
              {photos.length > 0 && <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>tap × to remove</span>}
            </div>
            {photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                {photos.map((url, i) => <PhotoThumbnail key={i} url={url} onRemove={() => handleRemovePhoto(i)} />)}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => cameraRef.current?.click()} className="photo-action-btn camera-btn">
                <span style={{ fontSize: 20 }}>📷</span>
                <span>Take Photo</span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="photo-action-btn upload-btn">
                <span style={{ fontSize: 20 }}>📁</span>
                <span>Upload</span>
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleAddPhotos} style={{ display: "none" }} />
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleAddPhotos} style={{ display: "none" }} />
          </div>
        </>
      )}

      {/* ── Navigation Buttons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--bd)" }}>
        <button onClick={onBackToOverview} className="nav-btn nav-overview">
          ← Return to Overview
        </button>
        {nextNav.type === "complete" ? (
          <button onClick={onBackToOverview} className="nav-btn nav-next" style={{ opacity: zoneDone ? 1 : 0.35, pointerEvents: zoneDone ? "auto" : "none" }}>
            ✓ Finish Inspection
          </button>
        ) : (
          <button onClick={onNext} className="nav-btn nav-next" style={{ opacity: zoneDone ? 1 : 0.35, pointerEvents: zoneDone ? "auto" : "none" }}>
            {nextNav.type === "section" ? `Next Section →` : `Next Zone →`}
          </button>
        )}
      </div>
      {blockReason && (
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", color: blockReason.includes("Damaged") ? "#ef4444" : "var(--mu)", opacity: blockReason.includes("Damaged") ? 1 : 0.7 }}>
          {blockReason}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   JOB INFO BAR
   ═══════════════════════════════════════════ */

/* ── Input Formatters ── */

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatDate(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatYear(raw) {
  return raw.replace(/\D/g, "").slice(0, 4);
}

function formatMileage(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function formatVin(raw) {
  return raw.replace(/[^A-HJ-NPR-Z0-9]/gi, "").toUpperCase().slice(0, 17);
}

function InfoField({ label, value, onChange, placeholder, required, size, formatter, inputMode, maxLength, uppercase }) {
  const handleChange = (e) => {
    const raw = e.target.value;
    onChange(formatter ? formatter(raw) : raw);
  };

  // size: xs(72px), sm(110px), md(160px), lg(flex-grow), full(100%)
  const sizeStyles = {
    xs:   { flex: "0 0 72px",  minWidth: 72 },
    sm:   { flex: "0 0 110px", minWidth: 100 },
    md:   { flex: "0 0 160px", minWidth: 140 },
    lg:   { flex: "1 1 160px", minWidth: 140 },
    full: { flex: "1 1 100%",  minWidth: 200 },
  };

  return (
    <div style={sizeStyles[size] || sizeStyles.lg}>
      <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "var(--mu)", letterSpacing: 1.5, marginBottom: 3, textTransform: "uppercase" }}>
        {label}
        {required && <span style={{ color: "#f97316", marginLeft: 3 }}>*</span>}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="info-input"
        inputMode={inputMode || "text"}
        maxLength={maxLength}
        style={{
          borderColor: required && !value?.trim() ? "rgba(249,115,22,0.4)" : undefined,
          textTransform: uppercase ? "uppercase" : undefined,
          fontFamily: uppercase ? "'DM Mono', monospace" : undefined,
          letterSpacing: uppercase ? 1.5 : undefined,
        }}
      />
    </div>
  );
}

function JobInfoBar({ jobInfo, onUpdate, expanded, onToggle }) {
  const complete = isJobInfoComplete(jobInfo);
  const missing = getMissingJobFields(jobInfo);
  const vehicleSummary = [jobInfo.vehicleYear, jobInfo.vehicleMake, jobInfo.vehicleModel].filter(Boolean).join(" ");

  const set = (field) => (val) => onUpdate({ ...jobInfo, [field]: val });

  return (
    <div className="job-info-bar">
      {/* Collapsed summary row */}
      <button onClick={onToggle} className="job-info-toggle">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16 }}>{complete ? "✅" : "📋"}</div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            {jobInfo.customerName || vehicleSummary ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {jobInfo.customerName && <span style={{ fontWeight: 700, color: "var(--tx)", fontSize: 14 }}>{jobInfo.customerName}</span>}
                {vehicleSummary && <span style={{ color: "var(--mu)", fontSize: 13 }}>{vehicleSummary}</span>}
                {jobInfo.vehicleColor && <span style={{ color: "var(--mu)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{jobInfo.vehicleColor}</span>}
                {jobInfo.roNumber && <span style={{ color: "var(--mu)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>RO# {jobInfo.roNumber}</span>}
              </div>
            ) : (
              <span style={{ color: "var(--mu)", fontSize: 13 }}>Tap to enter vehicle &amp; customer info</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!complete && (
            <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "#f97316", padding: "2px 7px", background: "rgba(249,115,22,0.1)", borderRadius: 3, border: "1px solid rgba(249,115,22,0.2)" }}>
              {missing.length} REQUIRED
            </span>
          )}
          <span style={{ color: "var(--mu)", fontSize: 11, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
        </div>
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="job-info-form slide-in">
          {/* Customer */}
          <MonoLabel style={{ marginBottom: 8, marginTop: 4, fontSize: 9 }}>Customer</MonoLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <InfoField label="Name" value={jobInfo.customerName} onChange={set("customerName")} placeholder="Full name" required size="lg" />
            <InfoField label="Phone" value={jobInfo.customerPhone} onChange={set("customerPhone")} placeholder="(702) 555-1234" size="md" formatter={formatPhone} inputMode="tel" maxLength={14} />
            <InfoField label="Email" value={jobInfo.customerEmail} onChange={set("customerEmail")} placeholder="email@example.com" size="lg" />
          </div>

          {/* Vehicle */}
          <MonoLabel style={{ marginBottom: 8, fontSize: 9 }}>Vehicle</MonoLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            <InfoField label="Year" value={jobInfo.vehicleYear} onChange={set("vehicleYear")} placeholder="2024" required size="xs" formatter={formatYear} inputMode="numeric" maxLength={4} />
            <InfoField label="Make" value={jobInfo.vehicleMake} onChange={set("vehicleMake")} placeholder="Toyota" required size="md" maxLength={20} />
            <InfoField label="Model" value={jobInfo.vehicleModel} onChange={set("vehicleModel")} placeholder="Camry" required size="lg" maxLength={40} />
            <InfoField label="Color" value={jobInfo.vehicleColor} onChange={set("vehicleColor")} placeholder="Midnight Black" size="lg" />
            <InfoField label="VIN" value={jobInfo.vehicleVin} onChange={set("vehicleVin")} placeholder="1HGCM82633A004352" required size="lg" formatter={formatVin} maxLength={17} uppercase />
            <InfoField label="Mileage" value={jobInfo.vehicleMileage} onChange={set("vehicleMileage")} placeholder="45,230" size="sm" formatter={formatMileage} inputMode="numeric" />
            <InfoField label="License Plate" value={jobInfo.vehiclePlate} onChange={set("vehiclePlate")} placeholder="ABC-1234" size="sm" maxLength={10} uppercase />
          </div>

          {/* Job */}
          <MonoLabel style={{ marginBottom: 8, fontSize: 9 }}>Job Details</MonoLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <InfoField label="Tech Name" value={jobInfo.techName} onChange={set("techName")} placeholder="Who's inspecting" required size="lg" />
            <InfoField label="RO / Work Order #" value={jobInfo.roNumber} onChange={set("roNumber")} placeholder="Optional" size="md" />
            <InfoField label="Date" value={jobInfo.inspectionDate} onChange={set("inspectionDate")} placeholder="MM/DD/YYYY" size="sm" formatter={formatDate} inputMode="numeric" maxLength={10} />
          </div>

          {!complete && (
            <div style={{ marginTop: 10, padding: "6px 10px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#f97316" }}>
              Missing: {missing.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   OVERVIEW PANEL
   ═══════════════════════════════════════════ */

function OverviewPanel({ sections, inspections, isFullyReady, isComplete, jobInfo, onOpenReport, onOpenSignature, signature }) {
  return (
    <div className="panel" style={{ padding: "28px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{isComplete ? "✅" : "🚗"}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 6 }}>
          {isComplete ? "Inspection Complete" : "Start Walkaround"}
        </div>
        <div style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: "var(--mu)", lineHeight: 1.8 }}>
          {isComplete
            ? "All zones have been inspected"
            : <>Tap a section on the diagram<br />to begin your inspection</>
          }
        </div>
      </div>

      {/* Finalize buttons when all zones done */}
      {isComplete && (
        <div style={{ marginBottom: 20 }}>
          {!isFullyReady && (
            <div style={{ padding: "8px 12px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 7, marginBottom: 12, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#f97316", textAlign: "center" }}>
              Fill in all required job info fields to unlock export
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <button onClick={onOpenReport} className="nav-btn nav-next" style={{ padding: "14px 8px", opacity: isFullyReady ? 1 : 0.4, pointerEvents: isFullyReady ? "auto" : "none" }}>
              📄 View Report
            </button>
            <button onClick={onOpenSignature} className="nav-btn nav-next" style={{ padding: "14px 8px" }}>
              ✍️ {signature ? "Update Signature" : "Capture Signature"}
            </button>
          </div>
          {signature && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, marginBottom: 8 }}>
              <img src={signature} alt="Sig" style={{ height: 24, borderRadius: 2, border: "1px solid #ddd" }} />
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#22c55e" }}>Signature captured</span>
            </div>
          )}
        </div>
      )}

      <MonoLabel style={{ marginBottom: 10, fontSize: 9 }}>Sections — {sections.length}</MonoLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sections.map((s) => {
          const agg = getSectionAgg(s.id, inspections);
          const sc = agg.status === "damaged" ? "#ef4444" : agg.status === "noted" ? "#f97316" : agg.status === "clean" ? "#22c55e" : agg.status === "partial" ? "#3b82f6" : null;
          return (
            <div key={s.id} className="overview-section-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {sc ? (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid var(--bd)", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--tx)" }}>{s.label}</div>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>
                    {agg.inspected}/{agg.active} zones
                    {agg.npCount > 0 && ` · ${agg.npCount} n/p`}
                  </div>
                </div>
              </div>
              {/* Mini progress */}
              <div style={{ width: 60, height: 4, background: "var(--s2)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  width: agg.active > 0 ? `${(agg.inspected / agg.active) * 100}%` : "0%",
                  height: "100%",
                  background: sc || "var(--bd)",
                  borderRadius: 2,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIGNATURE PAD MODAL
   ═══════════════════════════════════════════ */

function SignatureModal({ onSave, onClose, existingSignature }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasStrokes(true);
      };
      img.src = existingSignature;
    }
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  };

  const endDraw = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#111";
    setHasStrokes(false);
  };

  const handleSave = () => {
    if (!hasStrokes) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content slide-in" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <MonoLabel style={{ marginBottom: 3 }}>Customer Verification</MonoLabel>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)" }}>Sign Below</div>
          </div>
          <button onClick={onClose} className="btn-close">&times;</button>
        </div>

        <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "var(--mu)", marginBottom: 12, lineHeight: 1.6 }}>
          By signing, the customer acknowledges the recorded condition of the vehicle at the time of inspection.
        </div>

        {/* Canvas */}
        <div style={{ border: "2px solid var(--bd)", borderRadius: 8, overflow: "hidden", background: "#fff", position: "relative", marginBottom: 12 }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: 180, display: "block", cursor: "crosshair", touchAction: "none" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasStrokes && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "#ccc", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
              Sign here with finger or mouse
            </div>
          )}
          {/* Signature line */}
          <div style={{ position: "absolute", bottom: 30, left: 24, right: 24, borderBottom: "1px solid #ddd", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 14, left: 24, fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace", pointerEvents: "none" }}>CUSTOMER SIGNATURE</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearCanvas} className="sig-btn sig-clear">Clear</button>
          <button onClick={handleSave} className="sig-btn sig-accept" style={{ opacity: hasStrokes ? 1 : 0.4, pointerEvents: hasStrokes ? "auto" : "none" }}>
            ✓ Accept Signature
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRINTABLE REPORT (PDF)
   ═══════════════════════════════════════════ */

function PrintableReport({ jobInfo, inspections, signature, onClose }) {
  const vehicleSummary = [jobInfo.vehicleYear, jobInfo.vehicleMake, jobInfo.vehicleModel].filter(Boolean).join(" ");
  const npZones = SUB_ZONES.filter((z) => inspections[z.id]?.notPresent);
  const activeZones = SUB_ZONES.filter((z) => !inspections[z.id]?.notPresent);
  const damaged = activeZones.filter((z) => hasStatus(inspections[z.id], "damaged"));
  const clean = activeZones.filter((z) => hasStatus(inspections[z.id], "clean"));
  const now = new Date().toLocaleString();

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500);
    const afterPrint = () => onClose();
    window.addEventListener("afterprint", afterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [onClose]);

  const hdr = { fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: "#666", textTransform: "uppercase", marginBottom: 8, borderBottom: "2px solid #ddd", paddingBottom: 5, fontFamily: "monospace" };
  const td = { padding: "7px 10px", borderBottom: "1px solid #eee" };
  const thStyle = { textAlign: "left", padding: "7px 10px", fontWeight: 700, color: "#666", fontSize: 11, letterSpacing: 1.5, fontFamily: "monospace", borderBottom: "2px solid #ddd", textTransform: "uppercase" };

  return (
    <div className="print-overlay">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in 0.6in; }
          body * { visibility: hidden !important; }
          .print-overlay, .print-overlay * { visibility: visible !important; }
          .print-overlay { position: absolute !important; left: 0; top: 0; width: 100%; }
          .print-overlay * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print, .no-print * { display: none !important; visibility: hidden !important; }
          .print-page { max-width: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
        }
        @media screen {
          .print-overlay { position: fixed; inset: 0; z-index: 9999; background: #e0e0e0; overflow-y: auto; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, background: "#222", color: "#fff", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <span style={{ fontSize: 13, fontFamily: "monospace" }}>Print preview — Save as PDF from your browser's print dialog</span>
        <button onClick={onClose} style={{ background: "#555", border: "none", color: "#fff", padding: "6px 16px", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✕ Close</button>
      </div>

      <div className="print-page" style={{ maxWidth: 780, margin: "24px auto", background: "#fff", padding: "44px 40px", fontFamily: "'Rajdhani', Helvetica, sans-serif", color: "#111", boxShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, borderBottom: "3px solid #f97316", paddingBottom: 18 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#f97316" }}>SHOPGUARD</div>
            <div style={{ fontSize: 12, letterSpacing: 3, color: "#999", fontFamily: "monospace" }}>VEHICLE INSPECTION REPORT</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13, color: "#555", fontFamily: "monospace", lineHeight: 1.7 }}>
            <div>{now}</div>
            {jobInfo.roNumber && <div>RO# {jobInfo.roNumber}</div>}
            {jobInfo.techName && <div>Tech: {jobInfo.techName}</div>}
          </div>
        </div>

        {/* ── Customer + Vehicle ── */}
        <div style={{ display: "flex", gap: 32, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={hdr}>Customer</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{jobInfo.customerName || "—"}</div>
            {jobInfo.customerPhone && <div style={{ fontSize: 14, color: "#444", marginBottom: 1 }}>{jobInfo.customerPhone}</div>}
            {jobInfo.customerEmail && <div style={{ fontSize: 14, color: "#444" }}>{jobInfo.customerEmail}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={hdr}>Vehicle</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{vehicleSummary || "—"}</div>
            {jobInfo.vehicleColor && <div style={{ fontSize: 14, color: "#444", marginBottom: 1 }}>Color: {jobInfo.vehicleColor}</div>}
            {jobInfo.vehicleVin && <div style={{ fontSize: 13, color: "#444", fontFamily: "monospace", letterSpacing: 1 }}>VIN: {jobInfo.vehicleVin}</div>}
            <div style={{ display: "flex", gap: 20, marginTop: 2 }}>
              {jobInfo.vehicleMileage && <span style={{ fontSize: 14, color: "#444" }}>Miles: {jobInfo.vehicleMileage}</span>}
              {jobInfo.vehiclePlate && <span style={{ fontSize: 14, color: "#444" }}>Plate: {jobInfo.vehiclePlate}</span>}
            </div>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Zones", val: activeZones.length, bg: "#f5f5f5", col: "#333" },
            { label: "Clean", val: clean.length, bg: "#dcfce7", col: "#166534" },
            { label: "Damaged", val: damaged.length, bg: "#fef2f2", col: "#991b1b" },
            { label: "Not Present", val: npZones.length, bg: "#f5f5f5", col: "#666" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "12px 8px", background: s.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.col }}>{s.val}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#888", textTransform: "uppercase", fontFamily: "monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Zone Tables by Section ── */}
        {SECTIONS.map((sec) => {
          const secZones = getSectionZones(sec.id);
          if (secZones.length === 0) return null;
          return (
            <div key={sec.id} style={{ marginBottom: 24, pageBreakInside: "avoid" }}>
              <div style={hdr}>{sec.label}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "30%" }}>Zone</th>
                    <th style={{ ...thStyle, width: "18%" }}>Status</th>
                    <th style={thStyle}>Notes</th>
                    <th style={{ ...thStyle, width: "10%", textAlign: "center" }}>Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {secZones.map((z) => {
                    const d = inspections[z.id];
                    const isNP = d?.notPresent;
                    const sts = getStatuses(d);
                    return (
                      <tr key={z.id}>
                        <td style={{ ...td, fontWeight: 600, color: isNP ? "#bbb" : "#222", textDecoration: isNP ? "line-through" : "none" }}>{z.label}</td>
                        <td style={td}>
                          {isNP ? (
                            <span style={{ color: "#999", fontSize: 12, fontFamily: "monospace" }}>N/P</span>
                          ) : sts.length > 0 ? (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {sts.map((sid) => {
                                const sc = statusColor(sid);
                                return (
                                  <span key={sid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 3, background: sid === "clean" ? "#dcfce7" : sid === "damaged" ? "#fef2f2" : "#fff7ed", color: sc, fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                                    {sid}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ color: "#ccc" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...td, color: "#444", fontSize: 13 }}>{d?.notes?.trim() || "—"}</td>
                        <td style={{ ...td, textAlign: "center", color: "#888", fontSize: 13, fontFamily: "monospace" }}>{d?.photos?.length || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ── Signature ── */}
        <div style={{ marginTop: 36, pageBreakInside: "avoid", borderTop: "2px solid #ddd", paddingTop: 24 }}>
          <div style={hdr}>Customer Acknowledgment</div>
          <p style={{ margin: "0 0 20px 0", fontSize: 13, lineHeight: 1.6, color: "#555" }}>
            I acknowledge that the vehicle condition described above is accurate to the best of my knowledge at the time of this inspection.
          </p>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "2px solid #333", height: 70, marginBottom: 6, display: "flex", alignItems: "flex-end" }}>
                {signature && <img src={signature} alt="Customer signature" style={{ maxHeight: 64, maxWidth: "100%", objectFit: "contain" }} />}
              </div>
              <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", letterSpacing: 1.5 }}>CUSTOMER SIGNATURE</div>
              {jobInfo.customerName && <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{jobInfo.customerName}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "2px solid #333", height: 70, marginBottom: 6, display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
                <span style={{ fontSize: 15 }}>{jobInfo.inspectionDate}</span>
              </div>
              <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", letterSpacing: 1.5 }}>DATE</div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 36, textAlign: "center", fontSize: 10, color: "#bbb", fontFamily: "monospace", letterSpacing: 3 }}>
          GENERATED BY SHOPGUARD · {now}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT MODAL
   ═══════════════════════════════════════════ */

function ReportModal({ inspections, jobInfo, signature, onClose, onExportPDF, onOpenSignature }) {
  const npZones = SUB_ZONES.filter((z) => inspections[z.id]?.notPresent);
  const activeZones = SUB_ZONES.filter((z) => !inspections[z.id]?.notPresent);
  const damaged = activeZones.filter((z) => hasStatus(inspections[z.id], "damaged"));
  const flagged = activeZones.filter((z) => isFlagged(inspections[z.id]));
  const clean = activeZones.filter((z) => hasStatus(inspections[z.id], "clean"));
  const inspected = activeZones.filter((z) => getStatuses(inspections[z.id]).length > 0);
  const zonesComplete = inspected.length === activeZones.length && activeZones.length > 0;
  const infoComplete = isJobInfoComplete(jobInfo);
  const isReady = zonesComplete && infoComplete;

  const incompleteSections = SECTIONS.map((sec) => {
    const secZones = getSectionZones(sec.id).filter((z) => !inspections[z.id]?.notPresent);
    const missing = secZones.filter((z) => getStatuses(inspections[z.id]).length === 0);
    return { ...sec, missing };
  }).filter((s) => s.missing.length > 0);

  const missingFields = getMissingJobFields(jobInfo);
  const vehicleSummary = [jobInfo.vehicleYear, jobInfo.vehicleMake, jobInfo.vehicleModel].filter(Boolean).join(" ");

  const stats = [
    { val: damaged.length, label: "DAMAGED", col: "#ef4444" },
    { val: flagged.length, label: "FLAGGED", col: "#f97316" },
    { val: clean.length, label: "CLEAN", col: "#22c55e" },
    { val: npZones.length, label: "N/P", col: "var(--mu)" },
  ];

  const issues = activeZones.filter((z) => {
    const d = inspections[z.id];
    return d && (hasStatus(d, "damaged") || hasStatus(d, "noted") || d.notes?.trim() || d.photos?.length);
  });

  const issuesBySection = {};
  issues.forEach((z) => {
    if (!issuesBySection[z.section]) issuesBySection[z.section] = [];
    issuesBySection[z.section].push(z);
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content slide-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <MonoLabel style={{ marginBottom: 3 }}>Inspection Summary</MonoLabel>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--tx)" }}>Report Preview</div>
          </div>
          <button onClick={onClose} className="btn-close">&times;</button>
        </div>

        {/* Job info summary */}
        <div className="report-job-info">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              {jobInfo.customerName && <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tx)" }}>{jobInfo.customerName}</div>}
              {(jobInfo.customerPhone || jobInfo.customerEmail) && (
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--mu)", marginTop: 2 }}>
                  {[jobInfo.customerPhone, jobInfo.customerEmail].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {vehicleSummary && <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{vehicleSummary}</div>}
              {jobInfo.vehicleColor && <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>{jobInfo.vehicleColor}</div>}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>
            {jobInfo.vehicleVin && <span>VIN: {jobInfo.vehicleVin}</span>}
            {jobInfo.vehicleMileage && <span>Miles: {jobInfo.vehicleMileage}</span>}
            {jobInfo.vehiclePlate && <span>Plate: {jobInfo.vehiclePlate}</span>}
            {jobInfo.roNumber && <span>RO#: {jobInfo.roNumber}</span>}
            {jobInfo.techName && <span>Tech: {jobInfo.techName}</span>}
            {jobInfo.inspectionDate && <span>Date: {jobInfo.inspectionDate}</span>}
          </div>
        </div>

        {/* Completion bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <MonoLabel style={{ fontSize: 9 }}>Completion</MonoLabel>
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: zonesComplete ? "#22c55e" : "var(--mu)" }}>
              {inspected.length}/{activeZones.length} zones
              {zonesComplete && " ✓"}
            </span>
          </div>
          <div style={{ background: "var(--s2)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              width: activeZones.length > 0 ? `${(inspected.length / activeZones.length) * 100}%` : "0%",
              height: "100%",
              background: zonesComplete ? "#22c55e" : "#3b82f6",
              borderRadius: 4,
              transition: "width 0.3s",
            }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 22, fontWeight: 700, color: s.col }}>{s.val}</div>
              <MonoLabel style={{ fontSize: 8, letterSpacing: 1 }}>{s.label}</MonoLabel>
            </div>
          ))}
        </div>

        {issues.length === 0 && npZones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#22c55e", fontSize: 16, fontWeight: 600 }}>
            ✓ No issues recorded — vehicle is clear
          </div>
        ) : (
          <>
            {Object.entries(issuesBySection).map(([secId, secIssues]) => {
              const sec = SECTIONS.find((s) => s.id === secId);
              return (
                <div key={secId} style={{ marginBottom: 16 }}>
                  <MonoLabel style={{ marginBottom: 8 }}>{sec?.label || secId}</MonoLabel>
                  {secIssues.map((z) => {
                    const d = inspections[z.id];
                    const sts = getStatuses(d);
                    return (
                      <div key={z.id} className="flagged-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: d.notes?.trim() ? 6 : 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tx)" }}>{z.label}</div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            {d.photos?.length > 0 && <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#f97316" }}>📷 {d.photos.length}</span>}
                            {sts.map((sid) => {
                              const sc = statusColor(sid);
                              return sc ? <span key={sid} className="status-badge" style={{ background: `${sc}15`, color: sc, borderColor: `${sc}4d` }}>{sid}</span> : null;
                            })}
                          </div>
                        </div>
                        {d.notes?.trim() && <div style={{ fontSize: 13, color: "var(--mu)", lineHeight: 1.5 }}>{d.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {npZones.length > 0 && (
              <div>
                <MonoLabel style={{ marginBottom: 10 }}>Not Present</MonoLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {npZones.map((z) => <span key={z.id} className="np-tag">{z.label}</span>)}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Export / Signature — gated behind completion ── */}
        <div style={{ marginTop: 20, borderTop: "1px solid var(--bd)", paddingTop: 16 }}>
          {isReady ? (
            <>
              {/* Signature status */}
              {signature ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
                  <img src={signature} alt="Signature" style={{ height: 32, borderRadius: 3, border: "1px solid #ddd" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Signature Captured</div>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>{jobInfo.customerName || "Customer"}</div>
                  </div>
                  <button onClick={onOpenSignature} style={{ background: "none", border: "1px solid var(--bd)", borderRadius: 4, padding: "4px 10px", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)", cursor: "pointer" }}>Re-sign</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>No Signature Yet</div>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>Capture before exporting for a complete report</div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={onExportPDF} className="export-btn" style={{ background: "#22c55e", color: "#fff" }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span>Export PDF</span>
                </button>
                <button onClick={onOpenSignature} className="export-btn" style={{ background: "#3b82f6", color: "#fff" }}>
                  <span style={{ fontSize: 16 }}>✍️</span>
                  <span>{signature ? "Update Signature" : "Capture Signature"}</span>
                </button>
              </div>
              <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#22c55e" }}>
                ✓ All zones inspected &amp; info complete — ready to finalize
              </div>
            </>
          ) : (
            <div className="export-locked">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 22 }}>🔒</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tx)" }}>Not Ready to Export</div>
                  <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--mu)" }}>
                    Complete all requirements below to unlock
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12, opacity: 0.35, pointerEvents: "none" }}>
                <button className="export-btn" style={{ background: "var(--s2)", color: "var(--mu)" }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span>Export PDF</span>
                </button>
                <button className="export-btn" style={{ background: "var(--s2)", color: "var(--mu)" }}>
                  <span style={{ fontSize: 16 }}>✍️</span>
                  <span>Customer Signature</span>
                </button>
              </div>

              {/* Missing job info fields */}
              {missingFields.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12 }}>📋</span>
                    <MonoLabel style={{ fontSize: 9 }}>Missing Info Fields</MonoLabel>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {missingFields.map((f) => (
                      <span key={f} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", padding: "2px 8px", borderRadius: 3, background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing inspection zones */}
              {incompleteSections.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12 }}>🔍</span>
                    <MonoLabel style={{ fontSize: 9 }}>Missing Zones</MonoLabel>
                  </div>
                  <div style={{ maxHeight: 150, overflowY: "auto" }}>
                    {incompleteSections.map((sec) => (
                      <div key={sec.id} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)", marginBottom: 3 }}>{sec.label}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {sec.missing.map((z) => (
                            <span key={z.id} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", padding: "2px 8px", borderRadius: 3, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>
                              {z.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

export default function App() {
  const [dark, setDark] = useState(true);
  const [vehicleType, setVehicleType] = useState("sedan");
  const [showVehicleMenu, setShowVehicleMenu] = useState(false);
  const [inspections, setInspections] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [jobInfo, setJobInfo] = useState(DEFAULT_JOB_INFO);
  const [showJobInfo, setShowJobInfo] = useState(true);
  const [signature, setSignature] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const updateZone = useCallback((zoneId, updates) => {
    setInspections((prev) => ({ ...prev, [zoneId]: { ...prev[zoneId], ...updates } }));
  }, []);

  const activeZones = SUB_ZONES.filter((z) => !inspections[z.id]?.notPresent);
  const flaggedCount = activeZones.filter((z) => isFlagged(inspections[z.id])).length;
  const inspectedCount = activeZones.filter((z) => getStatuses(inspections[z.id]).length > 0).length;
  const npCount = SUB_ZONES.filter((z) => inspections[z.id]?.notPresent).length;
  const isComplete = inspectedCount === activeZones.length && activeZones.length > 0;
  const isFullyReady = isComplete && isJobInfoComplete(jobInfo);

  const currentSection = SECTIONS.find((s) => s.id === selectedSection);
  const currentZone = SUB_ZONES.find((z) => z.id === selectedZone);
  const currentZoneSection = currentZone ? SECTIONS.find((s) => s.id === currentZone.section) : null;

  const handleSectionClick = (id) => {
    setSelectedSection(id === selectedSection ? null : id);
    setSelectedZone(null);
  };

  const nextNav = currentZone && currentZoneSection
    ? getNextNav(currentZone.id, currentZoneSection.id, inspections)
    : { type: "complete" };

  const handleNextNav = () => {
    if (nextNav.type === "zone") {
      setSelectedZone(nextNav.zoneId);
    } else if (nextNav.type === "section") {
      setSelectedSection(nextNav.sectionId);
      setSelectedZone(nextNav.zoneId);
    } else {
      setSelectedZone(null);
      setSelectedSection(null);
    }
  };

  const goToOverview = () => { setSelectedZone(null); setSelectedSection(null); };

  return (
    <div style={{ background: "var(--bg)", color: "var(--tx)", minHeight: "100vh", fontFamily: "'Rajdhani', sans-serif" }}>
      <style>{getStyles(dark)}</style>

      {/* Header */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="logo-icon">🔍</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, lineHeight: 1, color: "var(--tx)" }}>SHOPGUARD</div>
            <MonoLabel style={{ fontSize: 9, letterSpacing: 3 }}>Vehicle Inspection</MonoLabel>
          </div>
        </div>
        <button onClick={() => setDark((d) => !d)} className="theme-toggle">
          {dark ? "☀️  LIGHT" : "🌙  DARK"}
        </button>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowVehicleMenu((v) => !v)} className="vehicle-picker-btn">
            <span>🚗</span>
            <span style={{ flex: 1, textAlign: "left" }}>{VEHICLE_TYPES.find((v) => v.id === vehicleType)?.label}</span>
            <span style={{ color: "var(--mu)", fontSize: 11 }}>▾</span>
          </button>
          {showVehicleMenu && (
            <div className="vehicle-dropdown">
              {VEHICLE_TYPES.map((v) => (
                <button key={v.id}
                  onClick={() => { if (v.available) { setVehicleType(v.id); setSelectedSection(null); setSelectedZone(null); } setShowVehicleMenu(false); }}
                  className="vehicle-option"
                  style={{ background: vehicleType === v.id ? "rgba(249,115,22,0.1)" : "transparent", color: v.available ? "var(--tx)" : "var(--mu)", cursor: v.available ? "pointer" : "default" }}>
                  <span style={{ flex: 1 }}>{v.label}</span>
                  {!v.available && <span className="soon-badge">SOON</span>}
                  {v.id === vehicleType && <span style={{ color: "#f97316", fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <ToolbarStat value={flaggedCount} label="FLAGGED" color="#f97316" />
          <ToolbarStat value={inspectedCount} label="INSPECTED" color="var(--tx)" showDivider />
          <ToolbarStat value={activeZones.length} label="ZONES" color="var(--mu)" showDivider />
          {npCount > 0 && <ToolbarStat value={npCount} label="N/P" color="#ef4444" showDivider />}
        </div>
      </div>

      {/* Job Info Bar */}
      <JobInfoBar jobInfo={jobInfo} onUpdate={setJobInfo} expanded={showJobInfo} onToggle={() => setShowJobInfo((v) => !v)} />

      {/* Main */}
      <div className="main-layout">
        {/* Left — Diagram */}
        <div style={{ flexShrink: 0, width: "100%", maxWidth: 290 }}>
          <div className="panel" style={{ padding: "16px 14px" }}>
            <MonoLabel style={{ textAlign: "center", marginBottom: 14, fontSize: 9 }}>Tap a section to inspect</MonoLabel>
            <SectionDiagram
              sections={SECTIONS}
              inspections={inspections}
              selectedSection={selectedSection}
              onSectionClick={handleSectionClick}
              dark={dark}
            />
          </div>
          <div className="panel" style={{ marginTop: 10, padding: "12px 14px" }}>
            <MonoLabel style={{ marginBottom: 10, fontSize: 9 }}>Legend</MonoLabel>
            {LEGEND.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: `1px solid ${l.bd}`, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--mu)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Panel */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {selectedZone && currentZone && currentZoneSection ? (
            <ZoneInspection
              zone={currentZone}
              section={currentZoneSection}
              data={inspections[selectedZone]}
              inspections={inspections}
              onUpdate={updateZone}
              onBack={() => setSelectedZone(null)}
              onBackToOverview={goToOverview}
              onNext={handleNextNav}
              nextNav={nextNav}
            />
          ) : selectedSection && currentSection ? (
            <SectionDetail
              section={currentSection}
              inspections={inspections}
              onUpdateZone={updateZone}
              onSelectZone={(id) => setSelectedZone(id)}
              onBack={() => setSelectedSection(null)}
            />
          ) : (
            <OverviewPanel
              sections={SECTIONS}
              inspections={inspections}
              isComplete={isComplete}
              isFullyReady={isFullyReady}
              jobInfo={jobInfo}
              signature={signature}
              onOpenReport={() => setShowReport(true)}
              onOpenSignature={() => setShowSignature(true)}
            />
          )}
        </div>
      </div>

      {showVehicleMenu && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowVehicleMenu(false)} />}
      {showReport && (
        <ReportModal
          inspections={inspections}
          jobInfo={jobInfo}
          signature={signature}
          onClose={() => setShowReport(false)}
          onExportPDF={() => { setShowReport(false); setShowPrint(true); }}
          onOpenSignature={() => { setShowReport(false); setShowSignature(true); }}
        />
      )}
      {showSignature && (
        <SignatureModal
          existingSignature={signature}
          onSave={(sig) => { setSignature(sig); setShowSignature(false); }}
          onClose={() => setShowSignature(false)}
        />
      )}
      {showPrint && (
        <PrintableReport
          jobInfo={jobInfo}
          inspections={inspections}
          signature={signature}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */

function getStyles(dark) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: ${dark ? "#0c0c11" : "#f0f0f5"};
      --sf: ${dark ? "#13131c" : "#ffffff"};
      --s2: ${dark ? "#1b1b27" : "#e8e8f0"};
      --bd: ${dark ? "#28283a" : "#d0d0e0"};
      --tx: ${dark ? "#e8e8f2" : "#111118"};
      --mu: ${dark ? "#606090" : "#7070a0"};
      --ac: #f97316;
      --zone-default: ${dark ? "#1a1a28" : "#cccce0"};
      --zone-stroke: ${dark ? "#2e2e45" : "#a8a8c0"};
    }
    body { background: var(--bg); color: var(--tx); font-family: 'Rajdhani', sans-serif; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 3px; }
    @keyframes slideIn { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .slide-in { animation: slideIn 0.2s ease; }
    .zone-rect { cursor: pointer; transition: all 0.15s; }
    .orient-label { fill: ${dark ? "#38385a" : "#9090b0"}; font-family: 'DM Mono', monospace; letter-spacing: 3px; }
    .panel { background: var(--sf); border: 1px solid var(--bd); border-radius: 10px; padding: 20px; }
    .app-header { background: var(--sf); border-bottom: 1px solid var(--bd); padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; backdrop-filter: blur(8px); }
    .logo-icon { width: 34px; height: 34px; background: #f97316; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
    .theme-toggle { background: var(--s2); border: 1px solid var(--bd); border-radius: 6px; padding: 7px 13px; color: var(--tx); font-size: 13px; font-family: 'Rajdhani', sans-serif; font-weight: 600; cursor: pointer; letter-spacing: 0.5px; }
    .toolbar { background: var(--sf); border-bottom: 1px solid var(--bd); padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .vehicle-picker-btn { background: var(--s2); border: 1px solid var(--bd); border-radius: 7px; padding: 8px 14px; color: var(--tx); font-size: 14px; font-family: 'Rajdhani', sans-serif; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; min-width: 195px; letter-spacing: 0.5px; }
    .vehicle-dropdown { position: absolute; top: calc(100% + 4px); left: 0; background: var(--sf); border: 1px solid var(--bd); border-radius: 9px; padding: 6px; z-index: 100; min-width: 210px; box-shadow: ${dark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 8px 30px rgba(0,0,0,0.15)"}; }
    .vehicle-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; border-radius: 6px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600; text-align: left; letter-spacing: 0.3px; }
    .soon-badge { font-size: 9px; font-family: 'DM Mono', monospace; color: var(--mu); border: 1px solid var(--bd); border-radius: 3px; padding: 1px 5px; letter-spacing: 1px; }
    /* Navigation buttons */
    .nav-btn { padding: 12px 8px; border-radius: 8px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: all 0.15s; text-align: center; }
    .nav-overview { background: var(--s2); border: 1.5px solid var(--bd); color: var(--mu); }
    .nav-overview:hover { border-color: var(--mu); color: var(--tx); }
    .nav-next { background: #f97316; border: 1.5px solid #f97316; color: #fff; }
    .nav-next:hover { background: #ea580c; border-color: #ea580c; }
    .main-layout { display: flex; gap: 16px; padding: 16px; max-width: 920px; margin: 0 auto; align-items: flex-start; flex-wrap: wrap; }
    .btn-close { background: var(--s2); border: 1px solid var(--bd); color: var(--mu); border-radius: 6px; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 300; }
    .btn-close:hover { color: var(--tx); border-color: var(--ac); }

    /* Breadcrumb */
    .breadcrumb-btn { background: none; border: none; font-family: 'DM Mono', monospace; font-size: 11px; cursor: pointer; padding: 2px 4px; border-radius: 3px; letter-spacing: 0.5px; transition: all 0.1s; }
    .breadcrumb-btn:hover { background: var(--s2); }

    /* Condition buttons */
    .condition-btn { padding: 9px 4px; border-radius: 6px; border-width: 1.5px; border-style: solid; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: all 0.15s; }

    /* Export buttons */
    .export-btn { border: none; border-radius: 8px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; font-family: 'Rajdhani', sans-serif; font-weight: 700; gap: 4px; transition: all 0.15s; letter-spacing: 0.5px; }
    .export-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .export-locked { padding: 16px; background: var(--s2); border: 1px solid var(--bd); border-radius: 10px; }

    /* Sub-zone buttons */
    .subzone-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 1px solid var(--bd); border-radius: 7px; background: var(--s2); font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.1s; letter-spacing: 0.3px; }
    .subzone-btn:hover { border-color: var(--ac); }

    /* Notes */
    .notes-input { background: var(--s2); border: 1px solid var(--bd); color: var(--tx); font-family: 'Rajdhani', sans-serif; font-size: 15px; padding: 10px 12px; border-radius: 6px; resize: none; width: 100%; outline: none; line-height: 1.5; transition: border-color 0.15s; }
    .notes-input:focus { border-color: var(--ac); }

    /* Photos */
    .photo-thumb { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: var(--s2); border: 1px solid var(--bd); }
    .photo-remove { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
    .photo-action-btn { border: 2px dashed var(--bd); border-radius: 8px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: var(--mu); font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; gap: 5px; transition: all 0.15s; letter-spacing: 0.5px; }
    .camera-btn:hover { border-color: #22c55e; color: #22c55e; background: rgba(34,197,94,0.08); }
    .upload-btn:hover { border-color: #f97316; color: #f97316; background: rgba(249,115,22,0.08); }

    /* Not Present */
    .not-present-btn { width: 100%; padding: 12px 14px; border-radius: 8px; border: 1.5px solid var(--bd); cursor: pointer; font-family: 'Rajdhani', sans-serif; transition: all 0.15s; display: block; background: var(--s2); margin-bottom: 18px; }
    .not-present-btn:hover { opacity: 0.85; }
    .np-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--bd); display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
    .np-tag { font-size: 11px; font-family: 'DM Mono', monospace; padding: 3px 10px; border-radius: 4px; background: var(--s2); border: 1px solid var(--bd); color: var(--mu); text-decoration: line-through; }

    /* Overview section rows */
    .overview-section-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--s2); border: 1px solid var(--bd); border-radius: 7px; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal-content { background: var(--sf); border: 1px solid var(--bd); border-radius: 12px; padding: 24px; max-width: 540px; width: 100%; max-height: 80vh; overflow-y: auto; }
    .stat-card { background: var(--s2); border: 1px solid var(--bd); border-radius: 8px; padding: 12px 6px; text-align: center; }
    .flagged-card { background: var(--s2); border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
    .status-badge { font-size: 10px; font-family: 'DM Mono', monospace; padding: 2px 7px; border-radius: 3px; border-width: 1px; border-style: solid; text-transform: uppercase; letter-spacing: 1px; }

    /* Job Info Bar */
    .job-info-bar { background: var(--sf); border-bottom: 1px solid var(--bd); }
    .job-info-toggle { width: 100%; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: transparent; border: none; cursor: pointer; font-family: 'Rajdhani', sans-serif; }
    .job-info-toggle:hover { background: var(--s2); }
    .job-info-form { padding: 0 18px 16px 18px; }
    .info-input { width: 100%; padding: 8px 10px; background: var(--s2); border: 1px solid var(--bd); border-radius: 6px; color: var(--tx); font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600; outline: none; transition: border-color 0.15s; }
    .info-input:focus { border-color: var(--ac); }
    .info-input::placeholder { color: var(--mu); opacity: 0.6; font-weight: 400; }

    /* Report job info summary */
    .report-job-info { background: var(--s2); border: 1px solid var(--bd); border-radius: 8px; padding: 14px; margin-bottom: 16px; }

    /* Signature buttons */
    .sig-btn { flex: 1; padding: 12px; border-radius: 7px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: all 0.15s; }
    .sig-clear { background: var(--s2); border: 1px solid var(--bd); color: var(--mu); }
    .sig-clear:hover { border-color: #ef4444; color: #ef4444; }
    .sig-accept { background: #22c55e; border: none; color: #fff; flex: 2; }
    .sig-accept:hover { background: #16a34a; }

    /* Print overlay */
    .print-overlay { font-family: 'Rajdhani', Helvetica, sans-serif; }
  `;
}

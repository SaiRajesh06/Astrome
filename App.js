import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
  useMapEvent,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-ellipse";
import "./App.css";

const defaultTowerIcon = new L.DivIcon({
  html: `<div class="tower-icon"></div>`,
  iconSize: [12, 12],
});

const selectedTowerIcon = new L.DivIcon({
  html: `<div class="tower-icon selected"></div>`,
  iconSize: [14, 14],
});

function MapClickHandler({ onClick }) {
  useMapEvent("click", (e) => {
    if (
      e.originalEvent.target.classList.contains("leaflet-container") ||
      e.originalEvent.target.classList.contains("leaflet-tile")
    ) {
      onClick(e);
    }
  });
  return null;
}

function EllipseOverlay({ lat, lng, r }) {
  const map = useMap();
  const ellipseRef = useRef();

  useEffect(() => {
    if (map && !ellipseRef.current) {
      const scaledR = r * 5;
      ellipseRef.current = L.ellipse([lat, lng], [scaledR, scaledR / 2], 0, {
        color: "#ff4444",
        weight: 1.5,
        fillOpacity: 0.3,
      }).addTo(map);
    }
    return () => {
      if (ellipseRef.current) {
        ellipseRef.current.remove();
        ellipseRef.current = null;
      }
    };
  }, [lat, lng, r, map]);
  return null;
}

export default function App() {
  const [towers, setTowers] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [fresnelZones, setFresnelZones] = useState([]);
  const [highlightedLink, setHighlightedLink] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleMapClick = (e) => {
    const freq = prompt("Enter tower frequency in GHz (e.g. 5):", "5");
    if (!freq) return;
    const newTower = {
      id: Date.now(),
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      frequencyGHz: parseFloat(freq),
    };
    setTowers((prev) => [...prev, newTower]);
  };

  const handleTowerClick = (tower, e) => {
    e.originalEvent.stopPropagation();
    if (!selectedTower) return setSelectedTower(tower);

    if (selectedTower.id === tower.id) return setSelectedTower(null);

    if (selectedTower.frequencyGHz !== tower.frequencyGHz) {
      alert("Frequencies must match to connect towers!");
      return setSelectedTower(null);
    }

    const newLink = {
      id: Date.now(),
      from: selectedTower,
      to: tower,
      freq: tower.frequencyGHz,
    };
    setLinks((prev) => [...prev, newLink]);
    setSelectedTower(null);
  };

  const calculateFresnel = async (link) => {
    const { from, to, freq } = link;
    const fHz = freq * 1e9;
    const lambda = 3e8 / fHz;
    const dTotal = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const d1 = dTotal / 2;
    const d2 = dTotal / 2;
    const r = Math.sqrt((lambda * d1 * d2) / (d1 + d2));
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;

    try {
      const res = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${midLat},${midLng}`
      );
      const data = await res.json();
      const elevation = data.results?.[0]?.elevation || 0;
      return { midLat, midLng, r, elevation };
    } catch (err) {
      console.error("Elevation API error", err);
      return null;
    }
  };

  const handleLinkClick = async (link, e) => {
    e.originalEvent.stopPropagation();
    setHighlightedLink(link.id);
    setFresnelZones((prev) => prev.filter((f) => f.id !== link.id));
    const fresnel = await calculateFresnel(link);
    if (fresnel)
      setFresnelZones((prev) => [...prev, { ...fresnel, id: link.id }]);
  };

  const removeTower = (id) => {
    setTowers((prev) => prev.filter((t) => t.id !== id));
    setLinks((prev) => prev.filter((l) => l.from.id !== id && l.to.id !== id));
    setFresnelZones((prev) => prev.filter((f) => f.id !== id));
  };

  const removeLink = (id) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setFresnelZones((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFrequencyChange = (id, newFreq) => {
    const freq = parseFloat(newFreq);
    setTowers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, frequencyGHz: freq } : t))
    );
    setLinks((prev) =>
      prev.filter((l) => {
        const t1 =
          l.from.id === id ? { ...l.from, frequencyGHz: freq } : l.from;
        const t2 =
          l.to.id === id ? { ...l.to, frequencyGHz: freq } : l.to;
        return t1.frequencyGHz === t2.frequencyGHz;
      })
    );
  };

  const handleMapClickWithClear = (e) => {
    setFresnelZones([]);
    handleMapClick(e);
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>RF Link Planner</h2>
        <p className="hint">Click map to add towers</p>

        <div className="section">
          <h3>Towers</h3>
          {towers.length === 0 && <p className="empty">No towers added yet</p>}
          {towers.map((t) => (
            <div className="card" key={t.id}>
              <b>Tower #{t.id.toString().slice(-4)}</b>
              <div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={t.frequencyGHz}
                  onChange={(e) =>
                    handleFrequencyChange(t.id, e.target.value)
                  }
                  className="freq-input"
                />{" "}
                GHz
              </div>
              <button
                className="btn-danger"
                onClick={() => removeTower(t.id)}
              >
                Remove Tower
              </button>
            </div>
          ))}
        </div>

        <div className="section">
          <h3>Links</h3>
          {links.length === 0 && <p className="empty">No links created yet</p>}
          {links.map((l) => {
            const dist = calculateDistance(
              l.from.lat,
              l.from.lng,
              l.to.lat,
              l.to.lng
            );
            return (
              <div
                className={`card ${
                  highlightedLink === l.id ? "highlighted" : ""
                }`}
                key={l.id}
              >
                <b>Link #{l.id.toString().slice(-4)}</b>
                <p>
                  {l.freq} GHz | {(dist / 1000).toFixed(2)} km
                </p>
                <button
                  className="btn-danger"
                  onClick={() => removeLink(l.id)}
                >
                  Remove Link
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Map */}
      <main className="map-area">
        <MapContainer center={[39.3, -76.6]} zoom={14} className="map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <MapClickHandler onClick={handleMapClickWithClear} />

          {/* Towers */}
          {towers.map((tower) => (
            <Marker
              key={tower.id}
              position={[tower.lat, tower.lng]}
              icon={
                selectedTower && selectedTower.id === tower.id
                  ? selectedTowerIcon
                  : defaultTowerIcon
              }
              eventHandlers={{
                click: (e) => handleTowerClick(tower, e),
              }}
            >
              <Popup>
                <b>Tower #{tower.id.toString().slice(-4)}</b>
                <br />
                {tower.frequencyGHz} GHz
              </Popup>
            </Marker>
          ))}

          {/* Links */}
          {links.map((link) => {
            const distance = calculateDistance(
              link.from.lat,
              link.from.lng,
              link.to.lat,
              link.to.lng
            );
            const label = `Link #${link.id
              .toString()
              .slice(-4)} | ${link.freq} GHz | ${(distance / 1000).toFixed(
              2
            )} km`;
            return (
              <Polyline
                key={link.id}
                positions={[
                  [link.from.lat, link.from.lng],
                  [link.to.lat, link.to.lng],
                ]}
                color={
                  highlightedLink === link.id ? "#ff9933" : "#00cc88"
                }
                weight={highlightedLink === link.id ? 5 : 3}
                eventHandlers={{
                  click: (e) => handleLinkClick(link, e),
                }}
              >
                <Tooltip direction="top" sticky>
                  {label}
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Fresnel Zones */}
          {fresnelZones.map((fz) => (
            <EllipseOverlay
              key={fz.id}
              lat={fz.midLat}
              lng={fz.midLng}
              r={fz.r}
            />
          ))}
        </MapContainer>
      </main>
    </div>
  );
}
 
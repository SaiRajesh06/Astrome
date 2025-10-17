# 🌐 RF Outdoor Link Planner

A **web-based RF (Radio Frequency) link planning tool** built using **React** and **Leaflet.js** that allows users to visualize, configure, and analyze point-to-point wireless communication links on a map.  
It demonstrates **geometric computation, user interactivity, data visualization**, and **API integration** — all in a single cohesive frontend project.

---

## 🧭 What is this project?

The **RF Link Planner** is an **interactive tool** for visualizing communication links between towers and analyzing their **Fresnel zone** — the region around a line-of-sight radio path that affects signal strength and interference.

Users can:
- Click on a map to **place towers**
- Configure each tower’s **frequency (in GHz)**
- Connect towers of matching frequencies with **links**
- View **link distance and frequency** on hover
- Visualize the **First Fresnel Zone** as a red ellipse
- Edit or remove towers and links dynamically

This project simplifies the **core logic used in RF network planning tools** like Ubiquiti AirLink, Cambium LINKPlanner, or Ekahau — in a compact, easy-to-use frontend implementation.

---

## 💡 Why I Built This

In telecommunications, **RF link planning** is essential for ensuring **clear line-of-sight** between base stations or towers.  
But most existing professional tools are complex and locked behind enterprise software.

This project was built to:
1. Demonstrate **geospatial UI design** and **geometry-based computation** in React.
2. Showcase integration of **real-world physics** (RF propagation) into a frontend system.
3. Highlight skills in **React state management, event-driven architecture, Leaflet mapping**, and **API usage**.
4. Provide a **proof-of-concept educational tool** to visualize how frequencies, distance, and terrain elevation affect wireless link quality.

---

## 🧩 How It Works

### 🗺️ Map Interaction
- Built with **Leaflet.js**, an open-source mapping library.
- Users can click anywhere to add towers.
- Each tower stores coordinates (`lat`, `lng`) and frequency (`GHz`).

### 🔗 Link Creation Logic
- When two towers of the **same frequency** are selected, a link (green line) is drawn between them.
- Each link object stores:

First Fresnel zone radius:
r = sqrt( (λ * d1 * d2) / (d1 + d2) )

Where:
  • r  = radius of the first Fresnel zone at a point (meters)
  • λ  = wavelength of the signal (meters). λ = c / f
  • d1 = distance from the transmitter to the point (meters)
  • d2 = distance from the receiver to the point (meters)

Constants / units:
  • c = speed of light = 3 × 10^8 m/s
  • f = frequency in Hz (if you accept MHz/GHz in UI, convert: 1 MHz = 1e6 Hz, 1 GHz = 1e9 Hz)
      Example: 5 GHz = 5e9 Hz → λ = 3e8 / 5e9 = 0.06 m
​	
The app fetches terrain elevation data from the Open-Elevation API for the midpoint to provide more realistic visualization.
The zone is drawn as a 2D red ellipse centered on the link midpoint.
Data Flow
User clicks map → tower created
User selects 2 towers → link created if frequencies match
User clicks link → ellipse visualized
User edits tower frequency → invalid links auto-remove
User removes tower or link → updates state, removes map objects
All state is handled in React using:
useState for towers, links, fresnel zones, selected tower
useEffect for ellipse rendering with Leaflet overlays

Core Concepts Used
Frontend Engineering
React.js Functional Components
React Hooks: useState, useEffect, useRef
Modular Component Architecture
Dynamic state-based rendering
Geospatial Computation
Leaflet.js for interactive mapping
Geodesic distance calculation using the Haversine formula
Fresnel Zone radius calculation (based on RF physics)
Coordinate midpoints for geometric visualization
Integration & Visualization
Open-Elevation API for real-world terrain data
Dynamic SVG/Canvas overlays (Leaflet Ellipse plugin)
Interactive tooltips & popups
UI/UX Design
Modern dark-themed layout
Clear sidebar navigation
Hover tooltips for link details
Smooth highlight transitions for selected links
Responsive design for tablets and wide screens

## 🧱 Tech Stack

- **Frontend:** React, JavaScript (ES6+)
- **Mapping Library:** Leaflet.js
- **Styling:** CSS3 (custom dark theme)
- **API Integration:** Open-Elevation API
- **Deployment:** Vercel
- **Version Control:** Git & GitHub

## 🎓 Key Learning Outcomes

- Bridging **engineering physics** with **frontend logic**
- Building **interactive map systems** using Leaflet
- Managing **real-time UI state synchronization**
- Designing for **usability and responsiveness**

This project successfully implements a working RF link planning system with Fresnel zone visualization, combining geometric computation, physics modeling, and frontend interaction. It demonstrates how spatial data and user interactivity can merge to create meaningful engineering insights through modern web technologies.

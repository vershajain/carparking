# PARKOS | Smart Parking Resource Scheduler

An Operating Systems-inspired, strictly rule-based, deterministic resource scheduling web application engineered for OS academic demonstration and viva defense.

---

## 🎯 OS Analogy & Architecture Mapping

| Operating System Concept | Smart Parking Scheduler Equivalent | Description |
| :--- | :--- | :--- |
| **Process (PCB)** | **Vehicle Entry** | Process Control Block storing PID, category, urgency ($U$), timestamps, burst duration, constraints (EV/Accessible). |
| **Resource / Memory Block** | **Parking Slot** | Physical allocation target characterized by state (`FREE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`), capabilities, and distance. |
| **Ready Queue** | **Waiting Vehicles Queue** | Priority heap ordered by dynamic score $P$. |
| **Demand-Aware Scheduler** | **$P_L$ vs $P_H$ Formula Selector** | Dynamically adapts formula weights based on resource congestion (Low Demand vs High Demand). |
| **Aging & Starvation Prevention** | **Fairness Accumulator ($F$)** | Waiting vehicles receive $+10$ points (capped at $100$) every cycle they are skipped, preventing starvation. |
| **Hold-and-Wait / Grace Timer** | **Reservation Lifecycle** | Strict $10$-minute grace timer before auto-releasing unclaimed reservations back to the free resource pool. |
| **CPU Burst Overrun Penalty** | **Overstay Fine Engine** | Actual vs Expected runtime tracking; penalizes processes exceeding burst time $+$ grace period. |
| **Hot-Plug Resource Expansion** | **Dynamic Slot & Zone Creator** | Dynamically register new resource blocks or memory banks at runtime with instant recalculation. |

---

## 🧮 Mathematical Scheduling Pipeline

### Step 1: Demand Classification (Zone Congestion)
$$\text{Demand (\%)} = \left(\frac{\text{Waiting Vehicles}}{\text{Available Suitable Slots}}\right) \times 100$$
- If Available Slots == $0$, Demand = $100\%$.
- **LOW DEMAND**: Demand < $50\%$ (uses $P_L$)
- **HIGH DEMAND**: Demand $\ge 50\%$ (uses $P_H$)

---

### Step 2: Dynamic Vehicle Priority Score ($P$)
All factors are normalized to $[0, 100]$:
- **$W$ (Waiting Time):** Min-max normalized based on max wait in ready queue.
- **$U$ (Urgency / Category):**
  - 🚑 Ambulance: $100$
  - 🚒 Fire Truck: $95$
  - 🚓 Police: $90$
  - ⭐ VIP / Authorized: $70$
  - ♿ Disabled Vehicle: $65$
  - 🚗 Normal Vehicle: $40$
- **$R$ (Reservation):** $100$ if active valid reservation, $0$ otherwise.
- **$F$ (Fairness / Aging):** Increments by $+10$ (capped at $100$) every scheduling cycle skipped.
- **$V$ (Duration Turnover):** Shorter bursts get higher turnover scores (Shortest Job First heuristic):
  $$V = \max\left(0, 100 - \left(\frac{\text{Duration}}{\text{Max Reference Duration}}\right) \times 100\right)$$

#### Dynamic Formula Selection:
- **Low Demand Formula ($P_L$):**
  $$P_L = 0.35W + 0.20U + 0.15R + 0.25F + 0.05V$$
- **High Demand Formula ($P_H$):**
  $$P_H = 0.20W + 0.35U + 0.15R + 0.20F + 0.10V$$

---

### Step 3: Slot Suitability Score
1. **Hard Filter:** Prunes incompatible slots:
   - EV vehicles require `EV_CHARGER`.
   - Disabled category vehicles require `ACCESSIBLE`.
   - Slot must be `FREE` (or reserved for this specific process).
2. **Compatibility Scoring:**
   $$\text{Slot Score} = 0.40 \times (100 - \text{Normalized Distance}) + 0.30 \times (100 - \text{Zone Demand}) + 0.30 \times \text{Fit Score}$$
3. Assign candidate slot with the highest Slot Suitability Score.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Installation & Running Locally
```bash
# Clone and enter directory
cd d:/os_project

# Install all dependencies (already configured)
npm install

# Start both Express backend and Vite frontend concurrently
npm run dev
```

- **Frontend Application:** `http://localhost:5173/`
- **Backend REST API:** `http://localhost:5001/`

### 3. Run Unit Tests (Proves All 4 Viva Fixtures)
```bash
npm test
```
Verifies:
1. High demand switches to $P_H$.
2. Aging increments and prevents starvation of normal vehicles.
3. Non-compatible slots are successfully pruned (EV / Accessible hard filters).
4. Strict 10-minute reservation expiration triggers auto-release.

---

## 🎨 Theme Switcher: Warm Mocha vs Cyber Dark
Click the **☕ Mocha / ⚡ Cyber** button in the top navigation bar to toggle between:
- **Warm Mocha (Default):** Deep rich espresso (`#120e0c`), dark roasted coffee cards (`#2b211b`), golden caramel accents (`#d97736`, `#e0a96d`), and warm status indicators (`#84cc16`, `#ef4444`, `#f59e0b`).
- **Cyber Dark:** High-contrast cyberpunk OS console with glowing cyan and emerald indicators.

---

## 🔌 Hot-Plug Resource Expansion
1. Click **"+ Add Slot / Zone"** in the Resource Map or header.
2. Select **"Add Single Slot"** or **"Create New Zone"** (e.g. `Zone D - Rooftop Deck`).
3. Set slot type (`STANDARD`, `EV_CHARGER`, `ACCESSIBLE`, `VIP`), distance, and initial status.
4. Click **"Plug Resource Block"**:
   - Total & Available slots update immediately.
   - Demand ratio is re-evaluated.
   - Scheduler immediately pops compatible waiting vehicles and assigns the new slot!
5. Click any slot card to toggle between **Online** and **Offline (Maintenance)** or **Delete** the slot.


---

## ⚡ Performance Comparison & Benchmark Simulation (FCFS vs Adaptive)

Navigate to the **⚡ Performance Benchmark** tab in the navigation bar to evaluate the proposed Adaptive Scheduler against traditional First-Come-First-Served (FCFS) on identical input traces.

### Evaluation Methodology
> *"The proposed Adaptive Scheduler is validated purely against deterministic, measurable operating system performance metrics across identical scenario traces, rather than static assumptions."*

### 5 Preset Workload Scenarios (Identical Input Traces):
1. **Low Demand Workload**: Sparse arrivals, low resource contention (<50% capacity, P_L locked).
2. **High Demand Workload**: Rapid incoming burst, high contention (>100% capacity, P_L ➔ P_H switching, aging starvation prevention).
3. **Emergency-Heavy Workload**: Ambulances ($U=100$), Fire Trucks ($U=95$), and Police cruisers ($U=90$) interspersed among normal cars.
4. **Reservation-Heavy Workload**: Advance pre-bookings testing 10-minute hold-and-wait grace timer and no-show auto-release.
5. **Mixed Duration Workload**: Short burst turnover (5–15 min) vs long resident stays (60–180 min) testing Shortest-Job-First turnover heuristic ($V$).

### Evaluated Operating System Metrics:
- **Average Waiting Time ($W_{avg}$)**: Lower is better.
- **Maximum Waiting Time ($W_{max}$)**: Lower is better.
- **Slot Utilization Rate ($U\%$)**: Higher is better.
- **Emergency Response Time ($T_{emerg}$)**: Lower is better.
- **Starvation Count ($N_{starve}$)**: Processes waiting > 20 minutes (eliminated under Adaptive via Aging $F$).
- **Reservation Success Rate ($R_{succ}\%$)**: Higher is better.
- **Expired Reservations / No-Shows**: Strict 10-minute grace auto-release count.
- **Total / Avg Overstay & Fines (₹)**: Overtime penalties incurred.

### Dynamic Delta Percentage Calculation:
$$\Delta\% = \left(\frac{|\text{Metric}_{FCFS} - \text{Metric}_{Adaptive}|}{\text{Metric}_{FCFS}}\right) \times 100$$

# Q-Day Global Timeline — Country & Company Intelligence
*Data reference compiled June 2026 · For Q-Orchestrator project, "Q-Day Timeline" page*

> **Note on "real-time live" data:** There is no live API for quantum-computing progress (unlike a stock ticker). This data is compiled from the most recent verified public sources — company roadmaps, government strategy documents, peer-reviewed papers, and quantum-industry trackers (The Quantum Insider, Global Risk Institute, NIST, national cyber agencies). It reflects the state of the field as of June 2026. Realistically this page should be re-scraped/refreshed every 1–3 months — qubit counts and roadmaps shift quarterly.

---

## 1. The Big Picture — When Is Q-Day?

"Q-Day" = the day a **Cryptographically Relevant Quantum Computer (CRQC)** exists — one that can break RSA-2048 / ECC in a practically useful timeframe using Shor's algorithm.

| Metric | Current Best Estimate (2026) |
|---|---|
| Logical qubits needed to break RSA-2048 | ~thousands (estimates have fallen from ~20 million physical qubits to under 1 million as algorithms improve) |
| Best logical qubit count achieved (any company) | 48 verified logical qubits (Quantinuum Helios, Nov 2025) / 96 logical qubits with looser verification (QuEra, Jan 2026) |
| Global Risk Institute 2026 expert survey (26 experts) | CRQC "quite possible" (28–49%) within 10 years; "likely" (51–70%) within 15 years |
| Consensus heaviest-probability window | **2030–2035** |
| NIST PQC standards finalized | August 2024 (FIPS 203 ML-KEM, FIPS 204 ML-DSA, FIPS 205 SLH-DSA); HQC added March 2025 |

This is the framing line for the page: **the hardware timeline (Q-Day) and the defense timeline (PQC migration) are racing each other**, and most national migration deadlines (2030–2035) assume CRQC arrival in roughly the same window.

---

## 2. Tier System (suggested for timeline visualization)

| Tier | Countries | Characteristics |
|---|---|---|
| **Tier 1 — Frontier** | United States, China | $10B+ government commitment, multiple companies with 100+ physical qubits, national PQC programs already mandatory, indigenous fabrication |
| **Tier 2 — Fast Followers** | United Kingdom, Germany, France (+ EU collective), Japan, Canada | $1–3B national programs, home-grown hardware companies, formal PQC migration roadmaps with hard 2030–2035 deadlines |
| **Tier 3 — Active Builders** | India, South Korea, Australia, Israel, Netherlands, Russia | $500M–2.5B programs, working sub-100-qubit prototypes, PQC strategy published but migration still early-stage |
| **Tier 4 — Emerging / Niche Hubs** | Singapore, Switzerland, Spain, Finland, Austria, Norway | Sub-$1B programs, often specialize in one modality (trapped-ion, software) or serve as regional hub/policy leader rather than hardware leader |

---

## 3. Country Profiles

### 🇺🇸 United States — Tier 1
- **Government program:** National Quantum Initiative (NQI), $1.2B (2019–2024) reauthorized with $1.8B more (2025–2029). DOE runs 5 quantum research centers ($625M).
- **Companies:** IBM, Google, Microsoft, IonQ, Quantinuum (US/UK joint), Rigetti, D-Wave, PsiQuantum, Atom Computing, QuEra.
- **Physical qubits (leading systems):** IBM Condor — 1,121 physical qubits (superconducting, 2024); D-Wave Advantage2 — 4,400+ qubits (annealing, not gate-model).
- **Logical qubits (leading):** Quantinuum Helios — 48 verified logical qubits (Nov 2025, best encoding ratio); Google Willow — 1 logical qubit below error-correction threshold (Dec 2024, the key scientific proof-point, not a usable logical qubit count).
- **PQC status:** NIST finalized FIPS 203/204/205 (Aug 2024). CNSA 2.0 mandates full PQC for National Security Systems by **2035**. Enterprise-wide NIST guidance effectively treats **May 2026** as the point implementation must be underway.
- **Roadmap / Q-Day-relevant prediction:** IBM targets a fault-tolerant computer ("Starling," 200 logical qubits, 100M gates) by **2029**, scaling to 2,000 logical qubits ("Blue Jay") by **2033+**. Google targets a useful fault-tolerant system "around the end of the decade," eventually ~1M physical qubits.

### 🇨🇳 China — Tier 1
- **Government program:** Disputed figures — often cited at $15B+, though Chinese physicist Dr. Chao-Yang Lu suggests actual disbursed funding may be roughly one-third of that. Coordinated via the National Laboratory for Quantum Information Sciences and Chinese Academy of Sciences.
- **Companies:** Origin Quantum, Baidu, QuantumCTek, SpinQ, Tencent Quantum Lab, Alibaba (historically).
- **Physical qubits (leading systems):** Origin Wukong-180 — 180-qubit superconducting chip (May 2026, fully self-developed stack: chip, control, environment, OS). Predecessor Origin Wukong (72 qubits) recorded ~50 million remote accesses from 160+ countries.
- **Logical qubits:** No major public claim comparable to IBM/Google/Quantinuum as of mid-2026 — China's public emphasis is on physical-qubit scaling and quantum communication (QKD) rather than logical-qubit error-correction milestones.
- **PQC status:** China does **not** use NIST's standards. It is developing its **own indigenous PQC standard**, expected to finalize within **~3 years (~2029)**, modeled on past practice with SM2/SM3/SM4 (its own classical crypto standards). In the meantime, China leans heavily on **QKD** (Quantum Key Distribution) — operates the Beijing–Shanghai QUESS quantum-communication backbone and a satellite-linked national QKD network via QuantumCTek/China Telecom Quantum Group.
- **Roadmap / prediction:** No single declared fault-tolerance year; the strategy is scaling physical qubits and quantum communications infrastructure as a parallel/alternative track to PQC, while a domestic PQC standard lands around 2029.
- **Note for the threat-audit page (later):** China's QKD-first approach + independent PQC standard is the key reason "PQC by country" isn't a single global checklist — it's genuinely two competing philosophies (PQC vs. QKD) plus a sovereignty dimension.

### 🇬🇧 United Kingdom — Tier 2
- **Government program:** National Quantum Strategy (2023), £2.5B over 2024–2034. March 2026: additional £2B announced (ProQure program) — £500M for pharma/finance/energy applications, £400M for sensing/navigation, £125M for quantum networking.
- **Companies:** Quantinuum (joint US/UK), ORCA Computing, Oxford Quantum Circuits, Infleqtion (delivered a 100-qubit system to the National Quantum Computing Centre).
- **Physical qubits:** IonQ's Cambridge Quantum Innovation Centre hosts a 256-qubit system; NQCC's Infleqtion system at 100 qubits.
- **PQC status:** NCSC published preparatory guidance since Nov 2023; UK approach mirrors NIST algorithms, with general "begin migration now" framing rather than a single hard national deadline (sector-specific timelines apply, e.g., finance regulators).
- **Roadmap:** No standalone UK fault-tolerance date — UK strategy bets on hosting/partnering with global leaders (Quantinuum, IonQ) rather than racing on its own hardware timeline.

### 🇩🇪 Germany — Tier 2
- **Government program:** €2B national program; Munich Quantum Valley (€300M Bavaria + €80M+ federal) is the anchor cluster.
- **Companies/institutions:** Max Planck Institute, TU Munich, IQM (Finnish company with German national-lab deployments).
- **Stated target:** A 2023 government announcement aimed for a **universal quantum computer by 2026** (Germany's own internal goal — worth flagging as aggressive/likely slipping, useful "watch" item for the timeline).
- **PQC status:** Follows EU coordinated roadmap (below) — no separate German-only deadline; BSI (Germany's cyber agency) recommends migration starting now, full coverage targeted in the EU's 2030/2035 phases.

### 🇫🇷 France — Tier 2
- **Government program:** €1.8B national quantum plan (€1B public + €800M private/EU), framed explicitly as **digital sovereignty**.
- **PQC status:** ANSSI (France's cyber agency) has explicitly framed **2030 as a hard horizon** for critical-infrastructure PQC migration — one of the more aggressive national deadlines in Europe.
- **Roadmap:** Active EU Quantum Flagship participant; no standalone hardware fault-tolerance date publicly set.

### 🇪🇺 European Union (supranational layer) — Tier 2
- **Program:** EU Quantum Flagship, €1B, running 2018–2028, coordinating compute/communication/sensing/simulation research across member states.
- **PQC status:** EU's NIS Cooperation Group "Roadmap on Post-Quantum Cryptography" (June 2025) sets three milestones: **31 Dec 2026** — initial national roadmaps; **31 Dec 2030** — high-risk use cases migrated; **31 Dec 2035** — full transition.
- **Note:** Combined European public quantum-tech commitment (EU + national programs) is estimated at **$7–12B**, second globally only to China.

### 🇯🇵 Japan — Tier 2
- **Government program:** 2025 declared "first year of quantum industrialization." ¥1.05 trillion ($7.4B) combined semiconductor+quantum R&D budget; quantum-specific slice estimated ~$900M, plus ¥50B ($335M) backing 10+ quantum startups (Fujitsu, KDDI, OptQC, Jij).
- **Companies/institutions:** RIKEN (256-qubit superconducting system built with Fujitsu), University of Tokyo.
- **Goal:** 10 million "quantum users" and a quantum-driven economy by **2030**.
- **PQC status:** Following NIST-aligned international standards; no standalone aggressive deadline found — Japan's emphasis is industrialization/commercial adoption rather than a sovereign crypto deadline.

### 🇰🇷 South Korea — Tier 3
- **Government program:** ~$2.3B (₩3 trillion) committed through **2035**.
- **Companies/institutions:** Samsung, LG (alongside national institutes) — research-stage rather than fielding standalone hardware companies comparable to IBM/IonQ yet.
- **Focus:** Talent development and indigenous capability-building rather than racing for qubit-count headlines.

### 🇮🇳 India — Tier 3
- **Government program:** National Quantum Mission (NQM), ₹6,003.65 crore (~$735M, sometimes rounded to ~$1B), 2023–2031. Target: 50–1,000 physical qubits within the mission's 8-year window.
- **Companies/institutions:** QpiAI (Bengaluru) — launched **QpiAI-Indus**, India's first full-stack 25-qubit superconducting quantum computer (14 April 2025); a follow-on **64-qubit "Kaveri"** processor targeted for commercial availability in 2026; QpiAI is also targeting a **100-logical-qubit system by 2030**. QNu Labs (quantum-safe networking), Dimira Technologies (indigenous cryogenic cables), BosonQ Psi (simulation software, IBM-network partner).
- **Flagship infrastructure:** **Amaravati Quantum Valley** (Andhra Pradesh) launched 7 Feb 2026 with IBM, TCS, and L&T as partners — anchored by an **IBM Quantum System Two**, planned as India's largest quantum computer; state target of **1,000 logical qubits** capacity by **2026–2029** window (ambitious, likely aspirational vs. IBM's own global System Two-class roadmap).
- **PQC status:** India published a **national PQC roadmap in February 2026** ("Implementation of Quantum-Safe Ecosystem in India," DST/NQM) — explicitly prioritizing protection of Aadhaar-scale identity and UPI-scale payment systems ahead of full threat maturity. Reported skills gap: only ~152 quantum-skilled researchers active today against an estimated need of ~250,000 by 2030.
- **This is your home-country data point — worth visually highlighting on the timeline.**

### 🇮🇱 Israel — Tier 3
- **Government program:** Largely VC-driven; $650M+ private venture capital into Israeli quantum startups in recent years, alongside government/academic support.
- **Focus:** Algorithm and hardware-innovation startups rather than a single flagship national-lab machine.

### 🇳🇱 Netherlands — Tier 3
- **Government program:** Quantum Delta NL, €615M.
- **Hubs:** Delft and Amsterdam — strong academic/startup ecosystem, positions itself as a European quantum hub rather than a hardware-scale leader.

### 🇷🇺 Russia — Tier 3
- **Government program:** Rosatom-led "Quantum Computing" national roadmap (2020–2030), ~24 billion rubles spent 2020–2024 (12B from Rosatom). Coordinates 19 institutes, 600+ researchers.
- **Hardware:** Russia is one of only **three countries (with the US and China)** to have working quantum processors on **all four major platforms** (superconducting, trapped-ion, neutral-atom, photonic). Current best: **72-qubit neutral-atom prototype** (Moscow State University/Rosatom, Dec 2025, 94% two-qubit fidelity); also a 50-qubit ion-trap system and a 35-qubit photonic processor.
- **Roadmap:** Targets **several hundred high-fidelity qubits with error correction by 2030**, aiming to "beat a classical supercomputer" on at least one practical industrial (nuclear-sector) task. From 2026, shifting from model/test problems to practical pilot problems.
- **PQC status:** Limited public information on a formal national PQC migration deadline (international sanctions context limits its participation in NIST/EU-aligned processes); developing independently in parallel with China to some extent.

### 🇦🇺 Australia — Tier 3
- **Government program:** AU$2.3B+ cumulative investment. Universities: Sydney, Melbourne, ANU.
- **PQC status:** Australian Signals Directorate (ASD) mandates **classical public-key cryptography must not be used beyond end of 2030** — one of the most aggressive deadlines globally; organizations told to have a refined transition plan by end of 2026 and begin critical-system migration by end of 2028.

### 🇨🇦 Canada — Tier 3 (borderline Tier 2 on PQC policy leadership)
- **Government program:** C$334M (2025 federal budget, Defence Industrial Strategy) + up to $92M Canadian Quantum Champions Program (Anyon Systems, Nord Quantique, Photonic, Xanadu each up to $23M) + $50M Defence Innovation Secure Hubs + $68M BOREALIS defence-innovation agency (Feb 2026).
- **Companies:** Xanadu (photonic, went public via SPAC March 2026 on Nasdaq/TSX as XNDU, ~$302M raised), Anyon Systems, Nord Quantique, Photonic, D-Wave (Canadian-American).
- **PQC status:** Canada published the **first concrete sovereign PQC deadline among G7 nations** — ITSM.40.001 (June 2025): departmental migration plans due **April 2026**, annual progress reporting thereafter, high-priority systems migrated by **end of 2031**, full migration by **end of 2035**.

### 🇸🇬 Singapore — Tier 4
- **Government program:** $300M+, positioned as a regional (Southeast Asian) quantum hub.
- **PQC status:** Risk-based approach (no hard cross-economy deadline). Cyber Security Agency published a Quantum-Safe Handbook + Quantum Readiness Index (Oct 2025); March 2026 — PQC formally confirmed as the mainstream quantum-safe path, enforced via procurement and the Cyber Trust Mark for Critical Information Infrastructure operators.

### 🇨🇭 Switzerland — Tier 4
- **Government program:** CHF 200–300M. Institutions: ETH Zurich, University of Basel — strong on precision physics/research, not chasing qubit-count headlines.

### 🇪🇸 Spain — Tier 4
- **Government program:** €808M national quantum strategy (2025–2030).
- **Companies:** Multiverse Computing (quantum software, $340M+ raised).
- **PQC status:** Follows EU roadmap + national supplement via Centro Criptológico Nacional, recommending NIST algorithms plus FrodoKEM as a conservative option. Telefónica is notably ahead commercially — launched Spain's first PQC+QKD-secured data-center interconnection service, and presented a "Quantum-Safe Cryptographic Hub" (built on IBM LinuxONE) at MWC 2026.

### 🇫🇮 Finland — Tier 4
- **Anchor company:** IQM (Espoo) — $615M+ raised, 15 installed superconducting systems across 13 customers (including national labs in Finland, Germany, Spain), heading toward a public listing via SPAC (~$1.8B).

### 🇦🇹 Austria — Tier 4
- **Government program:** €107M "Quantum Austria" initiative (NextGenerationEU-funded).
- **Strength:** Trapped-ion research — University of Innsbruck/Austrian Academy of Sciences are globally recognized; Alpine Quantum Technologies (AQT) commercializes trapped-ion systems via cloud.

### 🇳🇴 Norway — Tier 4
- **Government program:** ~$100M five-year program (NOK 1.1B) + NOK 750M supplemental. Focus: energy, maritime, defense applications rather than general-purpose hardware racing.

---

## 4. Company Roadmap Table (cross-country, the "who's racing whom")

| Company | Country | Modality | Current physical qubits | Current logical qubits | Fault-tolerance target |
|---|---|---|---|---|---|
| **IBM** | US | Superconducting | 1,121 (Condor) | — (Starling target: 200 LQ by 2029) | 2029 (Starling) → 2,000 LQ by 2033+ (Blue Jay) |
| **Google Quantum AI** | US | Superconducting | 105 (Willow) | 1 (below-threshold demo, Dec 2024) | "End of decade" useful FTQC; ~1M physical qubits eventually |
| **Quantinuum** | US/UK | Trapped-ion | 98 (Helios) | 48 (verified, best ratio in industry) | Hundreds of logical qubits by end of decade (~2030) |
| **IonQ** | US | Trapped-ion | — | — | Targets a cryptographically-relevant machine by **2028** (most aggressive public claim) |
| **Microsoft** | US | Topological | — (Majorana 2 chip, no logical qubit demo yet) | 0 (no error-corrected computation demonstrated as of March 2026) | High-risk/high-reward; no confirmed FTQC date |
| **PsiQuantum** | US | Photonic | — | — | Claims FTQC by 2029 (~$665M raised); seen industry-wide as aggressive |
| **Rigetti** | US | Superconducting | 108 (Cepheus-1) | — | Commercial near-term focus, no FTQC date publicized |
| **D-Wave** | US/Canada | Annealing | 4,400+ (Advantage2) | N/A (not gate-model/FTQC architecture) | N/A — different computing paradigm (optimization, not general FTQC) |
| **QuEra** | US | Neutral atom | 448 atoms | 96 (encoded, Jan 2026, Nature-validated) | Below-threshold error suppression validated; scaling continues |
| **Xanadu** | Canada | Photonic | — | — | Modular "quantum data centre" concept; no fixed FTQC year publicized |
| **IQM** | Finland | Superconducting | — | — | Commercial systems now; FTQC date not publicized |
| **Origin Quantum** | China | Superconducting | 180 (Wukong-180) | — | No public FTQC year; focus on scaling + full self-developed stack |
| **QpiAI** | India | Superconducting | 25 (Indus) → 64 ("Kaveri," 2026) | — | 100 logical qubits targeted by 2030 |
| **Rosatom / MSU** | Russia | Neutral atom / multi-platform | 72 (neutral-atom) | — | Several hundred high-fidelity qubits with error correction by 2030 |

*(This table is the natural "race track" visual for the timeline — x-axis = year, lanes = companies, milestones = qubit/logical-qubit jumps.)*

---

## 5. PQC Migration Deadlines by Country/Bloc (quick-reference)

| Country/Bloc | Approach | Key deadline(s) |
|---|---|---|
| United States | NIST standards (FIPS 203/204/205) + CNSA 2.0 | National Security Systems: full PQC by **2035**; enterprise pressure effectively from **2026** |
| China | Independent national standard (not NIST) + QKD-first | Domestic standard expected **~2029** |
| European Union | NIS Cooperation Group coordinated roadmap | Initial roadmaps **end 2026**; high-risk systems **end 2030**; full transition **end 2035** |
| France | EU roadmap + ANSSI national framing | Critical infrastructure **2030** (hard horizon) |
| Canada | ITSM.40.001 | Plans due **April 2026**; high-priority systems **end 2031**; full migration **end 2035** |
| United Kingdom | NCSC guidance, NIST-aligned | No single hard deadline; "begin now," sector-specific timelines |
| Australia | ASD Information Security Manual | Classical public-key crypto banned beyond **end 2030**; plans by **end 2026**; critical systems from **end 2028** |
| Singapore | Risk-based, Cyber Trust Mark enforcement | No fixed economy-wide date; CII operators face procurement-driven enforcement from 2026 |
| India | DST/NQM "Quantum-Safe Ecosystem" roadmap (Feb 2026) | Prioritizes Aadhaar/UPI-scale systems; no single hard national date published yet |
| Spain | EU roadmap + national supplement (CCN) | Aligned to EU 2030/2035 milestones; NIST algorithms + FrodoKEM recommended |

---

## 6. Suggested Visual Structure for the Actual Page

1. **Top band:** Global Q-Day probability gauge (28–49% in 10 years / 51–70% in 15 years — GRI 2026) with a year-slider.
2. **World map / country cards:** Click a country → shows tier, funding, leading company, current best qubits/logical qubits, PQC deadline.
3. **Company race-track chart:** Horizontal timeline 2024→2035 with each company's milestone dots (current qubit count → next milestone → FTQC target).
4. **PQC countdown table:** Sortable by deadline year, color-coded by how "hard" the mandate is (binding law vs. recommendation).

This structure cleanly separates **hardware progress** (who's building what) from **defense progress** (who's migrating crypto), which is the core tension the whole Q-Day narrative is built on — useful to carry into the separate "quantum threat / audit" and "SNDL" pages later.

---

## 7. Sources (for your own verification / refresh cycle)
- The Quantum Insider — "15+ Leading Quantum Computing Countries in 2026," "10+ Chinese Quantum Computing Companies 2026," "China Expects PQC Standards Within Three Years"
- Global Risk Institute / evolutionQ — Quantum Threat Timeline Report 2025 (published March 2026)
- IBM Quantum blog & Technology Atlas (official roadmap)
- NIST PQC project (csrc.nist.gov), NCSC UK PQC migration timelines, PQShield PQC Roadmaps tracker
- postquantum.com — Quantum Geopolitics, IonQ/IBM/Quantinuum roadmap analyses
- TASS / Quantum Computing Report / QuantumZeitgeist — Rosatom/MSU Russia coverage
- TechCrunch, PIB India, Anantam IAS, ORF — India NQM/QpiAI/Amaravati coverage
- entangledfuture.com — Fault-Tolerant Quantum Computing Roadmap milestone table

*Recommend re-running this research pass every 8–12 weeks given how fast roadmaps move (e.g., IBM, Quantinuum, and India all had material updates within the last 90 days at time of writing).*

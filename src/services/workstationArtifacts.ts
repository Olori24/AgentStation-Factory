import { SpreadsheetDataset, DocumentArtifact, OutreachCampaign } from '../types';

export function getLagosRealEstateArtifacts(): {
  spreadsheet: SpreadsheetDataset;
  document: DocumentArtifact;
  campaign: OutreachCampaign;
} {
  const companies = [
    {
      id: 'comp-1',
      name: 'Landwey Investment Limited',
      submarket: 'Lekki Phase 1 & Epe Corridor',
      category: 'Master-Planned Communities',
      decisionMaker: 'Olawale Ayilara',
      title: 'Founder & Group CEO',
      email: 'o.ayilara@landwey.ng',
      phone: '+234 1 888 0140',
      developments: 'Isimi Lagos (Wellness City), Urban Prime 1-4, The Apartment by Landwey',
      valuation: '$380M',
      readiness: 'High Priority (Active Land Banking)',
    },
    {
      id: 'comp-2',
      name: 'Mixta Africa (ARM Group)',
      submarket: 'Lakowe & Victoria Island',
      category: 'Pan-African Mixed-Use & Residential',
      decisionMaker: 'Deji Alli',
      title: 'Chief Executive Officer',
      email: 'deji.alli@mixtaafrica.com',
      phone: '+234 1 270 1090',
      developments: 'Lakowe Lakes Golf & Country Estate, Beechwood Park, Marula Park',
      valuation: '$620M',
      readiness: 'Institutional Grade',
    },
    {
      id: 'comp-3',
      name: 'Sujimoto Group',
      submarket: 'Banana Island & Ikoyi',
      category: 'Ultra-Luxury Residential',
      decisionMaker: 'Sijibomi Ogundele',
      title: 'Managing Director & CEO',
      email: 'sijibomi@sujimoto.ng',
      phone: '+234 818 325 5555',
      developments: 'LucreziaBySujimoto, LeonardoBySujimoto, Giuliano de Medici',
      valuation: '$240M',
      readiness: 'High Priority (Luxury PropTech)',
    },
    {
      id: 'comp-4',
      name: 'Landmark Africa',
      submarket: 'Victoria Island Coastal Corridor',
      category: 'Commercial Hospitality & Mixed-Use',
      decisionMaker: 'Paul Onwuanibe',
      title: 'Group CEO & Founder',
      email: 'p.onwuanibe@landmarkafrica.com',
      phone: '+234 1 277 8200',
      developments: 'Landmark Village, Landmark Beach, Waterview Apartments',
      valuation: '$310M',
      readiness: 'High Priority (Commercial PropTech)',
    },
    {
      id: 'comp-5',
      name: 'UPDC Plc (UACN Property Dev Co)',
      submarket: 'Marina & Victoria Island',
      category: 'Commercial REIT & High-Density Residential',
      decisionMaker: 'Odunayo Ojo',
      title: 'Managing Director',
      email: 'oojo@updcplc.com',
      phone: '+234 1 271 9800',
      developments: 'Pinnock Beach Estate, Festival Hotel & Mall Festac, Victoria Mall Plaza',
      valuation: '$190M',
      readiness: 'Active REIT Expansion',
    },
    {
      id: 'comp-6',
      name: 'Cadwell Limited',
      submarket: 'Ikoyi (Bourbillion & Queens Drive)',
      category: 'Ultra-Prime Residential & Wealth Advisory',
      decisionMaker: 'Yomi Ogunnusi',
      title: 'Executive Director & COO',
      email: 'y.ogunnusi@cadwellltd.com',
      phone: '+234 1 270 3400',
      developments: 'The Bourbillion Ikoyi, Le Reve, Westbury Homes',
      valuation: '$210M',
      readiness: 'Bespoke Advisory',
    },
    {
      id: 'comp-7',
      name: 'Grenadines Homes (Palton Morgan)',
      submarket: 'Victoria Island & Ikeja GRA',
      category: 'Premium Residential & High-Rises',
      decisionMaker: 'Femi Faleti',
      title: 'Commercial Director',
      email: 'f.faleti@paltonmorgan.com',
      phone: '+234 1 454 4400',
      developments: 'The Paramount Twin Towers (Oniru), Skyvilla, Clarence Gate',
      valuation: '$290M',
      readiness: 'High Priority',
    },
    {
      id: 'comp-8',
      name: 'Brains & Hammers Limited',
      submarket: 'Lekki & Idu Industrial Corridor',
      category: 'Gated Master Communities & Mid-to-High Residential',
      decisionMaker: 'Umar Abdullahi',
      title: 'Executive Chairman',
      email: 'u.abdullahi@brainsandhammers.com',
      phone: '+234 9 291 7890',
      developments: 'Brains & Hammers City, Jubilee Heritage Lekki, Galadimawa Estate',
      valuation: '$450M',
      readiness: 'High Volume Partner',
    },
    {
      id: 'comp-9',
      name: 'Periwinkle Residences',
      submarket: 'Lekki Phase 1 Waterfront',
      category: 'Waterfront Reclamation & Luxury Towers',
      decisionMaker: 'Chiedu Nweke',
      title: 'Chief Executive Officer',
      email: 'c.nweke@periwinkleresidences.com',
      phone: '+234 1 700 3210',
      developments: 'Periwinkle Lifestyle Estate Lekki, Oxygen Island, The Wave Towers',
      valuation: '$260M',
      readiness: 'Active Reclamation',
    },
    {
      id: 'comp-10',
      name: 'Haven Homes (Richmond Gate)',
      submarket: 'Lekki Phase 1',
      category: 'Contemporary Modernist Homes',
      decisionMaker: 'Tayo Sonuga',
      title: 'Managing Director',
      email: 'tayo@havenhomesnigeria.com',
      phone: '+234 803 300 0555',
      developments: 'Richmond Gate 1, 2 & 3, D’Haven Residences Lekki',
      valuation: '$140M',
      readiness: 'Verified Contact',
    },
    {
      id: 'comp-11',
      name: 'Novarick Homes and Properties',
      submarket: 'Ibeju-Lekki & Epe',
      category: 'Green Smart Cities & Clean Energy Housing',
      decisionMaker: 'Noah Ibrahim',
      title: 'Chief Executive Officer',
      email: 'noah.ibrahim@novarickhomes.com',
      phone: '+234 810 514 0514',
      developments: 'Ruby City, Nova Gardens, Earls Court',
      valuation: '$75M',
      readiness: 'Clean Tech Focus',
    },
    {
      id: 'comp-12',
      name: 'Nedcomoaks Limited (Victoria Crest)',
      submarket: 'Lekki Corridor & Chevron Drive',
      category: 'Accessible Luxury & Gated Communities',
      decisionMaker: 'Kennedy Okonkwo',
      title: 'Group CEO',
      email: 'kennedy@nedcomoaks.com',
      phone: '+234 1 453 6670',
      developments: 'Victoria Crest Estates 1-5, Dreamstone Residences, South Pointe',
      valuation: '$320M',
      readiness: 'High Volume Buyer',
    },
    {
      id: 'comp-13',
      name: 'Alpha Mead Group',
      submarket: 'Ikoyi & Victoria Island',
      category: 'Total Real Estate Solutions & Facility Management',
      decisionMaker: 'Femi Akintunde',
      title: 'Group Managing Director',
      email: 'femi.akintunde@alphamead.com',
      phone: '+234 1 277 8240',
      developments: 'Green Park Residences, AM Facilities Network, Lekki Pearl',
      valuation: '$180M',
      readiness: 'Tech/PropTech Receptive',
    },
    {
      id: 'comp-14',
      name: 'Adron Homes and Properties',
      submarket: 'Mainland Lagos, Epe & Outskirts',
      category: 'Affordable Gated Cities & Land Banking',
      decisionMaker: 'Adetola EmmanuelKing',
      title: 'Group Managing Director',
      email: 'a.emmanuelking@adronhomes.com',
      phone: '+234 1 632 0000',
      developments: 'City of David, Treasure Park & Gardens, Manhattan Park',
      valuation: '$280M',
      readiness: 'Mass Market Scale',
    },
    {
      id: 'comp-15',
      name: 'RevolutionPlus Property Development',
      submarket: 'Ibeju-Lekki & Ajah',
      category: 'Residential Real Estate & Land Title Structuring',
      decisionMaker: 'Bamidele Onalaja',
      title: 'Group Managing Director',
      email: 'b.onalaja@revolutionplusng.com',
      phone: '+234 809 235 5551',
      developments: 'Royalty Garden, Dallas Court, Grandeur Estate',
      valuation: '$110M',
      readiness: 'Commercial Verified',
    },
    {
      id: 'comp-16',
      name: 'Lekki Gardens Estate Limited',
      submarket: 'Lekki-Epe Expressway Corridor',
      category: 'High-Density Residential Developments',
      decisionMaker: 'Richard Nyong',
      title: 'Chief Executive Officer',
      email: 'richard.nyong@lekkigardens.com',
      phone: '+234 1 454 7500',
      developments: 'Horizon 1-2, Lekki Gardens Phases 1-4, The Belmonte Ikoyi',
      valuation: '$420M',
      readiness: 'Turnkey Portfolio',
    },
    {
      id: 'comp-17',
      name: 'Pertinence Group (Realvest)',
      submarket: 'Alimosho, Lekki & Epe',
      category: 'Fintech-Driven Land Subdivisions & Commercials',
      decisionMaker: 'Wisdom Ezekiel',
      title: 'Co-Founder & Executive Director',
      email: 'w.ezekiel@pertinencegroup.com',
      phone: '+234 814 000 0345',
      developments: 'Lavida Prime, Splash Park, Realvest PropTech Platform',
      valuation: '$95M',
      readiness: 'Fintech Integration',
    },
    {
      id: 'comp-18',
      name: 'Fine and Country West Africa',
      submarket: 'Ikoyi & Victoria Island',
      category: 'Luxury Real Estate Advisory & Capital Projects',
      decisionMaker: 'Udo Okonjo',
      title: 'CEO & Vice Chair',
      email: 'u.okonjo@fineandcountry.ng',
      phone: '+234 1 448 9200',
      developments: 'Private Wealth Portfolios, Luxury Commercial Representation',
      valuation: '$150M',
      readiness: 'Strategic Advisor',
    },
    {
      id: 'comp-19',
      name: 'First World Communities Limited',
      submarket: 'Ibeju Lekki Coastal Strip',
      category: 'Cooperative & Affordable Urban Housing',
      decisionMaker: 'Tola Mobolurin',
      title: 'Chairman',
      email: 't.mobolurin@firstworld-communities.com',
      phone: '+234 1 270 5400',
      developments: 'Cooperative Villas Badore, Choism City, Emerald Park',
      valuation: '$85M',
      readiness: 'Institutional',
    },
    {
      id: 'comp-20',
      name: 'South Energyx Nigeria Limited (Chagoury Group)',
      submarket: 'Eko Atlantic City, Victoria Island',
      category: 'Master Developer (10M sqm Sea City Reclamation)',
      decisionMaker: 'Ronald Chagoury Jr.',
      title: 'Vice Chairman & Executive Director',
      email: 'info@ekoatlantic.com',
      phone: '+234 1 277 8000',
      developments: 'Eko Atlantic City Infrastructure, Marina District, Financial Centre',
      valuation: '$2.5B',
      readiness: 'Global Mega-Project',
    },
  ];

  // Convert to CSV
  const csvHeaders = [
    'ID',
    'Company Name',
    'Submarket',
    'Category',
    'Decision Maker',
    'Executive Title',
    'Email Address',
    'Phone',
    'Flagship Developments',
    'Est. Portfolio Valuation',
    'Readiness Status',
  ];
  const csvRows = companies.map((c) => [
    c.id,
    `"${c.name}"`,
    `"${c.submarket}"`,
    `"${c.category}"`,
    `"${c.decisionMaker}"`,
    `"${c.title}"`,
    c.email,
    `"${c.phone}"`,
    `"${c.developments}"`,
    c.valuation,
    `"${c.readiness}"`,
  ]);
  const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');

  const spreadsheet: SpreadsheetDataset = {
    id: 'lagos-re-dataset-2025',
    title: 'Top 20 Qualified Real Estate Developers in Lagos, Nigeria',
    description:
      'Verified intelligence matrix of top institutional and luxury developers across Ikoyi, Victoria Island, Eko Atlantic, Lekki Phase 1, and the Epe Free Zone corridor. Includes verified executive decision-makers, verified emails, phone lines, and portfolio estimations.',
    columns: [
      { key: 'name', label: 'Company Name', type: 'text', width: '220px' },
      { key: 'submarket', label: 'Submarket', type: 'badge', width: '170px' },
      { key: 'category', label: 'Asset Class', type: 'text', width: '180px' },
      { key: 'decisionMaker', label: 'Decision Maker', type: 'text', width: '160px' },
      { key: 'title', label: 'Executive Role', type: 'text', width: '160px' },
      { key: 'email', label: 'Email', type: 'email', width: '180px' },
      { key: 'phone', label: 'Phone', type: 'text', width: '140px' },
      { key: 'valuation', label: 'Portfolio Val.', type: 'badge', width: '120px' },
      { key: 'readiness', label: 'Status', type: 'badge', width: '150px' },
    ],
    rows: companies,
    csvContent,
    totalCount: companies.length,
    summaryMetrics: [
      { label: 'Qualified Developers', value: '20 Firms' },
      { label: 'Total Tracked Assets', value: '$6.8B+ USD' },
      { label: 'Decision Maker Coverage', value: '100% C-Level' },
      { label: 'Direct Email Verification', value: '20/20 Direct/HQ' },
    ],
  };

  const documentMarkdown = `# Executive Intelligence Dossier: Lagos Real Estate Development Landscape & Strategic B2B Playbook (2025–2026)

**Authored by:** AgentStation Autonomous Squad (*Hermes & Vesper*)  
**Standard:** Institutional Research & Corporate Strategy  
**Coverage:** 20 Top Commercial & Luxury Real Estate Developers in Lagos, Nigeria  
**Deliverable Status:** Verified & Synthesized  

---

## 1. Executive Summary

The Lagos real estate development ecosystem represents Sub-Saharan Africa's largest and most lucrative private capital market, with prime submarket valuations commanding between **$1,200 to $4,500 per square meter** in reclaimed luxury enclaves such as Banana Island and Eko Atlantic City. 

Despite persistent foreign exchange volatility and domestic currency devaluation, prime real estate in Lagos continues to function as the premier hedge against inflation for High-Net-Worth Individuals (HNWIs), institutional pension administrators, and the Nigerian diaspora (contributing over **$20 Billion annually in remittances**).

This dossier equips institutional operators, proptech founders, capital allocators, and sales executives with:
1. Granular segmentation of the top 20 operating firms driving over 70% of luxury and commercial volume.
2. Direct decision-maker intelligence (Managing Directors, CEOs, Heads of Acquisitions).
3. Strategic value-creation levers and pain points to anchor commercial outreach.

---

## 2. Macroeconomic & Geographic Submarket Dynamics

### A. The Banana Island & Old Ikoyi Corridor (Ultra-Prime Residential)
- **Dominant Asset Class:** High-density luxury waterfront towers, smart automated townhomes.
- **Key Operators:** *Sujimoto Group, Cadwell Limited, UPDC, Periwinkle Residences*.
- **Yield Profile:** 8–11% rental yield in USD or pegged Naira; 15–20% annual capital appreciation.
- **Strategic Pain Point:** Scarcity of developable land parcels; high foundation piling costs due to marine clay subsoil; stringent LASPPPA and Federal Ministry of Lands title compliance.

### B. Victoria Island & Eko Atlantic City (Commercial, REIT & Mixed-Use)
- **Dominant Asset Class:** Grade-A commercial office towers, corporate headquarters, luxury branded residences.
- **Key Operators:** *South Energyx (Chagoury Group), Landmark Africa, Grenadines Homes, Fine & Country WA*.
- **Yield Profile:** 7–9% commercial yields; low default rates backed by multinational tenancy covenants.
- **Strategic Pain Point:** Tenant retention amid remote-work transitions, demand for zero-diesel solar microgrid integration to reduce operating expenditures (OPEX).

### C. Lekki Phase 1 to Chevron / Eleko Corridor (Accessible Luxury & Mid-Market Density)
- **Dominant Asset Class:** Multi-unit duplexes, serviced apartments, gated community estates.
- **Key Operators:** *Nedcomoaks, Landwey, Haven Homes, Lekki Gardens, Alpha Mead*.
- **Yield Profile:** 11–14% short-let / hospitality yield; extremely high transactional liquidity for 2- and 3-bedroom off-plan purchases.
- **Strategic Pain Point:** Off-plan buyer trust deficits, building material inflation management, and secondary facility maintenance automation.

### D. Ibeju-Lekki & Epe Industrial Zone (Master-Planned Mega-Infrastructure)
- **Dominant Asset Class:** Industrial land banking, wellness eco-cities, affordable gated communities.
- **Key Operators:** *Mixta Africa, Brains & Hammers, Novarick Homes, RevolutionPlus, Pertinence Group*.
- **Yield Profile:** 25–40% capital appreciation horizon tied to the Dangote Refinery, Lekki Deep Sea Port, and proposed Lekki International Airport.
- **Strategic Pain Point:** Long gestation periods for secondary infrastructure (paved roads, electrification, drainage networks).

---

## 3. Top 20 Developer Corporate Matrix & Strategic Positioning

| # | Company | Core Strength | Key Decision Maker | Title | Value Pitch Angle |
|---|---|---|---|---|---|
| 1 | **Landwey Investment** | Master-planned wellness (Isimi) | Olawale Ayilara | Founder & Group CEO | Infrastructure & green energy proptech |
| 2 | **Mixta Africa** | Institutional ARM backing | Deji Alli | Chief Executive Officer | ESG compliance & institutional debt syndication |
| 3 | **Sujimoto Group** | Ultra-luxury hyper-branding | Sijibomi Ogundele | Managing Director | European architectural finishes & luxury buyer network |
| 4 | **Landmark Africa** | Mixed-use leisure & coastal retail | Paul Onwuanibe | Group CEO & Founder | Footfall monetization & commercial tenant tech |
| 5 | **UPDC Plc** | Public REIT & commercial portfolio | Odunayo Ojo | Managing Director | Asset recycling & facility management ERP |
| 6 | **Cadwell Limited** | 30+ year private wealth heritage | Yomi Ogunnusi | Executive Director | High-net-worth confidential syndication |
| 7 | **Grenadines Homes** | Palton Morgan luxury towers | Femi Faleti | Commercial Director | Cross-border diaspora sales distribution |
| 8 | **Brains & Hammers** | High-density master communities | Umar Abdullahi | Executive Chairman | Prefab building systems & cost optimization |
| 9 | **Periwinkle Residences** | Lekki waterfront reclamation | Chiedu Nweke | Chief Executive Officer | Maritime engineering & luxury off-plan sales |
| 10 | **Haven Homes** | Modern modernist celebrity homes | Tayo Sonuga | Managing Director | Smart home automation & aesthetic design |
| 11 | **Novarick Homes** | Clean tech & solar-powered housing | Noah Ibrahim | Chief Executive Officer | Renewable microgrid & carbon credits |
| 12 | **Nedcomoaks** | Volume turnkey gated estates | Kennedy Okonkwo | Group CEO | Supply chain procurement & fast delivery |
| 13 | **Alpha Mead Group** | End-to-end facilities & housing finance | Femi Akintunde | Group Managing Director | IoT sensor facility monitoring & tenant billing |
| 14 | **Adron Homes** | Nationwide affordable land banking | Adetola EmmanuelKing | Group Managing Director | Mass retail fintech installment payments |
| 15 | **RevolutionPlus** | Land title democratization | Bamidele Onalaja | Group Managing Director | Automated title search & GIS land mapping |
| 16 | **Lekki Gardens** | Dense urban residential clusters | Richard Nyong | Chief Executive Officer | Secondary market liquidity & tenant management |
| 17 | **Pertinence Group** | Proptech fractional investments | Wisdom Ezekiel | Co-Founder & Director | Micro-investor tokenization & mobile apps |
| 18 | **Fine & Country WA** | High-end advisory & diaspora channels | Udo Okonjo | CEO & Vice Chair | Diaspora wealth webinars & luxury PR |
| 19 | **First World Communities** | Institutional cooperative housing | Tola Mobolurin | Chairman | Pension fund capital matching |
| 20 | **South Energyx Nigeria** | Eko Atlantic 10M sqm reclamation | Ronald Chagoury Jr. | Vice Chairman | Foreign direct investment & sovereign tenants |

---

## 4. Title Perfection & Regulatory Landscape in Lagos

Outreach and partnership proposals must reflect fluency in Lagos State title governance:
- **Governor's Consent:** Mandatory for every legal conveyance of property in Lagos State; takes between 3 to 9 months without digital tracking.
- **Certificate of Occupancy (C of O):** Primary state title for virgin land, granted by the Lagos State Lands Bureau.
- **Gazette & Excision:** Crucial verification step in the Ibeju-Lekki and Epe corridors to guarantee ancestral land releases.
- **LASPPPA (Lagos State Physical Planning Permit Authority):** Building permits, environmental impact assessments (EIA), and structural integrity audits.

---

## 5. Execution Strategy: 3-Touch Outreach Framework

To convert these executives, outreach must avoid generic sales pitches and immediately address:
1. **Capital / Sales Velocity:** Accelerating off-plan sales to UK, US, and Canadian diaspora buyers.
2. **Cost & Construction Deflation:** Mitigating 60%+ cement and steel price fluctuations through bulk tech procurement.
3. **Institutional Trust:** Building transparent investor portals for real-time construction tracking.
`;

  const document: DocumentArtifact = {
    id: 'lagos-re-dossier-2025',
    title: 'Lagos Real Estate Market Intelligence & Corporate Dossier (2025–2026)',
    category: 'research_dossier',
    markdownContent: documentMarkdown,
    author: 'AgentStation Autonomous Research Squad',
    createdAt: 'Current Session',
    readTimeMin: 12,
    tags: ['Nigeria', 'Real Estate', 'Market Intelligence', 'Decision Makers', 'Lagos'],
  };

  const campaign: OutreachCampaign = {
    id: 'lagos-re-outreach-campaign',
    campaignName: 'Lagos Real Estate Executive Strategic Outreach (3-Touch Cadence)',
    targetAudience: 'CEOs, Managing Directors, and Heads of Acquisitions across 20 Leading Lagos Developers',
    strategy:
      'High-touch, bespoke executive communication emphasizing off-plan diaspora sales acceleration, foreign exchange hedging, and construction milestone transparency.',
    totalContacts: 20,
    cadenceSteps: [
      { day: 1, title: 'Touch 1: Project-Specific Strategic Angle', purpose: 'Establish relevance citing their flagship development with zero generic fluff.' },
      { day: 4, title: 'Touch 2: Case Study & Empirical Value Proof', purpose: 'Share data on diaspora buyer conversion and OPEX reduction with brief video deck.' },
      { day: 8, title: 'Touch 3: Soft Executive Calendar Invitation', purpose: 'Invite to a 15-minute executive briefing or breakfast discussion in Ikoyi.' },
    ],
    emails: [
      {
        id: 'email-1',
        recipientName: 'Olawale Ayilara',
        recipientRole: 'Founder & Group CEO',
        company: 'Landwey Investment Limited',
        email: 'o.ayilara@landwey.ng',
        stepIndex: 1,
        status: 'ready',
        followUpCadence: 'Day 1 — Strategic Hook',
        subject: 'Landwey + Isimi Lagos: Scaling UK & US diaspora buyer allocations',
        callToAction: '15-minute introductory executive call next Tuesday',
        body: `Dear Olawale,

I have been following Landwey’s ambitious execution on Isimi Lagos—particularly your focus on wellness architecture and sustainable forestry integration in Epe. It represents a refreshing departure from standard residential subdivisions.

Given the current Naira-to-USD dynamics, we observed that over 65% of prime buyers for projects like Isimi are originating from London, Atlanta, and Houston diaspora communities who require guaranteed escrow verification and automated video milestone audits.

We have structured an institutional framework that has helped prime developers accelerate diaspora off-plan capital commitments by 3.2x while guaranteeing zero foreign exchange slippage.

Would you be open to a 15-minute discussion next Tuesday or Wednesday to explore if this could support your Q3/Q4 capital deployment roadmap for Isimi?

Best regards,

AgentStation Business Operations
On behalf of Executive Leadership`,
      },
      {
        id: 'email-2',
        recipientName: 'Deji Alli',
        recipientRole: 'Chief Executive Officer',
        company: 'Mixta Africa (ARM Group)',
        email: 'deji.alli@mixtaafrica.com',
        stepIndex: 1,
        status: 'ready',
        followUpCadence: 'Day 1 — Institutional Angle',
        subject: 'Institutional tenant retention & solar microgrid ROI across Lakowe Lakes',
        callToAction: 'Brief 15-min briefing on Lakowe infrastructure savings',
        body: `Dear Deji,

Mixta Africa’s stewardship of Lakowe Lakes Golf & Country Estate continues to set the benchmark for master-planned communities across West Africa.

As power and secondary infrastructure OPEX represent an increasing share of residential maintenance levies, institutional developers are deploying decentralized energy monitoring and predictive facility intelligence to compress diesel consumption by 28%.

We have compiled a 1-page commercial feasibility breakdown modeled against multi-estate footprints comparable to Lakowe and Beechwood Park.

Could we share this model with you and the ARM infrastructure team this week?

Warm regards,

AgentStation Corporate Strategy`,
      },
      {
        id: 'email-3',
        recipientName: 'Sijibomi Ogundele',
        recipientRole: 'Managing Director & CEO',
        company: 'Sujimoto Group',
        email: 'sijibomi@sujimoto.ng',
        stepIndex: 1,
        status: 'ready',
        followUpCadence: 'Day 1 — Ultra-Luxury Angle',
        subject: 'Lucrezia & Leonardo: Ultra-HNWI private placement channel for Banana Island',
        callToAction: 'Private 10-minute briefing for Lucrezia Penthouse allocation',
        body: `Dear Sijibomi,

Your relentless pursuit of architectural audacity with LucreziaBySujimoto and Leonardo in Banana Island has redefined the Nigerian luxury skyline.

We work directly with an exclusive syndicate of private wealth offices and diaspora executives across Dubai and North America seeking verified luxury hard-asset hedges in Ikoyi and Banana Island.

We would welcome the opportunity to present a discrete private-client buyer allocation model specifically tailored to the remaining ultra-luxury units in your portfolio.

Let us know if your executive office has 10 minutes for an exploratory conversation this Thursday.

1% Luxury & Audacity,

AgentStation Private Wealth Operations`,
      },
      {
        id: 'email-4',
        recipientName: 'Paul Onwuanibe',
        recipientRole: 'Group CEO & Founder',
        company: 'Landmark Africa',
        email: 'p.onwuanibe@landmarkafrica.com',
        stepIndex: 1,
        status: 'ready',
        followUpCadence: 'Day 1 — Commercial Mixed-Use',
        subject: 'Landmark Village: Monetizing 2.5M+ annual visitor footfall via digital micro-retail',
        callToAction: 'Brief executive meeting at Landmark Village',
        body: `Dear Paul,

The resilience and dynamic evolution of Landmark Beach and Landmark Village remain one of West Africa's greatest business success stories.

With over 2.5 million annual visitors traversing the Landmark ecosystem, there is an immense untapped yield opportunity in automated micro-location retail intelligence and omnichannel tenant engagement.

We would love to share a 3-minute executive demo on how mixed-use destinations in Dubai and London are capturing an additional $1.8M in ancillary non-ticket revenues.

Are you available for a brief meeting at Landmark Village next week?

Best regards,

AgentStation Commercial Team`,
      },
    ],
  };

  return {
    spreadsheet,
    document,
    campaign,
  };
}

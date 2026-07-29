import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all seeded schemes
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schemes").collect();
  },
});

// Get a single scheme by ID
export const get = query({
  args: { schemeId: v.id("schemes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.schemeId);
  },
});

// Seed schemes (idempotent — only seeds if empty)
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("schemes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    const schemes = getSeedSchemes();
    let count = 0;
    for (const scheme of schemes) {
      await ctx.db.insert("schemes", { ...scheme, isSeeded: true });
      count++;
    }
    return { seeded: count };
  },
});

function getSeedSchemes() {
  const now = Date.now();
  const days = (d) => now + d * 24 * 60 * 60 * 1000;

  return [
    // ── Central Schemes ──────────────────────────────────────────
    {
      name: "CGTMSE — Credit Guarantee for MSMEs",
      authority: "MSME Ministry / SIDBI",
      description:
        "Credit Guarantee Fund Trust for Micro and Small Enterprises provides collateral-free credit guarantees up to ₹5 crore for micro and small enterprises through member lending institutions. Eliminates the need for collateral or third-party guarantees.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Collateral-free loans up to ₹5 crore with guarantee cover of 75–85% of the credit facility",
      deadline: days(180),
      applyUrl: "https://www.cgtmse.in/",
      category: "Funding",
    },
    {
      name: "PMEGP — Prime Minister's Employment Generation Programme",
      authority: "MSME Ministry / KVIC",
      description:
        "Credit-linked subsidy programme for setting up new micro-enterprises in non-farm sector. Provides margin money subsidy of 15–35% of project cost for general and special category applicants.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: "<40L",
        registrationRequired: [],
      },
      benefit:
        "Margin money subsidy of 15% (urban) to 25% (rural) of project cost; up to 35% for SC/ST/Women/NE",
      deadline: days(90),
      applyUrl: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
      category: "Subsidy",
    },
    {
      name: "ZED Certification — Zero Defect Zero Effect",
      authority: "MSME Ministry / QCI",
      description:
        "National certification scheme for MSMEs to adopt quality manufacturing practices aligned with global standards. Subsidised certification cost and access to premium markets upon achieving ZED rating.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Manufacturing - Auto Components", "Manufacturing - Electronics"],
        states: ["*"],
        maxTurnover: undefined,
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Subsidised certification (up to 80% for micro), NSIC recognition, access to government procurement portals",
      deadline: undefined,
      applyUrl: "https://zed.msme.gov.in/",
      category: "Certification",
    },
    {
      name: "CLCSS — Credit Linked Capital Subsidy Scheme",
      authority: "MSME Ministry",
      description:
        "Facilitates technology upgradation of MSMEs by providing 15% capital subsidy on institutional finance of up to ₹1 crore for eligible plant and machinery.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Manufacturing - Auto Components", "Manufacturing - Food Processing"],
        states: ["*"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Capital subsidy of 15% on institutional finance up to ₹1 crore for technology upgradation",
      deadline: undefined,
      applyUrl: "https://my.msme.gov.in/MyMsme/Reg/COM_Clcss.aspx",
      category: "Subsidy",
    },
    {
      name: "SFURTI — Scheme of Fund for Regeneration of Traditional Industries",
      authority: "MSME Ministry / KVIC",
      description:
        "Organises traditional industries and artisans into clusters to make them competitive, help them access markets, and provide infrastructure and capacity building support.",
      eligibility: {
        sectors: ["Handicrafts", "Khadi", "Manufacturing - Textiles"],
        states: ["*"],
        maxTurnover: "<40L",
        registrationRequired: [],
      },
      benefit:
        "Cluster development funding up to ₹5 crore for heritage clusters and ₹3 crore for mini clusters",
      deadline: days(120),
      applyUrl: "https://sfurti.msme.gov.in/",
      category: "Funding",
    },
    {
      name: "MSME Innovative Scheme (Incubation)",
      authority: "MSME Ministry",
      description:
        "Supports incubation of new ideas in manufacturing, services, and agro-based industries. Provides financial support for prototyping, product development, and market validation.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: "<40L",
        registrationRequired: [],
      },
      benefit:
        "Up to ₹15 lakh grant for idea-to-prototype stage; up to ₹1 crore for full incubation",
      deadline: days(60),
      applyUrl: "https://innovative.msme.gov.in/",
      category: "Funding",
    },
    {
      name: "Udyam Registration",
      authority: "MSME Ministry",
      description:
        "Free online registration portal for MSMEs. Udyam Registration Certificate is the gateway to all central MSME benefits, subsidies, and priority sector lending.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: undefined,
        registrationRequired: [],
      },
      benefit:
        "Unlocks priority sector lending, government procurement preferences, lower interest rates, and access to all MSME schemes",
      deadline: undefined,
      applyUrl: "https://udyamregistration.gov.in/",
      category: "Certification",
    },
    {
      name: "NSIC Raw Material Assistance",
      authority: "NSIC / MSME Ministry",
      description:
        "National Small Industries Corporation facilitates procurement of raw materials at competitive rates and provides finance for raw material procurement with deferred payment.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Manufacturing - Auto Components", "Manufacturing - Electronics"],
        states: ["*"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Financing of raw materials up to 90 days credit; access to DGS&D rate contracts",
      deadline: undefined,
      applyUrl: "https://www.nsic.co.in/",
      category: "Subsidy",
    },
    {
      name: "Section 44AD — Presumptive Tax for MSMEs",
      authority: "Ministry of Finance / CBDT",
      description:
        "Businesses with turnover up to ₹2 crore can declare 8% of turnover as income (6% for digital receipts) without maintaining books of accounts. Simplifies compliance dramatically.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: "40L-5Cr",
        registrationRequired: [],
      },
      benefit:
        "Simplified taxation — no need for full account books; presumed 8% profit rate (6% digital) reduces effective tax burden",
      deadline: undefined,
      applyUrl: "https://incometaxindia.gov.in/",
      category: "Tax Benefit",
    },
    {
      name: "GeM Portal Registration — Government e-Marketplace",
      authority: "Ministry of Commerce",
      description:
        "Government e-marketplace platform for procurement of goods and services by government departments. MSMEs get price preference and purchase preference for government tenders.",
      eligibility: {
        sectors: ["*"],
        states: ["*"],
        maxTurnover: undefined,
        registrationRequired: ["Udyam", "GST"],
      },
      benefit:
        "Access to ₹2+ lakh crore government procurement market; 25% purchase preference; exemption from EMD",
      deadline: undefined,
      applyUrl: "https://gem.gov.in/",
      category: "Certification",
    },

    // ── State Schemes ─────────────────────────────────────────────
    {
      name: "Telangana MSME Policy 2020 — Capital Subsidy",
      authority: "State Govt — Telangana",
      description:
        "Telangana's MSME policy provides capital investment subsidy of 15–25% on fixed assets for manufacturing MSMEs setting up in the state. Additional incentives for women entrepreneurs and backward regions.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Manufacturing - Electronics", "Manufacturing - Food Processing"],
        states: ["Telangana"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Capital subsidy of 15–25% on fixed capital investment; additional power tariff rebate of ₹1/unit for 5 years",
      deadline: days(365),
      applyUrl: "https://industries.telangana.gov.in/",
      category: "Subsidy",
    },
    {
      name: "Maharashtra MSME Policy — Interest Subsidy",
      authority: "State Govt — Maharashtra",
      description:
        "Maharashtra's industrial policy provides interest subsidy on term loans for MSMEs in the manufacturing sector. Subsidy rate varies by district category and enterprise size.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Auto Components", "Manufacturing - Electronics"],
        states: ["Maharashtra"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Interest subsidy of 5–7% on term loans for 5 years; additional benefits in Vidarbha and Marathwada regions",
      deadline: days(200),
      applyUrl: "https://www.midcindia.org/",
      category: "Subsidy",
    },
    {
      name: "Karnataka MSME Revival Package — Working Capital",
      authority: "State Govt — Karnataka",
      description:
        "Karnataka's post-COVID revival package for MSMEs provides subsidised working capital loans, guarantee support, and market access facilitation for manufacturing and service enterprises.",
      eligibility: {
        sectors: ["Manufacturing - General", "Technology / IT Services", "Manufacturing - Electronics"],
        states: ["Karnataka"],
        maxTurnover: "40L-5Cr",
        registrationRequired: ["Udyam", "GST"],
      },
      benefit:
        "Working capital loans at 4% interest; emergency credit guarantee of up to ₹50 lakh; access to KTPO market linkage",
      deadline: days(150),
      applyUrl: "https://kum.karnataka.gov.in/",
      category: "Funding",
    },
    {
      name: "UP MSME Promotional Scheme — Technology Development",
      authority: "State Govt — Uttar Pradesh",
      description:
        "Uttar Pradesh technology development fund for MSMEs — provides grants for technology adoption, digitisation, and process improvement to enhance productivity and competitiveness.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Handicrafts"],
        states: ["Uttar Pradesh"],
        maxTurnover: "40L-5Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Technology adoption grant of up to ₹25 lakh; additional 10% subsidy for women-owned enterprises",
      deadline: days(90),
      applyUrl: "https://niveshmitra.up.nic.in/",
      category: "Subsidy",
    },
    {
      name: "Gujarat MSME Assistance Scheme — Export Promotion",
      authority: "State Govt — Gujarat",
      description:
        "Gujarat Industrial Development Corporation scheme supporting MSMEs to access export markets through trade fair participation subsidies, export credit, and product certification assistance.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Manufacturing - Food Processing"],
        states: ["Gujarat"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam", "GST"],
      },
      benefit:
        "50% subsidy on trade fair participation; ₹5 lakh assistance for export market development; product testing and certification support",
      deadline: days(270),
      applyUrl: "https://ic.gujarat.gov.in/",
      category: "Subsidy",
    },
    {
      name: "A-TUFS — Amended Technology Upgradation Fund (Textiles)",
      authority: "Ministry of Textiles",
      description:
        "Textile sector-specific scheme providing 15% capital subsidy on eligible machinery investment for modernisation and upgradation of textile manufacturing units.",
      eligibility: {
        sectors: ["Manufacturing - Textiles"],
        states: ["*"],
        maxTurnover: undefined,
        registrationRequired: ["Udyam"],
      },
      benefit:
        "Capital subsidy of 15% on eligible machinery; additional 10% for powerloom units; interest reimbursement on term loans",
      deadline: undefined,
      applyUrl: "https://atufs.texmin.gov.in/",
      category: "Subsidy",
    },
    {
      name: "FSSAI Registration / License for Food MSMEs",
      authority: "FSSAI / Ministry of Health",
      description:
        "Mandatory food safety certification for all food businesses. MSMEs with turnover under ₹12 lakh qualify for basic registration; higher turnover requires state/central license.",
      eligibility: {
        sectors: ["Manufacturing - Food Processing", "Food & Beverages", "Agro-based Industries"],
        states: ["*"],
        maxTurnover: undefined,
        registrationRequired: [],
      },
      benefit:
        "Enables legal food business operation; basic registration at just ₹100/year; unlocks institutional buyer access and e-commerce food category listings",
      deadline: undefined,
      applyUrl: "https://pmfme.mofpi.gov.in/",
      category: "Certification",
    },
    {
      name: "Rajasthan MSME Assistance — Stamp Duty Exemption",
      authority: "State Govt — Rajasthan",
      description:
        "Rajasthan's MSME promotion policy provides stamp duty exemption on land purchase and lease for manufacturing MSMEs, reducing initial capital requirements significantly.",
      eligibility: {
        sectors: ["Manufacturing - General", "Manufacturing - Textiles", "Handicrafts"],
        states: ["Rajasthan"],
        maxTurnover: "5Cr-50Cr",
        registrationRequired: ["Udyam"],
      },
      benefit:
        "100% stamp duty exemption on first land purchase; 50% exemption on subsequent purchases; electricity tariff subsidy for 7 years",
      deadline: days(365),
      applyUrl: "https://industries.rajasthan.gov.in/",
      category: "Tax Benefit",
    },
  ];
}

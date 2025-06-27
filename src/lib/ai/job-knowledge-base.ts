// Job Knowledge Base for Central Valley positions
// This helps the Job Genie expand basic inputs into detailed job postings

export interface JobTemplate {
  title: string;
  aliases: string[];
  typicalDuties: string[];
  typicalRequirements: string[];
  preferredQualifications: string[];
  typicalPay: {
    min: number;
    max: number;
  };
  typicalSchedule: string;
  typicalBenefits: string[];
}

export const JOB_TEMPLATES: Record<string, JobTemplate> = {
  janitor: {
    title: "Janitor/Custodian",
    aliases: ["custodian", "cleaner", "maintenance", "porter", "cleaning staff"],
    typicalDuties: [
      "Clean and maintain facilities including floors, restrooms, and common areas",
      "Empty trash receptacles and replace liners",
      "Restock supplies in restrooms and break rooms",
      "Perform minor maintenance tasks",
      "Report safety hazards and needed repairs",
      "Set up rooms for meetings or events",
      "Operate cleaning equipment (vacuum, buffer, etc.)",
      "Mix and use cleaning chemicals safely"
    ],
    typicalRequirements: [
      "Ability to lift up to 50 pounds",
      "Stand and walk for extended periods",
      "Basic understanding of cleaning chemicals and safety",
      "Reliable transportation to work site",
      "Ability to work independently with minimal supervision"
    ],
    preferredQualifications: [
      "Previous custodial or cleaning experience",
      "Knowledge of OSHA safety standards",
      "Basic maintenance skills",
      "Bilingual English/Spanish a plus"
    ],
    typicalPay: { min: 16, max: 22 },
    typicalSchedule: "Evening shift (6pm-10pm or similar), Monday-Friday",
    typicalBenefits: [
      "Steady hours with weekends off",
      "Work independently",
      "No customer interaction required",
      "Potential for additional hours"
    ]
  },
  
  driver: {
    title: "Delivery Driver",
    aliases: ["cdl driver", "truck driver", "delivery", "route driver", "courier"],
    typicalDuties: [
      "Safely operate delivery vehicle on assigned routes",
      "Load and unload cargo/packages",
      "Verify delivery addresses and obtain signatures",
      "Maintain accurate delivery logs and documentation",
      "Perform pre-trip and post-trip vehicle inspections",
      "Communicate with dispatch regarding delays or issues",
      "Provide excellent customer service during deliveries",
      "Follow all DOT regulations and company policies"
    ],
    typicalRequirements: [
      "Valid driver's license with clean driving record",
      "Ability to pass DOT physical and drug screening",
      "Lift and carry packages up to 70 pounds",
      "Navigate using GPS and maps",
      "Work in various weather conditions"
    ],
    preferredQualifications: [
      "CDL Class A or B (if applicable)",
      "Previous delivery or driving experience",
      "Knowledge of Central Valley area",
      "Forklift certification",
      "Customer service experience"
    ],
    typicalPay: { min: 18, max: 28 },
    typicalSchedule: "Full-time, Monday-Friday with occasional Saturdays",
    typicalBenefits: [
      "Health insurance",
      "Paid time off",
      "401(k) with company match",
      "Overtime opportunities",
      "Take-home vehicle (some positions)"
    ]
  },
  
  warehouse: {
    title: "Warehouse Worker",
    aliases: ["warehouse associate", "material handler", "picker", "packer", "shipping"],
    typicalDuties: [
      "Pick and pack orders accurately",
      "Load and unload trucks",
      "Operate warehouse equipment (pallet jack, forklift)",
      "Maintain inventory accuracy",
      "Keep warehouse clean and organized",
      "Follow safety procedures and protocols",
      "Process incoming and outgoing shipments",
      "Perform cycle counts and inventory checks"
    ],
    typicalRequirements: [
      "Ability to lift 50+ pounds repeatedly",
      "Stand, walk, and bend for entire shift",
      "Basic math and computer skills",
      "Attention to detail for order accuracy",
      "Work in non-climate controlled environment"
    ],
    preferredQualifications: [
      "Forklift certification",
      "Previous warehouse experience",
      "Experience with warehouse management systems",
      "High school diploma or equivalent",
      "Bilingual English/Spanish"
    ],
    typicalPay: { min: 17, max: 23 },
    typicalSchedule: "Various shifts available: day, swing, or night",
    typicalBenefits: [
      "Weekly pay",
      "Health benefits",
      "Shift differential for nights/weekends",
      "Overtime available",
      "Advancement opportunities"
    ]
  },
  
  receptionist: {
    title: "Receptionist",
    aliases: ["front desk", "administrative assistant", "office assistant", "clerk"],
    typicalDuties: [
      "Greet visitors and direct them appropriately",
      "Answer multi-line phone system",
      "Schedule appointments and maintain calendars",
      "Sort and distribute mail",
      "Maintain reception area cleanliness",
      "Data entry and filing",
      "Assist with administrative tasks",
      "Handle customer inquiries professionally"
    ],
    typicalRequirements: [
      "Professional appearance and demeanor",
      "Excellent verbal and written communication",
      "Computer skills (MS Office, email)",
      "Ability to multitask in busy environment",
      "Reliable attendance and punctuality"
    ],
    preferredQualifications: [
      "Previous receptionist or customer service experience",
      "Knowledge of office equipment",
      "Bilingual English/Spanish",
      "Experience with scheduling software",
      "Medical/dental office experience (if applicable)"
    ],
    typicalPay: { min: 16, max: 22 },
    typicalSchedule: "Monday-Friday, 8am-5pm (typical business hours)",
    typicalBenefits: [
      "Weekends and holidays off",
      "Professional office environment",
      "Health and dental insurance",
      "Paid time off",
      "Career growth opportunities"
    ]
  },
  
  "food service": {
    title: "Food Service Worker",
    aliases: ["cook", "prep cook", "line cook", "server", "restaurant", "kitchen"],
    typicalDuties: [
      "Prepare food according to recipes and standards",
      "Maintain cleanliness and sanitation standards",
      "Operate kitchen equipment safely",
      "Stock and rotate inventory",
      "Assist with food prep and plating",
      "Clean dishes, utensils, and work areas",
      "Follow health department regulations",
      "Work as part of kitchen team"
    ],
    typicalRequirements: [
      "Food Handler's card or ability to obtain",
      "Stand for entire shift in hot environment",
      "Work weekends and holidays as needed",
      "Fast-paced environment experience",
      "Basic knife skills and food safety knowledge"
    ],
    preferredQualifications: [
      "Previous restaurant or kitchen experience",
      "Culinary training or certification",
      "Knowledge of various cuisines",
      "ServSafe certification",
      "Bilingual abilities"
    ],
    typicalPay: { min: 16, max: 20 },
    typicalSchedule: "Varies - includes evenings, weekends, and holidays",
    typicalBenefits: [
      "Free or discounted meals",
      "Flexible scheduling",
      "Tips (for tipped positions)",
      "Fast-paced, team environment",
      "Advancement to supervisor/manager"
    ]
  },
  
  retail: {
    title: "Retail Sales Associate",
    aliases: ["sales associate", "cashier", "store clerk", "customer service", "sales"],
    typicalDuties: [
      "Provide excellent customer service",
      "Operate cash register and handle transactions",
      "Stock shelves and maintain displays",
      "Answer customer questions about products",
      "Process returns and exchanges",
      "Maintain store cleanliness",
      "Meet sales goals and metrics",
      "Work as part of retail team"
    ],
    typicalRequirements: [
      "Strong customer service skills",
      "Basic math and cash handling abilities",
      "Stand for extended periods",
      "Flexible schedule including weekends",
      "Professional appearance"
    ],
    preferredQualifications: [
      "Previous retail or sales experience",
      "Product knowledge in specific area",
      "Bilingual English/Spanish",
      "POS system experience",
      "Upselling and cross-selling skills"
    ],
    typicalPay: { min: 16, max: 19 },
    typicalSchedule: "Part-time or full-time, must work weekends and holidays",
    typicalBenefits: [
      "Employee discount",
      "Flexible hours",
      "Sales incentives/commission",
      "Advancement opportunities",
      "Seasonal bonus potential"
    ]
  },
  
  "office admin": {
    title: "Administrative Assistant",
    aliases: ["admin", "secretary", "office manager", "executive assistant", "coordinator"],
    typicalDuties: [
      "Manage calendars and schedule meetings",
      "Prepare reports and presentations",
      "Handle correspondence and communications",
      "Maintain filing systems and databases",
      "Coordinate travel arrangements",
      "Process invoices and expense reports",
      "Answer phones and greet visitors",
      "Support executive staff with various tasks"
    ],
    typicalRequirements: [
      "Proficient in Microsoft Office Suite",
      "Excellent organizational skills",
      "Strong written and verbal communication",
      "Ability to handle confidential information",
      "Multi-tasking and prioritization skills"
    ],
    preferredQualifications: [
      "Associate's degree or higher",
      "3+ years administrative experience",
      "QuickBooks or accounting software knowledge",
      "Project management experience",
      "Industry-specific knowledge"
    ],
    typicalPay: { min: 18, max: 25 },
    typicalSchedule: "Monday-Friday, 8am-5pm",
    typicalBenefits: [
      "Health and dental insurance",
      "401(k) retirement plan",
      "Paid vacation and sick time",
      "Professional development opportunities",
      "Stable, long-term employment"
    ]
  },
  
  mechanic: {
    title: "Automotive Mechanic",
    aliases: ["technician", "auto tech", "diesel mechanic", "equipment mechanic", "service tech"],
    typicalDuties: [
      "Diagnose vehicle problems using diagnostic equipment",
      "Perform routine maintenance (oil changes, tire rotations)",
      "Repair and replace parts as needed",
      "Test drive vehicles to verify repairs",
      "Maintain accurate service records",
      "Communicate with customers about repairs",
      "Keep work area clean and organized",
      "Follow safety procedures"
    ],
    typicalRequirements: [
      "Valid driver's license",
      "Own tools (basic set minimum)",
      "ASE certification or equivalent experience",
      "Physical ability to work under vehicles",
      "Problem-solving and diagnostic skills"
    ],
    preferredQualifications: [
      "ASE Master Technician certification",
      "Manufacturer-specific training",
      "5+ years professional experience",
      "Diesel experience (for diesel positions)",
      "Smog license (California)"
    ],
    typicalPay: { min: 20, max: 35 },
    typicalSchedule: "Monday-Friday with rotating Saturdays",
    typicalBenefits: [
      "Tool allowance or tool program",
      "Ongoing training and certifications",
      "Health and dental insurance",
      "Flat rate or hourly + commission",
      "Uniform service"
    ]
  },
  
  nurse: {
    title: "Registered Nurse",
    aliases: ["rn", "lpn", "lvn", "cna", "medical assistant", "healthcare"],
    typicalDuties: [
      "Assess patient health conditions",
      "Administer medications and treatments",
      "Monitor vital signs and patient progress",
      "Maintain accurate medical records",
      "Educate patients and families",
      "Collaborate with healthcare team",
      "Follow infection control protocols",
      "Respond to medical emergencies"
    ],
    typicalRequirements: [
      "Current California RN/LVN license",
      "BLS/CPR certification",
      "Ability to lift and move patients",
      "Standing and walking for extended periods",
      "Excellent clinical judgment"
    ],
    preferredQualifications: [
      "BSN degree (for RN positions)",
      "Specialty certifications (ICU, ER, etc.)",
      "2+ years acute care experience",
      "Bilingual English/Spanish",
      "ACLS certification"
    ],
    typicalPay: { min: 35, max: 55 },
    typicalSchedule: "12-hour shifts, days/nights/weekends, 3-4 days per week",
    typicalBenefits: [
      "Comprehensive health benefits",
      "Retirement plan with match",
      "Continuing education reimbursement",
      "Shift differentials",
      "Sign-on bonus (often available)"
    ]
  },
  
  teacher: {
    title: "Teacher",
    aliases: ["educator", "instructor", "substitute", "aide", "tutor", "coach"],
    typicalDuties: [
      "Develop and implement lesson plans",
      "Assess student progress and provide feedback",
      "Manage classroom behavior",
      "Communicate with parents and guardians",
      "Attend staff meetings and professional development",
      "Maintain accurate student records",
      "Create engaging learning environment",
      "Differentiate instruction for diverse learners"
    ],
    typicalRequirements: [
      "California teaching credential (or eligibility)",
      "Bachelor's degree minimum",
      "Pass CBEST and CSET exams",
      "Clear background check and TB test",
      "Classroom management skills"
    ],
    preferredQualifications: [
      "Master's degree in education",
      "CLAD or BCLAD certification",
      "Special education credential",
      "Experience with diverse populations",
      "Technology integration skills"
    ],
    typicalPay: { min: 25, max: 40 },
    typicalSchedule: "School hours (7:30am-3:30pm) plus planning time",
    typicalBenefits: [
      "Summers off",
      "Excellent health benefits",
      "CalSTRS retirement",
      "Professional development",
      "Job security with tenure"
    ]
  }
};

// Helper function to find best matching job template
export function findJobTemplate(input: string): JobTemplate | null {
  const normalizedInput = input.toLowerCase();
  
  // Check each template and its aliases
  for (const [key, template] of Object.entries(JOB_TEMPLATES)) {
    if (normalizedInput.includes(key)) return template;
    
    for (const alias of template.aliases) {
      if (normalizedInput.includes(alias)) return template;
    }
  }
  
  return null;
}

// Generate smart job description from minimal input
export function generateJobDescription(
  title: string,
  location: string,
  salary: string,
  additionalInfo?: string
): string {
  const template = findJobTemplate(title);
  
  if (!template) {
    return `We're hiring a ${title} in ${location}. ${salary}. ${additionalInfo || 'Apply today!'}`;
  }
  
  // Build a comprehensive job description
  const duties = template.typicalDuties.slice(0, 5).join('\n• ');
  const requirements = template.typicalRequirements.slice(0, 4).join('\n• ');
  const benefits = template.typicalBenefits.slice(0, 3).join('\n• ');
  
  return `
**${template.title} Opportunity in ${location}**

**What You'll Do:**
• ${duties}

**What We Need:**
• ${requirements}

**What We Offer:**
• ${salary}
• ${benefits}
${additionalInfo ? `\n**Additional Info:** ${additionalInfo}` : ''}

Ready to join our team? Apply today!`;
}
/**
 * Setup Company Knowledge Base for Phase 2
 * 
 * This script:
 * 1. Creates Company records for businesses with job postings
 * 2. Seeds initial knowledge base entries for top employers
 * 3. Links existing jobs to company records
 */

import 'dotenv/config'; // Ensure .env is loaded for any direct DB calls if needed
import { prisma } from '@/app/api/auth/prisma';
import { CompanyKnowledgeService } from '@/lib/knowledge/company-knowledge';
import { CompanyKnowledgeCategory, CompanyKnowledgeSource } from '@prisma/client';

const SAMPLE_COMPANIES = [
  { name: "AlphaCorp", industry: "Technology", size: "51-200", headquarters: "Stockton, CA" },
  { name: "BetaSolutions", industry: "Healthcare", size: "201-500", headquarters: "Modesto, CA" },
  { name: "Gamma Widgets", industry: "Manufacturing", size: "11-50", headquarters: "Lodi, CA" },
];

async function setupCompanyKnowledge() {
  console.log('🏢 Setting up Company Knowledge Base for Phase 2 (with sample data)\n');

  try {
    // Step 1: Create predefined sample Company records
    console.log('Step 1: Creating sample Company records...');
    const createdCompanies = [];
    
    for (const companyData of SAMPLE_COMPANIES) {
      try {
        let company = await prisma.company.findUnique({ where: { name: companyData.name } });
        if (!company) {
          const companyId = await CompanyKnowledgeService.createCompanyFromJobData(companyData.name); // Uses existing helper
          if (companyId) {
            // Update with more details
            company = await prisma.company.update({
              where: { id: companyId },
              data: {
                industry: companyData.industry,
                size: companyData.size,
                headquarters: companyData.headquarters,
              }
            });
            createdCompanies.push(company);
            console.log(`✅ Created company: ${company.name}`);
          } else {
            console.log(`⚠️ Failed to create company: ${companyData.name}`);
            continue;
          }
        } else {
          console.log(`ℹ️ Company ${companyData.name} already exists. Skipping creation, will update/seed knowledge.`);
          createdCompanies.push(company);
        }

        // Ensure existing jobs are linked (if any)
        const linkedCount = await CompanyKnowledgeService.linkJobsToCompany(company.name, company.id);
        if (linkedCount > 0) {
          console.log(`🔗 Linked ${linkedCount} existing jobs to ${company.name}`);
        }

        // Clear existing knowledge for a clean seed (optional, but good for consistent test data)
        await prisma.companyKnowledge.deleteMany({ where: { companyId: company.id } });
        console.log(`🧹 Cleared existing knowledge for ${company.name}`);

        // Seed default knowledge
        await CompanyKnowledgeService.seedDefaultKnowledge(company.id, company.name);
        console.log(`📝 Seeded default knowledge for ${company.name}`);

      } catch (error) {
        console.error(`Error processing company ${companyData.name}:`, error);
      }
    }
    
    // Step 2: Add rich knowledge for these sample companies
    console.log('\nStep 2: Adding rich knowledge for sample companies...');
    if (createdCompanies.length > 0) {
      await addSampleKnowledgeData(createdCompanies);
    }

    console.log('\n🎉 Sample Company Knowledge Base setup complete!');
    console.log(`\nSummary:`);
    console.log(`- Processed ${createdCompanies.length} sample company records`);
    console.log(`- Seeded default and rich knowledge base entries`);
    console.log(`\nNext: Run test:phase2-chatbot to test the chatbot with this company data!`);

  } catch (error) {
    console.error('Error setting up company knowledge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function addSampleKnowledgeData(companies: any[]) {
  for (const company of companies) {
    console.log(`📚 Adding rich knowledge for ${company.name}...`);
    // Culture information
    await CompanyKnowledgeService.addCompanyKnowledge({
      companyId: company.id,
      category: CompanyKnowledgeCategory.culture,
      title: 'Our Innovative Company Culture',
      content: `${company.name} fosters a dynamic and inclusive work environment. We champion innovation, collaboration, and empower our team for professional growth. Our diverse backgrounds are our strength, driving success in the ${company.industry || 'local'} market.`,
      keywords: ['culture', 'team', 'collaborative', 'inclusive', 'innovation', company.name.toLowerCase()],
      source: CompanyKnowledgeSource.company_provided,
      priority: 9
    });

    // Benefits information
    await CompanyKnowledgeService.addCompanyKnowledge({
      companyId: company.id,
      category: CompanyKnowledgeCategory.benefits,
      title: 'Comprehensive Employee Benefits',
      content: `At ${company.name}, we offer a full suite of benefits: medical, dental, vision, a 401(k) with company match, generous paid time off, and continuous learning opportunities.`,
      keywords: ['benefits', 'health', 'insurance', 'retirement', 'PTO', '401k'],
      source: CompanyKnowledgeSource.hr_verified,
      priority: 8
    });

    // Interview process
    await CompanyKnowledgeService.addCompanyKnowledge({
      companyId: company.id,
      category: CompanyKnowledgeCategory.interview_process,
      title: 'Our Interview Process',
      content: `Our interview journey at ${company.name} starts with a phone screen, then technical and team-fit interviews, typically concluding within 1-2 weeks. We value transparency and clear communication.`,
      keywords: ['interview', 'process', 'hiring', 'timeline', 'screening'],
      source: CompanyKnowledgeSource.hr_verified,
      priority: 7
    });

    if (company.name === "AlphaCorp") { // Add specific extra knowledge for one company
      await CompanyKnowledgeService.addCompanyKnowledge({
        companyId: company.id,
        category: CompanyKnowledgeCategory.remote_policy,
        title: 'Flexible Remote Work at AlphaCorp',
        content: `AlphaCorp embraces a hybrid work model, offering significant remote work flexibility for many roles, combined with collaborative in-office days for key projects based out of our ${company.headquarters || 'local'} office.`,
        keywords: ['remote', 'hybrid', 'flexible', 'wfh', 'policy'],
        source: CompanyKnowledgeSource.company_provided,
        priority: 6
      });
    }
  }
}

// Run the setup
if (require.main === module) {
  setupCompanyKnowledge().catch(console.error);
}

export { setupCompanyKnowledge }; 
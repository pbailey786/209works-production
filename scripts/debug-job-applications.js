const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugJobApplications() {
  console.log('🔍 Debugging job applications...');

  try {
    // 1. Check all jobs and their application counts
    console.log('\n📋 Jobs and their application counts:');
    const jobs = await prisma.job.findMany({
      include: {
        _count: {
          select: {
            jobApplications: true
          }
        },
        employer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    jobs.forEach(job => {
      console.log(`  • "${job.title}" by ${job.company}`);
      console.log(`    - ID: ${job.id}`);
      console.log(`    - Employer: ${job.employer?.name || 'No employer'} (${job.employer?.email || 'N/A'})`);
      console.log(`    - Employer ID: ${job.employerId || 'None'}`);
      console.log(`    - Applications: ${job._count.jobApplications}`);
      console.log(`    - Source: ${job.source}`);
      console.log(`    - Posted: ${job.postedAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    // 2. Check all job applications
    console.log('\n📝 All job applications:');
    const applications = await prisma.jobApplication.findMany({
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            employerId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    if (applications.length === 0) {
      console.log('  ❌ No job applications found in database');
    } else {
      applications.forEach(app => {
        console.log(`  • Application ID: ${app.id}`);
        console.log(`    - Job: "${app.job.title}" by ${app.job.company}`);
        console.log(`    - Job ID: ${app.job.id}`);
        console.log(`    - Job Employer ID: ${app.job.employerId || 'None'}`);
        console.log(`    - Applicant: ${app.user.name || 'Anonymous'} (${app.user.email})`);
        console.log(`    - Applicant Role: ${app.user.role}`);
        console.log(`    - Status: ${app.status}`);
        console.log(`    - Applied: ${app.appliedAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    // 3. Check employers and their jobs
    console.log('\n👔 Employers and their jobs:');
    const employers = await prisma.user.findMany({
      where: {
        role: 'employer'
      },
      include: {
        employerJobs: {
          include: {
            _count: {
              select: {
                jobApplications: true
              }
            }
          }
        }
      }
    });

    if (employers.length === 0) {
      console.log('  ❌ No employers found in database');
    } else {
      employers.forEach(employer => {
        console.log(`  • ${employer.name || 'Unnamed'} (${employer.email})`);
        console.log(`    - ID: ${employer.id}`);
        console.log(`    - Jobs posted: ${employer.employerJobs.length}`);
        
        employer.employerJobs.forEach(job => {
          console.log(`      - "${job.title}" (${job._count.jobApplications} applications)`);
        });
        console.log('');
      });
    }

    // 4. Summary
    console.log('\n📊 Summary:');
    console.log(`  • Total jobs: ${jobs.length}`);
    console.log(`  • Total applications: ${applications.length}`);
    console.log(`  • Total employers: ${employers.length}`);

    // 5. Recommendations
    console.log('\n💡 Recommendations:');
    
    if (applications.length === 0) {
      console.log('  • No applications found - check if job application form is working');
      console.log('  • Verify job application API endpoints are functioning');
    }
    
    const jobsWithoutEmployer = jobs.filter(job => !job.employerId);
    if (jobsWithoutEmployer.length > 0) {
      console.log(`  • ${jobsWithoutEmployer.length} jobs have no employer assigned`);
      console.log('  • These jobs won\'t show applications in employer dashboard');
      jobsWithoutEmployer.forEach(job => {
        console.log(`    - "${job.title}" (ID: ${job.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugJobApplications()
  .then(() => {
    console.log('✅ Debug script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug script failed:', error);
    process.exit(1);
  });

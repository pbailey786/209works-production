#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

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

    // 3. Check for orphaned applications (applications for non-existent jobs)
    console.log('\n🔗 Checking for orphaned applications:');
    const allApplications = await prisma.jobApplication.findMany({
      select: {
        id: true,
        jobId: true
      }
    });

    const allJobIds = await prisma.job.findMany({
      select: {
        id: true
      }
    });

    const existingJobIdSet = new Set(allJobIds.map(job => job.id));
    const orphanedApplications = allApplications.filter(app => !existingJobIdSet.has(app.jobId));

    if (orphanedApplications.length > 0) {
      console.log(`  ⚠️  Found ${orphanedApplications.length} orphaned applications:`);
      orphanedApplications.forEach(app => {
        console.log(`    - Application ${app.id} references non-existent job ${app.jobId}`);
      });
    } else {
      console.log('  ✅ No orphaned applications found');
    }

    // 4. Check employers and their jobs
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

    // 5. Check job seekers who have applied
    console.log('\n👤 Job seekers with applications:');
    const jobSeekers = await prisma.user.findMany({
      where: {
        role: 'jobseeker',
        jobApplications: {
          some: {}
        }
      },
      include: {
        jobApplications: {
          include: {
            job: {
              select: {
                title: true,
                company: true
              }
            }
          }
        }
      }
    });

    if (jobSeekers.length === 0) {
      console.log('  ❌ No job seekers with applications found');
    } else {
      jobSeekers.forEach(seeker => {
        console.log(`  • ${seeker.name || 'Anonymous'} (${seeker.email})`);
        console.log(`    - Applications: ${seeker.jobApplications.length}`);
        
        seeker.jobApplications.forEach(app => {
          console.log(`      - Applied to "${app.job.title}" at ${app.job.company}`);
        });
        console.log('');
      });
    }

    // 6. Summary
    console.log('\n📊 Summary:');
    console.log(`  • Total jobs: ${jobs.length}`);
    console.log(`  • Total applications: ${applications.length}`);
    console.log(`  • Total employers: ${employers.length}`);
    console.log(`  • Job seekers with applications: ${jobSeekers.length}`);
    console.log(`  • Orphaned applications: ${orphanedApplications.length}`);

    // 7. Recommendations
    console.log('\n💡 Recommendations:');
    
    if (applications.length === 0) {
      console.log('  • No applications found - check if job application form is working');
      console.log('  • Verify job application API endpoints are functioning');
    }
    
    if (orphanedApplications.length > 0) {
      console.log('  • Clean up orphaned applications');
    }
    
    const jobsWithoutEmployer = jobs.filter(job => !job.employerId);
    if (jobsWithoutEmployer.length > 0) {
      console.log(`  • ${jobsWithoutEmployer.length} jobs have no employer assigned`);
      console.log('  • These jobs won\'t show applications in employer dashboard');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
if (require.main === module) {
  debugJobApplications()
    .then(() => {
      console.log('✅ Debug script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Debug script failed:', error);
      process.exit(1);
    });
}

export { debugJobApplications };

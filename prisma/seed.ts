import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing jobs first
  await prisma.job.deleteMany({});

  // Create test jobs for pagination testing
  const testJobs = [];
  const companies = [
    'TechCorp',
    'InnovateLabs',
    'DataSystems',
    'CloudWorks',
    'DevStudio',
    'StartupXYZ',
    'MegaTech',
    'CodeCraft',
    'WebSolutions',
    'AppFactory',
  ];
  const jobTitles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager',
    'UX Designer',
    'QA Engineer',
    'Mobile Developer',
  ];
  const locations = [
    'San Francisco, CA',
    'New York, NY',
    'Austin, TX',
    'Seattle, WA',
    'Boston, MA',
    'Denver, CO',
    'Chicago, IL',
    'Los Angeles, CA',
    'Remote',
    'Portland, OR',
  ];
  const jobTypes = ['full_time', 'part_time', 'contract', 'internship'];

  for (let i = 1; i <= 50; i++) {
    const company = companies[i % companies.length];
    const title = jobTitles[i % jobTitles.length];
    const location = locations[i % locations.length];
    const jobType = jobTypes[i % jobTypes.length];
    const salaryMin = 60000 + i * 1000;
    const salaryMax = salaryMin + 20000;

    testJobs.push({
      id: `test-job-${i}`,
      title: `${title} ${i}`,
      company,
      description: `We are looking for a talented ${title.toLowerCase()} to join our team at ${company}. This is an exciting opportunity to work on cutting-edge projects and grow your career. Requirements include strong programming skills, experience with modern frameworks, and excellent communication abilities. We offer competitive salary, great benefits, and a collaborative work environment.`,
      location,
      salaryMin,
      salaryMax,
      jobType: jobType as any,
      categories: ['Technology', 'Software Development'],
      source: 'test',
      url: `https://example.com/job/${i}`,
      postedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Jobs posted over the last 50 days
      isRemote: location === 'Remote',
    });
  }

  await prisma.job.createMany({
    data: testJobs,
  });

  console.log(`Seeded ${testJobs.length} test jobs!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

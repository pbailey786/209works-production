const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleJobs = [
  {
    title: 'Warehouse Associate',
    company: 'Amazon Fulfillment Center',
    location: 'Stockton, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 18,
    salaryMax: 22,
    description:
      "Join our fast-paced warehouse team! We're looking for reliable team members to help fulfill customer orders. No experience necessary - we provide full training.",
    requirements:
      'Must be able to lift up to 50 lbs, stand for extended periods, and work in a team environment.',
    benefits:
      'Health insurance, dental, vision, 401k with company match, paid time off, career advancement opportunities.',
    isRemote: false,
    categories: ['warehouse', 'logistics'],
    status: 'active',
    postedAt: new Date(),
    url: 'https://amazon.jobs/warehouse-stockton',
  },
  {
    title: 'Registered Nurse - ICU',
    company: 'San Joaquin General Hospital',
    location: 'Stockton, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 85000,
    salaryMax: 110000,
    description:
      'Seeking experienced ICU nurses to join our critical care team. Provide direct patient care in our state-of-the-art intensive care unit.',
    requirements:
      'Current RN license in California, BSN preferred, 2+ years ICU experience, BLS and ACLS certification required.',
    benefits:
      'Excellent health benefits, retirement plan, tuition reimbursement, flexible scheduling, sign-on bonus available.',
    isRemote: false,
    categories: ['healthcare', 'nursing'],
    status: 'active',
    postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    url: 'https://sjgh.org/careers/icu-nurse',
  },
  {
    title: 'Customer Service Representative',
    company: 'Valley Credit Union',
    location: 'Modesto, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 16,
    salaryMax: 20,
    description:
      'Provide exceptional customer service to our members. Handle account inquiries, process transactions, and help members with their financial needs.',
    requirements:
      'High school diploma, excellent communication skills, cash handling experience preferred, bilingual Spanish a plus.',
    benefits:
      'Health insurance, paid holidays, vacation time, employee banking benefits, professional development opportunities.',
    isRemote: false,
    categories: ['customer-service', 'finance'],
    status: 'active',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    url: 'https://valleycu.org/careers',
  },
  {
    title: 'Software Developer',
    company: 'TechFlow Solutions',
    location: 'Tracy, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 75000,
    salaryMax: 95000,
    description:
      "Join our growing tech team! We're building innovative software solutions for local businesses. Work with modern technologies in a collaborative environment.",
    requirements:
      "Bachelor's degree in Computer Science or related field, 2+ years experience with JavaScript, React, Node.js, experience with databases.",
    benefits:
      'Competitive salary, health insurance, flexible work arrangements, professional development budget, modern equipment.',
    isRemote: true,
    categories: ['technology', 'software'],
    status: 'active',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    url: 'https://techflow.com/careers',
  },
  {
    title: 'Forklift Operator',
    company: 'Central Valley Logistics',
    location: 'Manteca, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 19,
    salaryMax: 23,
    description:
      'Operate forklifts and other warehouse equipment to move, stack, and organize inventory. Safety-focused environment with opportunities for advancement.',
    requirements:
      'Valid forklift certification required, 1+ years warehouse experience, ability to work various shifts, attention to detail.',
    benefits:
      'Health insurance, dental, vision, overtime opportunities, safety bonuses, equipment training provided.',
    isRemote: false,
    categories: ['warehouse', 'logistics', 'equipment'],
    status: 'active',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    url: 'https://cvlogistics.com/jobs',
  },
  {
    title: 'Medical Assistant',
    company: 'Central Valley Family Medicine',
    location: 'Modesto, CA',
    source: '209works',
    jobType: 'part_time',
    salaryMin: 18,
    salaryMax: 22,
    description:
      'Support our medical team by assisting with patient care, administrative tasks, and clinical procedures. Great opportunity for healthcare career growth.',
    requirements:
      'Medical Assistant certification, excellent communication skills, computer proficiency, bilingual Spanish preferred.',
    benefits:
      'Flexible scheduling, health insurance (for 30+ hours), paid training, career advancement opportunities.',
    isRemote: false,
    categories: ['healthcare', 'medical'],
    status: 'active',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    url: 'https://cvfamilymed.com/careers',
  },
  {
    title: 'Retail Sales Associate',
    company: 'Target',
    location: 'Tracy, CA',
    source: '209works',
    jobType: 'part_time',
    salaryMin: 16,
    salaryMax: 18,
    description:
      'Provide excellent guest service, maintain store appearance, and support sales goals. Flexible scheduling available for work-life balance.',
    requirements:
      'Customer service experience preferred, ability to work weekends and holidays, positive attitude, team player.',
    benefits:
      'Employee discount, flexible scheduling, health benefits for eligible team members, career development programs.',
    isRemote: false,
    categories: ['retail', 'customer-service'],
    status: 'active',
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    url: 'https://target.com/careers',
  },
  {
    title: 'Delivery Driver',
    company: 'FedEx Ground',
    location: 'Stockton, CA',
    source: '209works',
    jobType: 'full_time',
    salaryMin: 20,
    salaryMax: 25,
    description:
      'Deliver packages to residential and commercial customers. Enjoy being on the road and providing excellent customer service.',
    requirements:
      "Valid driver's license with clean driving record, ability to lift up to 75 lbs, DOT physical required, customer service skills.",
    benefits:
      'Competitive pay, health insurance, retirement plan, paid time off, vehicle provided, route training.',
    isRemote: false,
    categories: ['delivery', 'logistics', 'driving'],
    status: 'active',
    postedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    url: 'https://fedex.com/careers',
  },
];

async function addSampleJobs() {
  try {
    console.log('Adding sample jobs to database...');

    for (const job of sampleJobs) {
      await prisma.job.create({
        data: job,
      });
      console.log(`Added job: ${job.title} at ${job.company}`);
    }

    console.log(`Successfully added ${sampleJobs.length} sample jobs!`);
  } catch (error) {
    console.error('Error adding sample jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleJobs();

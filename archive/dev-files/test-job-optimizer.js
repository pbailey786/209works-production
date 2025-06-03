// Test script for Job Post Optimizer
const testJobData = {
  jobTitle: 'Customer Service Representative',
  companyName: 'Central Valley Medical Group',
  location: 'Stockton, CA',
  pay: '$18-22/hour',
  schedule: 'Monday-Friday, 8am-5pm',
  companyDescription:
    "We're a family-owned medical practice serving the Stockton community for over 20 years. We provide comprehensive healthcare services with a focus on patient care and community wellness.",
  idealFit:
    'Someone who loves helping people, stays calm under pressure, and has great communication skills. Previous customer service experience preferred but not required. We value empathy, reliability, and a positive attitude.',
  culture:
    'Friendly team environment where everyone supports each other. We believe in work-life balance and treating our employees like family. Professional development is encouraged and supported.',
  growthPath:
    'Opportunities to advance to senior customer service roles, medical office management, or specialized positions. We provide ongoing training and support career development goals.',
  perks:
    'Health insurance, dental coverage, 2 weeks PTO, flexible scheduling when possible, employee wellness programs, and team building events.',
  applicationCTA:
    "Ready to join our team? Send your resume to careers@cvmedical.com or call (209) 555-0123 to schedule an interview. We'd love to hear from you!",
};

console.log('Test Job Post Optimizer Data:');
console.log(JSON.stringify(testJobData, null, 2));

console.log('\n=== Expected AI-Generated Output Structure ===');
console.log(`
# Customer Service Representative — Join Our Healthcare Family!

## 👋 About This Opportunity
Central Valley Medical Group is a family-owned medical practice that has been serving the Stockton community for over 20 years. We're looking for a caring Customer Service Representative to join our team and help us provide exceptional patient care in a supportive, family-like environment.

## 🧾 Job Details
- **📍 Location:** Stockton, CA
- **💰 Pay:** $18-22/hour
- **📅 Schedule:** Monday-Friday, 8am-5pm
- **🎁 Perks:** Health insurance, dental coverage, 2 weeks PTO, flexible scheduling when possible, employee wellness programs, and team building events

## 🧠 Who Thrives Here
Someone who loves helping people, stays calm under pressure, and has great communication skills. Previous customer service experience preferred but not required. We value empathy, reliability, and a positive attitude.

## 🚀 Growth & Development
Opportunities to advance to senior customer service roles, medical office management, or specialized positions. We provide ongoing training and support career development goals.

## 📝 Ready to Apply?
Ready to join our team? Send your resume to careers@cvmedical.com or call (209) 555-0123 to schedule an interview. We'd love to hear from you!
`);

console.log('\n=== Test Instructions ===');
console.log('1. Open http://localhost:3000/employers/create-job-post');
console.log('2. Fill out the form with the test data above');
console.log('3. Click "Optimize Job Post"');
console.log('4. Verify the AI generates a compelling job listing');
console.log('5. Test the "Publish Job Post" functionality');
console.log('6. Check that the job appears in the main job listings');

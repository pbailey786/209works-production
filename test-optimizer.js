// Simple test to verify Job Post Optimizer API is working
const testData = {
  jobTitle: "Customer Service Representative",
  companyName: "Test Company",
  location: "Stockton, CA",
  pay: "$18-22/hour",
  schedule: "Monday-Friday, 9am-5pm",
  companyDescription: "We are a local business serving the Stockton community",
  idealFit: "Someone who loves helping people and has great communication skills",
  culture: "Friendly team environment with supportive management",
  growthPath: "Opportunities to advance to senior roles with training",
  perks: "Health insurance, paid time off, flexible scheduling",
  applicationCTA: "Send your resume to jobs@testcompany.com",
  degreeRequired: false,
  supplementalQuestions: ["What interests you most about this position?"]
};

console.log('Test data for Job Post Optimizer:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nThis data should now work without credit requirements!');

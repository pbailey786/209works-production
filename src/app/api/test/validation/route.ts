import { NextRequest } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { createJobSchema } from '@/lib/validations/api';
import { createSuccessResponse } from '@/lib/errors/api-errors';

// Test endpoint to demonstrate validation
export const POST = withValidation(
  async (req, { body, requestId }) => {
    // This will only execute if validation passes
    return createSuccessResponse(
      { 
        message: 'Validation passed!',
        validatedData: body,
        requestId 
      },
      'Test endpoint validation successful'
    );
  },
  {
    bodySchema: createJobSchema,
  }
);

// Example usage:
// POST /api/test/validation
// Body: {
//   "title": "Software Engineer",
//   "description": "Build awesome applications",
//   "company": "Tech Corp",
//   "location": "San Francisco, CA",
//   "type": "full_time",
//   "salaryMin": 80000,
//   "salaryMax": 120000
// } 
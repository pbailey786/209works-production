// Professional email templates for employer-candidate communication

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'initial' | 'interview' | 'decision' | 'followup';
  variables: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Initial Contact Templates
  {
    id: 'initial_interest',
    name: 'Initial Interest',
    subject: 'Thank you for your application - {{jobTitle}}',
    body: `Hi {{candidateName}},

Thank you for applying to the {{jobTitle}} position at {{companyName}}. We received your application and wanted to reach out personally.

Your background looks interesting, and we'd like to learn more about your experience with {{relevantSkill}}. 

Would you be available for a brief 15-minute phone call this week to discuss your interest in the role and answer any initial questions?

You can reach me at {{employerPhone}} or simply reply to this email with your availability.

Looking forward to hearing from you!

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'initial',
    variables: ['candidateName', 'jobTitle', 'companyName', 'relevantSkill', 'employerPhone', 'employerName', 'employerEmail']
  },

  {
    id: 'application_received',
    name: 'Application Received',
    subject: 'Your application for {{jobTitle}} - Next Steps',
    body: `Hello {{candidateName}},

Thank you for your application for the {{jobTitle}} position at {{companyName}}. We appreciate your interest in joining our team.

We're currently reviewing applications and will be in touch within the next 5-7 business days regarding next steps. In the meantime, please feel free to reach out if you have any questions about the role or our company.

You can learn more about us at {{companyWebsite}} or connect with us on LinkedIn.

We'll be in touch soon!

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'initial',
    variables: ['candidateName', 'jobTitle', 'companyName', 'companyWebsite', 'employerName', 'employerEmail']
  },

  // Interview Templates
  {
    id: 'interview_invitation',
    name: 'Interview Invitation',
    subject: 'Interview Invitation - {{jobTitle}} at {{companyName}}',
    body: `Hi {{candidateName}},

Great news! We'd like to invite you for an interview for the {{jobTitle}} position.

Interview Details:
• Date: {{interviewDate}}
• Time: {{interviewTime}}
• Duration: Approximately {{duration}} minutes
• Format: {{interviewFormat}}
• Location: {{interviewLocation}}

{{#if isVirtual}}
Meeting Link: {{meetingLink}}
Meeting ID: {{meetingId}}
{{/if}}

To prepare for the interview:
• Please bring a copy of your resume
• Be ready to discuss your experience with {{keySkills}}
• Prepare questions about the role and our company

Please confirm your attendance by replying to this email. If this time doesn't work, let me know and we can reschedule.

Looking forward to meeting you!

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}
{{employerPhone}}`,
    category: 'interview',
    variables: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'duration', 'interviewFormat', 'interviewLocation', 'meetingLink', 'meetingId', 'keySkills', 'employerName', 'employerEmail', 'employerPhone']
  },

  {
    id: 'interview_reminder',
    name: 'Interview Reminder',
    subject: 'Reminder: Interview Tomorrow - {{jobTitle}}',
    body: `Hi {{candidateName}},

This is a friendly reminder about your interview tomorrow for the {{jobTitle}} position.

Interview Details:
• Date: {{interviewDate}}
• Time: {{interviewTime}}
• Location: {{interviewLocation}}

{{#if isVirtual}}
Meeting Link: {{meetingLink}}
Please test your connection a few minutes early.
{{else}}
Our office is located at {{officeAddress}}. Please plan to arrive 10 minutes early.
{{/if}}

If you need to reschedule or have any questions, please call me at {{employerPhone}} or reply to this email.

Looking forward to meeting you tomorrow!

Best regards,
{{employerName}}
{{companyName}}`,
    category: 'interview',
    variables: ['candidateName', 'jobTitle', 'interviewDate', 'interviewTime', 'interviewLocation', 'meetingLink', 'officeAddress', 'employerPhone', 'employerName', 'companyName']
  },

  // Decision Templates
  {
    id: 'job_offer',
    name: 'Job Offer',
    subject: 'Job Offer - {{jobTitle}} at {{companyName}}',
    body: `Dear {{candidateName}},

We're excited to offer you the position of {{jobTitle}} at {{companyName}}!

After careful consideration, we believe you'll be a great addition to our team. Your experience with {{relevantExperience}} and enthusiasm for {{companyMission}} really impressed us.

Offer Details:
• Position: {{jobTitle}}
• Start Date: {{startDate}}
• Salary: {{salary}}
• Benefits: {{benefits}}
• Reporting to: {{supervisor}}

Please review the attached offer letter for complete details. We'd love to have you join our team and would like to hear back from you by {{responseDeadline}}.

If you have any questions about the offer or need any clarification, please don't hesitate to reach out. I'm available at {{employerPhone}} or via email.

Congratulations, and we hope you'll accept this exciting opportunity!

Best regards,
{{employerName}}
{{jobTitle}}
{{companyName}}
{{employerEmail}}
{{employerPhone}}`,
    category: 'decision',
    variables: ['candidateName', 'jobTitle', 'companyName', 'relevantExperience', 'companyMission', 'startDate', 'salary', 'benefits', 'supervisor', 'responseDeadline', 'employerPhone', 'employerName', 'employerEmail']
  },

  {
    id: 'rejection_professional',
    name: 'Professional Rejection',
    subject: 'Update on your application - {{jobTitle}}',
    body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{companyName}} and for taking the time to interview with our team.

After careful consideration, we've decided to move forward with another candidate whose background more closely aligns with our immediate needs for this specific role.

This was a difficult decision, as you have impressive qualifications and experience. We were particularly impressed by {{positiveNote}}.

We'll keep your resume on file and will reach out if future opportunities arise that might be a good fit for your skills and interests.

Thank you again for your time and interest in {{companyName}}. We wish you all the best in your job search.

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'decision',
    variables: ['candidateName', 'jobTitle', 'companyName', 'positiveNote', 'employerName', 'employerEmail']
  },

  {
    id: 'rejection_encouraging',
    name: 'Encouraging Rejection',
    subject: 'Thank you for your application - {{jobTitle}}',
    body: `Hi {{candidateName}},

I wanted to personally reach out regarding your application for the {{jobTitle}} position at {{companyName}}.

While we won't be moving forward with your application for this particular role, I was genuinely impressed by {{positiveAspect}}. Your experience in {{strengthArea}} is valuable and will serve you well.

For future opportunities, I'd suggest {{constructiveFeedback}}. 

Please don't let this discourage you from applying to other positions with us in the future. We'd welcome the opportunity to consider you for roles that might be an even better fit.

Best of luck with your job search!

Warm regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'decision',
    variables: ['candidateName', 'jobTitle', 'companyName', 'positiveAspect', 'strengthArea', 'constructiveFeedback', 'employerName', 'employerEmail']
  },

  // Follow-up Templates
  {
    id: 'followup_post_interview',
    name: 'Post-Interview Follow-up',
    subject: 'Thank you for interviewing - {{jobTitle}}',
    body: `Hi {{candidateName}},

Thank you for taking the time to interview for the {{jobTitle}} position yesterday. It was great learning more about your background and discussing how you might contribute to our team.

I was particularly interested in your experience with {{discussedTopic}} and your ideas about {{candidateIdea}}.

We're currently finishing up our interview process and expect to make a decision by {{decisionTimeline}}. I'll be sure to keep you updated on our progress.

If you have any additional questions that came to mind after our conversation, please feel free to reach out.

Thanks again for your time and interest in {{companyName}}!

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'followup',
    variables: ['candidateName', 'jobTitle', 'discussedTopic', 'candidateIdea', 'decisionTimeline', 'companyName', 'employerName', 'employerEmail']
  },

  {
    id: 'reference_check',
    name: 'Reference Check Request',
    subject: 'Reference check - {{candidateName}} for {{jobTitle}}',
    body: `Hi {{candidateName}},

We're moving forward with the next step in our hiring process for the {{jobTitle}} position and would like to conduct reference checks.

Could you please provide contact information for {{numberOfReferences}} professional references? Ideally, these would be former supervisors or colleagues who can speak to your work performance and character.

For each reference, please provide:
• Name and title
• Company/organization
• Phone number and email
• Your working relationship and duration

You can reply to this email with the reference details, or call me at {{employerPhone}} if you'd prefer to discuss.

Thank you for your continued interest in the position!

Best regards,
{{employerName}}
{{companyName}}
{{employerEmail}}`,
    category: 'followup',
    variables: ['candidateName', 'jobTitle', 'numberOfReferences', 'employerPhone', 'employerName', 'companyName', 'employerEmail']
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
};

// Helper function to get template by ID
export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return EMAIL_TEMPLATES.find(template => template.id === id);
};

// Helper function to replace variables in template
export const populateTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } => {
  let subject = template.subject;
  let body = template.body;

  // Replace all variables in format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value || '');
    body = body.replace(regex, value || '');
  });

  // Handle conditional blocks (basic implementation)
  // {{#if variable}} content {{/if}}
  const conditionalRegex = /{{#if (\w+)}}([\s\S]*?){{\/if}}/g;
  body = body.replace(conditionalRegex, (match, variable, content) => {
    return variables[variable] ? content.trim() : '';
  });

  return { subject, body };
};

// Default variables for common fields
export const getDefaultVariables = (employerProfile?: any, jobDetails?: any): Record<string, string> => {
  return {
    companyName: employerProfile?.companyName || '[Company Name]',
    employerName: employerProfile?.name || '[Your Name]',
    employerEmail: employerProfile?.email || '[Your Email]',
    employerPhone: employerProfile?.phoneNumber || '[Your Phone]',
    companyWebsite: employerProfile?.website || '[Company Website]',
    jobTitle: jobDetails?.title || '[Job Title]',
    // Add more default mappings as needed
  };
};
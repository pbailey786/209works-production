import { ExampleRegistrationForm } from '@/components/forms/ExampleRegistrationForm';
import { Toaster } from '@/components/ui/toaster';

export default function FormValidationDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Form Validation Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demo showcases our comprehensive form validation system with React Hook Form, 
            Zod validation, error handling, and user-friendly feedback.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features Demonstrated</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Validation Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time validation with debouncing</li>
                  <li>• Strong password requirements with strength indicator</li>
                  <li>• Email format validation</li>
                  <li>• Phone number format validation</li>
                  <li>• LinkedIn URL validation</li>
                  <li>• File upload validation (type & size)</li>
                  <li>• Character count for text areas</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">User Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Loading states during form submission</li>
                  <li>• Success and error toast notifications</li>
                  <li>• Visual validation feedback (icons & colors)</li>
                  <li>• Unsaved changes warning</li>
                  <li>• Error boundary protection</li>
                  <li>• Accessible form labels and descriptions</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <ExampleRegistrationForm />
        
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Try it out:</strong> Fill out the form to see validation in action. 
              The form has a 50% chance of simulating success or failure for demonstration purposes.
            </p>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
} 
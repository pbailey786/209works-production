import { ExampleRegistrationForm } from '@/components/forms/ExampleRegistrationForm';
import { Toaster } from '@/components/ui/toaster';

export default function FormValidationDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Form Validation Demo
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            This demo showcases our comprehensive form validation system with
            React Hook Form, Zod validation, error handling, and user-friendly
            feedback.
          </p>
        </div>

        <div className="mb-8">
          <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              Features Demonstrated
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">
                  Validation Features
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Real-time validation with debouncing</li>
                  <li>
                    • Strong password requirements with strength indicator
                  </li>
                  <li>• Email format validation</li>
                  <li>• Phone number format validation</li>
                  <li>• LinkedIn URL validation</li>
                  <li>• File upload validation (type & size)</li>
                  <li>• Character count for text areas</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">
                  User Experience
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
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
          <div className="mx-auto max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Try it out:</strong> Fill out the form to see validation
              in action. The form has a 50% chance of simulating success or
              failure for demonstration purposes.
            </p>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}

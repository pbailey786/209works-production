// Action result types for server actions
export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Helper function to create success result
export function createSuccessResult(message?: string, data?: any): ActionResult {
  return {
    success: true,
    message,
    data,
  };
}

// Helper function to create error result
export function createErrorResult(error: string): ActionResult {
  return {
    success: false,
    error,
  };
}

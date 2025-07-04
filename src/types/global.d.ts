declare global {
  interface Window {
    trackJobSearch: (query: string, location?: string) => void;
    trackJobView: (jobId: string, jobTitle: string) => void;
    trackEmailSubscription: () => void;
    trackEmployerClick: (action: string) => void;
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

namespace jest {
  interface Matchers<R> {
    toBeValidEmail(): R;
    toBeValidUrl(): R;
    toBeValidJobType(): R;
    toHaveValidSalaryRange(): R;
    toBeWithinDateRange(startDate: Date, endDate: Date): R;
  }
}

export {};
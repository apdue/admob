export const CONFIG = {
  // Google Cloud Project ID
  GOOGLE_CLOUD_PROJECT: 'keen-zenith-452613-h0',
  
  // API Configuration
  API: {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    TIMEOUT: 30000,
  },

  // AdMob Configuration
  ADMOB: {
    PROJECT_ID: 'keen-zenith-452613-h0',
    DEFAULT_TIMEZONE: 'America/Los_Angeles',
    METRICS: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS'] as const,
    DIMENSIONS: ['COUNTRY', 'APP', 'DATE'] as const,
  },

  // Date Configuration
  DATE: {
    DEFAULT_FORMAT: 'MMM d, yyyy',
    API_FORMAT: 'yyyyMMdd',
  },
} as const;

// Type for the CONFIG object
export type Config = typeof CONFIG;

// Helper function to get string values from config
export const getConfigValue = <T extends keyof Config>(key: T): Config[T] => {
  const value = CONFIG[key];
  if (value === undefined) {
    throw new Error(`Missing configuration value: ${key}`);
  }
  return value;
};

// Helper function specifically for string values
export const getStringValue = (key: keyof Pick<Config, 'GOOGLE_CLOUD_PROJECT'>): string => {
  const value = CONFIG[key];
  if (typeof value !== 'string') {
    throw new Error(`Configuration value ${key} is not a string`);
  }
  return value;
}; 
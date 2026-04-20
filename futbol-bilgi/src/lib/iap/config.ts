export interface IapConfig {
  apple: {
    enabled: boolean;
    bundleId: string;
    sharedSecret?: string;
  };
  google: {
    enabled: boolean;
    packageName: string;
    serviceAccountEmail?: string;
    privateKey?: string;
  };
  mock: {
    enabled: boolean;
  };
}

export function getIapConfig(): IapConfig {
  return {
    apple: {
      enabled: process.env.IAP_APPLE_ENABLED === 'true',
      bundleId: process.env.APPLE_BUNDLE_ID ?? '',
      sharedSecret: process.env.APPLE_SHARED_SECRET,
    },
    google: {
      enabled: process.env.IAP_GOOGLE_ENABLED === 'true',
      packageName: process.env.GOOGLE_PACKAGE_NAME ?? '',
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    },
    mock: {
      enabled: process.env.IAP_MOCK_ENABLED === 'true' || process.env.NODE_ENV !== 'production',
    },
  };
}

import type { IapProvider } from './types';
import { hashValue, type VerifyPurchaseInput, type VerifyPurchaseResult } from '../verification';

export class MockIapProvider implements IapProvider {
  async verify(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
    return {
      isValid: true,
      status: 'verified',
      productId: input.productId,
      transactionId: input.transactionId ?? `${input.platform}-mock-${Date.now()}`,
      originalTransactionId: null,
      amountCents: null,
      currency: null,
      purchasedAt: new Date().toISOString(),
      expiresAt: null,
      rawResponse: {
        provider: 'mock',
        platform: input.platform,
        productId: input.productId,
      },
      receiptHash: hashValue(input.receipt),
      purchaseTokenHash: hashValue(input.purchaseToken),
    };
  }
}

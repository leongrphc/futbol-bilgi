import type { VerifyPurchaseInput, VerifyPurchaseResult } from '../verification';

export interface IapProvider {
  verify(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult>;
}

import { ErrorCode } from '../enums/error-code.js';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

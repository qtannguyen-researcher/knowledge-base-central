export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class TooManyRequestsError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TooManyRequestsError';
  }
}

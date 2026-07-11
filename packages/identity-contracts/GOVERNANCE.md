# Identity Contracts Governance

This package follows strict semantic versioning and contract governance rules to ensure stability across service boundaries.

## Semantic Versioning

This package uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes

## Version Support Policy

| Version Bump | Consumer Action Required          | Deprecation Period        |
| ------------ | --------------------------------- | ------------------------- |
| PATCH        | None — transparent upgrade        | N/A                       |
| MINOR        | Optional — new features available | N/A (backward-compatible) |
| MAJOR        | Required — update to new API      | 90 days minimum           |

## Breaking Change Rules

1. **Breaking changes MUST** be released as a MAJOR version bump.
2. **Breaking changes MUST** include a migration guide in the CHANGELOG.
3. **Deprecated elements MUST** remain functional for at least 90 days after deprecation announcement.
4. **Services MUST NOT** accept unsupported contract versions (enforced at runtime).
5. **Contract version negotiation** MUST be supported for backward-compatible transitions.

## Deprecation Process

1. Announce deprecation in the CHANGELOG with a clear timeline.
2. Add deprecation warnings in TypeScript types (if applicable).
3. Maintain backward compatibility for the 90-day minimum period.
4. Remove deprecated elements only after the deprecation period has elapsed.
5. Update all internal consumers before removing deprecated elements.

## Contract Stability Requirements

- All public exports are considered part of the stable API surface.
- Internal implementation details (marked as private/internal) may change without notice.
- Pact contracts are versioned alongside the package version.
- Consumer-driven contract tests MUST be updated when contracts change.

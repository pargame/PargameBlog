# Commenting rules for this repo

Purpose
- Make code easier to understand for future contributors.
- Keep comments concise, factual, and up-to-date.

Top-of-file header
- Every module should start with a short header (3-6 lines):
  - path of the file (optional)
  - single-sentence responsibility description
  - important public exports / props summary

Public exports / props
- For exported functions/components, add a short param/return description using JSDoc where helpful.
- For React components, document prop interface above the interface/type declaration.

Inline comments
- Use short paragraph comments for non-trivial logic sections (why vs what).
- Avoid commenting obvious code (don't restate what is already clear).

TODOs and Deprecated
- Use `// TODO:` for actionable future work.
- Use `// @deprecated` on top of deprecated exports and link to recommended alternative.
 
Markers and conventions
- Use `// TODO:` only for short, actionable tasks. Include an owner or PR when appropriate: `// TODO(owner): reason`.
- Use `// FIXME:` for known bugs that must be addressed before shipping. Prefer linking to an issue: `// FIXME(#123): description`.
- Use `// LEGACY:` for code or APIs kept for backward compatibility. Add a short migration note and a planned removal timeline if available.
- Avoid leaving `TODO`/`FIXME` indefinitely; reviewers should convert them into issues or resolve before long-lived merges.

Examples
- File header example:
  /**
   * src/foo/bar.ts
   * Responsibility: Manage widget lifecycle and state transitions
   * Export: createWidget(options)
   */

- Small function example:
  /**
   * computeScore(user, options)
   * - user: User object
   * - returns: normalized score number
   */

Review
- Keep comments updated with PRs that change the code. CI does not validate comments but reviewers should ensure comments remain accurate.

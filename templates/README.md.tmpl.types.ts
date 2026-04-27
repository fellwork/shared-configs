/**
 * Context type for templates/README.md.tmpl.
 * Foreman type-checks renders against this shape.
 */
export type Context = {
  repo_name: string
  description: string
}

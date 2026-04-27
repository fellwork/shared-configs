/**
 * Context type for templates/fly.toml.tmpl.
 */
export type Context = {
  app_name: string
  primary_region: string
  internal_port: number
}

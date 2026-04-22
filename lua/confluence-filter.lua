-- Lua filter for Confluence/Jira output.
-- 1. Strips IDs from headers to prevent {anchor:...} macros being emitted.
-- 2. Removes raw blocks (e.g. \newpage LaTeX commands) so they don't appear
--    as escaped text in the Confluence output.

function Header(el)
  el.identifier = ""
  return el
end

function RawBlock(_)
  return {}
end

function RawInline(_)
  return {}
end

-- Lua filter: distribute full line width across columns proportionally to their
-- content, and wrap each table in \footnotesize...\normalsize for PDF output.

local TOTAL_WIDTH = 0.97  -- leaves a small margin for column separators

-- Return the length of the longest line in a stringified cell
local function cell_width(cell)
  local text = pandoc.utils.stringify(cell.contents)
  local max = 0
  for line in (text .. "\n"):gmatch("([^\n]*)\n") do
    if #line > max then max = #line end
  end
  return math.max(max, 1)
end

function Table(tbl)
  local n = #tbl.colspecs
  if n == 0 then return end

  -- Collect max content width per column across head and body rows
  local maxw = {}
  for i = 1, n do maxw[i] = 1 end

  local function measure_row(row)
    for i, cell in ipairs(row.cells) do
      if i <= n then
        local w = cell_width(cell)
        if w > maxw[i] then maxw[i] = w end
      end
    end
  end

  -- Header rows
  for _, head_row in ipairs(tbl.head.rows) do
    measure_row(head_row)
  end
  -- Body rows
  for _, body in ipairs(tbl.bodies) do
    for _, row in ipairs(body.body) do
      measure_row(row)
    end
  end

  -- Sum of all max widths
  local total = 0
  for i = 1, n do total = total + maxw[i] end

  -- Assign proportional widths
  for i = 1, n do
    tbl.colspecs[i][2] = (maxw[i] / total) * TOTAL_WIDTH
  end

  local before = pandoc.RawBlock("latex", "\\footnotesize")
  local after  = pandoc.RawBlock("latex", "\\normalsize")
  return { before, tbl, after }
end

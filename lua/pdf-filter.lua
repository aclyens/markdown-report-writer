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

-- Build the figure LaTeX for a given image path and caption string.
-- width / height are optional LaTeX dimension strings (e.g. "0.8\linewidth").
local function make_figure_latex(path, caption, width, height)
  local adj_opts
  if width or height then
    local parts = {}
    if width  then parts[#parts + 1] = 'width='  .. width  end
    if height then parts[#parts + 1] = 'height=' .. height end
    parts[#parts + 1] = 'keepaspectratio'
    adj_opts = table.concat(parts, ',')
  else
    adj_opts = 'max width=\\linewidth,max height=0.9\\textheight,keepaspectratio'
  end
  return string.format(
    '\\begin{figure}[H]\n' ..
    '  \\centering\n' ..
    '  \\adjustimage{%s}{%s}\n' ..
    (caption ~= '' and ('  \\caption{' .. caption .. '}\n') or '') ..
    '\\end{figure}',
    adj_opts,
    path
  )
end

-- Convert a pandoc percentage dimension string to a LaTeX dimension.
-- e.g. parse_percent("80%", "\\linewidth") → "0.8\\linewidth"
-- Returns nil if val is nil or not a valid percentage.
local function parse_percent(val, linedim)
  if not val then return nil end
  local n = tonumber(string.match(val, '^(%d+%.?%d*)%%$'))
  if n then
    return string.format('%.6g%s', n / 100, linedim)
  end
  return nil
end

-- Handle standalone figures (pandoc 3.x Figure AST element).
-- This runs in a separate first pass so the image path can be read before
-- the Image handler below replaces the inner Image node.
local function handle_Figure(fig)
  local path = ''
  local img_attrs = {}
  for _, block in ipairs(fig.content) do
    if block.t == 'Plain' or block.t == 'Para' then
      for _, inline in ipairs(block.content) do
        if inline.t == 'Image' then
          path = inline.src
          img_attrs = inline.attr.attributes
          break
        end
      end
    end
    if path ~= '' then break end
  end
  if path == '' then return end

  local caption = pandoc.utils.stringify(fig.caption.long)
  local width  = parse_percent(img_attrs['width'],  '\\linewidth')
  local height = parse_percent(img_attrs['height'], '\\textheight')
  return pandoc.RawBlock('latex', make_figure_latex(path, caption, width, height))
end

-- Scale images to fit within the line width without upscaling or warping.
-- Requires the LaTeX `adjustbox` package (included in TeX Live / MiKTeX).
-- In pandoc 3.x this only fires for inline (non-standalone) images because
-- standalone ones are already handled by handle_Figure above.
local function handle_Image(img)
  local path = img.src
  local caption = pandoc.utils.stringify(img.caption)
  local attrs = img.attr.attributes
  local width  = parse_percent(attrs['width'],  '\\linewidth')
  local height = parse_percent(attrs['height'], '\\textheight')
  return pandoc.RawInline('latex', make_figure_latex(path, caption, width, height))
end

-- Run Figure handler first (so it sees the original Image node inside),
-- then Table and Image handlers in a second pass.
return {
  { Figure = handle_Figure },
  { Table = Table, Image = handle_Image },
}

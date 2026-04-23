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
local function make_figure_latex(path, caption)
  return string.format(
    '\\begin{figure}[H]\n' ..
    '  \\centering\n' ..
    '  \\adjustimage{max width=\\linewidth,keepaspectratio}{%s}\n' ..
    (caption ~= '' and ('  \\caption{' .. caption .. '}\n') or '') ..
    '\\end{figure}',
    path
  )
end

-- Handle standalone figures (pandoc 3.x Figure AST element).
-- This runs in a separate first pass so the image path can be read before
-- the Image handler below replaces the inner Image node.
local function handle_Figure(fig)
  local path = ''
  for _, block in ipairs(fig.content) do
    if block.t == 'Plain' or block.t == 'Para' then
      for _, inline in ipairs(block.content) do
        if inline.t == 'Image' then
          path = inline.src
          break
        end
      end
    end
    if path ~= '' then break end
  end
  if path == '' then return end

  local caption = pandoc.utils.stringify(fig.caption.long)
  return pandoc.RawBlock('latex', make_figure_latex(path, caption))
end

-- Scale images to fit within the line width without upscaling or warping.
-- Requires the LaTeX `adjustbox` package (included in TeX Live / MiKTeX).
-- In pandoc 3.x this only fires for inline (non-standalone) images because
-- standalone ones are already handled by handle_Figure above.
local function handle_Image(img)
  local path = img.src
  local caption = pandoc.utils.stringify(img.caption)
  return pandoc.RawInline('latex', make_figure_latex(path, caption))
end

-- Run Figure handler first (so it sees the original Image node inside),
-- then Table and Image handlers in a second pass.
return {
  { Figure = handle_Figure },
  { Table = Table, Image = handle_Image },
}

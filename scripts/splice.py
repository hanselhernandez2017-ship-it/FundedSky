"""Replace the board section of a design page with its live version.
usage: splice.py <page.js> <start marker> <end marker> <new section file>"""
import sys
page, start, end, new = sys.argv[1:5]
s = open(page).read()
a = s.index(start)
b = s.index(end, a)
s = s[:a] + open(new).read().rstrip() + '\n' + s[b:]
open(page, 'w').write(s)
print('spliced', page, a, b)

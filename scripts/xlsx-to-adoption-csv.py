# Converts the "Donkey Adoption List APP FINAL" xlsx (Numbers export) into
# src/lib/data/donkey-adoption.csv in the FINAL unified column layout that
# scripts/parse-adoption-csv.ts consumes.
#
# Usage: python scripts/xlsx-to-adoption-csv.py "<path-to-xlsx>"
import csv
import re
import sys

import openpyxl

SRC = sys.argv[1]
OUT = "src/lib/data/donkey-adoption.csv"
SHEET = "Donkey Dreams - Current"

HEADER = [
    "", "mom/baby", "bonded", "Special Needs", "Over 20", "Under 3 yrs",
    "Needs Chip?", "Herd", "Gender", "Size", "Color", "Adopted", "Avid #",
    "Birth Date", "Origin", "Relationships", "Notes", "Medical",
    "Special Needs", "Last Annual Exam", "Trim History", "Dewormed Date",
    "Deworming History", "Next Vaccination", "Vaccination History",
    "Vaccination Date",
]

DATE_COLS = {11, 13, 19, 21, 23, 25}


def fmt(val, col):
    if val is None:
        return ""
    if hasattr(val, "year"):  # datetime → M/D/YYYY (parser normalizes)
        return f"{val.month}/{val.day}/{val.year}"
    if isinstance(val, float) and val == int(val) and col not in (2,):
        val = int(val)
    s = str(val)
    s = re.sub(r"[\t\r\n]+", " ", s).strip()
    return s


wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb[SHEET]

rows = []
for row in ws.iter_rows(min_row=2):
    vals = [c.value for c in row]
    name = fmt(vals[0], 0)
    if not name:
        continue  # skips the totals row and blank rows
    rows.append([fmt(vals[i], i) for i in range(26)])

with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(HEADER)
    w.writerows(rows)

print(f"Wrote {len(rows)} donkeys to {OUT}")

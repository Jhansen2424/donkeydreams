# Converts the "Deworming and Vaccination Checklist APP FINAL" xlsx (Numbers
# export) into:
#   - src/lib/data/deworming-vaccination.csv   (per-donkey table)
#   - src/lib/data/yard-wide-deworming.csv     (yard-wide schedule, deduped)
# Both are consumed by scripts/parse-deworming-csv.ts.
#
# The Numbers sheet stacks two tables: per-donkey rows (Herd = a real herd
# name) and the yard-wide dosing table (Name = PREV-HERD-N, repeated once per
# herd — collapsed here by (date, drug, dose)).
#
# Usage: python scripts/xlsx-to-deworming-csv.py "<path-to-xlsx>"
import csv
import re
import sys

import openpyxl

SRC = sys.argv[1]
SHEET = "Donkey Dreams - Current"
OUT_MAIN = "src/lib/data/deworming-vaccination.csv"
OUT_YARD = "src/lib/data/yard-wide-deworming.csv"

HERDS = {"Angels", "Brave", "Dragons", "Elsie", "Legacy", "Pegasus", "Pink", "Senior", "Seniors", "Unicorns"}

MAIN_HEADER = [
    "", "Herd", "Dewormed Date", "Deworming History", "Vaccinated",
    "Vaccination History", "Vaccination Date", "Next Vaccination", "Notes",
]
YARD_HEADER = ["Date", "Drug", "Dose"]


def fmt(val):
    if val is None:
        return ""
    if hasattr(val, "year"):
        return f"{val.month}/{val.day}/{val.year}"
    s = re.sub(r"[\t\r\n]+", " ", str(val)).strip()
    return s


wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb[SHEET]

main_rows = []
yard = {}
for row in ws.iter_rows(min_row=2):
    v = [c.value for c in row]
    name = fmt(v[0])
    if not name:
        continue
    herd = fmt(v[1]) if len(v) > 1 else ""
    if herd in HERDS:
        main_rows.append([fmt(v[i]) if i < len(v) else "" for i in range(9)])
    elif name.upper().startswith("PREV-HERD"):
        # Yard-wide row: cols are Next Deworming Date, Dewormer, Dose note
        date, drug, dose = fmt(v[1]), fmt(v[2]), fmt(v[3])
        if date and drug:
            yard[(date, drug, dose)] = None  # insertion-ordered dedupe

with open(OUT_MAIN, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(MAIN_HEADER)
    w.writerows(main_rows)

with open(OUT_YARD, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(YARD_HEADER)
    for (date, drug, dose) in yard:
        w.writerow([date, drug, dose])

print(f"Wrote {len(main_rows)} donkeys to {OUT_MAIN}")
print(f"Wrote {len(yard)} yard-wide protocol rows to {OUT_YARD}")

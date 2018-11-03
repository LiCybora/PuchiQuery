import csv
import json
import os
import sys

def readJson(filename):
    with open(filename, 'r', encoding="UTF-8") as json_file:
        jsonString = json_file.read()
        table = json.loads(jsonString)
    return table

if len(sys.argv) > 2:
    print("Usage: python csv2json.py <csv file name>")
elif len(sys.argv) == 2:
    file = sys.argv[1]
else:
    file = 'template.json'

d = readJson(file)
header = 'Text, Translation\n'
for i in d:
    header = header + i + ', ' + d[i] + '\n'

with open("template.csv", 'w', encoding="UTF-8") as f:
    f.write(header)

print("Done!")

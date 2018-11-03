import csv
import json
import os
import sys

def csv2json(filename, outpath='./'):
    with open(filename, 'r', encoding='UTF-8') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        key = []
        d = {}
        for row in csv_reader:
            if line_count == 0:
                # ignore field header for object file
                pass
            else:
                # Depending yout language, you may not want strip for latins.
                d[row[0]] = row[1].strip(' ')
            line_count += 1

    with open(os.path.join(outpath, filename).replace('.csv', '.json'), 'w', encoding='UTF-8') as json_file:
        jsonStr = json.dumps(d, ensure_ascii=False)
        json_file.write(jsonStr)
    print("Done!")


if len(sys.argv) > 2:
    print("Usage: python csv2json.py <csv file name>")
elif len(sys.argv) == 2:
    csv2json(sys.argv[1])
else:
    csv2json('template.csv')


import json

with open('data/stoic-content.json', 'r') as f:
    data = json.load(f)

with open('quotes_list.txt', 'w') as f:
    for entry in data:
        if 'quote' in entry:
            f.write(entry['quote'] + '\n')

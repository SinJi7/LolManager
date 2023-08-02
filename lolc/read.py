import json 

with open("./matches.json", "r") as f:
    data = json.load(f)
    print(data)
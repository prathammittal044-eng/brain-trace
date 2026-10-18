from pathlib import Path
from collections import defaultdict
import re

DATASET = Path("model2_data")

groups = defaultdict(list)

for split in ["train", "valid", "test"]:
    for img in DATASET.rglob(f"{split}/**/*"):

        if img.is_file():

            # remove Roboflow suffix
            base = re.sub(r"\.rf\..*", "", img.name)

            groups[base].append((split, img))

print("="*60)
print("SAME ORIGINAL IMAGE IN MULTIPLE SPLITS")
print("="*60)

count = 0

for base, files in groups.items():

    splits = {s for s,_ in files}

    if len(splits) > 1:

        count += 1

        print(f"\n{base}")

        for f in files:
            print(f)

print("\nLeaks:", count)
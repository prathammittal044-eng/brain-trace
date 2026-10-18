import random
import shutil
from pathlib import Path

from sklearn.model_selection import train_test_split

# Configuration

BASE_DIR = Path(__file__).parent

RAW_DATASET = BASE_DIR / "model1data"
OUTPUT_DATASET = BASE_DIR / "model1_split"

TRAIN_SIZE = 0.80
VAL_SIZE = 0.20

RANDOM_SEED = 42

random.seed(RANDOM_SEED)

# Remove old split

if OUTPUT_DATASET.exists():
    shutil.rmtree(OUTPUT_DATASET)

# Create folders

for split in ["train", "val"]:
    for cls in ["MRI_DATA", "NON_MRI_DATA"]:
        (OUTPUT_DATASET / split / cls).mkdir(parents=True, exist_ok=True)

# Split a class

def split_class(class_name):

    source_folder = RAW_DATASET / class_name

    image_files = []

    for extension in (
        "*.jpg",
        "*.jpeg",
        "*.png",
        "*.bmp",
        "*.tif",
        "*.tiff",
    ):
        image_files.extend(source_folder.glob(extension))

    image_files = sorted(image_files)

    train_files, val_files = train_test_split(
        image_files,
        train_size=TRAIN_SIZE,
        random_state=RANDOM_SEED,
        shuffle=True,
    )

    split_map = {
        "train": train_files,
        "val": val_files,
    }

    for split_name, files in split_map.items():

        destination = OUTPUT_DATASET / split_name / class_name

        for image_path in files:
            shutil.copy2(
                image_path,
                destination / image_path.name,
            )

    return (
        len(train_files),
        len(val_files),
    )

# Process classes

summary = {}

for class_name in ["MRI_DATA", "NON_MRI_DATA"]:
    summary[class_name] = split_class(class_name)

# Summary

print("\nDataset Split Complete!\n")

print("-" * 42)
print(f"{'Class':<15}{'Train':>12}{'Validation':>15}")
print("-" * 42)

for cls, counts in summary.items():
    print(
        f"{cls:<15}"
        f"{counts[0]:>12}"
        f"{counts[1]:>15}"
    )

print("-" * 42)

print("\nDataset Location:")
print(OUTPUT_DATASET.resolve())
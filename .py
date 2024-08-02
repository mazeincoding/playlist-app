import os

def log_music_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.flac', '.aac', '.ogg')):
                relative_path = os.path.relpath(os.path.join(root, file), directory)
                print(f"music / {relative_path}")

# Usage
log_music_files('music')

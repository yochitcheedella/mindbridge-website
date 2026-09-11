import requests
import sys
import os

def upload_file(filepath):
    print(f"Uploading {filepath} to bashupload.com...")
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        response = requests.post(f'https://bashupload.com/{filename}', data=f)
    
    if response.status_code == 200:
        print("Upload successful!")
        print("Share this link:")
        print(response.text)
    else:
        print("Upload failed with status code:", response.status_code)
        print(response.text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_apk.py <filepath>")
        sys.exit(1)
    upload_file(sys.argv[1])

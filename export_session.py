import os
import zipfile
import base64

def zip_session():
    folder_to_zip = '.wwebjs_auth'
    output_zip = 'session.zip'

    if not os.path.exists(folder_to_zip):
        print(f"Error: {folder_to_zip} folder not found. Please authenticate locally first.")
        return

    print("Zipping session...")
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_to_zip):
            for file in files:
                zipf.write(os.path.join(root, file))

    print("Encoding to Base64...")
    with open(output_zip, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')

    print("\n--- COPY THE TEXT BELOW TO GITHUB SECRETS (WPP_SESSION) ---")
    print(encoded_string)
    print("--- END OF TEXT ---\n")

    os.remove(output_zip)

if __name__ == "__main__":
    zip_session()

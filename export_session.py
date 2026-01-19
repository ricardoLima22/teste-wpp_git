import os
import zipfile
import base64

def zip_session():
    folder_to_zip = '.wwebjs_auth'
    output_zip = 'session.zip'

    if not os.path.exists(folder_to_zip):
        print(f"Error: {folder_to_zip} folder not found. Please authenticate locally first.")
        return

    # Aggressive list of keywords/paths to ignore
    ignore_list = [
        'Cache', 'GPUCache', 'Service Worker', 'IndexedDB', 'Code Cache', 
        'blob_storage', 'VideoDecodeStats', 'Platform Notifications',
        'LOG', 'LOG.old', 'LOCK', '.tmp', 'QuotaManager', 
        'Reporting and NEL', 'Trust Tokens', 'Segmentation Platform',
        'Web Data', 'History', 'Login Data', 'Favicons', 'shared_proto_db',
        'Collaboration', 'DataSharing', 'Extension', 'GCM Store', 'Sessions',
        'Sync Data', 'Shared Dictionary', 'Site Characteristics', 'BudgetDatabase',
        'chrome_cart_db', 'commerce_subscription_db', 'discounts_db', 'discount_infos_db',
        'parcel_tracking_db', 'power_bookmarks', 'Safe Browsing', 'segmentation_platform'
    ]

    print("Zipping session (Aggressive pruning)...")
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_to_zip):
            # Prune directories from search
            dirs[:] = [d for d in dirs if not any(x in d for x in ignore_list)]
            
            for file in files:
                if any(x in file for x in ignore_list):
                    continue
                
                file_path = os.path.join(root, file)
                
                # Filter for only essential authentication files
                # 1. Local Storage (LevelDB)
                # 2. Network (Cookies)
                # 3. Local State / Preferences at root
                is_essential = any(x in file_path for x in ['Local Storage', 'Network', 'Local State', 'Preferences'])
                
                if is_essential:
                    zipf.write(file_path)

    zip_size = os.path.getsize(output_zip)
    print(f"Success! Zip size: {zip_size / 1024:.2f} KB")
    
    if zip_size > 40000: # 40KB zip -> ~53KB Base64. Safe margin for 64KB limit.
        print("Warning: Session might still be tight for GitHub Secrets.")
    
    print("Encoding to Base64...")
    with open(output_zip, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')

    print("\n--- COPY THE TEXT BELOW TO GITHUB SECRETS (WPP_SESSION) ---")
    print(encoded_string)
    print("--- END OF TEXT ---\n")

    os.remove(output_zip)

if __name__ == "__main__":
    zip_session()

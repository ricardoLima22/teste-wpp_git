import pandas as pd
import subprocess
import os

def send_whatsapp_file(recipient, file_path, caption=""):
    node_script = "whatsapp_sender.js"
    if not os.path.exists(node_script):
        # Specific search in case CWD is different
        node_script = os.path.join(os.path.dirname(__file__), "whatsapp_sender.js")
    
    if not os.path.exists(node_script):
        print(f"Error: {node_script} not found.")
        return False

    cmd = ["node", node_script, recipient, caption, os.path.abspath(file_path)]
    print(f"Sending file to {recipient}...")
    
    try:
        # Removing capture_output so the user can see progress (QR code if needed, "Ready", etc.)
        subprocess.run(cmd, check=True)
        print("Success sending file via WhatsApp.")
        return True
    except subprocess.CalledProcessError as e:
        print("Error sending via WhatsApp.")
        return False

def main():
    # Use relative path for GitHub Actions/Cross-platform compatibility
    file_to_send = os.path.join("docs", "RS_Registros_de_ponto_(19.01.2026).xlsx")
    
    # Keeping the user's specific read parameters if they added them
    try:
        df = pd.read_excel(file_to_send, skiprows=3, header=0)
        print(df)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    print("File processed. Now sending via WhatsApp...")

    # IMPORTANT: Change 'NAME_OF_GROUP_OR_CONTACT' to the actual name on your WhatsApp
    recipient_name = "REGISTRO DE PONTO" 
    send_whatsapp_file(recipient_name, file_to_send, "TESTETESTETSETSETSETSETSETSETSET")

if __name__ == "__main__":
    main()
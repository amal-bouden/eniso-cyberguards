import subprocess
import os
import tempfile
import sys

def main():
    html_path = os.path.abspath('deployment_guide.html')
    pdf_path = os.path.abspath('ENISO_CyberGuards_Deployment_Guide.pdf')
    edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    
    if not os.path.exists(edge_path):
        print(f"Edge not found at {edge_path}")
        sys.exit(1)
        
    temp_profile = tempfile.mkdtemp(prefix="edge_pdf_")
    url = 'file:///' + html_path.replace('\\', '/')
    
    cmd = [
        edge_path,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        f'--user-data-dir={temp_profile}',
        '--no-pdf-header-footer',
        f'--print-to-pdf={pdf_path}',
        url
    ]
    
    print("Running command:", " ".join(cmd))
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    print("Exit code:", proc.returncode)
    print("Stdout:", proc.stdout)
    print("Stderr:", proc.stderr)
    
    if os.path.exists(pdf_path):
        size = os.path.getsize(pdf_path)
        print(f"SUCCESS: PDF created at {pdf_path} (size: {size} bytes)")
    else:
        print("FAILED: PDF not found")

if __name__ == '__main__':
    main()

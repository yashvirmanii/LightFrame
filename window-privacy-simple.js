const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const execAsync = promisify(exec);

class WindowPrivacySimple {
  static async compileProtectionTool() {
    try {
      const exePath = path.join(__dirname, 'SetWindowProtection.exe');
      
      // Check if already compiled
      if (fs.existsSync(exePath)) {
        return exePath;
      }
      
      console.log('Compiling protection tool...');
      const csPath = path.join(__dirname, 'SetWindowProtection.cs');
      
      // Compile the C# program
      await execAsync(`csc /out:"${exePath}" "${csPath}"`);
      
      return exePath;
    } catch (error) {
      console.log('Could not compile protection tool:', error.message);
      return null;
    }
  }

  static async setScreenCaptureProtection(windowHandle) {
    try {
      if (process.platform !== 'win32') {
        console.log('Screen capture protection only available on Windows');
        return false;
      }

      // Convert Buffer to decimal
      const hwndBuffer = Buffer.from(windowHandle);
      const hwndInt = hwndBuffer.readBigUInt64LE(0);
      
      console.log('Setting protection for window handle:', hwndInt.toString());

      // Try to compile and use the C# tool
      const exePath = await this.compileProtectionTool();
      
      if (exePath && fs.existsSync(exePath)) {
        const { stdout, stderr } = await execAsync(`"${exePath}" ${hwndInt.toString()}`);
        console.log('Protection tool output:', stdout);
        if (stderr) console.log('Protection tool errors:', stderr);
        
        return stdout.includes('Protection set: True');
      } else {
        // Fallback to PowerShell with proper escaping
        console.log('Using PowerShell fallback...');
        const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);
    
    public const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011;
}
"@

try {
    \\$hwnd = [IntPtr]${hwndInt.toString()}
    \\$result = [Win32]::SetWindowDisplayAffinity(\\$hwnd, [Win32]::WDA_EXCLUDEFROMCAPTURE)
    Write-Output "Protection set: \\$result"
} catch {
    Write-Output "Protection set: False"
    Write-Error \\$_.Exception.Message
}`;
        
        const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -Command "${script}"`);
        console.log('PowerShell output:', stdout);
        if (stderr) console.log('PowerShell errors:', stderr);
        
        return stdout.includes('Protection set: True');
      }
      
    } catch (error) {
      console.error('Error setting screen capture protection:', error.message);
      return false;
    }
  }

  static setBasicProtection(browserWindow) {
    try {
      // Electron built-in methods for basic protection
      if (process.platform === 'win32') {
        // Set content protection flag
        browserWindow.setContentProtection(true);
        
        // Additional Electron flags that may help
        browserWindow.webContents.once('dom-ready', () => {
          browserWindow.webContents.executeJavaScript(`
            // Disable right-click context menu to prevent some screenshot tools
            document.addEventListener('contextmenu', e => e.preventDefault());
            
            // Add visual indicator that screenshots are blocked
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            
            // Disable drag and drop
            document.addEventListener('dragstart', e => e.preventDefault());
            document.addEventListener('drop', e => e.preventDefault());
          `);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting basic protection:', error.message);
      return false;
    }
  }
}

module.exports = WindowPrivacySimple;
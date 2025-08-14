using System;
using System.Runtime.InteropServices;

class SetWindowProtection
{
    [DllImport("user32.dll")]
    static extern bool SetWindowDisplayAffinity(IntPtr hWnd, uint dwAffinity);
    
    const uint WDA_EXCLUDEFROMCAPTURE = 0x00000011;
    
    static void Main(string[] args)
    {
        if (args.Length != 1)
        {
            Console.WriteLine("Usage: SetWindowProtection.exe <window_handle>");
            Console.WriteLine("Protection set: False");
            return;
        }
        
        try
        {
            // Parse the window handle from command line argument
            IntPtr hwnd = new IntPtr(long.Parse(args[0]));
            
            // Apply the protection
            bool result = SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
            
            Console.WriteLine($"Protection set: {result}");
            
            if (result)
            {
                Console.WriteLine("Window is now excluded from screen capture");
            }
            else
            {
                Console.WriteLine("Failed to exclude window from screen capture");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine("Protection set: False");
        }
    }
}
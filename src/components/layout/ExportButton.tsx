'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { domToCanvas } from 'modern-screenshot';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const ExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById('report-content');
    if (!element) {
      toast.error('Could not find content to export');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF report...');

    try {
      // Capture the element using modern-screenshot which supports oklch
      const canvas = await domToCanvas(element, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#f9fafb',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions in mm (approx 3.78 pixels per mm at 96 DPI, but we use scale: 2)
      // Since we want edge-to-edge, we'll use the canvas aspect ratio to define the PDF size
      const pdfWidth = 210; // Standard A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Create PDF with custom height to match content exactly
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      // Add image at 0,0 with exactly the PDF dimensions
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Download the PDF
      const fileName = `gsc-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Report downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate PDF report', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
      title="Download PDF Report"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;

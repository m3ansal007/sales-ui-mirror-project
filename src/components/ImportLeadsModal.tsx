import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: any[]) => Promise<void>;
}

interface ParsedLead {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  source?: string;
  notes?: string;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    if (fileExtension === 'csv') {
      parseCSVFile(file);
    } else {
      parseExcelFile(file);
    }
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const leads = processRawData(results.data);
        setParsedLeads(leads);
        setPreviewMode(true);
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "Parsing Error",
          description: "Failed to parse CSV file. Please check the file format.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    });
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert array format to object format with headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const objectData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        const leads = processRawData(objectData);
        setParsedLeads(leads);
        setPreviewMode(true);
        setIsProcessing(false);
      } catch (error) {
        console.error('Excel parsing error:', error);
        toast({
          title: "Parsing Error",
          description: "Failed to parse Excel file. Please check the file format.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRawData = (rawData: any[]): ParsedLead[] => {
    return rawData.map((row: any) => {
      // Smart field mapping - look for common column names
      const lead: ParsedLead = {
        name: findFieldValue(row, ['name', 'full name', 'fullname', 'contact name', 'lead name', 'customer name']),
        email: findFieldValue(row, ['email', 'email address', 'e-mail', 'mail']),
        phone: findFieldValue(row, ['phone', 'phone number', 'mobile', 'contact', 'tel', 'telephone']),
        company: findFieldValue(row, ['company', 'company name', 'organization', 'business', 'firm']),
        location: findFieldValue(row, ['location', 'address', 'city', 'state', 'country', 'region']),
        source: findFieldValue(row, ['source', 'lead source', 'origin', 'channel']),
        notes: findFieldValue(row, ['notes', 'comments', 'description', 'remarks'])
      };

      // Remove empty fields
      Object.keys(lead).forEach(key => {
        if (!lead[key as keyof ParsedLead] || lead[key as keyof ParsedLead]?.toString().trim() === '') {
          delete lead[key as keyof ParsedLead];
        }
      });

      return lead;
    }).filter(lead => lead.name && lead.name.trim() !== ''); // Only include leads with names
  };

  const findFieldValue = (row: any, possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      // Check exact match (case insensitive)
      const exactMatch = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
      if (exactMatch && row[exactMatch]) {
        return row[exactMatch].toString().trim();
      }
      
      // Check partial match (case insensitive)
      const partialMatch = Object.keys(row).find(k => 
        k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase())
      );
      if (partialMatch && row[partialMatch]) {
        return row[partialMatch].toString().trim();
      }
    }
    return '';
  };

  const handleImport = async () => {
    if (parsedLeads.length === 0) return;

    setIsProcessing(true);
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Process leads in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < parsedLeads.length; i += batchSize) {
        const batch = parsedLeads.slice(i, i + batchSize);
        
        for (const lead of batch) {
          try {
            await onImport([{
              ...lead,
              status: 'New',
              source: lead.source || 'Import'
            }]);
            successful++;
          } catch (error) {
            failed++;
            errors.push(`${lead.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({ successful, failed, errors });
      
      if (successful > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successful} leads${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetModal = () => {
    setParsedLeads([]);
    setPreviewMode(false);
    setImportResults(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Leads from CSV/Excel
          </DialogTitle>
        </DialogHeader>

        {!previewMode && !importResults ? (
          <div className="space-y-6">
            <div className="text-slate-300 text-sm">
              <p className="mb-2">Upload a CSV or Excel file containing your leads. The system will automatically detect and map the following fields:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong>Name:</strong> Required - Contact name, full name, lead name</li>
                <li><strong>Email:</strong> Email address, e-mail</li>
                <li><strong>Phone:</strong> Phone number, mobile, contact</li>
                <li><strong>Company:</strong> Company name, organization, business</li>
                <li><strong>Location:</strong> Address, city, state, country</li>
                <li><strong>Source:</strong> Lead source, origin, channel</li>
              </ul>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-white mb-2">
                {isProcessing ? 'Processing file...' : 'Drag and drop your file here, or click to browse'}
              </p>
              <p className="text-slate-400 text-sm mb-4">
                Supports CSV, XLSX, and XLS files
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
        ) : previewMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">
                Preview: {parsedLeads.length} leads found
              </h3>
              <Button
                onClick={resetModal}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                <X className="w-4 h-4 mr-1" />
                Start Over
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-700 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-slate-300">Name</th>
                    <th className="text-left p-3 text-slate-300">Email</th>
                    <th className="text-left p-3 text-slate-300">Phone</th>
                    <th className="text-left p-3 text-slate-300">Company</th>
                    <th className="text-left p-3 text-slate-300">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLeads.slice(0, 50).map((lead, index) => (
                    <tr key={index} className="border-t border-slate-700 hover:bg-slate-800/50">
                      <td className="p-3 text-white">{lead.name}</td>
                      <td className="p-3 text-slate-300">{lead.email || '-'}</td>
                      <td className="p-3 text-slate-300">{lead.phone || '-'}</td>
                      <td className="p-3 text-slate-300">{lead.company || '-'}</td>
                      <td className="p-3 text-slate-300">{lead.location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedLeads.length > 50 && (
                <div className="p-3 text-center text-slate-400 text-sm border-t border-slate-700">
                  ... and {parsedLeads.length - 50} more leads
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Importing...' : `Import ${parsedLeads.length} Leads`}
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : importResults ? (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-white text-xl font-medium mb-2">Import Complete!</h3>
              <div className="space-y-2">
                <p className="text-green-400">
                  ✅ {importResults.successful} leads imported successfully
                </p>
                {importResults.failed > 0 && (
                  <p className="text-red-400">
                    ❌ {importResults.failed} leads failed to import
                  </p>
                )}
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto bg-slate-800 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Import Errors:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
              <Button
                onClick={resetModal}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Import More
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
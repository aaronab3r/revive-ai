'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle2, Download, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead, LeadStatus } from '@/types';
import { uploadLeads } from '@/app/actions/leads';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileAccepted?: (file: File) => void;
  onLeadsParsed?: (leads: Lead[]) => void;
}

export function FileUploader({ onFileAccepted, onLeadsParsed }: FileUploaderProps) {
  const [acceptedFile, setAcceptedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (files.length > 0) {
        const file = files[0];
        setAcceptedFile(file);
        onFileAccepted?.(file);

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const parsedLeads = results.data.map((row: any) => ({
              name: row.Name || row.name || 'Unknown',
              phone: row.Phone || row.phone || '',
              email: row.Email || row.email || '',
              interest: row.Interest || row.interest || 'General',
              notes: row.Notes || row.notes || '',
            })).filter((lead: any) => lead.name && lead.phone);

            // Upload to Supabase with user_id
            setIsUploading(true);
            const result = await uploadLeads(parsedLeads);
            setIsUploading(false);

            if (result.success) {
              toast.success(`Successfully imported ${result.count} leads`);
              
              // Use the real leads returned from the database with actual IDs
              if (onLeadsParsed && result.leads) {
                const mappedLeads: Lead[] = result.leads.map((lead: any) => ({
                  id: lead.id,
                  name: lead.name,
                  phone: lead.phone,
                  interest: lead.interest || undefined,
                  notes: lead.notes || undefined,
                  status: (lead.status || 'Pending') as LeadStatus,
                  lastContacted: lead.last_contacted ? new Date(lead.last_contacted) : null,
                  createdAt: new Date(lead.created_at),
                }));
                onLeadsParsed(mappedLeads);
              }
            } else {
              toast.error(`Failed to import leads: ${result.error}`);
            }
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            toast.error('Failed to parse CSV file');
          }
        });
      }
    },
    [onFileAccepted, onLeadsParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
    },
    maxFiles: 1,
  });

  const clearFile = () => {
    setAcceptedFile(null);
  };

  const handleDownloadTemplate = () => {
    const a = document.createElement('a');
    a.href = '/patient-leads-template.csv';
    a.download = 'patient-leads-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all duration-200',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50',
          acceptedFile && 'border-solid border-green-200 bg-green-50/50'
        )}
      >
        <input {...getInputProps()} />

        {acceptedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-900">{acceptedFile.name}</p>
              <p className="text-sm text-slate-500">
                {(acceptedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Badge variant="success" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Ready to Import
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute right-3 top-3 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                isDragActive ? 'bg-blue-100' : 'bg-slate-100'
              )}
            >
              <Upload
                className={cn(
                  'h-6 w-6 transition-colors',
                  isDragActive ? 'text-blue-600' : 'text-slate-400'
                )}
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-900">
                {isDragActive ? 'Drop your file here' : 'Drop your lead list'}
              </p>
              <p className="text-sm text-slate-500">
                or click to browse (CSV, XLS, XLSX)
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleDownloadTemplate}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline"
      >
        <Download className="h-3.5 w-3.5" />
        Download Template CSV
      </button>
    </div>
  );
}

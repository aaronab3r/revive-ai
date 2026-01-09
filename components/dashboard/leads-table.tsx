'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Phone, ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus } from '@/types';
import { formatPhoneNumber, formatDate } from '@/lib/utils';
import { makeCall } from '@/app/actions/make-call';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LeadsDataTableProps {
  data: Lead[];
}

const statusVariantMap: Record<LeadStatus, 'pending' | 'calling' | 'booked' | 'voicemail'> = {
  Pending: 'pending',
  Calling: 'calling',
  Booked: 'booked',
  Voicemail: 'voicemail',
};

// CallButton component to handle individual row state
function CallButton({ lead, onStatusChange }: { 
  lead: Lead; 
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDisabled = lead.status === 'Calling' || lead.status === 'Booked' || isPending;

  const handleCall = () => {
    const originalStatus = lead.status;
    
    // Optimistic update
    onStatusChange(lead.id, 'Calling');
    
    startTransition(async () => {
      const result = await makeCall({ 
        name: lead.name, 
        phone: lead.phone,
        interest: lead.interest
      });

      if (result.success) {
        toast.success(`Calling ${lead.name}...`, {
          description: `Dialing ${formatPhoneNumber(lead.phone)}`,
        });
        // Keep status as "Calling" - it will be updated via webhook in production
      } else {
        toast.error('Call failed', {
          description: result.error,
        });
        // Revert to original status on error
        onStatusChange(lead.id, originalStatus);
      }
    });
  };

  return (
    <Button
      size="sm"
      variant={isDisabled ? 'outline' : 'default'}
      disabled={isDisabled}
      onClick={handleCall}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
      {isPending ? 'Calling...' : 'Call Now'}
    </Button>
  );
}

export function LeadsDataTable({ data: initialData }: LeadsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [leads, setLeads] = useState<Lead[]>(initialData);

  // Sync internal state with props when initialData changes (e.g. on file upload)
  useEffect(() => {
    setLeads(initialData);
  }, [initialData]);

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === id 
          ? { ...lead, status: newStatus, lastContacted: newStatus === 'Calling' ? new Date() : lead.lastContacted }
          : lead
      )
    );
  };

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-sm text-slate-500">{row.original.interest}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        return (
          <span className="font-mono text-sm text-slate-600">
            {formatPhoneNumber(row.original.phone)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={statusVariantMap[status]}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastContacted',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Last Contacted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="text-sm text-slate-600">
            {formatDate(row.original.lastContacted)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <CallButton 
            lead={row.original} 
            onStatusChange={handleStatusChange}
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-slate-50/50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No leads found. Upload a CSV to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {table.getRowModel().rows.length} of {leads.length} leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

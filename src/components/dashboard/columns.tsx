"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define the data type for GSC queries/pages
export interface GSCDataRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// Column definitions for queries
export const queryColumns: ColumnDef<GSCDataRow>[] = [
  {
    accessorKey: "query",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Query
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const query = row.original.keys?.[0] || 'N/A'
      return (
        <div className="max-w-xs truncate font-medium">
          {query}
        </div>
      )
    },
    accessorFn: (row) => row.keys?.[0] || '',
    filterFn: "textFilter" as any,
  },
  {
    accessorKey: "clicks",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Clicks
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const clicks = row.getValue("clicks") as number
      return <div className="text-right">{clicks?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "impressions",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Impressions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const impressions = row.getValue("impressions") as number
      return <div className="text-right">{impressions?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "ctr",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            CTR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const ctr = row.getValue("ctr") as number
      return <div className="text-right">{ctr ? (ctr * 100).toFixed(2) + '%' : '0%'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Position
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const position = row.getValue("position") as number
      return <div className="text-right">{position?.toFixed(1) || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
]

// Column definitions for pages (same structure but with different header)
export const pageColumns: ColumnDef<GSCDataRow>[] = [
  {
    accessorKey: "page",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Page
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const page = row.original.keys?.[0] || 'N/A'
      return (
        <div className="max-w-xs truncate font-medium">
          {page}
        </div>
      )
    },
    accessorFn: (row) => row.keys?.[0] || '',
    filterFn: "textFilter" as any,
  },
  {
    accessorKey: "clicks",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Clicks
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const clicks = row.getValue("clicks") as number
      return <div className="text-right">{clicks?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "impressions",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Impressions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const impressions = row.getValue("impressions") as number
      return <div className="text-right">{impressions?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "ctr",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            CTR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const ctr = row.getValue("ctr") as number
      return <div className="text-right">{ctr ? (ctr * 100).toFixed(2) + '%' : '0%'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Position
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const position = row.getValue("position") as number
      return <div className="text-right">{position?.toFixed(1) || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
]

// Column definitions for countries
export const countryColumns: ColumnDef<GSCDataRow>[] = [
  {
    accessorKey: "country",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Country
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const country = row.original.keys?.[0] || 'N/A'
      // Convert country code to country name (basic mapping)
      const countryNames: { [key: string]: string } = {
        'us': 'United States', 'gb': 'United Kingdom', 'ca': 'Canada', 'au': 'Australia',
        'de': 'Germany', 'fr': 'France', 'es': 'Spain', 'it': 'Italy', 'nl': 'Netherlands',
        'se': 'Sweden', 'no': 'Norway', 'dk': 'Denmark', 'fi': 'Finland', 'pl': 'Poland',
        'br': 'Brazil', 'mx': 'Mexico', 'ar': 'Argentina', 'in': 'India', 'jp': 'Japan',
        'cn': 'China', 'kr': 'South Korea', 'sg': 'Singapore', 'ae': 'UAE', 'za': 'South Africa'
      };
      const countryName = countryNames[country.toLowerCase()] || country.toUpperCase();
      return (
        <div className="max-w-xs truncate font-medium">
          {countryName}
        </div>
      )
    },
    accessorFn: (row) => row.keys?.[0] || '',
    filterFn: "textFilter" as any,
  },
  {
    accessorKey: "clicks",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Clicks
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const clicks = row.getValue("clicks") as number
      return <div className="text-right">{clicks?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "impressions",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Impressions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const impressions = row.getValue("impressions") as number
      return <div className="text-right">{impressions?.toLocaleString() || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "ctr",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            CTR
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const ctr = row.getValue("ctr") as number
      return <div className="text-right">{ctr ? (ctr * 100).toFixed(2) + '%' : '0%'}</div>
    },
    filterFn: "numericFilter" as any,
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Position
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const position = row.getValue("position") as number
      return <div className="text-right">{position?.toFixed(1) || '0'}</div>
    },
    filterFn: "numericFilter" as any,
  },
]

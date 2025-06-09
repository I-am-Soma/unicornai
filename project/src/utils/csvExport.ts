import { Lead, CampaignData } from '../interfaces/interfaces';

/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: { [key: string]: string }
) => {
  if (data.length === 0) return '';

  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      allKeys.add(key);
    });
  });

  // Convert Set to Array
  const keys = Array.from(allKeys);

  // Create header row
  const headerRow = keys.map(key => {
    // Use custom header if provided, otherwise use the key
    return headers && headers[key] ? headers[key] : key;
  }).join(',');

  // Create data rows
  const rows = data.map(item => {
    return keys.map(key => {
      const value = item[key];
      // Handle different data types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return value;
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${rows}`;
};

/**
 * Downloads data as a CSV file
 * @param data Data to download
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export const downloadCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { [key: string]: string }
) => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export leads to CSV
 * @param leads Array of leads to export
 * @param filename Filename for the downloaded file
 */
export const exportLeadsToCSV = (leads: Lead[], filename = 'leads-export.csv') => {
  const headers = {
    id: 'ID',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    source: 'Source',
    status: 'Status',
    priority: 'Priority',
    notes: 'Notes',
    createdAt: 'Created At',
    lastContactDate: 'Last Contact Date'
  };
  
  downloadCSV(leads, filename, headers);
};

/**
 * Export campaigns to CSV
 * @param campaigns Array of campaigns to export
 * @param filename Filename for the downloaded file
 */
export const exportCampaignsToCSV = (campaigns: CampaignData[], filename = 'campaigns-export.csv') => {
  const headers = {
    id: 'ID',
    name: 'Campaign Name',
    budget: 'Budget',
    status: 'Status',
    clicks: 'Clicks',
    createdAt: 'Created At',
    endDate: 'End Date',
    platform: 'Platform',
    targetAudience: 'Target Audience'
  };
  
  downloadCSV(campaigns, filename, headers);
};

/**
 * Export report data to CSV
 * @param reportData Report data to export
 * @param period The time period of the report
 * @param filename Filename for the downloaded file
 */
export const exportReportToCSV = (reportData: any, period: string, filename = `${period}-report.csv`) => {
  // Create a flattened structure for the report data
  const reportRows = [
    {
      Period: period,
      TotalLeads: reportData.totalLeads,
      ConversionRate: `${reportData.conversionRate}%`,
      ROI: `${reportData.roi}%`,
      AmountSpent: reportData.amountSpent,
      Clicks: reportData.clicks,
      EngagementRate: `${reportData.engagementRate}%`
    }
  ];
  
  // Add lead sources
  if (reportData.leadSources) {
    Object.entries(reportData.leadSources).forEach(([source, percentage]) => {
      reportRows[0][`LeadSource_${source}`] = `${percentage}%`;
    });
  }
  
  // Add monthly conversions
  if (reportData.monthlyConversions) {
    Object.entries(reportData.monthlyConversions).forEach(([month, value]) => {
      reportRows[0][`Conversions_${month}`] = value;
    });
  }
  
  downloadCSV(reportRows, filename);
};
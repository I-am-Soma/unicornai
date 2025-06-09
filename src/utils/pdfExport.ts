import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Lead, CampaignData } from '../interfaces/interfaces';

/**
 * Generates a PDF report from report data
 * @param reportData Report data to include in the PDF
 * @param period The time period of the report
 * @param filename Optional filename for the PDF
 */
export const exportReportToPDF = (reportData: any, period: string, filename = `${period}-report.pdf`) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Unicorn AI ${period.charAt(0).toUpperCase() + period.slice(1)} Report`, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  let yPos = 40;
  
  // Add key metrics
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Key Metrics", 14, yPos);
  
  yPos += 10;
  
  const metrics = [
    ["Total Leads", reportData.totalLeads.toString()],
    ["Conversion Rate", `${reportData.conversionRate}%`],
    ["ROI", `${reportData.roi}%`],
    ["Amount Spent", `$${reportData.amountSpent.toLocaleString()}`],
    ["Clicks", reportData.clicks.toString()],
    ["Engagement Rate", `${reportData.engagementRate}%`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: metrics,
    theme: "striped",
    headStyles: { fillColor: [25, 118, 210], textColor: 255 },
    styles: { cellPadding: 5 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Add lead sources
  if (reportData.leadSources && Object.keys(reportData.leadSources).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Lead Sources", 14, yPos);
    
    yPos += 10;
    
    const leadSourcesData = Object.entries(reportData.leadSources).map(
      ([source, percentage]) => [source, `${percentage}%`]
    );
    
    autoTable(doc, {
      startY: yPos,
      head: [["Source", "Percentage"]],
      body: leadSourcesData,
      theme: "striped",
      headStyles: { fillColor: [25, 118, 210], textColor: 255 },
      styles: { cellPadding: 5 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Add conversion trends
  if (reportData.monthlyConversions && Object.keys(reportData.monthlyConversions).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Conversion Trends", 14, yPos);
    
    yPos += 10;
    
    const conversionsData = Object.entries(reportData.monthlyConversions).map(
      ([period, value]) => [period, value.toString()]
    );
    
    autoTable(doc, {
      startY: yPos,
      head: [["Period", "Conversions"]],
      body: conversionsData,
      theme: "striped",
      headStyles: { fillColor: [25, 118, 210], textColor: 255 },
      styles: { cellPadding: 5 },
    });
  }
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(filename);
};

/**
 * Exports leads data to PDF
 * @param leads Array of leads to export
 * @param filename Optional filename for the PDF
 */
export const exportLeadsToPDF = (leads: Lead[], filename = 'leads-report.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Unicorn AI Leads Report', 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add summary
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Leads: ${leads.length}`, 14, 40);
  
  // Prepare table data
  const tableData = leads.map(lead => [
    lead.name,
    lead.email,
    lead.phone,
    lead.source,
    lead.status,
    lead.priority,
    new Date(lead.createdAt).toLocaleDateString()
  ]);
  
  // Add leads table
  autoTable(doc, {
    startY: 50,
    head: [['Name', 'Email', 'Phone', 'Source', 'Status', 'Priority', 'Created At']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [25, 118, 210], textColor: 255 },
    styles: { cellPadding: 5, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 }
    }
  });
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(filename);
};

/**
 * Exports campaigns data to PDF
 * @param campaigns Array of campaigns to export
 * @param filename Optional filename for the PDF
 */
export const exportCampaignsToPDF = (campaigns: CampaignData[], filename = 'campaigns-report.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Unicorn AI Campaigns Report', 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add summary
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Campaigns: ${campaigns.length}`, 14, 40);
  
  // Prepare table data
  const tableData = campaigns.map(campaign => [
    campaign.name,
    `$${campaign.budget.toLocaleString()}`,
    campaign.status,
    campaign.clicks.toLocaleString(),
    campaign.platform || 'N/A',
    campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'
  ]);
  
  // Add campaigns table
  autoTable(doc, {
    startY: 50,
    head: [['Name', 'Budget', 'Status', 'Clicks', 'Platform', 'Created At']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [25, 118, 210], textColor: 255 },
    styles: { cellPadding: 5 }
  });
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(filename);
};
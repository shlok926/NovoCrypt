export interface ReportContext {
  userId: string;
  organizationName?: string;
  reportPeriod: string;
  startDate: Date;
  endDate: Date;
  enabledModules: string[];
}

export interface ReportSection {
  id: string; // e.g., 'threat_intelligence', 'scanner'
  title: string;
  order: number;
  
  /**
   * Fetch required data based on context.
   * Returns true if there is data to display, false otherwise.
   */
  fetchData(context: ReportContext): Promise<boolean>;

  /**
   * Render the section onto the PDF Document.
   * Called only if fetchData returned true and the module is enabled.
   */
  renderPdf(doc: PDFKit.PDFDocument, context: ReportContext): void | Promise<void>;
}

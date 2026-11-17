import { jsPDF } from 'jspdf';
import type { Project, ProjectContact, ProjectProposal } from '@/types/agency';

export function generateProposalPdf(
  project: Project,
  proposal: ProjectProposal,
  contacts: ProjectContact[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 22;

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HOLABUSINESS · PROJECT SCOPE & PROPOSAL SPECIFICATION', margin, 11);

  // Document Title & Project Name
  cursorY = 28;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(proposal.title || `${project.title} — Proposal`, margin, cursorY);

  cursorY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Client: ${project.client_name}  |  Type: ${project.project_type}  |  Date: ${new Date().toLocaleDateString()}`,
    margin,
    cursorY
  );

  cursorY += 4;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Primary Contacts Section
  if (contacts.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Key Client Stakeholders & Contacts', margin, cursorY);
    cursorY += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    contacts.forEach((contact) => {
      const line = `• ${contact.name} (${contact.role}) — ${contact.email}${contact.phone ? ` | ${contact.phone}` : ''}`;
      doc.text(line, margin + 2, cursorY);
      cursorY += 4.5;
    });
    cursorY += 4;
  }

  // Section 1: Proposed Solution & Technical Approach
  cursorY = renderSectionHeader(doc, '1. Solution Overview & Technical Approach', margin, cursorY);
  cursorY = renderParagraph(
    doc,
    proposal.solution_overview || 'Comprehensive solution aligned with stakeholder goals and requirements.',
    margin,
    cursorY,
    contentWidth
  );

  // Section 2: Team Schedule & Milestones
  cursorY = renderSectionHeader(doc, '2. Weekly / Monthly Workflow & Delivery Schedule', margin, cursorY);
  cursorY = renderParagraph(
    doc,
    proposal.workflow_team_schedule || 'Structured agile sprint delivery with bi-weekly client demo checkpoints.',
    margin,
    cursorY,
    contentWidth
  );

  // Section 3: Expected Results & Business Impact
  cursorY = renderSectionHeader(doc, '3. Expected Results & Deliverables', margin, cursorY);
  cursorY = renderParagraph(
    doc,
    proposal.expected_deliverables_results || 'Production-ready deployment meeting all performance and security criteria.',
    margin,
    cursorY,
    contentWidth
  );

  // Section 4: Support & Long-Term Maintenance
  cursorY = renderSectionHeader(doc, '4. Long-Term Support & Service SLA', margin, cursorY);
  cursorY = renderParagraph(
    doc,
    proposal.long_term_support_services || 'Post-delivery bug warranty, automated backups, security patching, and SLA support.',
    margin,
    cursorY,
    contentWidth
  );

  // Check page break for Pricing Table
  if (cursorY > 210) {
    doc.addPage();
    cursorY = 25;
  }

  // Section 5: Pricing Table
  cursorY = renderSectionHeader(doc, '5. Commercial Investment & Pricing Breakdown', margin, cursorY);

  // Table header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, cursorY, contentWidth, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Item Description', margin + 3, cursorY + 5);
  doc.text('Category', margin + 95, cursorY + 5);
  doc.text('Billing', margin + 130, cursorY + 5);
  doc.text('Cost ($)', pageWidth - margin - 5, cursorY + 5, { align: 'right' });
  cursorY += 9;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  proposal.pricing_items.forEach((item) => {
    if (cursorY > 270) {
      doc.addPage();
      cursorY = 25;
    }
    doc.text(item.description, margin + 3, cursorY);
    doc.text(item.category, margin + 95, cursorY);
    doc.text(item.billing_cycle || 'one-time', margin + 130, cursorY);
    doc.text(item.cost.toLocaleString('en-US', { minimumFractionDigits: 2 }), pageWidth - margin - 5, cursorY, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);
    cursorY += 6.5;
  });

  cursorY += 2;
  // Totals Box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, cursorY, contentWidth, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total One-Time Investment: $${proposal.total_one_time_cost.toLocaleString()}`, margin + 5, cursorY + 6);
  doc.text(`Ongoing / Recurring: $${proposal.total_recurring_cost.toLocaleString()} / mo`, margin + 5, cursorY + 11);
  cursorY += 22;

  // Sign-off signature footer
  if (cursorY > 260) {
    doc.addPage();
    cursorY = 30;
  }
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Acceptance & Sign-Off:', margin, cursorY);
  cursorY += 12;
  doc.line(margin, cursorY, margin + 65, cursorY);
  doc.line(margin + 90, cursorY, margin + 155, cursorY);
  cursorY += 4;
  doc.text('Agency Representative Signature', margin, cursorY);
  doc.text('Client Representative Signature', margin + 90, cursorY);

  // File Download
  const safeName = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`proposal_${safeName}.pdf`);
}

function renderSectionHeader(doc: jsPDF, title: string, margin: number, y: number): number {
  if (y > 265) {
    doc.addPage();
    y = 25;
  }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin, y);
  return y + 5;
}

function renderParagraph(
  doc: jsPDF,
  text: string,
  margin: number,
  y: number,
  width: number
): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const splitText = doc.splitTextToSize(text, width);
  doc.text(splitText, margin, y);
  const linesHeight = splitText.length * 4.2;
  return y + linesHeight + 5;
}

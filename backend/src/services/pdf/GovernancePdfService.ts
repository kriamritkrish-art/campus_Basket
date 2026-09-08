import PDFDocument from 'pdfkit';

export interface GovernancePdfData {
  generatedBy: string;
  generatedAt: Date;
  globalSettings: {
    codGloballyEnabled: boolean;
    maxCodAmount: number;
    codMinAdvanceAmount: number;
    cancellationCutoffStage: string;
    returnPolicyFood: string;
    returnPolicyProduce: string;
    returnPolicyStationery: string;
  };
  providers: Array<{
    id: string;
    name: string;
    category: string;
    allowCod: boolean;
    codAdvance?: number;
    cancellationCutoff?: string;
    allowReturn: boolean;
  }>;
  products: Array<{
    id: string;
    name: string;
    category: string;
    providerName: string;
    price: number;
    allowCod: boolean;
    isCodOverridden: boolean;
    allowReturn: boolean;
    isReturnOverridden: boolean;
  }>;
}

export class GovernancePdfService {
  /**
   * Generates a publication-grade PDF report buffer for institutional order governance policies.
   */
  public static async generatePdf(data: GovernancePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        info: {
          Title: 'Campus Basket — Order Governance & Multi-Service Policy Matrix',
          Author: 'NIT Durgapur Campus Basket Administration',
          Subject: 'Order Immutability, COD Advance & Multi-Category Return Policies',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#1e3a8a'; // Blue-900
      const accentColor = '#4338ca';  // Indigo-700
      const darkColor = '#0f172a';    // Slate-900
      const mutedColor = '#64748b';   // Slate-500
      const borderColor = '#cbd5e1';  // Slate-300
      const greenColor = '#15803d';   // Emerald-700
      const redColor = '#b91c1c';     // Rose-700

      // Page width & margins
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 72; // 36 margin on each side

      // ==========================================
      // 1. INSTITUTIONAL HEADER
      // ==========================================
      doc.rect(36, 36, contentWidth, 68).fillAndStroke('#f8fafc', borderColor);

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text('NATIONAL INSTITUTE OF TECHNOLOGY DURGAPUR', 48, 46);

      doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold')
        .text('CAMPUS BASKET — ORDER GOVERNANCE & MULTI-SERVICE POLICY MATRIX', 48, 64);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text(`Priority Rule: Product Override > Provider Override > Global Base Policy   |   Generated: ${data.generatedAt.toLocaleString('en-IN')}`, 48, 80);

      doc.fillColor(mutedColor).fontSize(8).font('Helvetica')
        .text(`Administrative Operator: ${data.generatedBy}   |   Verified Institutional Audit Record`, 48, 92);

      let currentY = 116;

      // ==========================================
      // 2. GLOBAL CATEGORY & IMMUTABILITY POLICIES
      // ==========================================
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text('1. GLOBAL PLATFORM POLICIES & IMMUTABILITY RULES', 36, currentY);

      currentY += 16;

      const cardWidth = (contentWidth - 16) / 3;
      const cardHeight = 52;

      // Card 1: COD Online Advance
      doc.rect(36, currentY, cardWidth, cardHeight).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text('COD PARTIAL ONLINE ADVANCE', 44, currentY + 8);
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold')
        .text(`₹${data.globalSettings.codMinAdvanceAmount} Online Fee`, 44, currentY + 20);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('Rest collected in cash at door', 44, currentY + 36);

      // Card 2: Cancellation Cutoff Stage
      const card2X = 36 + cardWidth + 8;
      doc.rect(card2X, currentY, cardWidth, cardHeight).fillAndStroke('#fef3c7', '#fde68a');
      doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold')
        .text('CANCELLATION & EDIT CUTOFF', card2X + 8, currentY + 8);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text(`${data.globalSettings.cancellationCutoffStage} Stage`, card2X + 8, currentY + 20);
      doc.fillColor('#92400e').fontSize(7).font('Helvetica')
        .text('Order strictly locked once accepted', card2X + 8, currentY + 36);

      // Card 3: Global COD Status
      const card3X = card2X + cardWidth + 8;
      doc.rect(card3X, currentY, cardWidth, cardHeight).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor(greenColor).fontSize(8).font('Helvetica-Bold')
        .text('CASH ON DELIVERY STATUS', card3X + 8, currentY + 8);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text(data.globalSettings.codGloballyEnabled ? 'ACTIVATED' : 'DISABLED', card3X + 8, currentY + 20);
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text(`Ceiling Limit: ₹${data.globalSettings.maxCodAmount}`, card3X + 8, currentY + 36);

      currentY += cardHeight + 10;

      // Category Return Windows Strip
      doc.rect(36, currentY, contentWidth, 24).fillAndStroke('#f1f5f9', borderColor);
      doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold')
        .text('Category Return Windows:', 44, currentY + 8);
      doc.fillColor('#0369a1').font('Helvetica-Bold')
        .text(`Fresh Produce: ${data.globalSettings.returnPolicyProduce} (2h Window)`, 160, currentY + 8);
      doc.fillColor('#4338ca').font('Helvetica-Bold')
        .text(`Stationery: ${data.globalSettings.returnPolicyStationery} (24h Window)`, 320, currentY + 8);
      doc.fillColor('#c2410c').font('Helvetica-Bold')
        .text(`Food: ${data.globalSettings.returnPolicyFood} (30m Window)`, 460, currentY + 8);

      currentY += 34;

      // ==========================================
      // 3. PROVIDER-WISE GOVERNANCE MATRIX
      // ==========================================
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text('2. PROVIDER-WISE ORDER & COD GOVERNANCE MATRIX', 36, currentY);

      currentY += 16;

      // Table Header
      const colX = [36, 170, 260, 330, 410, 475];
      const colW = [134, 90, 70, 80, 65, 47];

      doc.rect(36, currentY, contentWidth, 18).fillAndStroke('#1e293b', '#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('MERCHANT / PROVIDER', colX[0] + 6, currentY + 5);
      doc.text('CATEGORY', colX[1] + 6, currentY + 5);
      doc.text('COD STATUS', colX[2] + 6, currentY + 5);
      doc.text('ADVANCE FEE', colX[3] + 6, currentY + 5);
      doc.text('LOCK STAGE', colX[4] + 6, currentY + 5);
      doc.text('RETURNS', colX[5] + 6, currentY + 5);

      currentY += 18;

      data.providers.slice(0, 8).forEach((p, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, currentY, contentWidth, 18).fillAndStroke(bg, borderColor);

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold')
          .text(p.name.slice(0, 24), colX[0] + 6, currentY + 5);

        doc.fillColor(mutedColor).font('Helvetica')
          .text((p.category || 'GENERAL').slice(0, 15), colX[1] + 6, currentY + 5);

        if (p.allowCod) {
          doc.fillColor(greenColor).font('Helvetica-Bold').text('COD ALLOWED', colX[2] + 6, currentY + 5);
        } else {
          doc.fillColor(redColor).font('Helvetica-Bold').text('COD BLOCKED', colX[2] + 6, currentY + 5);
        }

        const advText = p.codAdvance !== undefined ? `₹${p.codAdvance}` : 'Default (₹10)';
        doc.fillColor(darkColor).font('Helvetica').text(advText, colX[3] + 6, currentY + 5);

        doc.fillColor(darkColor).font('Helvetica')
          .text(p.cancellationCutoff || 'ACCEPTED', colX[4] + 6, currentY + 5);

        if (p.allowReturn) {
          doc.fillColor(greenColor).font('Helvetica-Bold').text('ACTIVE', colX[5] + 6, currentY + 5);
        } else {
          doc.fillColor(redColor).font('Helvetica-Bold').text('OFF', colX[5] + 6, currentY + 5);
        }

        currentY += 18;
      });

      currentY += 14;

      // ==========================================
      // 4. PRODUCT & FOOD ITEM HIGH-PRIORITY OVERRIDES
      // ==========================================
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text('3. FOOD / ITEM HIGH-PRIORITY OVERRIDES (Overrides Provider Policies)', 36, currentY);

      currentY += 16;

      // Product Table Header
      const pColX = [36, 175, 270, 365, 445];
      doc.rect(36, currentY, contentWidth, 18).fillAndStroke('#334155', '#1e293b');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('FOOD / ITEM NAME', pColX[0] + 6, currentY + 5);
      doc.text('CATEGORY', pColX[1] + 6, currentY + 5);
      doc.text('MERCHANT', pColX[2] + 6, currentY + 5);
      doc.text('PRICE', pColX[3] + 6, currentY + 5);
      doc.text('COD OVERRIDE RULE', pColX[4] + 6, currentY + 5);

      currentY += 18;

      const itemsToShow = data.products.slice(0, 10);
      itemsToShow.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, currentY, contentWidth, 18).fillAndStroke(bg, borderColor);

        doc.fillColor(darkColor).fontSize(7.5).font('Helvetica-Bold')
          .text(item.name.slice(0, 26), pColX[0] + 6, currentY + 5);

        doc.fillColor(mutedColor).font('Helvetica')
          .text((item.category || 'Food').slice(0, 16), pColX[1] + 6, currentY + 5);

        doc.fillColor(mutedColor).font('Helvetica')
          .text((item.providerName || 'Campus Store').slice(0, 16), pColX[2] + 6, currentY + 5);

        doc.fillColor(darkColor).font('Helvetica-Bold')
          .text(`₹${item.price}`, pColX[3] + 6, currentY + 5);

        if (item.isCodOverridden) {
          if (item.allowCod) {
            doc.fillColor(greenColor).font('Helvetica-Bold').text('COD ALLOWED (Overridden)', pColX[4] + 6, currentY + 5);
          } else {
            doc.fillColor(redColor).font('Helvetica-Bold').text('COD BLOCKED (Overridden)', pColX[4] + 6, currentY + 5);
          }
        } else {
          doc.fillColor(mutedColor).font('Helvetica').text('Inherit Provider', pColX[4] + 6, currentY + 5);
        }

        currentY += 18;
      });

      // ==========================================
      // 5. OFFICIAL FOOTER NOTE
      // ==========================================
      const bottomY = doc.page.height - 50;
      doc.rect(36, bottomY, contentWidth, 24).fillAndStroke('#f8fafc', borderColor);
      doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica')
        .text('NIT Durgapur Campus Basket Core Engine • All modifications take immediate effect across Web and Android platforms.', 46, bottomY + 8);

      doc.end();
    });
  }
}

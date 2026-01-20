import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

interface CertificateData {
  userName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  certificateId: string;
}

@Injectable()
export class CertificatesService {
  async generatePDF(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // A4 Landscape
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, left: 0, right: 0, bottom: 0 }, // Zero margins to prevent auto-paging
        info: {
          Title: `Certificate - ${data.courseTitle}`,
          Author: 'Hitachi Astemo LMS',
        },
        autoFirstPage: false, // We will add the page manually to control it perfectly
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.addPage({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
      });

      const pageWidth = 841.89; // A4 landscape width
      const pageHeight = 595.28; // A4 landscape height
      const centerX = pageWidth / 2;

      // 1. Background Fill (Off-white / Parchment feel)
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FFFEFA');

      // 2. Premium Border Structure
      // Outer thick border (Dark Red / Hitachi Red shade)
      doc
        .lineWidth(4)
        .strokeColor('#8B0000') // Darker red for elegance
        .rect(15, 15, pageWidth - 30, pageHeight - 30)
        .stroke();

      // Middle gold border
      doc
        .lineWidth(1)
        .strokeColor('#C5A059') // Muted gold
        .rect(22, 22, pageWidth - 44, pageHeight - 44)
        .stroke();

      // Inner patterned border element (corner flourishes)
      this.drawOrnateCorners(doc, 30, 30, pageWidth - 60, pageHeight - 60);

      // 3. Header: HITACHI Logo Area
      doc
        .fontSize(36)
        .font('Helvetica-Bold') // Sans-serif for Logo match
        .fillColor('#CC0000') // Hitachi Red
        .text('HITACHI', 0, 60, { align: 'center' });

      // "Inspire the Next" is REMOVED as per request

      // 4. Certificate Title
      // Compacted vertical spacing
      doc
        .fontSize(42)
        .font('Times-Bold') // Serif for "Certificate"
        .fillColor('#1A1A1A')
        .text('CERTIFICATE', 0, 120, { align: 'center', characterSpacing: 5 });

      doc
        .fontSize(16)
        .font('Times-Roman')
        .fillColor('#C5A059') // Gold text
        .text('OF ACHIEVEMENT', 0, 165, {
          align: 'center',
          characterSpacing: 3,
        });

      // 5. Presentation Text
      doc
        .fontSize(14)
        .font('Times-Italic')
        .fillColor('#555555')
        .text('This certificate is proudly presented to', 0, 205, {
          align: 'center',
        });

      // 6. Recipient Name
      doc
        .fontSize(36)
        .font('Times-BoldItalic')
        .fillColor('#1A365D') // Navy Blue for name
        .text(data.userName, 0, 235, { align: 'center' });

      // Underline for name
      const nameWidth = doc.widthOfString(data.userName);
      const lineY = 275;
      doc
        .moveTo(centerX - nameWidth / 2 - 20, lineY)
        .lineTo(centerX + nameWidth / 2 + 20, lineY)
        .strokeColor('#C5A059')
        .lineWidth(0.5)
        .stroke();

      // 7. Completion Text
      doc
        .fontSize(14)
        .font('Times-Roman')
        .fillColor('#444444')
        .text('for successfully completing the course', 0, 295, {
          align: 'center',
        });

      // 8. Course Title
      doc
        .fontSize(24)
        .font('Times-Bold')
        .fillColor('#333333')
        .text(data.courseTitle, 0, 325, { align: 'center' });

      // 9. Signatures & Date Section
      // Moved up to ensure plenty of room for footer
      const signatureY = 410;
      const formattedDate = data.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Left: Instructor
      doc
        .fontSize(12)
        .font('Times-Bold')
        .fillColor('#333333')
        .text(data.instructorName, 150, signatureY - 20, {
          align: 'center',
          width: 200,
        });
      doc
        .moveTo(150, signatureY)
        .lineTo(350, signatureY)
        .strokeColor('#333333')
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(10)
        .font('Times-Roman')
        .fillColor('#666666')
        .text('Course Instructor', 150, signatureY + 5, {
          align: 'center',
          width: 200,
        });

      // Right: Date
      doc
        .fontSize(12)
        .font('Times-Bold')
        .fillColor('#333333')
        .text(formattedDate, pageWidth - 350, signatureY - 20, {
          align: 'center',
          width: 200,
        });
      doc
        .moveTo(pageWidth - 350, signatureY)
        .lineTo(pageWidth - 150, signatureY)
        .strokeColor('#333333')
        .lineWidth(1)
        .stroke();
      doc
        .fontSize(10)
        .font('Times-Roman')
        .fillColor('#666666')
        .text('Date of Completion', pageWidth - 350, signatureY + 5, {
          align: 'center',
          width: 200,
        });

      // 10. Footer (Combined ID and Date for official record)
      const footerY = 500;
      const footerHeight = 25;
      const footerWidth = pageWidth - 400; // Centered box width
      const footerX = (pageWidth - footerWidth) / 2;

      // Stylish pill-shaped container
      doc
        .roundedRect(footerX, footerY, footerWidth, footerHeight, 12)
        .fillAndStroke('#FEFCF8', '#C5A059'); // Cream fill, Gold border

      const textY = footerY + 8;

      // We use standard centered text for reliability
      doc
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text(
          `ID: ${data.certificateId}   •   Issued: ${formattedDate}`,
          0,
          textY,
          { align: 'center', width: pageWidth },
        );

      doc.end();
    });
  }

  private drawOrnateCorners(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    doc.save();
    doc.translate(x, y);

    const color = '#C5A059';
    doc.strokeColor(color).lineWidth(2);

    // Top-Left
    doc.moveTo(0, 20).lineTo(0, 0).lineTo(20, 0).stroke();
    // Top-Right
    doc
      .moveTo(w - 20, 0)
      .lineTo(w, 0)
      .lineTo(w, 20)
      .stroke();
    // Bottom-Right
    doc
      .moveTo(w, h - 20)
      .lineTo(w, h)
      .lineTo(w - 20, h)
      .stroke();
    // Bottom-Left
    doc
      .moveTo(20, h)
      .lineTo(0, h)
      .lineTo(0, h - 20)
      .stroke();

    doc.restore();
  }
}

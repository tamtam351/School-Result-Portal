import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateReportCardPDF = (reportCard, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold')
         .text('DE-LAUREL SCHOOL', { align: 'center' });
      
      doc.fontSize(10).font('Helvetica')
         .text('Excellence in Education', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(18).font('Helvetica-Bold')
         .text('STUDENT REPORT CARD', { align: 'center' });
      
      doc.moveDown(2);

      // Student Information Box
      doc.rect(50, doc.y, 495, 100).stroke();
      const infoY = doc.y + 10;
      
      doc.fontSize(11).font('Helvetica-Bold')
         .text('Student Name:', 60, infoY)
         .font('Helvetica')
         .text(reportCard.student.name, 200, infoY);
      
      doc.font('Helvetica-Bold')
         .text('Student ID:', 60, infoY + 20)
         .font('Helvetica')
         .text(reportCard.student.studentId, 200, infoY + 20);
      
      doc.font('Helvetica-Bold')
         .text('Class:', 60, infoY + 40)
         .font('Helvetica')
         .text(reportCard.student.classLevel, 200, infoY + 40);
      
      doc.font('Helvetica-Bold')
         .text('Term:', 60, infoY + 60)
         .font('Helvetica')
         .text(reportCard.term, 200, infoY + 60);
      
      doc.font('Helvetica-Bold')
         .text('Session:', 300, infoY + 60)
         .font('Helvetica')
         .text(reportCard.session, 400, infoY + 60);

      doc.y = infoY + 110;
      doc.moveDown();

      // Results Table
      doc.fontSize(14).font('Helvetica-Bold')
         .text('ACADEMIC PERFORMANCE', { underline: true });
      
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Subject', 60, tableTop);
      doc.text('1st CA', 250, tableTop, { width: 50, align: 'center' });
      doc.text('2nd CA', 310, tableTop, { width: 50, align: 'center' });
      doc.text('Exam', 370, tableTop, { width: 50, align: 'center' });
      doc.text('Total', 430, tableTop, { width: 50, align: 'center' });
      doc.text('Grade', 490, tableTop, { width: 50, align: 'center' });

      // Line under header
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      // Table Rows
      let yPosition = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      reportCard.results.forEach((result, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.text(result.subject.name, 60, yPosition, { width: 180 });
        doc.text(result.firstCA.toString(), 250, yPosition, { width: 50, align: 'center' });
        doc.text(result.secondCA.toString(), 310, yPosition, { width: 50, align: 'center' });
        doc.text(result.exam.toString(), 370, yPosition, { width: 50, align: 'center' });
        doc.text(result.total.toString(), 430, yPosition, { width: 50, align: 'center' });
        doc.text(result.grade, 490, yPosition, { width: 50, align: 'center' });

        yPosition += 25;
      });

      // Summary Box
      doc.moveDown(2);
      doc.rect(50, doc.y, 495, 80).stroke();
      const summaryY = doc.y + 10;

      doc.fontSize(11).font('Helvetica-Bold')
         .text('Total Score:', 60, summaryY)
         .text(reportCard.totalScore.toString(), 200, summaryY);
      
      doc.text('Average Score:', 60, summaryY + 20)
         .text(`${reportCard.averageScore}%`, 200, summaryY + 20);
      
      doc.text('Overall Grade:', 60, summaryY + 40)
         .fontSize(20)
         .text(reportCard.overallGrade, 200, summaryY + 35);

      // Comments Section
      if (doc.y > 650) doc.addPage();
      
      doc.y += 100;
      doc.fontSize(12).font('Helvetica-Bold')
         .text('COMMENTS', { underline: true });
      
      doc.moveDown();
      doc.fontSize(10).font('Helvetica');
      
      if (reportCard.classTeacherComment) {
        doc.font('Helvetica-Bold').text("Class Teacher's Comment:");
        doc.font('Helvetica').text(reportCard.classTeacherComment);
        doc.moveDown();
      }
      
      if (reportCard.proprietressComment) {
        doc.font('Helvetica-Bold').text("Proprietress' Comment:");
        doc.font('Helvetica').text(reportCard.proprietressComment);
      }

      // Footer
      doc.fontSize(8).font('Helvetica')
         .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 750, {
           align: 'center',
           width: 495
         });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};
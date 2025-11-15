import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send report card notification
export const sendReportCardEmail = async (parentEmail, studentName, reportCardData) => {
  const mailOptions = {
    from: `DE-LAUREL School <${process.env.EMAIL_USER}>`,
    to: parentEmail,
    subject: `${studentName}'s Report Card - ${reportCardData.term} ${reportCardData.session}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
          .score-card { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .grade { font-size: 48px; font-weight: bold; color: #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 DE-LAUREL SCHOOL</h1>
            <p>Student Report Card Available</p>
          </div>
          
          <div class="content">
            <h2>Dear Parent,</h2>
            <p>We are pleased to inform you that the report card for <strong>${studentName}</strong> is now available.</p>
            
            <div class="score-card">
              <h3>Report Summary</h3>
              <p><strong>Term:</strong> ${reportCardData.term}</p>
              <p><strong>Session:</strong> ${reportCardData.session}</p>
              <p><strong>Number of Subjects:</strong> ${reportCardData.numberOfSubjects}</p>
              <p><strong>Average Score:</strong> ${reportCardData.averageScore}%</p>
              <div style="text-align: center; margin-top: 20px;">
                <div class="grade">${reportCardData.overallGrade}</div>
                <p style="color: #666;">Overall Grade</p>
              </div>
            </div>
            
            <p>${reportCardData.proprietressComment || 'Keep up the good work!'}</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/login" class="button">View Full Report Card</a>
            </center>
          </div>
          
          <div class="footer">
            <p>This is an automated message from DE-LAUREL School Portal.</p>
            <p>If you have any questions, please contact the school administration.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: error.message };
  }
};

// Send result rejection notification to teacher
export const sendRejectionEmail = async (teacherEmail, teacherName, rejectionData) => {
  const mailOptions = {
    from: `DE-LAUREL School <${process.env.EMAIL_USER}>`,
    to: teacherEmail,
    subject: `Results Rejected - Action Required`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fee; padding: 20px; border-left: 4px solid #f00; border-radius: 5px;">
            <h2 style="color: #c00;">Results Rejected</h2>
            <p>Dear ${teacherName},</p>
            <p>Your submitted results have been rejected by the administration.</p>
            <p><strong>Subject:</strong> ${rejectionData.subject}</p>
            <p><strong>Class:</strong> ${rejectionData.class}</p>
            <p><strong>Reason:</strong> ${rejectionData.reason}</p>
            <p>Please review and resubmit the results.</p>
            <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Login to Portal</a>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};
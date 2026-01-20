import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor(private configService: ConfigService) {
        this.initTransporter();
    }

    private initTransporter() {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        // Only initialize if SMTP settings are configured
        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: port || 587,
                secure: false, // true for 465, false for other ports
                auth: { user, pass },
            });
            console.log('Email transporter initialized');
        } else {
            console.log('Email service not configured (SMTP settings missing)');
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.transporter) {
            console.log(
                `[Email Mock] To: ${options.to}, Subject: ${options.subject}`,
            );
            return true; // Return true in dev mode without SMTP
        }

        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM') || 'noreply@lms.com',
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to HITACHI LMS!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name || 'there'},</p>
                    <p>Welcome to the Hitachi Learning Management System! We're excited to have you join our learning community.</p>
                    <p>Here's what you can do:</p>
                    <ul>
                        <li>📚 Browse and enroll in courses</li>
                        <li>🎯 Track your learning progress</li>
                        <li>🏆 Earn badges and certificates</li>
                        <li>💬 Join course discussions</li>
                    </ul>
                    <p>Start your learning journey today!</p>
                    <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/courses" class="button">Browse Courses</a>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Welcome to HITACHI LMS! 🎉',
            html,
        });
    }

    async sendCertificateEmail(
        email: string,
        name: string | null,
        courseName: string,
        certificateId: string,
    ): Promise<boolean> {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #CC0000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; text-align: center; }
                .certificate-box { background: white; border: 2px solid #CC0000; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .button { display: inline-block; background: #CC0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
                .logo-text { font-size: 12px; color: #CC0000; font-weight: bold; letter-spacing: 1px; margin-bottom: 20px; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>HITACHI LMS</h1>
                </div>
                <div class="content">
                    <p class="logo-text">CERTIFICATE OF ACHIEVEMENT</p>
                    <p>Hi ${name || 'there'},</p>
                    <p>Congratulations! You have successfully completed the course:</p>
                    <div class="certificate-box">
                        <h2 style="margin: 0; color: #333;">${courseName}</h2>
                        <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Certificate ID: ${certificateId}</p>
                    </div>
                    <p>Your official Hitachi certificate is ready for download.</p>
                    <a href="${frontendUrl}/certificates" class="button">View & Download Certificate</a>
                    <div class="footer">
                        <p>PT. Hitachi Astemo Indonesia - Learning Management System</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: `🎓 Hitachi Certificate: ${courseName}`,
            html,
        });
    }

    async sendCourseReminderEmail(
        email: string,
        name: string | null,
        courseName: string,
        progress: number,
    ): Promise<boolean> {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .progress-bar { background: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden; margin: 20px 0; }
                .progress-fill { background: linear-gradient(90deg, #f59e0b, #d97706); height: 100%; }
                .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Continue Learning!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name || 'there'},</p>
                    <p>You're making great progress in <strong>${courseName}</strong>!</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; color: #f59e0b;">${progress}% Complete</p>
                    <p>Keep going! You're almost there.</p>
                    <div style="text-align: center;">
                        <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/my-learning" class="button">Continue Course</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: `📚 Keep Learning: ${courseName} (${progress}% done)`,
            html,
        });
    }
    async sendBadgeEarnedEmail(
        email: string,
        name: string | null,
        badgeName: string,
        badgeIcon: string,
    ): Promise<boolean> {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; text-align: center; }
                .badge-icon { font-size: 64px; margin: 20px 0; display: block; }
                .button { display: inline-block; background: #FFA500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 New Badge Earned!</h1>
                </div>
                <div class="content">
                    <p>Hi ${name || 'Learner'},</p>
                    <p>You've just unlocked a new achievement!</p>
                    
                    <div class="badge-icon">${badgeIcon}</div>
                    
                    <h2 style="color: #d97706; margin-top: 0;">${badgeName}</h2>
                    
                    <p>Great job! Keep learning to earn more badges.</p>
                    
                    <a href="${frontendUrl}/my-learning" class="button">View My Badges</a>
                    
                    <div class="footer">
                        <p>Hitachi LMS - Gamification</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: `🏆 Badge Unlocked: ${badgeName}!`,
            html,
        });
    }

    async sendCourseEnrollmentEmail(
        email: string,
        name: string | null,
        courseName: string,
    ): Promise<boolean> {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .course-card { background: white; border: 1px solid #e5e7eb; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Enrollment Confirmed</h1>
                </div>
                <div class="content">
                    <p>Hi ${name || 'Learner'},</p>
                    <p>You have successfully enrolled in the following course:</p>
                    
                    <div class="course-card">
                        <h3 style="margin: 0; color: #333;">${courseName}</h3>
                    </div>
                    
                    <p>You can start learning right away whenever you're ready.</p>
                    
                    <div style="text-align: center;">
                        <a href="${frontendUrl}/my-learning" class="button">Start Learning</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        return this.sendEmail({
            to: email,
            subject: `📚 Enrolled: ${courseName}`,
            html,
        });
    }
}

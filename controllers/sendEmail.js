import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';


dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const createTransporter = async () => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
    } catch (error) {
        console.log('Lỗi khi tạo transporter:', error);
        throw new Error('Không thể tạo transporter');
    }
};

export const sendEmailNotification = async (to, subject, text, html) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email đã được gửi thành công đến ${to}!`);
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw new Error(`Không thể gửi email đến ${to}`);
    }
};

export const testSendEmail_single = async (newEmail) => {
    try {
        const to = newEmail;
        const subject = 'Thông báo';
        const text = 'Thêm';
        const html = '<h1>Thêm</h1>';

        await sendEmailNotification(to, subject, text, html);
        console.log(`Email kiểm tra đã được gửi thành công đến ${to}!`);
    } catch (error) {
        console.error(`Lỗi khi gửi email đến ${newEmail}:`, error);
    }
};

export const testSendEmail_multi = async (oldEmail, newEmail) => {
    const to = [oldEmail, newEmail];
    const subject = 'Thông báo';
    const text = ['Hủy', 'Thêm'];
    const html = ['<h1>Hủy</h1>', '<h1>Thêm</h1>'];

    try {
        if (to.length !== text.length || to.length !== html.length) {
            throw new Error('Số lượng email, nội dung văn bản và HTML không khớp!');
        }

        for (let i = 0; i < to.length; i++) {
            await sendEmailNotification(to[i], subject, text[i], html[i]);
        }
    } catch (error) {
        console.error('Lỗi khi gửi email kiểm tra:', error);
    }
};

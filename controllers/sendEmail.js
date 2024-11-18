import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load biến môi trường từ file .env
dotenv.config();

// Điền thông tin OAuth2
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Cấu hình OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Thiết lập refresh token
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Hàm khởi tạo transporter để gửi email
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
    }
};

// Hàm gửi email thông báo
const sendEmailNotification = async (to, subject, text, html) => {
    const transporter = await createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER, // Địa chỉ email của bạn
        to: to,                        // Địa chỉ email người nhận
        subject: subject,              // Tiêu đề email
        text: text,                    // Nội dung văn bản thuần
        html: html                     // Nội dung HTML (nếu có)
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email đã được gửi thành công!');
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
    }
};


export const testSendEmail_single = async (newEmail) => {
    console.log(newEmail);
    try {
        const to = newEmail;
        const subject = 'Thông báo';
        const text = 'Thêm'; // Nội dung văn bản
        const html = '<h1>Thêm</h1>'; // Nội dung HTML cho email

        // Gửi email
        sendEmailNotification(to, subject, text, html);

        // In thông báo thành công
        console.log(`Email kiểm tra đã được gửi thành công đến ${to}!`);
    } catch (error) {
        // Xử lý lỗi nếu có
        console.error(`Lỗi khi gửi email đến ${newEmail}:`, error);
    }
};

export const testSendEmail_multi = async (oldEmail, newEmail) => {
    const to = [oldEmail, newEmail];  // Các địa chỉ email người nhận
    const subject = 'Thông báo';  // Tiêu đề email
    const text = ['Hủy', 'Thêm'];  // Nội dung văn bản thuần cho mỗi email
    const html = ['<h1>Hủy</h1>', '<h1>Thêm</h1>'];  // Nội dung HTML cho mỗi email

    try {
        // Kiểm tra số lượng email và số lượng nội dung có khớp không
        if (to.length !== text.length || to.length !== html.length) {
            throw new Error('Số lượng email, nội dung văn bản và HTML không khớp!');
        }

        // Gửi từng email với nội dung tương ứng
        for (let i = 0; i < to.length; i++) {
            await sendEmailNotification(to[i], subject, text[i], html[i]);  // Gửi email
            console.log(`Email kiểm tra đã được gửi thành công đến ${to[i]}!`);
        }

    } catch (error) {
        console.error('Lỗi khi gửi email kiểm tra:', error);
    }
};

 
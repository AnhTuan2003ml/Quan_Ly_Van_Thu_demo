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

// // Hàm kiểm tra gửi email
// const testSendEmail = async () => {
// <<<<<<< HEAD
//     const to = ['tuankkffdnc@gmail.com','xb91200'];           // Thay thế bằng email người nhận
//     const subject = 'Thông báo kiểm tra';       // Tiêu đề email
//     const text = 'Đây là nội dung văn bản';     // Nội dung văn bản thuần
//     const html = '<h1>Đây là nội dung HTML</h1>'; // Nội dung HTML
// =======
//     const to = ['tuankkffdnc@gmail.com', 'xb91200@gmail.com'];
//     const subject = 'Thông báo kiểm tra';
//     const text = ['Hủy', 'Thêm']; // Text content for each email
//     const html = '<h1>Đây là nội dung HTML</h1>';
// >>>>>>> 48cc33e312af189aa0ee362d4996ff119735b7ac

//     try {
//         if (to.length !== text.length) {
//             throw new Error('Số lượng email và số lượng nội dung không khớp!');
//         }

//         // Send each email with the corresponding text
//         for (let i = 0; i < to.length; i++) {
//             await sendEmailNotification(to[i], subject, text[i], html);  // Use text[i]
//             console.log(`Email kiểm tra đã được gửi thành công đến ${to[i]}!`);
//         }

//     } catch (error) {
//         console.error('Lỗi khi gửi email kiểm tra:', error);
//     }
// };


// // Gọi hàm kiểm tra
// testSendEmail();

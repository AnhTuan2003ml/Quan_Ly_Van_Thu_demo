import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import apiVbDen from './api/vb_den.js';
import apiAuth from './api/auth.js';

import { fileURLToPath } from 'url';

import users from './routes/users.js'

const app = express();

// Lấy đường dẫn thư mục hiện tại
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Cấu hình middleware để phục vụ các file tĩnh
app.use(express.static(path.join(__dirname, 'public'))); // Phục vụ các file tĩnh từ thư mục 'public'
app.use('/doc', express.static(path.join(__dirname, 'doc'))); // Phục vụ các tài liệu từ thư mục 'doc'

// Cấu hình middleware để xử lý body dữ liệu và session
app.use(bodyParser.urlencoded({ extended: true })); // Xử lý dữ liệu URL-encoded (dành cho form)
app.use(express.json());                           // Xử lý body dữ liệu dạng JSON


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Chỉ sử dụng secure: true khi chạy trên HTTPS
}));

// Định nghĩa route mặc định để phục vụ file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sử dụng các API
//app.use('/api/users', apiUsers());    // API cho người dùng
app.use('/api/users', users)
app.use('/api/vb_den', apiVbDen());   // API cho văn bản đến
app.use('/api/auth', apiAuth());

// app.use('/api/log', apiLog()); 

// Cài đặt cổng mà server sẽ lắng nghe
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});

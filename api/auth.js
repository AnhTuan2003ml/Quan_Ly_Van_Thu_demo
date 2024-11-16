import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export default () => {
    const router = Router();

    // Login API
    router.post('/login', (req, res) => {
        const { email, password } = req.body;

        // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
        const __dirname = path.dirname(new URL(import.meta.url).pathname);

        // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
        let filePath = path.join(__dirname, '../data/users.json');
        // Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
        if (filePath.startsWith('\\')) {
            filePath = filePath.substring(1);
        }

        console.log('Đường dẫn tệp:', filePath);  // Kiểm tra đường dẫn thư mục hiện tại

        // Đọc dữ liệu từ tệp JSON
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Đã xảy ra lỗi khi đọc dữ liệu.');
            }

            const users = JSON.parse(data);
            const user = users.find(u => u.email === email);

            // console.log(user)
            // Kiểm tra thông tin đăng nhập
            if (user && password === user.password) {
                req.session.userId = user.id;
                req.session.userRole = user.status === 1 ? 'admin' :
                    user.status === 2 ? 'vanthu' :
                        user.status === 3 ? 'user' : 'guest'; // Default to 'guest' if status is not 1, 2, or 3
 
                return res.json({ success: true, role: req.session.userRole });
            } else {
                return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
            }
        });
    });

    // Logout API
    router.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Đã xảy ra lỗi khi đăng xuất.');
            }
            res.redirect('/');
        });
    });

    return router;
};

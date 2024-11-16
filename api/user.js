import fs from 'fs';
import path from 'path';
import express from 'express';

// Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
let filePath = path.join(__dirname, '../data/users.json');
// Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1);
}
export default () => {
    const router = express.Router();

    // Đọc dữ liệu từ file users.json
    function readUsers() {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    }

    // Ghi dữ liệu vào file users.json
    function writeUsers(data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Lấy tất cả người dùng
    router.get('/', (req, res) => {
        const users = readUsers();

        // Loại bỏ trường password khỏi từng người dùng
        const usersWithoutPassword = users.map(user => {
            const { password, ...userWithoutPassword } = user; // Tách password và trả lại phần còn lại của user
            return userWithoutPassword;
        });

        // Gửi lại danh sách người dùng không có password
        res.json(usersWithoutPassword);
    });

    // Thêm route /basic chỉ lấy id và name
    router.get('/basic', (req, res) => {
        const users = readUsers();
        const basicUsers = users.map(user => ({
            id: user.id,
            name: user.name
        }));
        // console.log(basicUsers);
        res.json(basicUsers);
    });

    // Thêm người dùng mới
    router.post('/', (req, res) => {
        let { name, phone, address, email, role, status } = req.body;

        // Gán null cho các trường nếu không có giá trị
        const updatedName = name || null;
        const updatedPhone = phone || null;
        const updatedAddress = address || null;
        const updatedEmail = email || null;
        const updatedRole = role || null;
        const updatedStatus = status !== undefined ? status : null;

        const users = readUsers();

        // Kiểm tra nếu email hoặc số điện thoại đã tồn tại
        const emailExists = users.some(user => user.email === updatedEmail);
        const phoneExists = users.some(user => user.phone === updatedPhone);

        if (emailExists) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        if (phoneExists) {
            return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
        }

        // Tạo người dùng mới với id tự động tăng
        const newUser = {
            id: users.length + 1,
            name: updatedName,
            phone: updatedPhone,
            address: updatedAddress,
            email: updatedEmail,
            password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // Mật khẩu mặc định
            role: updatedRole,
            status: updatedStatus
        };

        // Thêm người dùng vào danh sách
        users.push(newUser);
        writeUsers(users);

        res.status(201).json(newUser);  // Trả về người dùng mới
    });



    // Cập nhật thông tin người dùng
    router.put('/:id', (req, res) => {
        const userId = parseInt(req.params.id);
        const { name, phone, address, email, role, status } = req.body;

        // Gán null cho các trường nếu không có giá trị
        const updatedName = name || null;
        const updatedPhone = phone || null;
        const updatedAddress = address || null;
        const updatedEmail = email || null;
        const updatedRole = role || null;
        const updatedStatus = status !== undefined ? status : null;

        // console.log(userId, updatedName, updatedPhone, updatedAddress, updatedEmail, updatedRole, updatedStatus);

        const users = readUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Cập nhật thông tin người dùng
        users[userIndex] = {
            ...users[userIndex],
            name: updatedName,
            phone: updatedPhone,
            address: updatedAddress,
            email: updatedEmail,
            role: updatedRole,
            status: updatedStatus
        };
        writeUsers(users);

        res.json({
            message: 'Cập nhật người dùng thành công',
            user: users[userIndex]
        });
    });

    // Xóa người dùng
    router.delete('/:id', (req, res) => {
        const userId = parseInt(req.params.id);
        const users = readUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        const deletedUser = users.splice(userIndex, 1);
        writeUsers(users);
        res.json(deletedUser);
    });

    return router;
};

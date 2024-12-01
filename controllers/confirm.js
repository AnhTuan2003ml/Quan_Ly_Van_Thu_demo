import jwt from 'jsonwebtoken';  // Sử dụng cú pháp import

// Bí mật dùng để ký token (nên được bảo mật và không tiết lộ)
const secretKey = 'your-secret-key';

// Hàm tạo token bằng email và thời gian hết hạn được truyền vào
export  function generateToken(email, expiresInDays) {
    const payload = {
        email: email,  // Lưu email vào payload
        issuedAt: new Date().toISOString(), 
    };

    // Chuyển số ngày thành chuỗi theo định dạng "Xd" (với X là số ngày)
    const expiresIn = `${expiresInDays}h`;

    const options = {
        expiresIn: expiresIn, // Thời gian hết hạn được truyền vào
    };

    // Tạo và ký token
    const token = jwt.sign(payload, secretKey, options);
    return token;
}

// // Ví dụ sử dụng hàm tạo token với email và thời gian hết hạn được truyền vào (2 ngày)
// const userEmail = 'user@example.com';  // Email người dùng của bạn
// const token = generateToken(userEmail, 3);  // Token sẽ hết hạn sau 3 ngày
// console.log('Generated Token:', token);

// Hàm tạo link với token
export function generateConfirmLink(email, expiresInDays) {
    const token = generateToken(email, expiresInDays);  // Tạo token với email và thời gian hết hạn
    // const confirmLink = `https://yourwebsite.com/confirm?token=${token}`;  // Tạo link chứa token
    const confirmLink = `http://localhost:3000/confirm?token=${token}`;  // Tạo link chứa token
    return confirmLink;
}

export const verifyToken = (req, res) => {
    // Lấy token từ query string
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Token không được cung cấp.'
        });
    }

    try {
        // Giải mã và xác minh token
        const decoded = jwt.verify(token, secretKey);

        // Kiểm tra thời gian
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decoded.iat > now) {
            return res.status(400).json({
                success: false,
                message: 'Token chưa có hiệu lực.'
            });
        }
        if (decoded.exp < now) {
            return res.status(400).json({
                success: false,
                message: 'Token đã hết hạn.'
            });
        }

        // Token hợp lệ
        return res.status(200).json({
            success: true,
            message: 'Xác nhận thành công.',
            data: decoded
        });
    } catch (error) {
        // Lỗi khi xác minh token
        console.error('Lỗi xác nhận token:', error);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ.'
        });
    }
};
// // Kiểm tra token sau khi người dùng nhấp vào liên kết
// const tokenFromUser = token;  // Token người dùng cung cấp từ URL
// const decodedToken = verifyToken(tokenFromUser);
// if (decodedToken) {
//     // Thực hiện hành động xác nhận đã đọc
// }
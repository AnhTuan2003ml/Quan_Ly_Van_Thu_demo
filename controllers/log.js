import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Lấy thư mục hiện tại của tệp mã
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Xác định đường dẫn tới file log.json
let logFilePath = path.join(__dirname, '../data/log.json');
if (logFilePath.startsWith('\\')) {
    logFilePath = logFilePath.substring(1);
}

console.log('Đường dẫn tới file log.json:', logFilePath);

// Hàm để thêm dữ liệu log vào file log.json với id tự động tăng
export function addLogData(newLogEntry) {
    try {
        // Kiểm tra xem file log.json có tồn tại không
        let logData = [];
        if (existsSync(logFilePath)) {
            // Đọc nội dung hiện tại của file log.json
            const fileContent = readFileSync(logFilePath, 'utf8');
            if (fileContent) {
                logData = JSON.parse(fileContent); // Chuyển từ chuỗi JSON sang mảng/đối tượng
            }
        }

        // Tìm id lớn nhất hiện có và tăng lên 1
        let newId = 1; // Mặc định nếu logData rỗng
        if (logData.length > 0) {
            const maxId = Math.max(...logData.map(entry => entry.id || 0));
            newId = maxId + 1;
        }

        // Thêm thuộc tính id vào bản ghi mới
        const entryWithId = { id: newId, ...newLogEntry };

        // Thêm dữ liệu mới vào logData
        logData.push(entryWithId);

        // Ghi dữ liệu đã cập nhật trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
        console.log('Đã thêm dữ liệu mới vào log.json:', entryWithId);
    } catch (error) {
        console.error('Lỗi khi thêm dữ liệu vào log.json:', error);
    }
}

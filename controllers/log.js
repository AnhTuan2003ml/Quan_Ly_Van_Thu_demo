import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Lấy thư mục hiện tại của tệp mã
const __dirname = path.dirname(new URL(import.meta.url).pathname);

let logData = [];

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

// Hàm để lấy dữ liệu log theo loại
export function readLogData(req, res) {
    const type = req.params.type;
    try {
        // Kiểm tra xem file log.json có tồn tại không
        if (!existsSync(logFilePath)) {
            console.warn('File log.json không tồn tại.');
            return res.status(404).json({ message: 'File log không tồn tại.' }); // Trả về lỗi 404 nếu file không tồn tại
        }

        // Đọc nội dung của file log.json
        const fileContent = readFileSync(logFilePath, 'utf8');
        if (fileContent) {
            logData = JSON.parse(fileContent); // Cập nhật logData từ file

            // Lọc dữ liệu theo loại
            const filteredLogs = logData.filter(log => log.type === type);

            return res.json(filteredLogs); // Trả về dữ liệu đã lọc
        }
    } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ log.json:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi đọc dữ liệu.' }); // Trả về lỗi 500 nếu có lỗi xảy ra
    }

    return res.json([]); // Trả về mảng rỗng nếu không có dữ liệu
}

// Xóa các bản ghi theo loại
export const deleteLogByType = (req, res) => {
    const type = req.params.type;
    console.log(type);
    if (!type) {
        return res.status(400).send('Loại bản ghi cần xóa không được cung cấp.');
    }

    try {
        // Đọc lại dữ liệu log từ file
        const fileContent = readFileSync(logFilePath, 'utf8');
        logData = JSON.parse(fileContent); // Cập nhật logData từ file

        // Lọc các bản ghi không thuộc loại cần xóa
        const updatedLogData = logData.filter(entry => entry.type !== type);

        // Nếu không có bản ghi nào bị xóa, thông báo
        if (updatedLogData.length === logData.length) {
            return res.status(404).send(`Không tìm thấy bản ghi nào với loại "${type}".`);
        }

        // Ghi dữ liệu đã cập nhật trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(updatedLogData, null, 2), 'utf8');
        logData = updatedLogData; // Cập nhật lại logData trong bộ nhớ
        return res.status(200).send(`Đã xóa tất cả bản ghi loại "${type}".`);
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu trong log.json:', error);
        return res.status(500).send('Đã xảy ra lỗi khi xóa dữ liệu.');
    }
};
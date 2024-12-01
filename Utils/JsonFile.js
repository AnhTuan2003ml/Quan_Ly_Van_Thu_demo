import { existsSync, writeFileSync, readFileSync } from 'fs';
import { sendEmailNotification } from "../controllers/sendEmail.js";
import { getEmailById } from '../controllers/users.js';

export function readJSONFile(filePath) {
    if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, 'utf8');

        // Kiểm tra xem nội dung file có rỗng không
        if (!fileContent) {
            console.error('Tệp JSON trống');
            return [];
        }

        try {
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Lỗi phân tích cú pháp JSON:', error);
            return []; // Trả về mảng rỗng nếu có lỗi
        }
    }

    return [];
}


// Hàm ghi dữ liệu vào tệp JSON
export function writeJSONFile(filePath, data) {
    try {
        // Nếu file không tồn tại, tạo file mới
        if (!existsSync(filePath)) {
            writeFileSync(filePath, '[]', 'utf8'); // Tạo file JSON rỗng
        }

        // Ghi lại dữ liệu vào file JSON
        writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Lỗi khi ghi file JSON:', error);
        throw error;
    }
}

// Hàm kiểm tra giá trị rỗng và thay thế bằng null
function checkEmpty(value) {
    return value === '' || value === null || value === undefined ? null : value;
}

// Thêm thông tin văn bản vào JSON
export function addDocument_den(tenvb, noidung, ngayden, so, han, nguoiphutrach, link, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const data = readJSONFile(filePath);  // Đọc dữ liệu hiện tại từ file JSON

            // Tạo ID mới cho văn bản (ID là số thứ tự tăng dần)
            const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;  // Tính ID mới dựa trên ID cuối cùng

            // Tạo đối tượng văn bản mới
            const newDocument = {
                id: newId,  // ID mới
                tenvb: checkEmpty(tenvb),
                noidung: checkEmpty(noidung),
                ngayden: checkEmpty(ngayden),
                so: checkEmpty(so),
                han: checkEmpty(han),
                nguoiphutrach: checkEmpty(nguoiphutrach),
                link: checkEmpty(link),
                status: "uncheck"
            };

            // Thêm văn bản mới vào mảng dữ liệu
            data.push(newDocument);

            // Ghi lại dữ liệu vào file JSON
            writeJSONFile(filePath, data);

            // Trả về ID của văn bản mới thêm
            resolve(newDocument.id);
        } catch (error) {
            reject('Lỗi khi thêm văn bản: ' + error.message);
        }
    });
}

// Cập nhật thông tin văn bản vào JSON
export function updateDocument_den(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link, filePath) {
    return new Promise((resolve, reject) => {
        const data = readJSONFile(filePath);
        const documentIndex = data.findIndex(doc => doc.id === id);
        if (documentIndex === -1) return reject('Document not found');
        data[documentIndex] = {
            ...data[documentIndex],
            tenvb,
            noidung,
            ngayden,
            so,
            han,
            nguoiphutrach,
            link
        };
        writeJSONFile(filePath, data);
        resolve();
    });
}

// Cập nhật thông tin văn bản vào JSON (loại khác)
export function updateDocument_di(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link, filePath, lienket, ngaydi) {
    return new Promise((resolve, reject) => {
        const data = readJSONFile(filePath);
        const documentIndex = data.findIndex(doc => doc.id === id);
        if (documentIndex === -1) return reject('Document not found');
        data[documentIndex] = {
            ...data[documentIndex],
            tenvb,
            lienket,
            ngayden,
            ngaydi,
            so,
            han,
            nguoiphutrach,
            noidung,
            link
        };
        console.log(data);
        writeJSONFile(filePath, data);
        resolve();
    });
}

// Thêm thông tin văn bản vào JSON (loại khác)
export function addDocument_di(tenvb, noidung, ngayden, so, han, nguoiphutrach, link, filePath, lienket, ngaydi) {
    return new Promise((resolve, reject) => {
        try {
            const data = readJSONFile(filePath);  // Đọc dữ liệu hiện tại từ file JSON

            // Tạo ID mới cho văn bản (ID là số thứ tự tăng dần)
            const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;  // Tính ID mới dựa trên ID cuối cùng

            // Tạo đối tượng văn bản mới
            const newDocument = {
                id: newId,  // ID mới
                tenvb: checkEmpty(tenvb),
                lienket: checkEmpty(lienket),
                ngayden: checkEmpty(ngayden),
                ngaydi: checkEmpty(ngaydi),
                so: checkEmpty(so),
                han: checkEmpty(han),
                nguoiphutrach: checkEmpty(nguoiphutrach),
                noidung: checkEmpty(noidung),
                link: checkEmpty(link),
                status: "uncheck"
            };

            // Thêm văn bản mới vào mảng dữ liệu
            data.push(newDocument);

            // Ghi lại dữ liệu vào file JSON
            writeJSONFile(filePath, data);

            // Trả về ID của văn bản mới thêm
            resolve(newDocument.id);
        } catch (error) {
            reject('Lỗi khi thêm văn bản: ' + error.message);
        }
    });
}

// Hàm kiểm tra hợp lệ của hạn
export function checkDeadlineValidity(han) {
    const today = new Date();
    const deadline = new Date(han);

    // Kiểm tra xem hạn có hợp lệ và chưa qua
    if (isNaN(deadline)) {
        return 'Ngày hạn không hợp lệ';
    }
    if (deadline < today) {
        return 'Ngày hạn đã qua';
    }
    return 'Ngày hạn hợp lệ';
}

// Hàm tính số ngày còn lại cho các tài liệu
export async function daysUntilDeadline(filePath, type) {
    const data = readJSONFile(filePath);
    const today = new Date();

    for (const doc of data) {
        const deadline = new Date(doc.han);
        const timeDiff = deadline - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Chuyển đổi thành ngày

        // Kiểm tra nếu thời hạn gần kề (<= 3 ngày) và tài liệu chưa hoàn thành
        if (daysDiff >= 0 && daysDiff <= 3) {
            const email = await getEmailById(doc.nguoiphutrach); // Lấy email của người phụ trách
            const subject = `Reminder: Document ${doc.tenvb} Deadline Approaching`;
            const text = `The deadline for document "${doc.tenvb}" is approaching in ${daysDiff} days. Please complete it by ${doc.han}.`;
            const html = `<p>The deadline for document <strong>${doc.tenvb}</strong> is approaching in <strong>${daysDiff}</strong> days.</p><p>Please complete it by <strong>${doc.han}</strong>.</p><p>${type}</p>`;

            try {
                await sendEmailNotification(email, subject, text, html);
                console.log(`Email đã được gửi đến ${email} cho tài liệu ${doc.tenvb}`);
            } catch (error) {
                console.error(`Không thể gửi email cho tài liệu ${doc.tenvb}:`, error);
            }
        }
    }
}

export function readJSONFileID(filePath, id) {
    return new Promise((resolve, reject) => {
        if (existsSync(filePath)) {
            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            // Lọc dữ liệu theo id sử dụng find, trả về phần tử đầu tiên nếu tìm thấy
            const document = data.find(item => item.id === id);

            if (document) {
                resolve(document);
            } else {
                reject('Không tìm thấy văn bản');
            }
        } else {
            reject('Tệp không tồn tại');
        }
    });
}

// Hàm thay đổi trạng thái (status) của văn bản
export function updateDocumentStatus(id, newStatus, filePath) {
    return new Promise((resolve, reject) => {
        // Đọc dữ liệu từ file JSON
        const data = readJSONFile(filePath);

        // Tìm văn bản theo ID
        const documentIndex = data.findIndex(doc => doc.id === id);

        if (documentIndex === -1) {
            return reject('Không tìm thấy văn bản với ID ' + id);
        }

        // Cập nhật trạng thái mới của văn bản
        data[documentIndex].status = newStatus;

        // Ghi lại dữ liệu vào file JSON
        writeJSONFile(filePath, data);

        // Trả về thành công
        resolve({
            success: true,
            message: `Trạng thái của văn bản với ID ${id} đã được cập nhật thành ${newStatus}.`,
            document: data[documentIndex]
        });
    });
}

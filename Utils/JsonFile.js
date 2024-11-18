import { existsSync, writeFileSync, readFileSync } from 'fs';
// Hàm đọc dữ liệu từ tệp JSON
export function readJSONFile(filePath) {
    if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    }
    return [];
}

// Hàm ghi dữ liệu vào tệp JSON
export function writeJSONFile(filePath, data) {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function readJSONFileID(filePath, id) {
    return new Promise((resolve, reject) => {
        if (existsSync(filePath)) {
            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            // Lọc dữ liệu theo id
            const filteredData = data.filter(item => item.id === id);

            if (filteredData.length > 0) {
                // console.log(filteredData[0]);
                resolve(filteredData[0]);
            } else {
                reject('Không tìm thấy văn bản');
            }
        } else {
            reject('Tệp không tồn tại');
        }
    });
}

// Cập nhật thông tin văn bản vào JSON
export function updateDocument_den(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link) {
    console.log(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link);
    return new Promise((resolve, reject) => {
        const data = readJSONFile(filePath);
        const documentIndex = data.findIndex(doc => doc.id === id);
        if (documentIndex === -1) return reject('Document not found');
        data[documentIndex] = { ...data[documentIndex], tenvb, noidung, ngayden, so, han, nguoiphutrach, link };
        writeJSONFile(filePath, data);
        resolve();
    });
}


// Hàm kiểm tra giá trị rỗng và thay thế bằng null
function checkEmpty(value) {
    return value === '' || value === null ? null : value;
}

// Thêm thông tin văn bản vào JSON
export function addDocument_den(tenvb, noidung, ngayden, so, han, nguoiphutrach, link) {
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
                link: checkEmpty(link)
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
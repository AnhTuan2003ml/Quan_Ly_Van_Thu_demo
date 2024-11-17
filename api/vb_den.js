import { Router } from 'express';
import multer, { diskStorage } from 'multer';
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import path, { join } from 'path';
import { addLogData } from './log.js'; // Import đúng file log.js trong cùng thư mục
import { getEmailById } from '../controllers/users.js';
import sendEmailNotification  from './sendEmail.js';

export default () => {
    const router = Router();
    // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
    let filePath = path.join(__dirname, '../data/vb_den.json');
    // Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
    if (filePath.startsWith('\\')) {
        filePath = filePath.substring(1);
    }


    // Định nghĩa thư mục để lưu file tải lên
    let uploadDir = join(__dirname, '../doc');
    if (uploadDir.startsWith('\\')) {
        uploadDir = uploadDir.substring(1);
    }

    const storage = diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const filePath = join(uploadDir, file.originalname);
            if (existsSync(filePath)) {
                unlinkSync(filePath); // Xóa tệp cũ nếu tồn tại
            }
            cb(null, file.originalname);
        }
    });

    const upload = multer({ storage: storage });

    // Middleware kiểm tra đăng nhập
    function ensureAuthenticated(req, res, next) {
        // console.log(req.session); // Kiểm tra session có tồn tại không
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập trước' });
        }
        next();
    }

    const testSendEmail = async (newEmail) => {
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
    // , ensureAuthenticated


    // API lấy dữ liệu vb_den
    router.get('/', (req, res) => {
        const userId = req.session.userId;
        const userRole = req.session.userRole;

        const data = readJSONFile(filePath);
        if (userRole === 'user') {
            const userDocuments = data.filter(doc => doc.nguoiphutrach === userId);
            return res.json(userDocuments);
        }
        return res.json(data);
    });

    // API cập nhật thông tin văn bản đến
    router.put('/:id', upload.single('documentFile'), (req, res) => {
        const documentId = parseInt(req.params.id);
        const { tenvb, noidung, ngayden, so, han, nguoiphutrach } = req.body;
        const documentFile = req.file; // Tệp mới nếu có

        // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
        const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : req.body.oldFilePath || null;
        console.log(filePath_doc);
        // Tìm thông tin văn bản cũ (có thể lấy từ cơ sở dữ liệu hoặc từ file JSON)
        readJSONFileID(filePath, documentId) // Giả sử bạn có hàm này để lấy thông tin văn bản cũ
            .then(oldDocument => {
                const userId = req.session.userId;
                // So sánh và tạo danh sách các thuộc tính thay đổi
                const changes = [];
                // console.log(oldDocument);
                if (oldDocument.tenvb !== tenvb) {
                    changes.push(`Tên văn bản thay đổi từ '${oldDocument.tenvb}' thành '${tenvb}'`);
                }
                if (oldDocument.noidung !== noidung) {
                    changes.push(`Nội dung thay đổi`);
                }
                if (oldDocument.ngayden !== ngayden) {
                    changes.push(`Ngày đến thay đổi từ '${oldDocument.ngayden}' thành '${ngayden}'`);
                }
                if (oldDocument.so !== parseInt(so)) {
                    changes.push(`Số văn bản thay đổi từ '${oldDocument.so}' thành '${so}'`);
                }
                if (oldDocument.han !== han) {
                    changes.push(`Hạn thay đổi từ '${oldDocument.han}' thành '${han}'`);
                }
                if (oldDocument.nguoiphutrach !== parseInt(nguoiphutrach)) {
                    changes.push(`Người phụ trách thay đổi từ '${oldDocument.nguoiphutrach}' thành '${nguoiphutrach}'`);
                    const oldEmail = getEmailById(oldDocument.nguoiphutrach)
                    const newEmail = getEmailById(nguoiphutrach)
                    const testSendEmail_put = async () => {
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
                    testSendEmail_put();
                }
                if (oldDocument.filePath !== filePath_doc) {
                    changes.push(`Tệp đính kèm thay đổi`);
                }

                // Nếu có thay đổi, ghi log
                if (changes.length > 0) {
                    const timestamp = new Date().toISOString(); // Thời gian thay đổi
                    console.log(userId, documentId, 'văn bản đến', changes.join('; '), timestamp);
                    addLogData({
                        userId: userId,
                        documentId: documentId,
                        type: 'văn bản đến',
                        changes: changes.join('; '),
                        timestamp: timestamp
                    });
                }

                // Cập nhật thông tin văn bản
                updateDocument(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc)
                    .then(() => {
                        res.json({ success: true, message: 'Văn bản đã được cập nhật thành công.' });
                    })
                    .catch(err => {
                        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật văn bản.' });
                    });
            })
            .catch(err => {
                res.status(500).json({ success: false, message: 'Không tìm thấy văn bản.' });
            });
    });

    // API thêm văn bản đến mới
    router.post('/', upload.single('documentFile'), (req, res) => {
        const { tenvb, noidung, ngayden, so, han, nguoiphutrach } = req.body;
        const documentFile = req.file; // Tệp mới nếu có

        // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
        const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : null;
        const newEmail = getEmailById(nguoiphutrach);
        const timestamp = new Date().toISOString(); // Thời gian thay đổi
        let id_doc =0;
        // console.log(newDocument);
        testSendEmail(newEmail);

        // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
        addDocument(tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc)
            .then((documentId) => {
                const id_doc = documentId;
                const timestamp = new Date().toISOString(); // Thời gian thay đổi

                // Trả về phản hồi thành công trước khi gọi addLogData()
                res.json({ success: true, message: 'Văn bản đến đã được thêm thành công.', documentId: id_doc });

                // Ghi log vào cơ sở dữ liệu (hoặc file) sau khi phản hồi đã được gửi
                // Lưu ý là không gọi res.json() nữa sau khi đã gửi phản hồi
                addLogData({
                    userId: userId,
                    documentId: id_doc,
                    type: 'văn bản đến',
                    changes: 'Thêm văn bản đến',
                    timestamp: timestamp
                }).catch(err => {
                    console.error('Có lỗi xảy ra khi thêm log:', err);
                    // Không gọi res.json() lại nữa vì phản hồi đã được gửi
                });
            })
            .catch(err => {
                // Lỗi khi thêm văn bản, trả về phản hồi ngay
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm văn bản đến', error: err.message });
                }
            });

    });


    // , ensureAuthenticated

    // API xóa văn bản
    // Xóa văn bản và tệp tin theo ID
    router.delete('/:id', (req, res) => {
        const documentId = parseInt(req.params.id); // Chuyển ID từ chuỗi sang số
        console.log("Văn bản cần xóa:", documentId);

        // Đọc dữ liệu từ file JSON
        const data = readJSONFile(filePath);

        // Tìm kiếm index của văn bản cần xóa
        const documentIndex = data.findIndex(doc => doc.id === documentId);

        if (documentIndex === -1) {
            return res.status(404).json({ success: false, message: 'Văn bản không tồn tại.' });
        }

        // Lấy link của tệp tin cần xóa
        const fileLink = data[documentIndex].link;

        // Kiểm tra xem fileLink có hợp lệ hay không
        if (fileLink && typeof fileLink === 'string') {
            // Xử lý đường dẫn tệp tin từ link trong JSON
            const filePathToDelete = path.join(__dirname, '../doc', path.basename(fileLink));  // Đảm bảo đường dẫn chính xác

            // Xóa tệp tin nếu tồn tại
            if (existsSync(filePathToDelete)) {
                unlinkSync(filePathToDelete);  // Xóa tệp tin
                console.log('Tệp tin đã được xóa:', filePathToDelete);
            } else {
                console.log('Tệp tin không tồn tại, bỏ qua việc xóa.');
            }
        } else {
            console.log('Không có tệp tin liên quan hoặc link không hợp lệ, bỏ qua việc xóa tệp.');
        }

        // Xóa văn bản khỏi mảng
        data.splice(documentIndex, 1);
        // Đặt lại ID cho các văn bản còn lại để chúng có ID liên tục
        data.forEach((doc, index) => {
            doc.id = index + 1; // Đặt lại ID để đảm bảo thứ tự liên tục từ 1
        });


        // Ghi lại dữ liệu vào file JSON
        writeJSONFile(filePath, data);

        // Trả về phản hồi thành công
        return res.status(200).json({ success: true, message: 'Văn bản và tệp tin đã được xóa.' });
    });


    // Cập nhật thông tin văn bản vào JSON
    function updateDocument(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link) {
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
    function addDocument(tenvb, noidung, ngayden, so, han, nguoiphutrach, link) {
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
    // Hàm đọc dữ liệu từ tệp JSON
    function readJSONFile(filePath) {
        if (existsSync(filePath)) {
            const fileContent = readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
        return [];
    }

    // Hàm ghi dữ liệu vào tệp JSON
    function writeJSONFile(filePath, data) {
        writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    function readJSONFileID(filePath, id) {
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

    return router;
};

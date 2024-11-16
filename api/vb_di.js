import { Router } from 'express';
import multer, { diskStorage } from 'multer';
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import path, { join } from 'path';
import { addLogData } from './log.js'; // import đúng file log.js trong cùng thư mục
import sendEmailNotification from './sendEmail.js'
import { getEmails } from '../controllers/users.js';
export default () => {
    const router = Router();
    // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
    let filePath = path.join(__dirname, '../data/vb_di.json');
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



    // , ensureAuthenticated


    // API lấy dữ liệu vb_di
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

    // API cập nhật thông tin văn bản đi
    router.put('/:id', upload.single('documentFile'), (req, res) => {
        const documentId = parseInt(req.params.id);
        const { tenvb, noidung, ngayden, so, han, nguoiphutrach, lienket, ngaydi } = req.body;
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
                    const oldEmail = getEmails(oldDocument.nguoiphutrach)
                    const newEmail = getEmails(nguoiphutrach)

                    const testSendEmail = async () => {
                        const to = [oldEmail, newEmail];
                        const subject = 'Thông báo';
                        const text = ['Hủy', 'Thêm']; // Text content for each email
                        const html = ['<h1>Hủy</h1>', '<h1>Thêm</h1>'];

                        try {
                            if (to.length !== text.length) {
                                throw new Error('Số lượng email và số lượng nội dung không khớp!');
                            }

                            // Send each email with the corresponding text
                            for (let i = 0; i < to.length; i++) {
                                await sendEmailNotification(to[i], subject, text[i], html);  // Use text[i]
                                console.log(`Email kiểm tra đã được gửi thành công đến ${to[i]}!`);
                            }

                        } catch (error) {
                            console.error('Lỗi khi gửi email kiểm tra:', error);
                        }
                    };
                    testSendEmail();
                }
                if (oldDocument.filePath !== filePath_doc) {
                    changes.push(`Tệp đính kèm thay đổi`);
                }
                if (oldDocument.ngaydi !== ngaydi) {
                    changes.push(`Sửa ngày đi`)
                }
                if (oldDocument.lienket !== parseInt(lienket)) {
                    changes.push(`Liên kết thay đổi`)
                }
                // Nếu có thay đổi, ghi log
                if (changes.length > 0) {
                    const timestamp = new Date().toISOString(); // Thời gian thay đổi
                    console.log(userId, documentId, 'văn bản đi', changes.join('; '), timestamp);
                    addLogData({
                        userId: userId,
                        documentId: documentId,
                        type: 'văn bản đi',
                        changes: changes.join('; '),
                        timestamp: timestamp
                    });
                }

                // Cập nhật thông tin văn bản
                updateDocument(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc, ngaydi, parseInt(lienket))
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
        const { tenvb, noidung, ngayden, so, han, nguoiphutrach, ngaydi, lienket } = req.body;
        const documentFile = req.file; // Tệp mới nếu có

        // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
        const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : null;
        const newEmail = getEmails(nguoiphutrach)

        const testSendEmail = async () => {
            const to = newEmail;
            const subject = 'Thông báo';
            const text = 'Thêm'; // Text content for each email
            const html ='<h1>Thêm</h1>';

            try {
                if (to.length !== text.length) {
                    throw new Error('Số lượng email và số lượng nội dung không khớp!');
                } 
                await sendEmailNotification(to, subject, text, html);  // Use text[i]
                console.log(`Email kiểm tra đã được gửi thành công đến ${to}!`);
                

            } catch (error) {
                console.error('Lỗi khi gửi email kiểm tra:', error);
            }
        };

        // Tạo văn bản mới
        const newDocument = {
            tenvb,
            noidung,
            ngayden,
            ngaydi,
            so: parseInt(so),
            han,
            lienket: parseInt(lienket),
            nguoiphutrach: parseInt(nguoiphutrach),
            filePath: filePath_doc
        };
        console.log(newDocument);

        // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
        addDocument(newDocument)  // Giả sử bạn có hàm `addDocument` để lưu văn bản mới
            .then((documentId) => {
                const timestamp = new Date().toISOString(); // Thời gian thay đổi
                console.log(userId, documentId, 'văn bản đi', 'Thêm văn bản đi', timestamp);
                addLogData({
                    userId: userId,
                    documentId: documentId,
                    type: 'văn bản đi',
                    changes: 'Thêm văn bản đi',
                    timestamp: timestamp
                });
                res.json({ success: true, message: 'Văn bản đi đã được thêm thành công.' });
                testSendEmail();
            })
            .catch(err => {
                res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm văn bản đi.' });
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

        // Ghi lại dữ liệu vào file JSON
        writeJSONFile(filePath, data);

        // Trả về phản hồi thành công
        return res.status(200).json({ success: true, message: 'Văn bản và tệp tin đã được xóa.' });
    });


    // Cập nhật thông tin văn bản vào JSON
    function updateDocument(id, tenvb, noidung, ngayden, so, han, nguoiphutrach, link, ngaydi, lienket) {
        return new Promise((resolve, reject) => {
            const data = readJSONFile(filePath);
            const documentIndex = data.findIndex(doc => doc.id === id);
            if (documentIndex === -1) return reject('Document not found');
            data[documentIndex] = { ...data[documentIndex], tenvb, noidung, ngayden, so, han, nguoiphutrach, link, ngaydi, lienket };
            writeJSONFile(filePath, data);
            resolve();
        });
    }


    // Hàm kiểm tra giá trị rỗng và thay thế bằng null
    function checkEmpty(value) {
        return value === '' || value === null ? null : value;
    }

    // Thêm thông tin văn bản vào JSON
    function addDocument(tenvb, noidung, ngayden, so, han, nguoiphutrach, link, ngaydi, lienket) {
        return new Promise((resolve, reject) => {
            try {
                const data = readJSONFile(filePath);

                // Tạo đối tượng mới với các giá trị đã kiểm tra rỗng
                const newDocument = {
                    id: Date.now(), // Tạo ID mới (sử dụng timestamp làm ID)
                    tenvb: checkEmpty(tenvb),
                    noidung: checkEmpty(noidung),
                    ngayden: checkEmpty(ngayden),
                    so: checkEmpty(so),
                    ngaydi: checkEmpty(ngaydi),
                    lienket: checkEmpty(lienket),
                    han: checkEmpty(han),
                    nguoiphutrach: checkEmpty(nguoiphutrach),
                    link: checkEmpty(link),
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
}
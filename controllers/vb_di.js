
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { addLogData } from './log.js'; // Import đúng file log.js trong cùng thư mục
import { getEmailById } from './users.js';
import { testSendEmail_multi, testSendEmail_single } from "./sendEmail.js";
import { readJSONFile, readJSONFileID, writeJSONFile, updateDocument_di, addDocument_di, daysUntilDeadline } from '../Utils/JsonFile.js';
import {Get_link_vb_den} from './vb_den.js';

// Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
export const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
export let filePath = path.join(__dirname, '../data/vb_di.json');
// Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1);
}


export const Get_vb_di = async (req, res) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const data = readJSONFile(filePath);

    // Sử dụng async/await để xử lý bất đồng bộ khi gọi Get_link_vb_den
    const updatedData = await Promise.all(data.map(async (doc) => {
        if (doc.lienket !== null) {
            try {
                // Gọi Get_link_vb_den để lấy link từ lienket
                const linkData = await Get_link_vb_den(doc.lienket);

                // Thêm thuộc tính vb_lk mà không thay đổi lienket
                return {
                    ...doc,
                    vb_lk: linkData.link,  // Thêm link vào vb_lk
                };
            } catch (error) {
                // Nếu có lỗi, có thể trả về lienket ban đầu và vb_lk là null
                console.error(`Error fetching link for document with ID: ${doc.lienket}`, error);
                return {
                    ...doc,
                    vb_lk: null,  // Nếu không có link, gán vb_lk là null
                };
            }
        }
        return doc;  // Nếu không có lienket, giữ nguyên tài liệu
    }));

    // Nếu người dùng có role là 'user', chỉ trả về các tài liệu mà người đó phụ trách
    if (userRole === 'user') {
        const userDocuments = updatedData.filter(doc => doc.nguoiphutrach === userId);
        return res.json(userDocuments);
    }

    // Nếu là admin, trả về tất cả dữ liệu đã cập nhật
    return res.json(updatedData);
};


export const Put_vb_di = (req, res) => {
    const documentId = parseInt(req.params.id);
    const { tenvb, noidung, ngayden, so, han, nguoiphutrach,lienket,ngaydi,status} = req.body;
    const userId = req.session.userId;
    const documentFile = req.file; // Tệp mới nếu có
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : req.body.oldFilePath || null;
   
    if (filePath_doc) {
        const data = readJSONFile(filePath);
        const existingDocument = data.find(doc => doc.link === filePath_doc);

        if (existingDocument) {
            // Nếu trùng với văn bản khác, thay đổi tên tệp
            if (existingDocument.id !== documentId) {
                const ext = path.extname(filePath_doc);
                const baseName = path.basename(filePath_doc, ext);
                let counter = 1;
                let newFilePath = `../../doc/${baseName}_${counter}${ext}`;

                while (data.some(doc => doc.link === newFilePath)) {
                    counter++;
                    newFilePath = `../../doc/${baseName}_${counter}${ext}`;
                }

                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
            // Nếu trùng với chính văn bản đó, không thay đổi tên file, chỉ ghi đè
        }
    }
    // Tìm thông tin văn bản cũ (có thể lấy từ cơ sở dữ liệu hoặc từ file JSON)
    readJSONFileID(filePath, documentId) // Giả sử bạn có hàm này để lấy thông tin văn bản cũ
        .then(oldDocument => {
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
                testSendEmail_multi(oldEmail, newEmail);
            }
            if (oldDocument.filePath !== filePath_doc && oldDocument.filePath !== null) {
                changes.push(`Tệp đính kèm thay đổi`);
            }
            if (oldDocument.lienket !== lienket && oldDocument.lienket !== null) {
                changes.push(`Liên kết file văn bản đến thay đổi`);
            }
            if (oldDocument.ngaydi !== ngaydi) {
                changes.push(`Ngày đi thay đổi`);
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
            // console.log(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc,lienket,ngaydi);
            // Cập nhật thông tin văn bản
            updateDocument_di(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc, filePath, parseInt(lienket),ngaydi,status)
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
}

export const Post_vb_di = (req, res) => {
    const { tenvb, noidung, ngayden, so, han, nguoiphutrach,lienket,ngaydi,status } = req.body;
    const documentFile = req.file; // Tệp mới nếu có
    const userId = req.session.userId;
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : null;

    if (filePath_doc) {
        const data = readJSONFile(filePath);
        const existingDocument = data.find(doc => doc.link === filePath_doc);

        if (existingDocument) {
            // Nếu trùng với văn bản khác, thay đổi tên tệp
            if (existingDocument.id) {
                const ext = path.extname(filePath_doc);
                const baseName = path.basename(filePath_doc, ext);
                let counter = 1;
                let newFilePath = `../../doc/${baseName}_${counter}${ext}`;

                while (data.some(doc => doc.link === newFilePath)) {
                    counter++;
                    newFilePath = `../../doc/${baseName}_${counter}${ext}`;
                }

                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
            // Nếu trùng với chính văn bản đó, không thay đổi tên file, chỉ ghi đè
        }
    }
    const newEmail = getEmailById(nguoiphutrach);
    // console.log(newDocument);
    testSendEmail_single(newEmail);

    // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
    addDocument_di(tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc, filePath,parseInt(lienket),ngaydi,status)
        .then((documentId) => {
            const id_doc = documentId;
            const timestamp = new Date().toISOString(); // Thời gian thay đổi

            // Trả về phản hồi thành công trước khi gọi addLogData()
            res.json({ success: true, message: 'Văn bản đi đã được thêm thành công.', documentId: id_doc });

            // Ghi log vào cơ sở dữ liệu (hoặc file) sau khi phản hồi đã được gửi
            // Lưu ý là không gọi res.json() nữa sau khi đã gửi phản hồi
            addLogData({
                userId: userId,
                documentId: id_doc,
                type: 'văn bản đi',
                changes: 'Thêm văn bản đi',
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
}

export const Delete = (req, res) => {
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
        let filePathToDelete = path.join(__dirname, '../doc', path.basename(fileLink));  // Đảm bảo đường dẫn chính xác
        if (filePathToDelete.startsWith('\\')) {
            filePathToDelete = filePathToDelete.substring(1);
        }
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
}



// Gọi hàm kiểm tra và gửi email
export async function checkDeadlines() {
    try {
        await daysUntilDeadline(filePath,"Văn bản đi");
        console.log('Đã kiểm tra tất cả các hạn.');
    } catch (error) {
        console.error('Lỗi khi kiểm tra hạn:', error);
    }
}
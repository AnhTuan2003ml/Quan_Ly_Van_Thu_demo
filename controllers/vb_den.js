
import { existsSync, unlinkSync} from 'fs';
import path from 'path';
import { addLogData } from './log.js'; // Import đúng file log.js trong cùng thư mục
import { getEmailById } from './users.js';
import { testSendEmail_multi, testSendEmail_single } from "./sendEmail.js";
import { readJSONFile, readJSONFileID, writeJSONFile, updateDocument_den,addDocument_den} from '../Utils/JsonFile.js';


// Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
export const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
export let filePath = path.join(__dirname, '../data/vb_den.json');
// Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1);
}


export const Get_link_vb_den = async (id) => {
    const data = readJSONFile(filePath);

    // Tìm văn bản có ID trùng với id
    const document = data.find(doc => doc.id === id);
    // console.log(id,document)
    // Nếu tìm thấy văn bản, trả về link của nó, nếu không trả về lỗi
    if (document) {
        return { link: document.link };
    } else {
        // Trả về một đối tượng có lỗi khi không tìm thấy tài liệu
        return { link: null, error: 'Document not found' };
    }
};
export const GetDocumentInfo = (req, res) => {
    const data = readJSONFile(filePath);
    // Lấy thông tin các văn bản và tạo một mảng mới chứa các đối tượng id và info
    const documentInfo = data.map(doc => {
        // Tạo chuỗi thông tin bao gồm tenvb, ngayden, so
        const info = `${doc.tenvb} - Ngày đến: ${doc.ngayden} - Số: ${doc.so}`;
        // Trả về đối tượng chứa id và chuỗi thông tin
        return {
            id: doc.id,
            info: info
        };
    });
    // console.log(documentInfo);
    // Trả về mảng documentInfo dưới dạng JSON
    res.json(documentInfo);
};




export const Get_vb_den = (req, res) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const data = readJSONFile(filePath);
    if (userRole === 'user') {
        const userDocuments = data.filter(doc => doc.nguoiphutrach === userId);
        return res.json(userDocuments);
    }
    return res.json(data);
}

export const Put_vb_den = (req, res) => {
    const documentId = parseInt(req.params.id);
    const { tenvb, noidung, ngayden, so, han, nguoiphutrach } = req.body;
    const userId = req.session.userId;
    const documentFile = req.file; // Tệp mới nếu có
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : req.body.oldFilePath || null;
    console.log(documentId,tenvb, noidung, ngayden, so, han, nguoiphutrach);
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
            console.log(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc);
            // Cập nhật thông tin văn bản
            updateDocument_den(documentId, tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc,filePath)
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

export const Post_vb_den = (req,res) => {
    const { tenvb, noidung, ngayden, so, han, nguoiphutrach } = req.body;
    const documentFile = req.file; // Tệp mới nếu có
    const userId = req.session.userId;
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    const filePath_doc = documentFile ? `../../doc/${path.basename(documentFile.filename)}` : null;
    const newEmail = getEmailById(nguoiphutrach);
    // console.log(newDocument);
    testSendEmail_single(newEmail);

    // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
    addDocument_den(tenvb, noidung, ngayden, parseInt(so), han, parseInt(nguoiphutrach), filePath_doc,filePath)
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
}

export const Delete = (req,res) =>{
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
}




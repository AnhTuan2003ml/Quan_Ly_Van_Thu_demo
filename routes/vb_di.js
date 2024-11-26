import { Router } from 'express';
import { Get_vb_di, Post_vb_di, Put_vb_di, Delete, __dirname} from '../controllers/vb_di.js';
import multer, { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { ensureAuthenticated } from '../middleware/Middleware.js';


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

const router = Router();
router.get('/', ensureAuthenticated, Get_vb_di);
router.put('/:id', ensureAuthenticated, upload.single('documentFile'), Put_vb_di);
router.post('/', ensureAuthenticated, upload.single('documentFile'), Post_vb_di);
router.delete('/:id', ensureAuthenticated, Delete);

export default router;
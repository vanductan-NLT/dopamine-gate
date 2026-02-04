# Hướng dẫn Publish Dopamine Gate lên Chrome Web Store

Để đưa extension của bạn lên cửa hàng chính thức, hãy thực hiện các bước sau:

## 1. Chuẩn bị bản build
- Chạy lệnh: `npm run build`
- Kiểm tra thư mục `dist`. Toàn bộ file trong đây sẽ là nội dung của extension.
- Nén (zip) thư mục `dist` thành file `dist.zip`.

## 2. Tạo tài khoản Developer
- Truy cập [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
- Đăng nhập bằng tài khoản Google.
- Đăng ký làm Developer (phí một lần là $5).

## 3. Tạo Item mới
- Click **"New Item"**.
- Upload file `dist.zip` đã chuẩn bị.

## 4. Cấu hình chi tiết
- **Store Listing**:
  - Tên (Dopamine Gate).
  - Mô tả ngắn và dài (Lấy từ README).
  - Upload Icon (128x128).
  - Screenshots (Ít nhất 1 cái, kích thước 1280x800 hoặc 640x400).
- **Privacy Tab**:
  - Khai báo các quyền (Permissions): `storage`, `tabs`, `scripting`, `activeTab`.
  - Giải thích tại sao cần các quyền này (để theo dõi web blocked và hiển thị overlay).
  - Khai báo là không thu thập dữ liệu cá nhân (vì API Key và logs lưu local).

## 5. Review và Publish
- Click **"Submit for Review"**.
- Google sẽ kiểm duyệt trong vòng 24h - vài ngày.
- Sau khi duyệt, extension sẽ có mặt trên Chrome Web Store!

Chúc bạn thành công! 🚀

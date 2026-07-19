# Hệ Thống Luyện Thi Trắc Nghiệm

Ứng dụng web tĩnh dùng để luyện thi trắc nghiệm, quản lý tài khoản người dùng và quản lý đề thi mà không cần backend/database. Dự án được thiết kế để chạy tốt trên GitHub Pages: chỉ cần HTML, TailwindCSS CDN, Vanilla JavaScript và các file dữ liệu tĩnh trong thư mục `data/`.

## Mục Tiêu Thiết Kế

- Chạy được trên GitHub Pages hoặc static hosting bất kỳ.
- Không cần build step, không cần Node server, không cần database.
- Dữ liệu đề thi và user được lưu trong file tĩnh của repo.
- Có admin panel để hỗ trợ hash mật khẩu, encode đề thi và cập nhật danh sách user qua GitHub API.
- Các lớp bảo vệ được thiết kế phù hợp với môi trường static hosting, nhưng không thay thế backend auth thật.

## Cấu Trúc Thư Mục

```text
multiple-choice-web/
├── index.html                 # App luyện thi chính (HTML shell)
├── admin.html                 # Admin panel (HTML shell)
├── README.md                  # Tài liệu hướng dẫn
├── .gitignore                 # Ignore config local / IDE / log
├── assets/
│   ├── css/
│   │   ├── base.css           # CSS dùng chung
│   │   ├── app.css            # CSS riêng app luyện thi
│   │   └── admin.css          # CSS riêng admin panel
│   └── js/
│       ├── config.js          # Constants dùng chung
│       ├── core/              # Logic thuần: crypto, parser, utils
│       ├── services/          # Fetch/API/storage/session services
│       ├── ui/                # DOM/toast/password helpers
│       ├── app/               # Modules cho index.html
│       └── admin/             # Modules cho admin.html
└── data/
    ├── manifest.txt           # Danh sách đề thi
    ├── de_1.txt               # File đề thi, có thể encode bằng #ENCODED
    ├── de_2.txt               # File đề thi, có thể encode bằng #ENCODED
    └── users/
        └── user.text          # Danh sách user dạng username,hash
```

## 1. App Chính: `index.html`

### Tính Năng

- Đăng nhập bằng tài khoản trong `data/users/user.text`.
- Tự động tải danh sách đề từ `data/manifest.txt`.
- Tải nội dung đề từ các file `data/de_*.txt`.
- Hỗ trợ đảo thứ tự câu hỏi.
- Hỗ trợ đảo thứ tự đáp án.
- Chấm điểm sau khi nộp bài.
- Hiển thị danh sách câu đúng/sai.
- Cho phép click vào câu đúng/sai để scroll tới câu tương ứng.
- Lưu lịch sử làm bài trong `localStorage`.

### Logic Bảo Mật

#### Đăng nhập bằng HMAC-SHA256

Mật khẩu user không được lưu plaintext trong `user.text`. Mỗi dòng user có dạng:

```text
username,hmac_sha256_hex
```

App sử dụng HMAC-SHA256 thay vì SHA-256 thuần để giảm rủi ro bị tra ngược bằng rainbow table. Secret key không được ghi plaintext trực tiếp trong file hướng dẫn này. Khi fork repo, người triển khai cần tự chọn secret key riêng và cập nhật lại `SECRET_KEY_HASH` trong cả `index.html` và `admin.html`.

#### Session chỉ lưu trong `sessionStorage`

Trạng thái đăng nhập được lưu trong `sessionStorage`, không lưu trong `localStorage`. Điều này giúp session mất khi đóng tab/trình duyệt, giảm thời gian tồn tại của phiên đăng nhập trên máy dùng chung.

#### Chặn file HTML giả

Khi fetch `user.text`, `manifest.txt` hoặc file đề, code có kiểm tra trường hợp server trả về HTML thay vì file text. Điều này giúp tránh việc parser xử lý nhầm trang lỗi hoặc trang fallback của static hosting.

#### Bỏ BOM khi đọc text

Các file text có thể bị lưu với UTF-8 BOM. Code có hàm xử lý BOM để tránh lỗi username hoặc câu hỏi bị dính ký tự ẩn ở đầu file.

### Giới Hạn Bảo Mật

Vì toàn bộ code chạy trên browser, người dùng có kỹ năng DevTools vẫn có thể bypass client-side auth. Lớp đăng nhập hiện tại phù hợp để hạn chế người dùng thông thường, không phải bảo mật cấp backend.

Nếu cần bảo mật thật, nên dùng backend hoặc dịch vụ auth như Firebase Auth, Supabase Auth, hoặc một API server riêng.

## 2. Dữ Liệu Người Dùng: `data/users/user.text`

### Format

```text
# username,hmac_sha256
user_a,<hash-here>
user_b,<hash-here>
```

Quy tắc:

- Dòng bắt đầu bằng `#` là comment.
- Mỗi user nằm trên một dòng.
- Dùng dấu phẩy để tách `username` và hash.
- Hash phải là chuỗi hex 64 ký tự.
- Không lưu mật khẩu plaintext.

### Tối Ưu Cho GitHub Pages

File `user.text` được fetch bằng `cache: 'no-store'` để giảm rủi ro browser giữ bản cũ sau khi admin cập nhật file qua GitHub API.

GitHub Pages vẫn có thể cần một khoảng thời gian ngắn để cập nhật sau commit. Nếu vừa lưu user mới mà app chưa nhận, hãy chờ 1-2 phút và hard refresh trang.

## 3. Hệ Thống Đề Thi

### `data/manifest.txt`

File manifest khai báo danh sách đề thi:

```text
de_1.txt|Đề kiểm tra số 1
de_2.txt|Đề kiểm tra số 2
```

Quy tắc:

- Cột trái là tên file trong thư mục `data/`.
- Cột phải là tiêu đề hiển thị trên UI.
- Dòng trống hoặc dòng comment có thể được bỏ qua.

### Format Đề Plaintext

Mỗi câu gồm nội dung câu hỏi và 4 đáp án được đánh dấu bằng `A.`, `B.`, `C.`, `D.`. Đáp án đúng được đánh dấu bằng `(true)` ở cuối dòng. Câu hỏi có thể kéo dài nhiều dòng.

```text
Câu 1: 2 + 2 = ?
A. 3
B. 4 (true)
C. 5
D. 6
*note: Vì 2 + 2 bằng 4 nên đáp án đúng là B.
```

Các câu cách nhau bằng một dòng trống.

`*note:` là phần giải thích tùy chọn và đặt sau đáp án D. Note chỉ được hiển thị sau khi người dùng nộp bài. Note có thể kéo dài nhiều dòng; nếu không có `*note:` hoặc nội dung note rỗng, giao diện sẽ không hiển thị khung giải thích.

### Encode Đề Bằng `#ENCODED`

Để tránh người dùng mở trực tiếp file đề và thấy ngay `(true)`, admin panel hỗ trợ encode file đề sang Base64 với header:

```text
#ENCODED
<base64-content>
```

Khi app tải đề, loader sẽ tự nhận diện `#ENCODED` và decode lại runtime.

### Logic Bảo Mật

Base64 không phải encryption. Đây chỉ là obfuscation để tránh lộ đáp án với người dùng thông thường khi mở URL file đề. Người có kỹ thuật vẫn có thể decode Base64.

Ưu điểm của cách này là phù hợp GitHub Pages: không cần server decode, không cần API, không cần build step.

### Validate Đề

Parser có kiểm tra số lượng đáp án đúng mỗi câu. Nếu một câu không có đúng một đáp án `(true)`, app sẽ ghi cảnh báo trong console để admin dễ phát hiện lỗi format.

## 4. Đảo Câu Và Đảo Đáp Án

### Tính Năng

- Nút đảo câu thay đổi thứ tự câu hỏi khi render.
- Nút đảo đáp án thay đổi thứ tự đáp án trong từng câu.
- Chấm điểm vẫn đúng dù thứ tự hiển thị đã bị đảo.

### Logic Kỹ Thuật

App giữ `originalIndex` cho từng đáp án và `id` gốc cho từng câu hỏi. Khi shuffle, thứ tự render thay đổi nhưng chỉ số gốc vẫn được giữ để chấm điểm chính xác.

Thuật toán shuffle là Fisher-Yates, tạo mảng mới thay vì mutate mảng gốc.

## 5. Chấm Điểm Và Lịch Sử

### Chấm Điểm

Khi nộp bài:

- App tìm radio đã chọn theo `question_<originalQuestionId>`.
- So sánh với đáp án có `isCorrect = true`.
- Tô xanh đáp án đúng.
- Tô đỏ đáp án sai nếu user chọn sai.
- Disable radio để khóa bài sau khi chấm.
- Tạo danh sách câu đúng/sai để user click scroll tới câu.

### Lịch Sử Làm Bài

Lịch sử được lưu trong `localStorage` của trình duyệt dưới key `quizHistory`.

Dữ liệu gồm:

- Thời gian làm bài.
- Tên đề.
- Tổng số câu.
- Số câu đúng/sai.
- Danh sách câu đúng/sai.
- Username hiện tại nếu có.

### Logic Bảo Mật

Khi render history, các chuỗi như title, date, user và tên câu được escape HTML để giảm rủi ro XSS nếu dữ liệu có chứa HTML/script.

### Giới Hạn

- Lịch sử chỉ nằm trên máy hiện tại.
- Xóa cache/localStorage sẽ mất lịch sử.
- Không sync giữa nhiều thiết bị.

## 6. Admin Panel: `admin.html`

### Tính Năng Chính

- Login riêng cho admin panel.
- Cấu hình GitHub owner/repo/branch.
- Tải danh sách user hiện tại từ `data/users/user.text`.
- Thêm user mới.
- Xóa user.
- Đổi mật khẩu user.
- Preview nội dung `user.text` trước khi lưu.
- Commit file `user.text` lên GitHub qua GitHub Contents API.
- Hash user thủ công bằng HMAC.
- Encode/decode đề thi.

### Login Admin

Admin panel có login gate riêng. Username và hash mật khẩu admin được cấu hình trong `admin.html` thông qua các constant.

Không ghi password admin trong README. Khi fork repo, bạn nên đổi ngay thông tin admin panel trước khi deploy public.

### Logic Bảo Mật

#### Admin password dùng HMAC

Admin password cũng được so sánh bằng HMAC-SHA256, dùng cùng cơ chế với app chính.

#### PAT không lưu lâu dài

GitHub Personal Access Token chỉ được nhập khi cần commit. Admin panel không lưu PAT vào `localStorage` hoặc `sessionStorage`. Sau khi commit thành công, field PAT được clear.

#### Toàn bộ thao tác user chạy trên state tạm

Khi thêm/xóa/đổi mật khẩu user, dữ liệu chỉ thay đổi trong memory của tab hiện tại. Chỉ khi bấm lưu lên GitHub thì file `user.text` mới được commit.

### Giới Hạn

Admin panel vẫn là client-side code. Người có kỹ năng DevTools có thể bypass UI hoặc đọc source. Vì vậy không nên xem admin panel là cơ chế bảo mật tuyệt đối.

## 7. Lưu User Lên GitHub Qua API

### Flow Kỹ Thuật

Khi bấm lưu user lên GitHub:

1. Admin panel đọc owner, repo, branch và PAT từ form.
2. Gọi GitHub API để lấy SHA của file hiện tại:

```text
GET /repos/{owner}/{repo}/contents/data/users/user.text?ref={branch}
```

3. Gửi nội dung mới bằng GitHub Contents API:

```text
PUT /repos/{owner}/{repo}/contents/data/users/user.text
```

4. Body gồm commit message, content Base64, branch và SHA cũ.
5. Sau khi thành công, app clear PAT và chờ vài giây để reload lại danh sách user.

### Vì Sao Cần Lấy SHA Trước Khi PUT?

GitHub Contents API yêu cầu SHA file hiện tại khi cập nhật file đã tồn tại. Điều này giúp tránh ghi đè file khi có thay đổi mới từ nơi khác.

### Tối Ưu Cho GitHub Pages

Sau khi commit, GitHub Pages tự rebuild site. Thời gian cập nhật thường mất từ vài giây đến vài phút. Admin panel có reload lại danh sách sau một khoảng delay ngắn để kiểm tra trạng thái mới.

## 8. Tạo GitHub Personal Access Token (PAT)

Nên dùng Fine-grained PAT, không dùng Classic PAT nếu không cần.

Khuyến nghị cấu hình:

- Repository access: chỉ chọn repo hiện tại.
- Permissions: `Contents: Read and write`.
- Metadata: GitHub tự cấp read-only.
- Expiration: 30-90 ngày.
- Không cấp quyền khác nếu không cần.

Không commit PAT vào repo. Không gửi PAT qua chat. Nếu nghi ngờ token bị lộ, revoke token ngay trong GitHub Settings.

## 9. Chạy Local

Không nên mở trực tiếp bằng `file://` vì fetch file tĩnh có thể lỗi, và một số browser giới hạn Web Crypto API.

### Cách 1: VS Code Live Server

1. Cài extension Live Server.
2. Mở `index.html` hoặc `admin.html`.
3. Click chuột phải → Open with Live Server.

### Cách 2: Node HTTP Server

```powershell
npx --yes http-server -p 8080 -c-1
```

Sau đó mở:

```text
http://localhost:8080/
http://localhost:8080/admin.html
```

### Cách 3: Python HTTP Server

```powershell
python -m http.server 8080
```

## 10. Deploy GitHub Pages

### Điều Kiện

- Repo public nếu dùng GitHub Pages miễn phí.
- Nếu repo private, cần gói GitHub hỗ trợ Pages cho private repo.

### Bật Pages

1. Vào GitHub repo.
2. Settings → Pages.
3. Source: Deploy from a branch.
4. Branch: `main`.
5. Folder: `/root`.
6. Save.

URL thường có dạng:

```text
https://<your-username>.github.io/<your-repo>/
```

## 11. Cấu Hình Cho Fork Riêng

Phần này rất quan trọng nếu bạn fork repo hoặc public repo cho người khác dùng.

### Đổi `SECRET_KEY_HASH`

`SECRET_KEY_HASH` nằm trong cả `index.html` và `admin.html`. Hai file phải dùng cùng một giá trị.

Quy trình đề xuất:

1. Chọn một secret key riêng, đủ dài và không dùng lại ở nơi khác.
2. Tính SHA-256 của secret key đó.
3. Thay giá trị `SECRET_KEY_HASH` trong cả `index.html` và `admin.html`.
4. Tạo lại hash cho toàn bộ user trong `data/users/user.text`.

Sau khi đổi `SECRET_KEY_HASH`, toàn bộ hash user cũ sẽ không còn hợp lệ.

### Đổi `ADMIN_HASH`

`ADMIN_HASH` nằm trong `admin.html`. Đây là HMAC hash của mật khẩu admin panel.

Quy trình đề xuất:

1. Chọn mật khẩu admin panel mới.
2. Dùng cùng HMAC algorithm để tạo hash mới.
3. Thay `ADMIN_HASH` trong `admin.html`.
4. Nếu muốn, đổi luôn `ADMIN_USER`.

Không ghi mật khẩu admin trong README hoặc commit message.

### Đổi `FALLBACK_USER` Và `FALLBACK_HASH`

`FALLBACK_USER` và `FALLBACK_HASH` nằm trong `index.html`. Đây là tài khoản dự phòng khi `data/users/user.text` thiếu hoặc không có user hợp lệ.

Khi fork repo, nên đổi fallback account trước khi deploy public.

Không ghi password fallback trong README. Chỉ giữ hash trong source.

## 12. Các Giới Hạn Bảo Mật Cần Biết

### Những Gì Hệ Thống Đã Làm

- Không lưu mật khẩu plaintext.
- Dùng HMAC-SHA256 để giảm rủi ro rainbow table.
- Không lưu PAT dài hạn trong browser storage.
- Encode đề thi để tránh lộ đáp án ngay khi mở file.
- Escape HTML khi render lịch sử.
- Dùng `sessionStorage` cho login session.

### Những Gì Hệ Thống Không Thể Làm Trên Static Hosting

- Không thể giấu secret thật khỏi người xem source.
- Không thể ngăn người có kỹ năng DevTools bypass client-side auth.
- Không thể phân quyền server-side.
- Không thể bảo vệ tuyệt đối file đề nếu file đó public trong repo.

Nếu cần bảo mật thật, hãy thêm backend hoặc dùng dịch vụ auth/database có server-side rules.

## 13. Troubleshooting

### Không đăng nhập được app chính

- Kiểm tra `data/users/user.text` có đúng format `username,hash` không.
- Kiểm tra hash được tạo bằng cùng `SECRET_KEY_HASH` với `index.html`.
- Kiểm tra file có bị cache bởi GitHub Pages không. Thử hard refresh hoặc chờ vài phút.

### Không mở được admin panel

- Kiểm tra đang chạy bằng `https://` hoặc `http://localhost`.
- Kiểm tra browser có hỗ trợ Web Crypto API.
- Kiểm tra `ADMIN_HASH` có được tạo bằng đúng thuật toán HMAC không.

### Commit GitHub API lỗi 401

Token sai, hết hạn hoặc bị revoke. Tạo PAT mới.

### Commit GitHub API lỗi 403

Token thiếu quyền. Fine-grained PAT cần `Contents: Read and write` trên đúng repo.

### Commit GitHub API lỗi 404

Sai owner/repo hoặc token không có quyền truy cập repo đó.

### Commit GitHub API lỗi 422

Có thể file bị conflict hoặc SHA cũ. Hãy tải lại danh sách user rồi commit lại.

### Đề thi không hiển thị

- Kiểm tra `manifest.txt` trỏ đúng tên file.
- Kiểm tra file đề nằm trong thư mục `data/`.
- Nếu file encode, dòng đầu phải là `#ENCODED`.
- Nếu file plaintext, mỗi câu nên có 1 câu hỏi và 4 đáp án.

### GitHub Pages chưa cập nhật sau khi commit

GitHub Pages có thể mất 1-2 phút để rebuild. Hãy chờ, sau đó hard refresh bằng `Ctrl + F5`.

## 14. Ghi Chú Vận Hành

- Trước khi public repo, hãy đổi secret key, admin hash và fallback account.
- Không ghi password thật, PAT hoặc secret key thật vào README, issue, commit message.
- Không cấp PAT quyền rộng hơn mức cần thiết.
- Nên rotate PAT định kỳ.
- Nên backup file đề plaintext ở nơi riêng tư nếu file trong repo đã encode.
- Nếu nhiều người cùng quản trị user, nên thống nhất quy trình để tránh conflict khi commit qua GitHub API.

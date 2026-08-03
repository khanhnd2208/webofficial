# Kế hoạch cải tạo nội dung website lên chuẩn 10/10

**Vai trò:** Marketing strategy, positioning, content architecture và conversion  
**Phạm vi:** 6 giao diện công khai: Trang chủ, Dịch vụ, Dự án, Case study, Giới thiệu, Liên hệ  
**Căn cứ:** Feedback expert ngày 2026-08-02 và nội dung hiện có trong source  
**Nguyên tắc:** Không tạo số liệu, testimonial, logo, chức danh hoặc kết quả chưa được xác minh

**Trạng thái triển khai code (2026-08-02):** Đã triển khai positioning, need-state
routing, productized services, CTA framework, project taxonomy, case structure,
About, contact timeframe, metadata và analytics. Proof assets do chủ website cung
cấp vẫn đang chờ; giao diện không hiển thị testimonial/KPI giả và ghi rõ mọi hình
minh họa tạm thời.

---

## 1. Kết luận điều hành

Website hiện có nền tảng hình ảnh và kiến trúc tốt, nhưng content đang bán **phương pháp và sự cẩn trọng** nhiều hơn bán **giá trị và sự thay đổi**. Người đọc có thể cảm nhận Duy Khánh là một chuyên gia có chiều sâu, nhưng chưa chắc trả lời được ngay ba câu hỏi:

1. Khánh giỏi nhất việc gì?
2. Khánh giúp đúng người nào đạt kết quả gì?
3. Bằng chứng nào khiến họ nên chủ động liên hệ?

Mục tiêu của đợt cải tạo không phải thêm nhiều section. Mục tiêu là tạo một chuỗi thuyết phục liền mạch:

> **Nhu cầu của khách hàng → Lời hứa rõ ràng → Cách hỗ trợ phù hợp → Bằng chứng thật → Bước tiếp theo ít ma sát**

### Định vị trung tâm đề xuất

> **Duy Khánh giúp người học và tổ chức biến kiến thức phức tạp về quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.**

Đây là “chiếc ô” kết nối ba vai trò hiện tại:

- **Educator:** biến kiến thức thành khả năng hiểu và ra quyết định.
- **Learning designer:** biến mục tiêu thành chương trình, trải nghiệm và học liệu.
- **Advisor:** biến vấn đề kinh doanh thành ưu tiên, lựa chọn và quy trình hành động.

### Brand manifesto giữ lại

> **Học để hiểu sâu. Làm để tạo thay đổi.**

Câu này giàu cảm xúc và khác biệt, nhưng chỉ nên đóng vai trò manifesto. Ngay sau đó phải có một câu giải thích cụ thể “giúp ai — làm gì — tạo ra điều gì”.

---

## 2. Chẩn đoán hiện trạng từ source

| Hạng mục     | Hiện trạng                                                                   | Khoảng cách cần xử lý                                                    |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Định vị      | “Education · Applied AI · Business Advisory” và ba mảng tương đối ngang hàng | Thiếu một năng lực lõi kết nối cả ba mảng                                |
| Hero         | Manifesto tốt; mô tả đã khá rõ                                               | Chưa nói đủ kết quả cụ thể và CTA vẫn yêu cầu cam kết sớm                |
| Audience     | Sinh viên, người đi làm, giảng viên, quản lý, SME, startup, tổ chức giáo dục | Quá rộng; chưa có thứ tự ưu tiên                                         |
| Self-routing | Bắt đầu bằng tên chuyên môn/dịch vụ                                          | Nên bắt đầu bằng mục tiêu mà người đọc muốn đạt được                     |
| Proof        | Vai trò, phương pháp, mô tả dự án                                            | Thiếu artefact thật, nhận xét, đơn vị và kết quả đã xác minh             |
| Dịch vụ      | Có audience, problem, output, approach và proof                              | Vẫn giống giới thiệu năng lực; chưa “productize” thành đề nghị hợp tác   |
| Dự án        | 4 dự án, 5 filter                                                            | Filter làm portfolio trông mỏng; nên ẩn đến khi có 7–8 dự án             |
| Impact       | “5 nhóm đầu ra”, “4 lăng kính phân tích”                                     | Đây là scope/deliverable, không phải impact                              |
| Case study   | Cấu trúc tốt                                                                 | Hình đang là illustration thương hiệu, chưa phải bằng chứng công việc    |
| About        | Giọng cá nhân tốt, logic nghề nghiệp rõ                                      | Triết lý nhiều hơn credentials và xác nhận năng lực                      |
| Contact      | Form rõ và ít ma sát                                                         | `timeframe` có trong state/API nhưng chưa có trường nhập trên UI         |
| CTA          | Lặp nhiều “Bắt đầu trao đổi”, “Trao đổi nhu cầu”                             | Chưa phản ánh ý định cụ thể của từng audience                            |
| Voice        | Điềm tĩnh, có trách nhiệm                                                    | “Làm rõ”, “có căn cứ”, “bằng chứng” lặp nhiều, dễ tạo cảm giác phòng thủ |

### Đánh giá marketing content hiện tại

Đây là điểm chuẩn để đo cải tiến, không phải điểm UX hoặc kỹ thuật:

| Tiêu chí                            | Trọng số | Hiện tại ước tính | Mục tiêu |
| ----------------------------------- | -------: | ----------------: | -------: |
| Rõ định vị và khác biệt             |      20% |            6.5/10 |    10/10 |
| Rõ audience và nhu cầu              |      15% |              6/10 |    10/10 |
| Giá trị/kết quả nhận được           |      20% |              6/10 |    10/10 |
| Bằng chứng và độ tin cậy            |      20% |            4.5/10 |  9–10/10 |
| Luồng chuyển đổi và CTA             |      15% |              7/10 |    10/10 |
| Giọng thương hiệu và tính nhất quán |      10% |              8/10 |    10/10 |

Điểm yếu lớn nhất là **proof**, sau đó là **outcome language** và **audience prioritization**.

---

## 3. Chiến lược audience và offer

### Thứ tự audience

#### Nhóm 1 — Tổ chức cần đào tạo hoặc thiết kế chương trình

**Ưu tiên cao nhất.** Bao gồm trường học, trung tâm, doanh nghiệp và đội ngũ.

- Nhu cầu: chương trình rõ, workshop ứng dụng, học liệu tốt, nội dung quản trị/AI đáng tin cậy.
- Giá trị Khánh mang lại: kết hợp giảng dạy, course design, nghiên cứu và khả năng chuyển kiến thức thành hoạt động học.
- Offer phù hợp: thiết kế chương trình, workshop, corporate training, review curriculum/học liệu.
- CTA chính: **Nhận đề xuất chương trình phù hợp**.

#### Nhóm 2 — Người học muốn hiểu sâu và áp dụng được

- Nhu cầu: hiểu đúng bản chất, kết nối mô hình, luyện trên case và biết cách vận dụng.
- Giá trị: cấu trúc lại kiến thức khó, giải thích rõ nhưng không làm sai bản chất.
- Offer: lớp học, buổi bổ trợ, workshop, mentoring học thuật.
- CTA chính: **Tìm hình thức học phù hợp**.

#### Nhóm 3 — Doanh nghiệp nhỏ cần giải quyết vấn đề thực tế

- Nhu cầu: nhìn đúng vấn đề, xác định ưu tiên, kết nối vận hành–khách hàng–tài chính–con người.
- Giá trị: phân tích liên chức năng, tạo lựa chọn phù hợp với nguồn lực thật.
- Offer: diagnostic, advisory sprint, process mapping, recommendation report.
- CTA chính: **Mô tả vấn đề doanh nghiệp**.

### Ba cửa vào theo ý định

Không dùng ba tên nghề làm cửa vào chính. Dùng ba “job to be done”:

1. **Tôi muốn học và hiểu rõ hơn**  
   Dành cho người học đang có kiến thức rời rạc hoặc cần vận dụng vào case thực tế.
2. **Tôi muốn đào tạo một đội ngũ**  
   Dành cho tổ chức cần chương trình, workshop hoặc học liệu quản trị/AI.
3. **Tôi cần giải quyết một vấn đề kinh doanh**  
   Dành cho doanh nghiệp nhỏ cần chẩn đoán, ưu tiên và lựa chọn khả thi.

---

## 4. Message house toàn website

### Lời hứa cốt lõi

> Biến kiến thức phức tạp thành năng lực và công cụ có thể sử dụng.

### Ba trụ cột thông điệp

| Trụ cột             | Điều cần nói                                                    | Điều cần cho thấy                                                    |
| ------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| Hiểu sâu            | Không học mẹo rời rạc; thấy được cấu trúc và logic              | Course map, slide, case, reading map                                 |
| Thiết kế để áp dụng | Nội dung được chuyển thành hoạt động, workflow và quyết định    | Workbook, checklist, process map, bài tập                            |
| Có trách nhiệm      | Biết giới hạn, kiểm chứng và giữ quyền quyết định của con người | Rubric, verification checklist, nguồn nghiên cứu, disclaimer phù hợp |

### Reasons to believe

Chỉ dùng dữ kiện đã xác minh:

- Giảng viên tại Trường Đại học Hà Nội.
- Kinh nghiệm học thuật và thực hành về quản trị.
- Thiết kế trải nghiệm học Strategic Management.
- Phát triển chương trình AI50.
- Nghiên cứu AI trong tuyển dụng/quản trị nhân sự.
- Kinh nghiệm phân tích và cố vấn doanh nghiệp nhỏ, khi quyền công bố được xác nhận.

### Giọng văn

- 70% tiếng Việt tự nhiên, rõ và cụ thể.
- 20% thuật ngữ chuyên môn thật sự cần thiết.
- 10% tiếng Anh cho tên artefact hoặc khái niệm quen dùng.
- Ưu tiên động từ: **hiểu, thiết kế, thực hành, kiểm chứng, lựa chọn, áp dụng, điều chỉnh**.
- Giảm tự tuyên bố “research-based/evidence-based”; tăng minh chứng trực tiếp.
- Không dùng: “giải pháp toàn diện”, “đột phá”, “hàng đầu”, “tối ưu vượt trội” nếu không có bằng chứng.

---

## 5. Kế hoạch chi tiết theo trang

## A. Trang chủ

### Vai trò của trang

Trong 15–20 giây, người đọc hiểu: Khánh là ai, giúp ai, tạo giá trị gì, có bằng chứng nào và nên đi đâu tiếp theo.

### Thứ tự nội dung đề xuất

1. Hero: manifesto + định vị cụ thể.
2. Proof strip bằng dữ kiện đã xác minh.
3. Ba cửa vào theo nhu cầu.
4. Ba case study mạnh nhất.
5. Social proof.
6. Cách làm việc.
7. CTA cuối theo ba loại nhu cầu.

### Copy mẫu

**Eyebrow**  
`Management Education · Learning Design · Applied AI`

**Headline**  
`Học để hiểu sâu. Làm để tạo thay đổi.`

**Subheadline**  
`Tôi là Nguyễn Duy Khánh — giảng viên và người thiết kế trải nghiệm học tập. Tôi giúp người học và tổ chức biến kiến thức quản trị và AI thành năng lực, chương trình và quy trình có thể áp dụng.`

**CTA 1**  
`Tìm hướng hỗ trợ phù hợp`

**CTA 2**  
`Xem công việc đã thực hiện`

### Proof strip

Giữ tối đa 4 dữ kiện, không dùng claim phương pháp chung:

- `Giảng viên · Trường Đại học Hà Nội`
- `Chuyên môn · Management Education`
- `Thiết kế · Learning Experience & Curriculum`
- `Nghiên cứu · AI trong quản trị nhân sự`

### Ba cửa vào

Mỗi block theo cùng một cấu trúc:

- **Mục tiêu:** người dùng muốn đạt gì.
- **Dấu hiệu phù hợp:** vấn đề họ đang gặp.
- **Kết quả:** thay đổi kỳ vọng.
- **Hướng hỗ trợ:** loại dịch vụ.
- **Bằng chứng:** một case liên quan.

Ví dụ block tổ chức:

> **Tôi muốn đào tạo một đội ngũ**  
> Phù hợp khi tổ chức cần chương trình quản trị hoặc AI có cấu trúc, hoạt động thực hành và tiêu chuẩn kiểm chứng rõ ràng.  
> **Kết quả hướng tới:** một trải nghiệm học phù hợp với người học và bối cảnh công việc.  
> CTA: **Xem giải pháp đào tạo** · Proof: **AI50**

### Case study nổi bật

Thứ tự:

1. Strategic Management Learning Experience.
2. AI50 — AI cho mọi người.
3. Moonie Café Business Development.

Card cần có 5 dòng thông tin:

- Vấn đề.
- Vai trò.
- Đối tượng.
- Đầu ra nổi bật.
- Bằng chứng/kết quả hoặc nhãn minh bạch “đang phát triển”.

### Social proof

Chỉ bật section khi có ít nhất một trong các nhóm sau:

- 2–3 testimonial được phép công bố.
- 3+ logo/tên đơn vị được xác nhận quyền hiển thị.
- 3+ ảnh hoạt động thật.
- Một nhóm dữ liệu đã xác minh như số lớp, số chương trình hoặc số nhóm người học.

### Cách làm việc

Chuyển xuống sau proof và dùng flow 4 bước:

> **Hiểu đúng → Thiết kế rõ → Thử trong thực tế → Điều chỉnh**

### CTA cuối

**Headline**  
`Bạn đang muốn thiết kế một chương trình học, đào tạo đội ngũ hoặc giải quyết một vấn đề trong tổ chức?`

**CTA**  
`Chọn nội dung bạn muốn trao đổi`

---

## B. Trang Dịch vụ

### Vai trò của trang

Giúp người đọc tự đánh giá mức phù hợp trước khi liên hệ và hiểu chính xác mình sẽ nhận được gì.

### Hero đề xuất

**Headline:** `Bắt đầu từ điều bạn muốn thay đổi.`  
**Lead:** `Chọn một nhu cầu để xem hình thức hợp tác, kết quả hướng tới, đầu ra cụ thể và dự án liên quan.`

### Cấu trúc bắt buộc cho mỗi offer

1. **Phù hợp khi nào?** — dấu hiệu/bối cảnh cụ thể.
2. **Dành cho ai?** — chỉ 2–3 nhóm ưu tiên.
3. **Sau hợp tác, điều gì sẽ rõ hoặc tốt hơn?** — outcome, không chỉ format.
4. **Hình thức hợp tác** — class/workshop/design/review/advisory.
5. **Đầu ra cụ thể** — artefact có thể cầm, đọc hoặc sử dụng.
6. **Cách làm** — 3–4 bước.
7. **Bằng chứng** — case/artefact/testimonial.
8. **Có thể không phù hợp nếu…** — qualification.
9. **CTA riêng** — theo đúng ý định.

### Offer 1 — Học và hiểu quản trị

- **Phù hợp khi:** người học nhớ mô hình nhưng chưa thấy cách các mô hình liên kết với quyết định.
- **Audience:** sinh viên; người đi làm học quản trị; nhóm học/tổ chức giáo dục.
- **Outcome:** hiểu cấu trúc kiến thức, đọc được case và giải thích được lựa chọn.
- **Format:** lớp học, buổi bổ trợ, workshop, mentoring, review học liệu.
- **Deliverable:** lesson plan, slide deck, case pack, worksheet, reading map.
- **Không phù hợp nếu:** chỉ cần lời giải/đáp án làm thay hoặc chứng chỉ tức thời.
- **CTA:** `Tìm hình thức học quản trị phù hợp`.

### Offer 2 — Đào tạo và thiết kế chương trình AI

- **Phù hợp khi:** đội ngũ biết dùng công cụ nhưng thiếu workflow, tiêu chuẩn đầu ra và vòng kiểm chứng.
- **Audience:** tổ chức giáo dục; doanh nghiệp/đội ngũ; giảng viên hoặc người mới.
- **Outcome:** biết chọn việc cho AI, giao việc rõ, kiểm chứng đầu ra và giữ trách nhiệm con người.
- **Format:** workshop, corporate training, curriculum design, review học liệu.
- **Deliverable:** course map, slide deck, practice pack, workflow template, verification checklist.
- **Không phù hợp nếu:** mục tiêu chỉ là sưu tập prompt hoặc tự động hóa bằng mọi giá.
- **CTA:** `Nhận đề xuất chương trình AI`.

### Offer 3 — Cố vấn vấn đề doanh nghiệp

- **Phù hợp khi:** nhiều dấu hiệu rời rạc đang ảnh hưởng lẫn nhau và đội ngũ chưa thống nhất ưu tiên.
- **Audience:** doanh nghiệp nhỏ; startup; tổ chức giáo dục/dịch vụ.
- **Outcome:** hiểu vấn đề trọng tâm, thấy các lựa chọn và có lộ trình khả thi.
- **Format:** diagnostic session, advisory sprint, process review, project-based advisory.
- **Deliverable:** problem framing, process map, priority framework, recommendation report.
- **Không phù hợp nếu:** cần cam kết KPI trước khi có dữ liệu hoặc cần bên tư vấn quyết định thay hoàn toàn.
- **CTA:** `Mô tả vấn đề doanh nghiệp`.

---

## C. Trang Dự án

### Quyết định ngay

- Ẩn filter khi chỉ có 4 dự án.
- Chỉ bật lại khi có tối thiểu 7–8 dự án và ít nhất hai category có từ 2 dự án trở lên.
- Nếu muốn giữ định hướng, dùng 3 nhãn tĩnh: `Learning Design`, `Applied AI`, `Business Advisory` thay vì filter tương tác.

### Cấu trúc card

1. Tên dự án.
2. Vấn đề một câu.
3. Vai trò.
4. Đối tượng.
5. Một đầu ra nổi bật.
6. Trạng thái minh bạch.
7. Kết quả/bằng chứng thật; nếu chưa có thì dùng `Phạm vi dự án`, không gọi là impact.

### Quy tắc taxonomy

- `Impact/Kết quả`: thay đổi đã quan sát hoặc đo lường được.
- `Evidence/Bằng chứng`: artefact, feedback, dữ liệu hoặc tài liệu xác nhận kết quả.
- `Deliverable/Đầu ra`: thứ được tạo hoặc bàn giao.
- `Scope/Phạm vi`: phần việc, nhóm nội dung, số cấu phần.
- `Status/Trạng thái`: đang phát triển, đang sử dụng, hoàn thành, đang nghiên cứu.

### Sửa dữ liệu hiện tại

| Dự án                   | Nội dung đang ở `impact` | Nhãn đúng              |
| ----------------------- | ------------------------ | ---------------------- |
| AI50                    | 5 nhóm đầu ra            | `Đầu ra đang thiết kế` |
| Strategic Management    | 5 nhóm học liệu          | `Hệ thống học liệu`    |
| Moonie Café             | 4 lăng kính phân tích    | `Phạm vi phân tích`    |
| AI Recruitment Research | 4 nhóm đầu ra            | `Cấu phần nghiên cứu`  |

### Bổ sung portfolio

Ưu tiên đưa thêm 3–4 hồ sơ đã hoàn thành từ công việc thật trước đây:

- Một môn học/lớp đã triển khai.
- Một workshop đã hoàn thành.
- Một bộ học liệu/curriculum đã được sử dụng.
- Một dự án tổ chức/doanh nghiệp được phép công bố.

Mục tiêu: ít nhất 50% portfolio ở trạng thái **đã hoàn thành/đang sử dụng**, không để toàn bộ portfolio trông như dự án ý tưởng.

---

## D. Trang Case study

### Cấu trúc chuẩn

1. **Vấn đề** — đặt trước để tạo lý do đọc.
2. **Bối cảnh** — ai, khi nào, điều kiện nào.
3. **Vai trò và phạm vi** — Khánh chịu trách nhiệm phần nào.
4. **Những quyết định quan trọng** — tại sao chọn cách này.
5. **Artefact** — sản phẩm thật có caption giải thích.
6. **Kết quả** — điều đã thay đổi, định lượng hoặc định tính.
7. **Bằng chứng** — dữ liệu, feedback, tài liệu, nguồn.
8. **Điều dự án chứng minh** — năng lực/cách làm.
9. **CTA liên quan** — dựa trên loại dự án.

### Công thức mở đầu

> `[Đối tượng] đang gặp [vấn đề]. Trong vai trò [vai trò], tôi thiết kế [giải pháp/đầu ra] để giúp [kết quả mong muốn hoặc đã xác minh].`

### Tiêu chuẩn artefact

Mỗi case nên có tối thiểu 3 artefact thật:

- một ảnh tổng quan;
- một ảnh cận cảnh chi tiết;
- một artefact thể hiện quyết định hoặc phương pháp.

Caption phải trả lời: **đây là gì, dùng ở bước nào, giúp người dùng làm gì**. Không dùng caption trang trí.

### Khi chưa có KPI

Dùng kết quả định tính có bằng chứng:

- chương trình đã được đưa vào sử dụng;
- người học hoàn thành một task cụ thể;
- đội ngũ thống nhất một process/priority;
- học liệu được sử dụng ở lớp nào;
- phản hồi mô tả thay đổi trong cách hiểu hoặc thực hiện.

Không biến số lượng đầu ra thành impact.

---

## E. Trang Giới thiệu

### Vai trò của trang

Tạo sự tin cậy cá nhân và giải thích logic nghề nghiệp, không lặp lại trang dịch vụ.

### Cấu trúc đề xuất

1. `Tôi làm giáo dục để tiếp tục học.`
2. Câu định vị giao điểm học thuật–thực hành.
3. Công việc hiện tại.
4. Hành trình quản trị → thực hành → giáo dục → AI.
5. Ba vai trò: educator, learning designer, advisor.
6. Credentials và dấu mốc đã xác minh.
7. Nguyên tắc làm việc, rút xuống còn 3 nguyên tắc.
8. Dự án tương ứng với từng năng lực.
9. CTA.

### Copy định vị đề xuất

> `Tôi làm việc ở giao điểm giữa học thuật và thực hành: giữ sự chính xác của lý thuyết, nhưng luôn tìm cách chuyển nó thành điều con người có thể hiểu và sử dụng.`

### Credentials cần bổ sung

- Tên chính xác bằng cấp, cơ sở đào tạo, năm (nếu muốn công bố).
- Chức danh và đơn vị hiện tại được phê duyệt.
- Môn học/chương trình đã giảng dạy hoặc thiết kế.
- Vai trò tại các dự án được phép nhắc tên.
- Link CV/LinkedIn/public profile nếu có.

Loại bớt các câu tự khẳng định “có căn cứ” khi đã có credentials và case chứng minh.

---

## F. Trang Liên hệ

### Mục tiêu

Thu thập đủ bối cảnh để đánh giá fit nhưng không làm người dùng thấy đang điền một proposal.

### Trường form

1. Họ và tên — bắt buộc.
2. Email — bắt buộc.
3. Tổ chức — không bắt buộc.
4. Chủ đề liên hệ — bắt buộc.
5. Bối cảnh và kết quả mong muốn — bắt buộc.
6. Thời gian dự kiến — không bắt buộc nhưng hiển thị.
7. Privacy consent — bắt buộc.

### Timeframe đề xuất

Không dùng ô text tự do nếu có thể dùng select:

- Trong 2–4 tuần tới.
- Trong 1–3 tháng tới.
- Sau 3 tháng.
- Chưa có mốc cụ thể.

### Microcopy

**Intro:** `Bạn không cần chuẩn bị một đề bài hoàn chỉnh. Hãy cho tôi biết bối cảnh, người liên quan và điều bạn muốn thay đổi.`

**Context prompt:** `Ví dụ: đối tượng là ai, điều gì đang chưa hiệu quả và kết quả nào sẽ hữu ích với bạn?`

**Response promise:** chỉ hiển thị mốc phản hồi sau khi chủ website xác nhận có thể cam kết. Nếu chưa xác nhận, dùng: `Tôi sẽ đọc bối cảnh và phản hồi qua email với câu hỏi hoặc bước tiếp theo phù hợp.`

Không hỏi ngân sách ở lần liên hệ đầu khi chưa có gói dịch vụ cố định.

---

## 6. Proof system: phần quyết định website có đạt 10/10 hay không

Content chỉ đạt 10/10 khi có bằng chứng thật. Copy tốt không thể thay thế proof.

### Danh sách cần thu thập

| Asset               | Mục tiêu tối thiểu | Tiêu chuẩn                                                |
| ------------------- | -----------------: | --------------------------------------------------------- |
| Chân dung thật      |                  1 | Chất lượng cao, ánh sáng tự nhiên, quyền sử dụng rõ       |
| Ảnh lớp/workshop    |                3–5 | Có bối cảnh hoạt động, không chỉ ảnh tạo dáng             |
| Artefact            |               6–10 | Slide, course map, worksheet, workflow, checklist, report |
| Testimonial         |                  3 | Có quyền công bố; tên/vai trò hoặc ghi rõ ẩn danh         |
| Đơn vị/chương trình |          3+ nếu có | Tên chính xác, quyền hiển thị logo/tên                    |
| Kết quả             |  1–2 mỗi case mạnh | Có nguồn, thời gian và ngữ cảnh đo lường                  |
| Credentials         |          Bộ đầy đủ | Tên chính thức, không viết tắt gây mơ hồ                  |

### Form thu thập dữ liệu cho mỗi case

- Tên dự án và thời gian.
- Khách hàng/đơn vị hoặc cách mô tả ẩn danh.
- Đối tượng sử dụng.
- Vấn đề trước dự án.
- Vai trò chính xác của Khánh.
- Phần việc ngoài phạm vi.
- 3–5 quyết định quan trọng.
- Danh sách artefact.
- Kết quả quan sát được.
- Nguồn xác minh kết quả.
- Quote được phép công bố.
- Hạn chế hoặc điều chưa thể kết luận.

---

## 7. SEO và content discovery

### Chủ đề trụ cột

1. **Giảng dạy và thiết kế học tập quản trị**.
2. **Đào tạo ứng dụng AI có trách nhiệm**.
3. **Cố vấn và phân tích doanh nghiệp nhỏ**.

### Nguyên tắc title/description

- Title nói rõ dịch vụ/giá trị trước, tên cá nhân sau.
- Description nêu audience + outcome, tránh chỉ liệt kê vai trò.
- Case study dùng tên dự án + loại công việc + đối tượng nếu phù hợp.

Ví dụ homepage:

- **Title:** `Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI`
- **Description:** `Giúp người học và tổ chức biến kiến thức quản trị và AI thành chương trình, năng lực và quy trình có thể áp dụng.`

### Internal linking

Mỗi journey phải đi được theo vòng:

> Home need-state → Service offer → Relevant case → Contact prefilled

Mỗi case link ngược về offer tương ứng. About link đến case chứng minh từng năng lực.

---

## 8. CTA framework

| Ngữ cảnh             | CTA chính                      | CTA phụ                     |
| -------------------- | ------------------------------ | --------------------------- |
| Homepage hero        | Tìm hướng hỗ trợ phù hợp       | Xem công việc đã thực hiện  |
| Nhu cầu học          | Tìm hình thức học phù hợp      | Xem case giảng dạy          |
| Nhu cầu tổ chức      | Nhận đề xuất chương trình      | Xem AI50/case liên quan     |
| Nhu cầu doanh nghiệp | Mô tả vấn đề doanh nghiệp      | Xem case advisory           |
| Project card         | Xem cách dự án được thực hiện  | —                           |
| Case study           | Trao đổi về một dự án tương tự | Xem dịch vụ liên quan       |
| About                | Xem công việc đã thực hiện     | Chọn nội dung muốn trao đổi |
| Contact              | Gửi bối cảnh trao đổi          | Email trực tiếp             |

Quy tắc: CTA phải mô tả điều xảy ra tiếp theo; không dùng một nhãn chung cho mọi ý định.

---

## 9. Đo lường hiệu quả

### Funnel chính

1. Vào homepage.
2. Chọn một need-state.
3. Xem service/case liên quan.
4. Mở contact với loại nhu cầu đã điền sẵn.
5. Bắt đầu form.
6. Gửi thành công.

### Events cần theo dõi

- `home_need_select`
- `service_view`
- `service_proof_click`
- `case_study_view`
- `case_artifact_engage`
- `contact_open`
- `contact_form_start`
- `contact_form_error`
- `contact_form_submit`
- `contact_form_success`

### KPI nội dung

- Tỷ lệ homepage → service/case.
- Tỷ lệ service → contact.
- Tỷ lệ case → contact.
- Tỷ lệ bắt đầu form → gửi thành công.
- Tỷ lệ inquiry đủ thông tin để đánh giá fit.
- Phân bổ inquiry theo ba need-state.

Không đặt mục tiêu số tuyệt đối khi chưa có baseline. Thu thập baseline 4–6 tuần sau khi triển khai.

---

## 10. Roadmap triển khai

### Sprint 1 — Định vị và conversion

**Phạm vi**

- Chốt positioning statement và audience priority.
- Viết lại hero và metadata homepage.
- Đổi ba entry point theo need-state.
- Chuẩn hóa CTA theo toàn site.
- Chuyển phần “cách làm” xuống sau proof.

**Điều kiện hoàn thành**

- Người mới có thể trả lời “Khánh giúp ai, làm gì, tạo ra gì” sau khi đọc hero.
- Mỗi audience có một đường đi rõ từ homepage đến contact.
- Không còn CTA “Trao đổi nhu cầu” dùng cho cả ba offer.

### Sprint 2 — Proof và portfolio truthfulness

**Phạm vi**

- Thu thập proof assets.
- Thay illustration bằng artefact thật theo mức sẵn có.
- Đổi taxonomy `impact` thành đúng loại dữ liệu.
- Ẩn filter portfolio.
- Thêm testimonial/social proof đã xác minh.

**Điều kiện hoàn thành**

- Không có số scope/deliverable nào được gọi là impact.
- Mỗi featured case có ít nhất 3 artefact thật hoặc nhãn rõ “đang hoàn thiện bằng chứng”.
- Ít nhất một case thể hiện công việc đã hoàn thành/đang sử dụng với evidence.

### Sprint 3 — Productize dịch vụ

**Phạm vi**

- Viết lại ba offer theo 9 phần bắt buộc.
- Chốt hình thức hợp tác và đầu ra.
- Thêm “không phù hợp nếu”.
- CTA và query contact riêng cho từng offer.

**Điều kiện hoàn thành**

- Người đọc tự xác định được fit/no-fit.
- Outcome không bị lẫn với format hoặc deliverable.
- Mỗi offer có ít nhất một proof link.

### Sprint 4 — About, Contact và SEO

**Phạm vi**

- Rút gọn triết lý, bổ sung credentials.
- Thêm timeframe vào UI form.
- Chốt response promise.
- Viết lại metadata và internal links.

**Điều kiện hoàn thành**

- About có credentials xác minh và liên kết case.
- Form UI, state và payload đồng nhất.
- Metadata thể hiện định vị mới trên 6 route công khai.

### Sprint 5 — Kiểm thử nội dung và tối ưu

- Test 5 giây: “Bạn nghĩ người này giúp việc gì?”
- Test first-click: “Nếu muốn đào tạo đội ngũ, bạn bấm đâu?”
- Test comprehension với 5–8 người thuộc audience thật.
- Review mobile: hero, CTA, card proof, case artefact và form.
- Theo dõi funnel 4–6 tuần, sau đó điều chỉnh CTA/copy theo dữ liệu.

---

## 11. Definition of Done — chuẩn content 10/10

Website chỉ được xem là hoàn thành khi đáp ứng tất cả:

- Một định vị trung tâm xuất hiện nhất quán ở hero, About, Services và metadata.
- Ba audience có thứ tự ưu tiên và self-routing theo nhu cầu.
- Mỗi service mô tả fit, outcome, format, deliverable, process, proof, no-fit và CTA.
- Không có claim hoặc số liệu chưa xác minh.
- Không gọi scope/deliverable là impact.
- Mỗi featured case có artefact thật và role rõ.
- Có ít nhất 3 social proof asset được phép công bố.
- CTA phản ánh đúng ý định và bước tiếp theo.
- Contact form hiển thị timeframe, có response expectation hợp lý.
- Người dùng mobile hiểu định vị và thấy CTA chính trong viewport đầu.
- 5-second test và first-click test đạt tối thiểu 80% câu trả lời đúng.
- Analytics đo được toàn bộ funnel từ need-state đến inquiry thành công.

---

## 12. Các quyết định cần chủ website xác nhận trước khi viết production copy

1. Có ưu tiên **tổ chức cần đào tạo/thiết kế chương trình** là audience số 1 hay không.
2. Tên chức danh công khai mong muốn: `Giảng viên`, `Learning Designer`, `Educator–Designer–Advisor` hay một cách gọi tiếng Việt thống nhất.
3. Danh sách bằng cấp, môn học, chương trình và đơn vị được phép công bố.
4. Dịch vụ/hình thức hợp tác nào thực sự đang nhận trong 3–6 tháng tới.
5. Mốc thời gian phản hồi có thể cam kết.
6. Các project/artefact/testimonial nào có quyền công bố.
7. Có muốn dùng “Nguyễn Duy Khánh” hay “Duy Khánh” nhất quán ở mọi điểm chạm.

Sau khi bảy quyết định này được chốt, production copy có thể được viết và đưa vào source mà không cần bịa dữ kiện hoặc để lại placeholder mơ hồ.

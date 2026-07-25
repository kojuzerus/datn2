export interface Article {
  id: number;
  tag: string;
  tieu_de: string;
  tom_tat: string;
  ngay: string;
  hinhAnh: string;
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 1, tag: "Tin tức",
    tieu_de: "Người dùng iPhone vẫn có độ trung thành rất cao dù iPhone 17 không có nhiều thay đổi",
    tom_tat: "Khảo sát mới nhất cho thấy tỉ lệ giữ lại người dùng iPhone đạt mức kỷ lục, bất chấp các đối thủ Android ngày càng cạnh tranh mạnh.",
    ngay: "25/07/2026",
    hinhAnh: "https://photo2.tinhte.vn/data/attachment-files/2026/07/9062588_8841211-tinhte-khang-iphone-17-series-iphone17-22.jpg",
    body: [
      "Theo báo cáo từ CIRP (Consumer Intelligence Research Partners), tỉ lệ người dùng trung thành với iPhone đạt 94% trong quý 2/2026 — mức cao nhất từ trước đến nay.",
      "Điều đáng chú ý là con số này đạt được trong bối cảnh iPhone 17 không có quá nhiều nâng cấp đột phá so với thế hệ trước. Apple dường như đã xây dựng được một hệ sinh thái đủ mạnh để giữ chân người dùng ngay cả khi sản phẩm không 'wow'.",
      "Ngược lại, Samsung ghi nhận tỉ lệ giữ chân người dùng Galaxy khoảng 76%, trong khi các thương hiệu Android khác như OPPO, Xiaomi dao động 60-70%.",
      "Các chuyên gia phân tích cho rằng iMessage, AirDrop, Apple Watch và hệ sinh thái thiết bị Apple là những yếu tố 'khóa' người dùng hiệu quả nhất, khiến việc chuyển sang Android trở nên 'tốn kém' về mặt tiện lợi.",
    ],
  },
  {
    id: 2, tag: "Đánh giá",
    tieu_de: "Trên tay Samsung Galaxy Z Fold8: Màn hình tỉ lệ mới, AI thực dụng hơn thế hệ trước",
    tom_tat: "Samsung đổi tỉ lệ màn hình Z Fold8 lên 4:3 — quyết định táo bạo giúp trải nghiệm giải trí và đa nhiệm lên một tầm cao mới.",
    ngay: "24/07/2026",
    hinhAnh: "https://photo2.tinhte.vn/data/attachment-files/2026/07/9063846_tinhte-huy-tu-nda-samsung-galaxy-zfold-8-079.jpg",
    body: [
      "Galaxy Z Fold8 xuất hiện với thay đổi lớn nhất là tỉ lệ màn hình trong 4:3 thay vì 5:4 như trước. Cảm giác dùng thực tế cho thấy màn hình rộng hơn, nội dung hiển thị nhiều hơn khi lướt web hay xem video.",
      "Camera cải tiến đáng kể với cảm biến chính 200MP, zoom quang 5x sắc nét. Ảnh chụp trong điều kiện ánh sáng thấp tốt hơn hẳn Fold7 nhờ khẩu độ f/1.7.",
      "Các tính năng AI mới trên Z Fold8 thực dụng hơn: tóm tắt văn bản trực tiếp trong màn hình chính, dịch ngôn ngữ realtime trong ứng dụng, và gợi ý hành động thông minh khi nhận thông báo.",
      "Điểm trừ duy nhất: giá bán vẫn ở mức trên 40 triệu — một con số không dành cho tất cả mọi người, dù chất lượng xứng đáng với mức giá đó.",
    ],
  },
  {
    id: 3, tag: "Đánh giá",
    tieu_de: "Trên tay Samsung Galaxy Z Fold8 Ultra: Pin Silicon-carbon 5000mAh, mỏng 4.1mm khi gập",
    tom_tat: "Bản Ultra của Z Fold8 mang công nghệ pin thế hệ mới và thiết kế siêu mỏng — đây là điện thoại gập mỏng nhất Samsung từng làm.",
    ngay: "23/07/2026",
    hinhAnh: "https://photo2.tinhte.vn/data/attachment-files/2026/07/9064822_tinhte-huy-tu-nda-samsung-galaxy-zfold-8-161.jpg",
    body: [
      "Z Fold8 Ultra là bước đột phá về thiết kế: khi gập lại, máy chỉ dày 4.1mm — mỏng hơn nhiều so với 5.4mm của Fold7. Cầm trên tay cảm giác không khác gì một chiếc điện thoại thanh thông thường.",
      "Pin Silicon-carbon 5000mAh là công nghệ pin thế hệ mới cho phép đóng gói nhiều năng lượng hơn trong thể tích nhỏ hơn. Kết quả: thời lượng pin tăng 20% so với Fold7 dù máy mỏng hơn đáng kể.",
      "Nếp gấp màn hình gần như biến mất — đây là cải tiến mà người dùng dòng Fold mong chờ từ lâu. Cảm giác như xem trên một tờ giấy thực sự khi mở máy ra.",
      "Z Fold8 Ultra cũng là điện thoại đầu tiên của Samsung tích hợp S Pen ngay trong thân máy — điều mà Galaxy Note fans từng mong đợi được thấy trên dòng Fold.",
    ],
  },
  {
    id: 4, tag: "Đánh giá",
    tieu_de: "Trên tay ASUS ROG Zephyrus Duo 2026: Laptop gaming 189 triệu với 2 màn OLED 'hủy diệt'",
    tom_tat: "Máy tính gaming đỉnh nhất của ASUS năm 2026 gây choáng ngợp với hai màn hình OLED và cấu hình RTX 5090 — nhưng liệu có đáng đồng tiền?",
    ngay: "22/07/2026",
    hinhAnh: "https://cdn-media.sforum.vn/storage/app/media/thongvo/tren-tay-asus-rog-zephyrus-duo-2026/tren-tay-asus-zephyrus-dou-gx651-COVER.jpg",
    body: [
      "ASUS ROG Zephyrus Duo 2026 (GX651) là một trong những laptop gaming mạnh nhất trên thị trường hiện tại với CPU Intel Core Ultra 9 285HX và GPU NVIDIA RTX 5090 Laptop.",
      "Điểm nhấn là hai màn hình OLED: màn chính 16 inch 2560x1600 240Hz, và màn phụ 14 inch ScreenPad Plus nằm phía trên bàn phím. Thiết lập dual-screen này biến Duo thành 'workstation di động' thực sự.",
      "Hiệu năng gaming ở mức tối đa: Cyberpunk 2077 chạy 4K Ultra mượt mà ở 80+ fps, trong khi các tác vụ render 3D hoàn thành nhanh hơn 35% so với thế hệ trước.",
      "Nhược điểm: giá 189 triệu đồng là con số không nhỏ, pin chỉ trụ được 2-3 giờ khi chơi game thực tế, và máy nặng 2.5kg không phù hợp để di chuyển nhiều.",
    ],
  },
  {
    id: 5, tag: "Đánh giá",
    tieu_de: "Đánh giá camera OPPO Reno16 F 5G: Mang phong cách digicam lên điện thoại tầm trung",
    tom_tat: "OPPO Reno16 F 5G chơi lớn với giao diện camera phong cách máy ảnh kỹ thuật số retro — cảm giác mới lạ cho phân khúc giá dưới 10 triệu.",
    ngay: "21/07/2026",
    hinhAnh: "https://cdn-media.sforum.vn/storage/app/media/dinhnhan/Danh-gia-camera-OPPO-Reno16-F-5G/Danh-gia-camera-OPPO-Reno16-F-5G.jpg",
    body: [
      "OPPO Reno16 F 5G mang đến trải nghiệm camera độc đáo với giao diện giả lập máy ảnh kỹ thuật số (digicam), hoàn toàn mới lạ ở phân khúc tầm trung.",
      "Về chất lượng ảnh thực tế, camera chính 50MP cho kết quả ổn định trong điều kiện ánh sáng tốt. Màu sắc ảnh có xu hướng bão hòa nhẹ, tạo cảm giác 'Instagram-ready' ngay khi chụp.",
      "Chế độ Portrait hoạt động tốt với khả năng tách nền chính xác, bokeh tự nhiên. Tuy nhiên, camera selfie 32MP đôi khi làm mịn da quá mức dù đã tắt chế độ làm đẹp.",
      "Ở tầm giá dưới 10 triệu, Reno16 F 5G là lựa chọn hợp lý cho người dùng trẻ thích chụp ảnh phong cách và không đòi hỏi quá cao về chất lượng ảnh chuyên nghiệp.",
    ],
  },
  {
    id: 6, tag: "Đánh giá",
    tieu_de: "Trên tay JBL Quantum 650: Tai nghe gaming siêu ngầu, giả lập âm thanh 7.1 cực chuẩn",
    tom_tat: "JBL Quantum 650 nhắm thẳng vào game thủ với âm thanh 7.1 ảo, kết nối không dây 2.4GHz và thiết kế RGB bắt mắt — tất cả ở mức giá 3.9 triệu đồng.",
    ngay: "20/07/2026",
    hinhAnh: "https://cdn-media.sforum.vn/storage/app/media/thongvo/tren-tay-jbl-quantum-650/tren-tay-jbl-quantum-650-COVER.jpg",
    body: [
      "JBL Quantum 650 ấn tượng ngay từ cái nhìn đầu tiên với thiết kế đầu băng chắc chắn, đệm tai dày dặn, và hệ thống đèn RGB có thể tùy chỉnh qua phần mềm JBL QuantumEngine.",
      "Âm thanh giả lập 7.1 thực sự hữu ích trong game FPS: tiếng bước chân, tiếng súng và âm thanh môi trường định vị rõ ràng hơn hẳn so với stereo thông thường. Đây là lợi thế cạnh tranh thực sự trong Valorant và CS2.",
      "Kết nối không dây 2.4GHz qua USB dongle cho độ trễ dưới 10ms — không phân biệt được so với có dây trong thực tế chơi game. Pin trụ được 38 giờ, đủ để chơi marathon cuối tuần mà không lo hết pin.",
      "Nhược điểm: mic khá 'bình thường', không phải điểm mạnh. Nếu chất lượng mic là ưu tiên hàng đầu, nên cân nhắc thêm mic rời. Nhưng về âm thanh gaming, JBL Quantum 650 xứng đáng với mức giá 3.9 triệu.",
    ],
  },
  {
    id: 7, tag: "Tin tức",
    tieu_de: "Qualcomm tăng giá chip đột ngột: Điện thoại giá rẻ sẽ ngày càng khan hiếm hơn?",
    tom_tat: "Qualcomm thông báo điều chỉnh giá chip Snapdragon, ảnh hưởng trực tiếp đến chi phí sản xuất điện thoại tầm trung và tầm thấp toàn cầu.",
    ngay: "25/07/2026",
    hinhAnh: "https://genk.mediacdn.vn/zoom/260_162/139269124445442048/2026/7/25/avatar1784953234879-17849532355701957300651-0-100-702-1223-crop-1784953242272993406596.png",
    body: [
      "Qualcomm vừa thông báo tăng giá chip Snapdragon trung bình 15-25% cho các đơn hàng mới từ quý 3/2026, ảnh hưởng đến phần lớn smartphone Android trên toàn cầu.",
      "Lý do được đưa ra là chi phí R&D tăng cao, đặc biệt trong mảng AI on-device, cùng với chi phí sản xuất tại TSMC tăng theo lộ trình chuyển sang node 3nm và 2nm.",
      "Hệ quả trực tiếp: các hãng điện thoại tầm trung như Xiaomi, OPPO, Vivo sẽ phải điều chỉnh lại chiến lược cấu hình hoặc tăng giá bán lẻ. Phân khúc điện thoại dưới 5 triệu có thể bị thu hẹp đáng kể.",
      "Một số chuyên gia nhận định đây là cơ hội để MediaTek giành thị phần, khi các hãng điện thoại tìm kiếm giải pháp chip thay thế rẻ hơn cho dòng sản phẩm tầm trung.",
    ],
  },
  {
    id: 8, tag: "Tin tức",
    tieu_de: "Mắt kính thông minh tích hợp AI đổ bộ thị trường Việt: Nghe nhạc, đàm thoại không cần điện thoại",
    tom_tat: "Xu hướng smart glasses đang nóng lên tại Việt Nam, với nhiều mẫu mắt kính AI có khả năng nghe nhạc, gọi điện và thậm chí nhận diện khuôn mặt.",
    ngay: "24/07/2026",
    hinhAnh: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=900&q=85&fit=crop",
    body: [
      "Mắt kính thông minh (smart glasses) đang trở thành xu hướng mới sau thành công của Meta Ray-Ban. Tại Việt Nam, một số mẫu mới vừa được đưa vào phân phối chính thức.",
      "Tính năng nổi bật của thế hệ mắt kính AI mới bao gồm: loa mở không che tai, mic kép lọc tiếng ồn, kết nối Bluetooth 5.3, và trợ lý AI có thể trả lời câu hỏi, dịch ngôn ngữ thời gian thực.",
      "Một số mẫu cao cấp còn tích hợp camera nhỏ ở gọng kính, cho phép chụp ảnh, quay video góc nhìn thứ nhất và phân tích môi trường xung quanh bằng AI.",
      "Thách thức lớn nhất vẫn là pin (4-6 giờ), thẩm mỹ (nhiều mẫu còn cồng kềnh) và giá bán từ 3-8 triệu đồng. Dù vậy, đây hứa hẹn là phân khúc phụ kiện công nghệ tăng trưởng mạnh trong 2-3 năm tới.",
    ],
  },
  {
    id: 9, tag: "Xu hướng",
    tieu_de: "Ưu đãi lên đến 1 triệu khi mua Galaxy Z Fold8 và Z Flip8: Cơ hội không thể bỏ lỡ",
    tom_tat: "Samsung và các nhà bán lẻ tung loạt ưu đãi hấp dẫn cho dòng Galaxy Z Fold8 và Z Flip8 — thời điểm vàng để nâng cấp điện thoại gập.",
    ngay: "23/07/2026",
    hinhAnh: "https://photo2.tinhte.vn/data/attachment-files/2026/07/9065771_apple-vs-samsung-fold.webp",
    body: [
      "Ngay sau khi ra mắt chính thức, Galaxy Z Fold8 và Z Flip8 đang được các nhà bán lẻ lớn áp dụng nhiều chương trình ưu đãi giảm giá và tặng kèm phụ kiện hấp dẫn.",
      "Cụ thể, khách hàng mở mới thẻ tín dụng của một số ngân hàng đối tác sẽ được giảm thêm 1 triệu đồng. Ngoài ra, chương trình thu cũ đổi mới cũng được nâng mức định giá cao hơn 20% so với thông thường.",
      "Galaxy Z Flip8 với form factor nhỏ gọn và giá thấp hơn Z Fold8 đang thu hút nhiều sự chú ý, đặc biệt từ nhóm người dùng nữ và giới trẻ thích phong cách thời trang.",
      "Nếu bạn đang cân nhắc mua điện thoại gập, đây là thời điểm tốt nhất để xuống tiền trước khi các chương trình ưu đãi kết thúc vào cuối tháng 7.",
    ],
  },
  {
    id: 10, tag: "Tin tức",
    tieu_de: "Nvidia và Google, Microsoft, Meta gửi thư khẩn đến Nhà Trắng về quy định AI",
    tom_tat: "Các gã khổng lồ công nghệ Mỹ đồng loạt lên tiếng phản đối một số quy định AI mới đề xuất, cho rằng chúng sẽ kìm hãm đổi mới và làm yếu vị thế cạnh tranh với Trung Quốc.",
    ngay: "25/07/2026",
    hinhAnh: "https://genk.mediacdn.vn/zoom/260_162/139269124445442048/2026/7/25/avatar1784955197862-17849551986591006621335.png",
    body: [
      "Hơn 30 công ty công nghệ hàng đầu của Mỹ, bao gồm Nvidia, Google, Microsoft và Meta, đã gửi thư ngỏ đến Nhà Trắng bày tỏ lo ngại về một số điều khoản trong dự thảo quy định AI mới.",
      "Điểm gây tranh cãi nhất là yêu cầu kiểm định an toàn bắt buộc đối với các mô hình AI có trên 10 tỷ tham số — một ngưỡng mà các công ty cho rằng sẽ làm chậm đáng kể tốc độ phát triển sản phẩm.",
      "Nvidia, với vai trò nhà cung cấp chip AI số 1 thế giới, đặc biệt lo ngại các quy định này sẽ ảnh hưởng đến xuất khẩu chip H100, B200 sang các thị trường quan trọng.",
      "Tuy nhiên, nhiều chuyên gia độc lập và tổ chức phi lợi nhuận lại ủng hộ việc kiểm soát chặt hơn, với lý do AI mạnh nếu không có giám sát có thể gây ra những rủi ro khó kiểm soát.",
    ],
  },
];

export function getArticleById(id: number): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

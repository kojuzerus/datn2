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
    id: 1, tag: "Đánh giá",
    tieu_de: "iPhone 17 Pro Max: Đánh giá sau 2 tuần sử dụng",
    tom_tat: "Chip A19 Bionic mạnh mẽ, camera cải tiến đáng kể, nhưng giá vẫn là rào cản lớn với nhiều người.",
    ngay: "20/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80&fit=crop",
    body: [
      "Sau hai tuần sử dụng iPhone 17 Pro Max như thiết bị chính, có thể thấy Apple đã tập trung vào ba cải tiến lớn: hiệu năng chip A19 Bionic, hệ thống camera, và thời lượng pin.",
      "Chip A19 Bionic mang lại mức cải thiện hiệu năng đáng kể so với A18, đặc biệt trong các tác vụ dựng video 4K và chơi game nặng đồ họa. Máy gần như không nóng trong các bài test kéo dài 30 phút.",
      "Camera chính 200MP cho ảnh chi tiết hơn rõ rệt trong điều kiện ánh sáng tốt, và chế độ chụp đêm cũng được cải thiện đáng kể nhờ thuật toán xử lý ảnh mới.",
      "Tuy nhiên, mức giá khởi điểm vẫn là rào cản lớn với nhiều người dùng tại Việt Nam. Nếu không có nhu cầu nâng cấp camera/hiệu năng rõ rệt, người dùng iPhone 15/16 Pro Max có thể chưa cần vội nâng cấp.",
    ],
  },
  {
    id: 2, tag: "So sánh",
    tieu_de: "MacBook Air M4 vs Dell XPS 15: Nên chọn cái nào?",
    tom_tat: "Hai chiếc laptop cao cấp với điểm mạnh khác nhau — Apple hay Windows sẽ phù hợp với bạn hơn?",
    ngay: "17/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&fit=crop",
    body: [
      "MacBook Air M4 tiếp tục là lựa chọn hàng đầu cho người dùng cần một laptop mỏng nhẹ, pin trâu và hiệu năng ổn định cho công việc văn phòng, sáng tạo nội dung nhẹ.",
      "Dell XPS 15 lại ghi điểm với màn hình lớn hơn, cấu hình linh hoạt hơn (có thể chọn card đồ họa rời), và hệ sinh thái Windows quen thuộc với phần lớn người dùng doanh nghiệp.",
      "Về thời lượng pin, MacBook Air M4 vẫn nhỉnh hơn rõ rệt — trung bình 16-18 giờ sử dụng thực tế so với 8-10 giờ của XPS 15.",
      "Kết luận: nếu bạn đã quen với macOS hoặc cần máy nhẹ để di chuyển nhiều, MacBook Air M4 là lựa chọn an toàn. Nếu cần hiệu năng đồ họa cao hơn và tính linh hoạt phần cứng, Dell XPS 15 đáng xem xét.",
    ],
  },
  {
    id: 3, tag: "Tin tức",
    tieu_de: "Samsung Galaxy Z Fold 7: Những nâng cấp đáng chú ý nhất",
    tom_tat: "Thế hệ mới của dòng gập đến gần — Samsung hứa hẹn màn hình bền hơn và pin lâu hơn.",
    ngay: "14/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&q=80&fit=crop",
    body: [
      "Galaxy Z Fold 7 được kỳ vọng sẽ giải quyết hai điểm yếu lớn nhất của dòng gập: độ bền của bản lề và màn hình, cùng thời lượng pin còn hạn chế.",
      "Samsung cho biết bản lề thế hệ mới giảm độ dày nếp gấp đáng kể, đồng thời vật liệu màn hình mới có khả năng chống trầy xước tốt hơn các thế hệ trước.",
      "Pin được tăng dung lượng kết hợp tối ưu phần mềm, hứa hẹn cải thiện thời gian sử dụng thêm 15-20% so với Z Fold 6.",
      "Mức giá dự kiến vẫn ở phân khúc cao cấp, nhưng nếu các cải tiến về độ bền là thật, đây có thể là lý do đủ thuyết phục để nâng cấp đối với người dùng dòng gập lâu năm.",
    ],
  },
  {
    id: 4, tag: "Đánh giá",
    tieu_de: "Galaxy Watch 7 Ultra: Smartwatch tốt nhất Android 2025?",
    tom_tat: "Dòng đồng hồ mới nhất của Samsung có đáng để nâng cấp hay không? Đánh giá nhanh tính năng, pin và thiết kế.",
    ngay: "11/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&fit=crop",
    body: [
      "Galaxy Watch 7 Ultra hướng đến nhóm người dùng thể thao với khung viền titan bền chắc, khả năng chống nước/chống va đập tốt hơn các bản Watch thường.",
      "Các chỉ số sức khỏe (nhịp tim, SpO2, giấc ngủ) được đo chính xác hơn nhờ cảm biến thế hệ mới, đồng thời tích hợp thêm tính năng theo dõi phục hồi sau tập luyện.",
      "Pin là điểm cải thiện rõ rệt nhất — có thể dùng 2 ngày với chế độ thường, hoặc cả tuần nếu chỉ dùng tính năng theo dõi cơ bản.",
      "Nếu bạn đang dùng điện thoại Samsung và có nhu cầu tập luyện thể thao thường xuyên, đây là một trong những lựa chọn smartwatch Android đáng tiền nhất hiện tại.",
    ],
  },
  {
    id: 5, tag: "Hướng dẫn",
    tieu_de: "5 cách kéo dài tuổi thọ pin điện thoại hiệu quả nhất",
    tom_tat: "Những thói quen sạc và sử dụng đơn giản giúp pin điện thoại bền hơn theo thời gian.",
    ngay: "08/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&fit=crop",
    body: [
      "Tránh để pin xả cạn hoàn toàn xuống 0% thường xuyên — mức sạc lý tưởng cho pin Lithium-ion là duy trì trong khoảng 20-80%.",
      "Hạn chế sạc qua đêm liên tục trong thời gian dài. Hầu hết điện thoại hiện đại có tính năng sạc thông minh, nhưng tắt sạc khi đầy vẫn tốt hơn cho pin về lâu dài.",
      "Tránh để điện thoại ở nơi quá nóng (trong xe ô tô giữa trưa, gần bếp...) vì nhiệt độ cao là nguyên nhân hàng đầu làm chai pin nhanh.",
      "Dùng bộ sạc chính hãng hoặc đạt chuẩn, vì sạc kém chất lượng có thể gây dòng điện không ổn định, ảnh hưởng tuổi thọ pin.",
      "Cập nhật phần mềm thường xuyên — các bản cập nhật hệ điều hành thường đi kèm tối ưu quản lý năng lượng.",
    ],
  },
  {
    id: 6, tag: "Kinh nghiệm",
    tieu_de: "Mua tai nghe chống ồn: Những điều cần biết trước khi xuống tiền",
    tom_tat: "Không phải tai nghe chống ồn nào cũng giống nhau — đây là những yếu tố cần cân nhắc.",
    ngay: "05/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517519014922-8fc7eea9b7f1?w=1200&q=80&fit=crop",
    body: [
      "Chống ồn chủ động (ANC) hoạt động tốt nhất với tiếng ồn đều và liên tục như động cơ máy bay, máy lạnh — nhưng kém hiệu quả hơn với tiếng ồn đột ngột như giọng nói.",
      "Thời lượng pin thực tế thường thấp hơn quảng cáo 15-20% khi bật ANC liên tục, nên cần lưu ý nếu hay di chuyển xa.",
      "Độ ôm tai và chất liệu đệm ảnh hưởng trực tiếp đến hiệu quả cách âm vật lý, đôi khi quan trọng hơn cả công nghệ ANC.",
      "Nên ưu tiên các mẫu hỗ trợ nhiều codec âm thanh (AAC, LDAC...) nếu bạn nghe nhạc chất lượng cao thường xuyên.",
    ],
  },
  {
    id: 7, tag: "Xu hướng",
    tieu_de: "Laptop gaming tầm giá 20–25 triệu đáng mua nhất 2025",
    tom_tat: "Phân khúc laptop gaming tầm trung ngày càng cạnh tranh — đây là những lựa chọn đáng chú ý.",
    ngay: "02/05/2025",
    hinhAnh: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&fit=crop",
    body: [
      "Tầm giá 20-25 triệu hiện nay đã có thể sở hữu laptop gaming với card đồ họa đủ mạnh để chơi tốt hầu hết game AAA ở mức thiết lập trung bình-cao, 1080p.",
      "Các yếu tố cần ưu tiên ở tầm giá này: tản nhiệt hiệu quả, màn hình tần số quét từ 144Hz trở lên, và RAM tối thiểu 16GB để tránh phải nâng cấp ngay sau khi mua.",
      "Pin không phải là thế mạnh của laptop gaming nói chung — nên cân nhắc nếu cần máy di chuyển nhiều, không chỉ dùng cố định tại nhà.",
      "Nhìn chung, đây là thời điểm tốt để mua laptop gaming tầm trung khi các hãng đang cạnh tranh mạnh về cấu hình trong cùng phân khúc giá.",
    ],
  },
];

export function getArticleById(id: number): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

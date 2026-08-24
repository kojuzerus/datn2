import type { MetadataRoute } from "next";

const SITE_URL = "https://datn2-nine.vercel.app";

// Next.js App Router quy ước: file này tự động phục vụ tại /robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/nguoidung",
          "/giohang",
          "/thanhtoan",
          "/don-hang",
          "/dat-hang-thanh-cong",
          "/login",
          "/dangky",
          "/quen-mat-khau",
          "/dat-lai-mat-khau",
          "/oauth-callback",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
